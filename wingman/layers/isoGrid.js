/* =====================================================================
   LAYER: isoGrid (GPU). Sim: arm a flash on each beat. Draw: one fullscreen
   pass that computes the iso lattice procedurally + the flash + radial fade.
   ===================================================================== */
import { clamp, lerp, flashEnvelope } from "../engine/core.js";
import { Program } from "../engine/gl/gl.js";
import { FS_VERT } from "../shaders/quad.js";
import { GRID_FRAG } from "../shaders/grid.js";

export class IsoGrid {
  static type = "isoGrid";
  static schema = {
    cellPx:        { default: 24 },   // target on-screen line spacing (CSS px)
    restAlpha:     { default: 0.07 },
    flashDur:      { default: 0.52 },
    flashAttack:   { default: 0.16 },
    peakLow:       { default: 0.06 },   // grid flash kept very subtle so it doesn't compete with the buckets
    peakHigh:      { default: 0.14 },
    fadeStartZoom: { default: 0.035 },   // keep the lattice visible nearly all the way out (it just steps coarser)
    fadeRange:     { default: 0.05 },
  };

  constructor(params) { this.p = params; this.prog = null; this.reset(); }
  reset() { this.flashT0 = -10; this.flashStr = 0; this.flashDur = 0.8; this.lodStep = 0; this.prevLod = 0; this.transStart = -10; this.transDur = 0.45; this.lastZoom = 0; }

  // flash on the beats; the fade duration scales with the gap to the next beat, so at slow
  // phases the dots swell/fade slowly over the whole interval, and quicken as the beats crowd.
  step(world) {
    const beats = world.timeline.beats;
    for (const c of world.cues) {
      if (c.kind !== "beat") continue;
      const next = c.index + 1 < beats.length ? beats[c.index + 1].t : null;
      const prev = c.index > 0 ? beats[c.index - 1].t : null;
      const interval = next != null ? next - c.t : (prev != null ? c.t - prev : 1.6);
      this.flashDur = clamp(interval * 0.9, 0.5, 3.2);
      this.flashT0 = world.t;
      this.flashStr = lerp(this.p.peakLow, this.p.peakHigh, Math.pow(c.index / Math.max(1, c.total - 1), 1.2));
    }
  }

  draw(R, view) {
    const gl = R.gl, p = this.p;
    const gOp = clamp((view.camNorm - p.fadeStartZoom) / p.fadeRange, 0, 1);
    if (gOp <= 0.02) return;
    const flash = flashEnvelope(view.time - this.flashT0, this.flashDur, p.flashAttack) * this.flashStr;
    if ((p.restAlpha + flash) * gOp < 0.004) return;
    if (!this.prog) this.prog = new Program(gl, FS_VERT, GRID_FRAG);

    // LOD step (lattice coarseness) from zoom. Re-quantizing it makes the lattice jump, so:
    //  - never change it while the grid is actively flashing (the jump is most visible there), and
    //  - when it does change (at rest), cross-fade old->new lattice instead of cutting.
    const cellPx = Math.hypot(17 * view.zoom, 8.5 * view.zoom);
    const desired = Math.max(1, Math.round((p.cellPx * view.dpr) / Math.max(1e-3, cellPx)));
    if (this.lodStep === 0) { this.lodStep = desired; this.prevLod = desired; }
    // Only re-space the lattice when the CAMERA HAS SETTLED — holding it steady through the whole
    // beat zoom (not just the flash), so it never re-quantizes mid-motion.
    const dz = Math.abs(view.zoom - this.lastZoom); this.lastZoom = view.zoom;
    const animating = flash > 0.012 || dz > 0.0004;
    const transitioning = (view.time - this.transStart) < this.transDur;
    if (!animating && !transitioning && desired !== this.lodStep) {
      this.prevLod = this.lodStep; this.lodStep = desired; this.transStart = view.time;   // begin a cross-fade
    }
    const tr = clamp((view.time - this.transStart) / this.transDur, 0, 1);

    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);                   // additive light
    const pass = (lf, st) => { this.prog.use()
      .set("uViewport", [view.W, view.H]).set("uZoom", view.zoom).set("uCam", [view.camX, view.camY])
      .set("uStep", st).set("uFlash", flash).set("uRest", p.restAlpha)
      .set("uColorMix", flash > 0.04 ? 1 : 0).set("uGridFade", gOp).set("uMapFade", view.mapFade)
      .set("uLevelFade", lf); R.fs.draw(); };
    if (tr < 1 && this.prevLod !== this.lodStep) {
      pass(1 - tr, this.prevLod);      // old lattice fading out
      pass(tr, this.lodStep);          // new lattice fading in
    } else {
      pass(1, this.lodStep);
    }
  }
}
