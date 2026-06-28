/* =====================================================================
   TIMELINE — the music as DATA (decoupled from the runtime).
   Loaded from a JSON artifact produced by tools/analyze.py:
     { duration, beats:[{t,v}], onsets:[t,...], energy:[per-second,...] }
   The runtime only ever READS cues from here, so any song/animation
   reuses the same engine — swap the JSON, get a new rhythm.
   ===================================================================== */
import { clamp, lerp } from "./core.js";

export class Timeline {
  constructor(data) {
    this.duration = data.duration || 60;
    this.beats = (data.beats || []).map(b => (typeof b === "number" ? { t: b, v: 1 } : b));
    this.onsets = (data.onsets || []).map(o => (typeof o === "number" ? o : o.t));
    this.energy = data.energy || [0, 1];
    this.energyMax = Math.max(1e-6, ...this.energy);
  }

  /* build-energy envelope at time t, 0..1 */
  energyAt(t) {
    if (t <= 0) return this.energy[0] || 0;
    const last = this.energy.length - 1;
    if (t >= last) return this.energy[last];
    const i = Math.floor(t);
    return lerp(this.energy[i], this.energy[i + 1], t - i);
  }
  energyNorm(t) { return clamp(this.energyAt(t) / this.energyMax, 0, 1); }

  beatCount() { return this.beats.length; }
  lastBeatT() { return this.beats.length ? this.beats[this.beats.length - 1].t : this.duration; }

  /* Return every cue whose time falls in (t0, t1]. Used each sim tick so
     layers fire exactly once per beat/onset, deterministically. */
  cuesIn(t0, t1) {
    const out = [];
    for (let i = 0; i < this.beats.length; i++) {
      const t = this.beats[i].t;
      if (t > t0 && t <= t1) out.push({ kind: "beat", t, index: i, v: this.beats[i].v, total: this.beats.length });
    }
    for (let i = 0; i < this.onsets.length; i++) {
      const t = this.onsets[i];
      if (t > t0 && t <= t1) out.push({ kind: "onset", t, index: i, total: this.onsets.length });
    }
    return out;
  }

  static async load(url) {
    const res = await fetch(url);
    return new Timeline(await res.json());
  }
}
