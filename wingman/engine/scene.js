/* =====================================================================
   SCENE — the deterministic runtime. A scene = camera + layers + timeline
   + finale, all driven by a virtual clock and a seeded RNG. Given a time,
   it reproduces the exact same frame (reset + fixed-step re-sim), which is
   what makes the scrubber, live param editing, and video export all exact.
   ===================================================================== */
import { makeRNG, clamp } from "./core.js";
import { Camera, CameraSchema } from "./camera.js";
import { makeIsoProjection } from "./projection.js";

export const FIXED_DT = 1 / 60;

export const FinaleSchema = {
  fadeStartOffset: { label: "Finale start (vs last beat)", min: -3, max: 4, step: 0.05, default: 0 },
  fadeDur:         { label: "Map fade duration", min: 0.3, max: 5, step: 0.1, default: 2.1 },
  freezeCamera:    { label: "Freeze camera on finale", type: "bool", default: true },
};

export class Scene {
  constructor(config, timeline, registry) {
    this.config = config;
    this.timeline = timeline;
    this.duration = config.duration || timeline.duration;
    this.seed = config.seed >>> 0;
    this.view = { W: 1, H: 1 };

    // camera
    this.camera = new Camera(mergeDefaults(CameraSchema, config.camera));
    this.project = makeIsoProjection(this.camera, this.view);

    // finale
    this.finale = mergeDefaults(FinaleSchema, config.finale);

    // layers (instantiate from the registry by type)
    this.layers = (config.layers || []).map((spec, i) => {
      const Klass = registry[spec.type];
      if (!Klass) throw new Error("Unknown layer type: " + spec.type);
      const layer = new Klass(mergeDefaults(Klass.schema, spec.params));
      layer.id = spec.id || (countType(config.layers, spec.type) > 1 ? spec.type + i : spec.type);
      return layer;
    });

    this.t = 0;
    this.reset();
  }

  get fadeStartT() { return this.timeline.lastBeatT() + (this.finale.fadeStartOffset || 0); }

  reset() {
    this.rng = makeRNG(this.seed);
    this.t = 0;
    this.mapFade = 1;
    this.finaleStarted = false;
    this.camera.reset();
    const ctx = { rng: this.rng, timeline: this.timeline, view: this.view };
    this.layers.forEach((l, i) => l.reset(this.rng.fork(101 + i), ctx));
  }

  _world(t, dt, cues) {
    return {
      t, dt, cues: cues || [],
      view: this.view, cam: this.camera, project: this.project,
      timeline: this.timeline, mapFade: this.mapFade, rng: this.rng,
    };
  }

  stepOnce(dt) {
    const t0 = this.t, t1 = t0 + dt;
    const cues = this.timeline.cuesIn(t0, t1);
    this.t = t1;
    for (const c of cues) if (c.kind === "beat") this.camera.onBeat(c);
    this.camera.step(dt);
    // finale: begin fade + (optionally) freeze the camera on the last beat
    if (t1 >= this.fadeStartT && !this.finaleStarted) {
      this.finaleStarted = true;
      if (this.finale.freezeCamera) this.camera.freeze();
    }
    this.mapFade = clamp(1 - (t1 - this.fadeStartT) / this.finale.fadeDur, 0, 1);
    const w = this._world(t1, dt, cues);
    for (const l of this.layers) l.step(w);
  }

  /* jump to any time by re-simulating from 0 with fixed steps (deterministic) */
  seek(T) {
    this.reset();
    const n = Math.max(0, Math.round(clamp(T, 0, this.duration) / FIXED_DT));
    for (let i = 0; i < n; i++) this.stepOnce(FIXED_DT);
  }

  /* ---- params: flattened (kept for reference / programmatic edits; no UI) ---- */
  params() {
    const out = [];
    const push = (ns, schema, bag) => {
      for (const key in schema) {
        const s = schema[key];
        out.push({ path: ns + "." + key, label: s.label || key, schema: s,
          get: () => bag[key], set: v => { bag[key] = v; } });
      }
    };
    push("camera", CameraSchema, this.camera.p);
    push("finale", FinaleSchema, this.finale);
    for (const l of this.layers) push(l.id, l.constructor.schema, l.p);
    return out;
  }
}

function mergeDefaults(schema, overrides = {}) {
  const o = {};
  for (const k in schema) o[k] = "default" in schema[k] ? schema[k].default : 0;
  return Object.assign(o, overrides || {});
}
function countType(layers, type) { return (layers || []).filter(l => l.type === type).length; }
