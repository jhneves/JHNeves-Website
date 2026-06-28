/* =====================================================================
   RENDERER — WebGL2 pipeline. Draws bg + every layer into an HDR target,
   then bloom (bright -> separable blur) and a composite pass (tonemap +
   amber grade + chromatic aberration + vignette + grain) to the screen.
   Layers own their own programs; the renderer owns the scene-wide passes.
   ===================================================================== */
import { getGL, Program, Target, Fullscreen, bindScreen } from "./gl.js";
import { FS_VERT } from "../../shaders/quad.js";
import { BG_FRAG, BRIGHT_FRAG, BLUR_FRAG, COMPOSITE_FRAG } from "../../shaders/post.js";

const POST_DEFAULTS = { bloom: 1.6, threshold: 0.28, grade: 0.9, aberration: 0.7, vignette: 0.6, grain: 0.05, exposure: 0.62, murk: 0.9 };

export class Renderer {
  constructor(canvas, post) {
    this.canvas = canvas;
    this.gl = getGL(canvas);
    this.post = Object.assign({}, POST_DEFAULTS, post);
    const gl = this.gl;
    this.fs = new Fullscreen(gl);
    this.bg = new Program(gl, FS_VERT, BG_FRAG);
    this.bright = new Program(gl, FS_VERT, BRIGHT_FRAG);
    this.blur = new Program(gl, FS_VERT, BLUR_FRAG);
    this.composite = new Program(gl, FS_VERT, COMPOSITE_FRAG);
    this.dpr = 1;
    this.scene = new Target(gl, 2, 2, { float: true });
    this.bloomA = new Target(gl, 2, 2, { float: false });
    this.bloomB = new Target(gl, 2, 2, { float: false });
  }

  resize(W, H, dpr) {
    this.dpr = dpr;
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    const dw = this.canvas.width, dh = this.canvas.height;
    this.scene.resize(dw, dh);
    this.bloomA.resize(Math.max(1, dw >> 1), Math.max(1, dh >> 1));
    this.bloomB.resize(Math.max(1, dw >> 1), Math.max(1, dh >> 1));
  }

  render(scene) {
    const gl = this.gl, W = this.canvas.width, H = this.canvas.height;
    const view = {
      W, H, zoom: scene.camera.zoom * this.dpr, camX: 0, camY: 0,
      time: scene.t, mapFade: scene.mapFade, camNorm: scene.camera.norm, dpr: this.dpr,
    };
    gl.disable(gl.DEPTH_TEST);

    // 1) scene -> HDR target: bg, then layers (each sets its own blend)
    this.scene.bind();
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    this.bg.use().set("uViewport", [W, H]); this.fs.draw();
    for (const l of scene.layers) if (l.draw) l.draw({ gl, fs: this.fs }, view);

    // 2) bloom (half res): bright-pass, then 2 separable-blur iterations for a wide soft glow
    const hw = Math.max(1, W >> 1), hh = Math.max(1, H >> 1);
    gl.disable(gl.BLEND);
    this.bloomA.bind(); this.bright.use().set("uViewport", [hw, hh]).set("uThreshold", this.post.threshold).setTex("uTex", this.scene.tex, 0); this.fs.draw();
    for (let i = 0; i < 2; i++) {
      const spread = 1 + i;   // widen on the second pass
      this.bloomB.bind(); this.blur.use().set("uViewport", [hw, hh]).set("uDir", [spread, 0]).setTex("uTex", this.bloomA.tex, 0); this.fs.draw();
      this.bloomA.bind(); this.blur.use().set("uViewport", [hw, hh]).set("uDir", [0, spread]).setTex("uTex", this.bloomB.tex, 0); this.fs.draw();
    }

    // 3) composite -> screen.  The fog/grain run on a free-running wall clock (not scene.t), so
    // the murk keeps drifting even at idle (pre-start) when the sim clock is frozen.
    if (this._t0 === undefined) this._t0 = performance.now();
    const fogTime = (performance.now() - this._t0) / 1000;
    bindScreen(gl, W, H);
    gl.disable(gl.BLEND);
    this.composite.use()
      .set("uViewport", [W, H]).set("uTime", fogTime)
      .set("uBloomAmt", this.post.bloom).set("uGrade", this.post.grade)
      .set("uAberr", this.post.aberration).set("uVignette", this.post.vignette).set("uGrain", this.post.grain)
      .set("uExposure", this.post.exposure).set("uMurk", this.post.murk)
      .setTex("uScene", this.scene.tex, 0).setTex("uBloom", this.bloomA.tex, 1);
    this.fs.draw();
  }
}
