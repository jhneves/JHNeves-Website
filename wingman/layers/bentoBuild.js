/* =====================================================================
   LAYER: bentoBuild (GPU). Sim: guillotine-pack a disc of slots; HOW MANY
   exist follows the music energy, WHEN they appear bursts on note onsets.
   Draw: upload the live cards as instances; one instanced draw renders them
   all, the shader does the iso projection + assemble-grow + procedural
   content. Card "type" (doc/code/chart/map) comes from the seed.
   ===================================================================== */
import { clamp, makeRNG } from "../engine/core.js";
import { Program, InstancedMesh, gridMeshVerts } from "../engine/gl/gl.js";
import { CARD_VERT, CARD_FRAG } from "../shaders/card.js";

export class BentoBuild {
  static type = "bentoBuild";
  static schema = {
    radius:      { default: 168 },
    cellCount:   { default: 1300 },
    gap:         { default: 0.34 },
    holeRadius:  { default: 20 },     // world-space clearing at the disc centre (the sign-up field's breathing room)
    holeHold:    { default: 12 },     // seconds to keep that centre clear before letting the buckets fill it in
    fillPower:   { default: 2.0 },
    introRate:   { default: 1.3 },    // continuous min cadence early (a bucket at least this often) -> no gaps
    onsetCap:    { default: 10 },      // gradual fill on the dense melody onsets (rhythm)
    beatCap:     { default: 90 },      // bigger punch on the (sparse, strong) climax beats
    asmSlow:     { default: 2.6 },    // assembly window before the kick (careful, staggered)
    asmFast:     { default: 0.55 },   // assembly window after the kick (snappy surge)
    kickStart:   { default: 26 },     // spawnT where assembly starts speeding up
    kickEnd:     { default: 38 },
  };

  constructor(params) { this.p = params; this.prog = null; this.slots = []; this.outer = []; this.inner = []; this.outerIdx = 0; this.innerIdx = 0; this.cards = []; this.cardIndex = 0; this.cardTarget = 0; this.idleActive = false; this.idleClock = 0; this.idleRng = makeRNG(7); this.idleNext = 0.5; this.galleryActive = false; this.galleryClock = 0; this.galleryCards = null; }

  /* GALLERY: one card per content variant (type + subtype), laid out in a grid, for review.
     Finds a seed that maps to each variant (the shaders pick type/subtype from the seed). */
  buildGallery() {
    if (this.galleryCards) return;
    const fr = x => x - Math.floor(x);
    const h11 = p => { p = fr(p * 0.1031); p *= p + 33.33; p *= p + p; return fr(p); };
    const typeOf = s => s < 0.10 ? 5 : s < 0.22 ? 4 : Math.min(3, Math.floor((s - 0.22) / 0.78 * 4));
    const subOf = (s, t) => t === 1 ? Math.floor(h11(s * 1.7) * 3) : t === 2 ? Math.floor(h11(s * 4.3) * 2) : t === 3 ? Math.floor(h11(s * 2.3) * 5) : 0;
    const want = [[0,0],[5,0],[4,0],[1,0],[1,1],[1,2],[2,0],[2,1],[3,0],[3,1],[3,2],[3,3],[3,4]];  // one [type,sub] per content variant
    const seeds = want.map(() => 0.5);
    for (let s = 0.001; s < 1; s += 0.0003) {
      const t = typeOf(s), sub = subOf(s, t);
      for (let k = 0; k < want.length; k++) if (want[k][0] === t && want[k][1] === sub) seeds[k] = s;
    }
    const cols = 4, cw = 13, ch = 9.5, gap = 4;
    const rows = Math.ceil(want.length / cols), gw = cols * cw + (cols - 1) * gap, gh = rows * ch + (rows - 1) * gap;
    this.galleryCards = want.map((w, k) => {
      const j = k % cols, i = Math.floor(k / cols);
      return { slot: { c: -gw / 2 + j * (cw + gap), r: -gh / 2 + i * (ch + gap), w: cw, h: ch }, spawnT: -3, seed: seeds[k], deathT: 0 };
    });
  }

  reset(rng, ctx) {
    this.rng = rng;
    this.slots = buildBento(rng, this.p.radius, this.p.cellCount, this.p.gap);   // natural: nearest-centre first
    // split off the centre slots so the build can hold them back through the opening, then fill them.
    const hr = this.p.holeRadius;
    this.outer = []; this.inner = [];
    for (const s of this.slots) {
      const nx = Math.max(s.c, Math.min(s.c + s.w, 0)), ny = Math.max(s.r, Math.min(s.r + s.h, 0));
      (hr > 0 && Math.hypot(nx, ny) < hr ? this.inner : this.outer).push(s);
    }
    this.inner.reverse();   // fill the clearing from its inner EDGES inward, not from the dead centre
    this.outerIdx = 0; this.innerIdx = 0;
    this.cards = []; this.cardIndex = 0; this.cardTarget = 0; this.idleActive = false;
    this.ENV1 = ctx.timeline.energyNorm(ctx.timeline.lastBeatT()) || 1;
  }

  /* IDLE preview (before the animation starts): a few central buckets assemble, hold, dissolve,
     loop — a living glimpse. Uses its own clock so it's independent of the timed show. */
  idleReset() { this.idleActive = true; this.idleClock = 0; this.cards = []; this.cardIndex = 0; this.idleNext = 0.3; this.idleRng = makeRNG(7); }
  idleStep(dt) {
    if (!this.idleActive || !this.slots.length) return;
    this.idleClock += dt;
    this.cards = this.cards.filter(c => this.idleClock < c.deathT + 0.75);   // drop fully-dissolved
    this.idleNext -= dt;
    if (this.idleNext <= 0 && this.cards.length < 3) {
      const n = 1 + Math.floor(this.idleRng() * 2);
      for (let i = 0; i < n; i++) {
        const slot = this.outer[2 + Math.floor(this.idleRng() * Math.min(this.outer.length - 2, 36))];   // around the field, not over it
        this.cards.push({ slot, spawnT: this.idleClock, seed: this.idleRng(), deathT: this.idleClock + 3.6 + this.idleRng() * 1.2 });
      }
      this.idleNext = 1.4 + this.idleRng() * 1.0;
    }
  }

  step(world) {
    const p = this.p, t = world.t;
    const frac = Math.pow(clamp(world.timeline.energyNorm(t) / this.ENV1, 0, 1), p.fillPower);
    let target = Math.round(this.slots.length * frac);
    // continuous floor: keep at least one new bucket arriving every ~introRate seconds so the
    // build never goes idle (a block is always assembling). The env curve overtakes it at the surge.
    target = Math.max(target, Math.min(this.slots.length, Math.floor(t / p.introRate)));
    this.cardTarget = Math.max(this.cardTarget, target);
    const innerOpen = t >= p.holeHold;     // after the opening, the centre clearing fills back in
    for (const c of world.cues) {
      const cap = c.kind === "beat" ? p.beatCap : c.kind === "onset" ? p.onsetCap : 0;
      if (!cap) continue;
      // OUTER ring keeps expanding (nearest-centre first) on the music energy, so the disc grows
      // continuously and never loses its circle shape.
      let n = 0;
      while (this.outerIdx < this.outer.length && this.outerIdx < this.cardTarget && n++ < cap) {
        this.cards.push({ slot: this.outer[this.outerIdx++], spawnT: t, seed: this.rng() });
      }
      // INNER clearing fills in INDEPENDENTLY, in parallel: a gentle trickle from its edges inward,
      // so the centre closes on its own without ever pausing the outer disc.
      if (innerOpen) {
        let m = 0, icap = c.kind === "beat" ? 2 : 1;
        while (this.innerIdx < this.inner.length && m++ < icap) {
          this.cards.push({ slot: this.inner[this.innerIdx++], spawnT: t, seed: this.rng() });
        }
      }
    }
    this.cardIndex = this.outerIdx + this.innerIdx;
  }

  draw(R, view) {
    const gl = R.gl;
    const cards = this.galleryActive ? this.galleryCards : this.cards;
    const n = cards ? cards.length : 0;
    if (!n) return;
    if (!this.prog) {
      this.prog = new Program(gl, CARD_VERT, CARD_FRAG);
      this.mesh = new InstancedMesh(gl, gridMeshVerts(4, 4), 4, [{ loc: 1, size: 4 }, { loc: 2, size: 4 }]);
      this.data = new Float32Array(2048);
    }
    if (this.data.length < n * 8) this.data = new Float32Array(n * 8 * 2);
    const d = this.data;
    for (let i = 0; i < n; i++) {
      const c = cards[i], s = c.slot, o = i * 8;
      d[o] = s.c; d[o + 1] = s.r; d[o + 2] = s.w; d[o + 3] = s.h;
      // content type from seed: 0-3 common, plus two rarer ones (5 ~10%, 4 ~12%)
      const ty = c.seed < 0.10 ? 5 : c.seed < 0.22 ? 4 : Math.min(3, Math.floor((c.seed - 0.22) / 0.78 * 4));
      d[o + 4] = c.spawnT; d[o + 5] = ty; d[o + 6] = c.seed; d[o + 7] = c.deathT || 0;
    }
    this.mesh.upload(d.subarray(0, n * 8), n);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);    // premultiplied alpha
    const time = this.galleryActive ? this.galleryClock : this.idleActive ? this.idleClock : view.time;
    this.prog.use()
      .set("uViewport", [view.W, view.H]).set("uZoom", view.zoom).set("uCam", [view.camX, view.camY])
      .set("uTime", time).set("uMapFade", (this.idleActive || this.galleryActive) ? 1 : view.mapFade)
      .set("uAsmSlow", this.p.asmSlow).set("uAsmFast", this.p.asmFast)
      .set("uKickStart", this.p.kickStart).set("uKickEnd", this.p.kickEnd);
    this.mesh.draw();
  }
}

function buildBento(rng, RAD, N, gap) {
  const RW = RAD * 2.14, RH = RAD * 2.14;
  let cells = [{ c: -RW / 2, r: -RH / 2, w: RW, h: RH }];
  let guard = 0;
  while (cells.length < N && guard++ < N * 8) {
    cells.sort((a, b) => b.w * b.h - a.w * a.h);
    const idx = Math.floor(Math.pow(rng(), 2) * Math.min(cells.length, 6));
    const cell = cells.splice(idx, 1)[0];
    if (cell.w < 3 && cell.h < 3) { cells.push(cell); continue; }
    const vert = cell.w > cell.h ? true : cell.w < cell.h ? false : rng() < 0.5;
    const ratio = 0.42 + rng() * 0.16;   // splits a touch more even -> fewer extreme cells
    if (vert) { const w1 = cell.w * ratio; cells.push({ c: cell.c, r: cell.r, w: w1, h: cell.h }, { c: cell.c + w1, r: cell.r, w: cell.w - w1, h: cell.h }); }
    else { const h1 = cell.h * ratio; cells.push({ c: cell.c, r: cell.r, w: cell.w, h: h1 }, { c: cell.c, r: cell.r + h1, w: cell.w, h: cell.h - h1 }); }
  }
  const kept = cells.filter(c => Math.hypot(c.c + c.w / 2, c.r + c.h / 2) < RAD);
  // Constrain every slot to a window-like aspect (w/h in [ARmin, ARmax]) by trimming the
  // long side, keeping the card centred in its cell. Drop anything too small after trimming.
  // This is what keeps buckets looking like real app windows — never tall-thin or too wide.
  const ARmin = 0.62, ARmax = 1.85;
  const slots = [];
  for (const cell of kept) {
    let c = cell.c + gap, r = cell.r + gap, w = cell.w - gap * 2, h = cell.h - gap * 2;
    if (w <= 0 || h <= 0) continue;
    const ar = w / h;
    if (ar > ARmax) { const nw = h * ARmax; c += (w - nw) / 2; w = nw; }        // too wide -> trim width
    else if (ar < ARmin) { const nh = w / ARmin; r += (h - nh) / 2; h = nh; }   // too tall -> trim height
    if (w < 2.4 || h < 2.4) continue;
    slots.push({ c, r, w, h });
  }
  slots.sort((A, B) => Math.hypot(A.c + A.w / 2, A.r + A.h / 2) - Math.hypot(B.c + B.w / 2, B.r + B.h / 2));
  return slots;
}
