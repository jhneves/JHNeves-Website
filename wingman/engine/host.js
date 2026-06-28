/* =====================================================================
   HOST — drives a Scene on screen via the WebGL2 Renderer: DPR/resize, a
   fixed-step loop (matches the deterministic re-sim used by seek/export),
   audio sync, and play/seek API the scrubber talks to.
   ===================================================================== */
import { FIXED_DT } from "./scene.js";
import { clamp } from "./core.js";
import { Renderer } from "./gl/renderer.js";

export class Host {
  constructor(canvas, scene, audio) {
    this.canvas = canvas; this.scene = scene; this.audio = audio;
    this.renderer = new Renderer(canvas, scene.config.post);
    this.playing = false; this.acc = 0; this.last = performance.now(); this.dirty = false;
    this.onTime = null; this.onFrame = null;
    this.started = false;                                   // idle (pre-start) until begin()/seek
    this.bento = scene.layers.find(l => typeof l.idleStep === "function");
    if (this.bento) this.bento.idleReset();
    this.resize();
    addEventListener("resize", () => this.resize());
    requestAnimationFrame(t => this.loop(t));
  }

  begin() {                                                 // leave idle, play the show from the top
    this.started = true;
    if (this.bento) this.bento.idleActive = false;
    this.playing = true;
    this.scene.seek(0);
    this.audio.muted = false; try { this.audio.currentTime = 0; } catch (e) {}
    this.audio.play().catch(() => {});
    if (this.onTime) this.onTime(0);
  }

  resize() {
    const r = this.canvas.getBoundingClientRect();
    const W = Math.max(1, r.width || this.canvas.clientWidth), H = Math.max(1, r.height || this.canvas.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.scene.view.W = W; this.scene.view.H = H;
    this.renderer.resize(W, H, dpr);
    this.render();
  }

  play() { if (!this.started) return this.begin(); if (this.scene.t >= this.scene.duration - 0.02) this.seekImmediate(0); this.playing = true; this.audio.muted = false; this.audio.play().catch(() => {}); }
  pause() { this.playing = false; this.audio.pause(); }
  togglePlay() { this.playing ? this.pause() : this.play(); }

  seek(t) { this.pause(); this.seekImmediate(t); }
  seekImmediate(t) {
    this.started = true; if (this.bento) this.bento.idleActive = false;   // scrubbing leaves idle too
    this.scene.seek(t);
    try { this.audio.currentTime = clamp(t, 0, (this.audio.duration || this.scene.duration) - 0.05); } catch (e) {}
    this.render();
    if (this.onTime) this.onTime(this.scene.t);
  }

  setParam(path, value) {       // programmatic only (code/console); no UI knobs
    const p = this.scene.params().find(x => x.path === path);
    if (!p) return; p.set(value);
    if (!this.playing) this.dirty = true;
  }

  toggleGallery() {
    if (!this.bento) return;
    this.galleryActive = !this.galleryActive;
    const cam = this.scene.camera, post = this.renderer.post;
    if (this.galleryActive) {
      this.bento.buildGallery(); this.bento.galleryActive = true; this.galleryClock = 0; this.pause();
      this._save = { norm: cam.norm, zoom: cam.zoom, murk: post.murk, exp: post.exposure };
      cam.norm = 0.42; cam.zoom = 0.42 * cam.p.viewScale; post.murk = 0.12; post.exposure = 1.0;
    } else {
      this.bento.galleryActive = false;
      if (this._save) { cam.norm = this._save.norm; cam.zoom = this._save.zoom; post.murk = this._save.murk; post.exposure = this._save.exp; }
    }
    this.render();
  }

  loop(now) {
    const rdt = Math.min(0.05, (now - this.last) / 1000); this.last = now;
    if (this.galleryActive) {
      this.galleryClock += rdt; this.bento.galleryClock = this.galleryClock;
      this.render();
      requestAnimationFrame(t => this.loop(t));
      return;
    }
    if (!this.started) {
      if (this.bento) this.bento.idleStep(rdt);             // pre-start idle preview
    } else if (this.playing) {
      // The <audio> element is the master clock; the deterministic sim just follows it.
      // We never seek the audio to chase the sim: seeking a still-buffering network stream
      // mid-playback is what made the hosted audio stutter (each seek hit an unbuffered
      // spot, stalled, the sim raced ahead, and it re-seeked in a spiral). If audio stalls
      // to buffer, the sim simply waits with it, in sync, then catches up when it resumes.
      const target = this.audio.currentTime;
      let g = 0;
      while (this.scene.t + FIXED_DT <= target && g++ < 600) this.scene.stepOnce(FIXED_DT);
      if (this.audio.ended || this.scene.t >= this.scene.duration) this.pause();
      if (this.onTime) this.onTime(this.scene.t);
    } else if (this.dirty) {
      this.scene.seek(this.scene.t); this.dirty = false;
    }
    this.render();
    if (this.onFrame) this.onFrame();
    requestAnimationFrame(t => this.loop(t));
  }

  render() { this.renderer.render(this.scene); }
}
