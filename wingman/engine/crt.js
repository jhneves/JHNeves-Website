/* =====================================================================
   CRT power-off — a standalone WebGL2 overlay for the JOIN finale. A soft,
   natural glint: an fbm-textured haze with faint domain-warped rays, so nothing
   reads as a clean ball or clean lines — it's mottled and irregular like a light
   seen through air. It blooms, shimmers, and fades. Composited with `screen`
   blend; centred + sized on the JOIN box (uHalfW/uHalfH).
   ===================================================================== */
const VERT = `#version 300 es
const vec2 P[3] = vec2[3](vec2(-1.0,-1.0), vec2(3.0,-1.0), vec2(-1.0,3.0));
out vec2 vUv;
void main(){ vec2 p = P[gl_VertexID]; vUv = p*0.5+0.5; gl_Position = vec4(p,0.0,1.0); }`;

const FRAG = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 frag;
uniform float uT;        // 0..1 progress
uniform float uAspect;   // w/h  (1 vertical unit == canvas height)
uniform float uCenterY;  // vertical centre (0..1)
uniform float uHalfW;    // panel half-width  in vertical units
uniform float uHalfH;    // panel half-height in vertical units
uniform float uTime;     // seconds, for shimmer / drift

float hash(vec2 p){ p = fract(p*vec2(123.34, 456.21)); p += dot(p, p+45.32); return fract(p.x*p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash(i), b = hash(i+vec2(1,0)), c = hash(i+vec2(0,1)), d = hash(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float s = 0.0, a = 0.55; for(int i=0;i<5;i++){ s += a*vnoise(p); p = p*2.03 + 1.3; a *= 0.5; } return s; }

// faint ray pair along an axis: al = along, pe = perpendicular. Thick + soft, fading to a point.
float rays(float al, float pe, float len, float baseThick){
  float a = clamp(1.0 - al/len, 0.0, 1.0);
  float thick = max(baseThick * pow(a, 1.6), 0.0008);
  float sharp = exp(-(pe*pe)/(2.0*thick*thick));
  float soft  = exp(-(pe*pe)/(2.0*pow(thick*5.5, 2.0)));
  return (sharp*0.15 + soft*1.0) * pow(a, 1.0);
}

void main(){
  vec2 p = vUv - vec2(0.5, uCenterY);
  p.x *= uAspect;                                  // aspect-correct: x,y share scale
  float t = clamp(uT, 0.0, 1.0);

  float appear = smoothstep(0.0, 0.14, t);
  float grow   = smoothstep(0.06, 0.90, t);
  float amp    = appear * (1.0 - smoothstep(0.38, 1.0, t));

  float baseThick = mix(max(uHalfH*0.34, 0.007), 0.0014, smoothstep(0.0, 0.5, t));
  float lenH = uHalfW * mix(1.0, 3.0, grow);
  float lenV = uHalfH * mix(1.4, 2.8, grow);

  // organic domain warp: a LOW-frequency, gentle bend off the perfect gaussian (not jagged forks)
  vec2 wn   = p*8.0;
  vec2 warp = vec2(fbm(wn + vec2(0.0, uTime*0.4)), fbm(wn + vec2(8.4, -uTime*0.3))) - 0.5;
  vec2 q    = p + warp * (uHalfH*0.18 + baseThick*0.6);

  // faint, gently-warped rays
  float rayH = rays(abs(q.x), q.y, lenH, baseThick);
  float rayV = rays(abs(q.y), q.x, lenV, baseThick);

  // soft haze (fbm-broken radial falloff) instead of a clean ball — softly mottled like air
  float rq   = length(q);
  float haze = exp(-rq / (uHalfH*0.9 + 0.026));
  float tex  = 0.55 + 0.55 * fbm(p*13.0 + vec2(-uTime*0.4, uTime*0.3));
  haze *= tex;

  // faint wide ambient wash
  float amb = exp(-length(p) / (uHalfH*1.5 + 0.045));

  vec3 shine = vec3(0.961, 0.969, 0.980);          // BONE_HI
  vec3 amber = vec3(0.961, 0.773, 0.259);          // AMBER
  vec3 glim  = shine + amber*0.41;                 // bucket-assembly shimmer tint

  vec3 col = glim  * (rayH + rayV) * 0.40
           + glim  * haze * 0.50
           + amber * amb  * 0.16;

  col *= amp;
  col = col / (1.0 + 0.60*col);                    // soft knee
  frag = vec4(max(col, 0.0), 1.0);
}`;

export class CrtOff {
  constructor(canvas) {
    this.canvas = canvas; this.gl = null; this.prog = null; this.raf = 0; this.durMs = 680; this.elapsed = 0;
    this.centerY = 0.5; this.halfW = 0.06; this.halfH = 0.022;   // sensible defaults (overridden per play)
  }

  init() {
    const gl = this.canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: false, antialias: false, depth: false });
    if (!gl) throw new Error("WebGL2 unavailable for CRT overlay");
    this.gl = gl;
    const sh = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s)); return s; };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    this.prog = p;
    this.vao = gl.createVertexArray();                 // empty VAO; positions come from the shader
    this.u = { t: gl.getUniformLocation(p, "uT"), aspect: gl.getUniformLocation(p, "uAspect"),
      centerY: gl.getUniformLocation(p, "uCenterY"), halfW: gl.getUniformLocation(p, "uHalfW"),
      halfH: gl.getUniformLocation(p, "uHalfH"), time: gl.getUniformLocation(p, "uTime") };
  }

  resize() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(innerWidth * dpr)), h = Math.max(1, Math.round(innerHeight * dpr));
    if (this.canvas.width !== w || this.canvas.height !== h) { this.canvas.width = w; this.canvas.height = h; }
    this.gl.viewport(0, 0, w, h);
    this.aspect = w / h;
  }

  play(onDone) {
    try { if (!this.gl) this.init(); } catch (e) { if (onDone) onDone(); return; }   // fail soft
    this.resize();
    this.start = performance.now(); this.onDone = onDone;
    cancelAnimationFrame(this.raf);
    this.raf = requestAnimationFrame(t => this.loop(t));
  }

  loop(now) {
    const el = (now - this.start) / 1000; this.elapsed = el;          // real seconds (shimmer stays real-time)
    const lin = Math.min(el / (this.durMs / 1000), 1);
    const t = lin < 0.5 ? 2.0*lin*lin : 1.0 - Math.pow(-2.0*lin + 2.0, 2.0) / 2.0;   // easeInOutQuad
    this.draw(t);
    if (lin < 1) { this.raf = requestAnimationFrame(n => this.loop(n)); }
    else { this.clear(); this.raf = 0; if (this.onDone) this.onDone(); }
  }

  draw(t) {
    const gl = this.gl, u = this.u;
    gl.bindVertexArray(this.vao);
    gl.useProgram(this.prog);
    gl.uniform1f(u.t, t);
    gl.uniform1f(u.aspect, this.aspect);
    gl.uniform1f(u.centerY, this.centerY);
    gl.uniform1f(u.halfW, this.halfW);
    gl.uniform1f(u.halfH, this.halfH);
    gl.uniform1f(u.time, this.elapsed);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  clear() { const gl = this.gl; if (!gl) return; gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); }
}
