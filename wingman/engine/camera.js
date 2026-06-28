/* =====================================================================
   CAMERA — beat-stepped zoom on an underdamped/critical spring, with an
   optional freeze (for the "stop on the last beat" finale). All behaviour
   is exposed as schema params so the control panel can tune it live.
   ===================================================================== */
import { clamp, lerp, springStep } from "./core.js";

export const CameraSchema = {
  startZoom:  { label: "Start zoom",   min: 0.1,  max: 1.0, step: 0.01, default: 0.3 },
  viewScale:  { label: "View scale",   min: 0.4,  max: 2.0, step: 0.05, default: 1.0 },
  stepEarly:  { label: "Beat step (early)", min: 0.7, max: 0.99, step: 0.005, default: 0.86 },
  stepLate:   { label: "Beat step (late)",  min: 0.7, max: 0.99, step: 0.005, default: 0.965 },
  floor:      { label: "Zoom floor",   min: 0.02, max: 0.4, step: 0.005, default: 0.07 },
  punchEarly: { label: "Punch (early)", min: 0, max: 1.5, step: 0.02, default: 0.7 },
  punchLate:  { label: "Punch (late)",  min: 0, max: 1.5, step: 0.02, default: 0.16 },
  stiffLow:   { label: "Stiffness (low)",  min: 40, max: 240, step: 5, default: 105 },
  stiffHigh:  { label: "Stiffness (high)", min: 40, max: 240, step: 5, default: 150 },
  dampLow:    { label: "Damping (low)",  min: 6, max: 40, step: 1, default: 11 },
  dampHigh:   { label: "Damping (high)", min: 6, max: 40, step: 1, default: 25 },
};

export class Camera {
  constructor(params) { this.p = params; this.x = 0; this.y = 0; this.reset(); }

  reset() {
    this.zoomBeat = 1;
    this.norm = this.p.startZoom;        // normalized zoom (the thing beats step)
    this.vel = 0;
    this.tension = 0;                    // 0 early -> 1 at climax (ramps damping)
    this.frozen = false;
    this.zoom = this.norm * this.p.viewScale;
  }

  /* called once per beat cue (unless frozen) */
  onBeat(cue) {
    if (this.frozen) return;
    const intensity = Math.pow(cue.index / Math.max(1, cue.total - 1), 1.2);
    this.zoomBeat = Math.max(this.p.floor / this.p.startZoom,
      this.zoomBeat * lerp(this.p.stepEarly, this.p.stepLate, intensity));
    this.vel -= this.norm * lerp(this.p.punchEarly, this.p.punchLate, intensity);
    this.tension = intensity;
  }

  freeze() { this.frozen = true; this.vel = 0; }

  step(dt) {
    if (!this.frozen) {
      const target = this.p.startZoom * this.zoomBeat;
      const k = lerp(this.p.stiffLow, this.p.stiffHigh, this.tension);
      const c = lerp(this.p.dampLow, this.p.dampHigh, this.tension);
      const st = { x: this.norm, v: this.vel };
      springStep(st, target, dt, k, c);
      this.norm = st.x; this.vel = st.v;
    }
    this.zoom = this.norm * this.p.viewScale;
  }
}
