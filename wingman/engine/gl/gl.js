/* =====================================================================
   GL — small WebGL2 toolkit: program compile/link, render targets (HDR
   when available), a fullscreen-triangle pass, and an instanced-quad
   batch. Everything else (layers, post) builds on these.
   ===================================================================== */

export function getGL(canvas) {
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, premultipliedAlpha: false });
  if (!gl) throw new Error("WebGL2 not available");
  gl.hdr = !!gl.getExtension("EXT_color_buffer_float");
  gl.getExtension("OES_texture_float_linear");
  return gl;
}

export class Program {
  constructor(gl, vert, frag) {
    this.gl = gl;
    this.prog = link(gl, compile(gl, gl.VERTEX_SHADER, vert), compile(gl, gl.FRAGMENT_SHADER, frag));
    this.u = {}; this.a = {};
  }
  use() { this.gl.useProgram(this.prog); return this; }
  loc(name) { return this.u[name] ?? (this.u[name] = this.gl.getUniformLocation(this.prog, name)); }
  attr(name) { return this.a[name] ?? (this.a[name] = this.gl.getAttribLocation(this.prog, name)); }
  set(name, v) {
    const gl = this.gl, l = this.loc(name); if (l == null) return this;
    if (typeof v === "number") gl.uniform1f(l, v);
    else if (v.length === 2) gl.uniform2fv(l, v);
    else if (v.length === 3) gl.uniform3fv(l, v);
    else if (v.length === 4) gl.uniform4fv(l, v);
    return this;
  }
  setTex(name, tex, unit) { const gl = this.gl; gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, tex); gl.uniform1i(this.loc(name), unit); return this; }
}

function compile(gl, type, src) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS))
    throw new Error((type === gl.VERTEX_SHADER ? "VERT" : "FRAG") + " shader:\n" + gl.getShaderInfoLog(s) + "\n" + numberLines(src));
  return s;
}
function link(gl, vs, fs) {
  const p = gl.createProgram(); gl.attachShader(p, vs); gl.attachShader(p, fs); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error("link: " + gl.getProgramInfoLog(p));
  return p;
}
function numberLines(s) { return s.split("\n").map((l, i) => (i + 1) + ": " + l).join("\n"); }

/* offscreen color target; float if available else 8-bit */
export class Target {
  constructor(gl, w, h, { float = false, linear = true } = {}) {
    this.gl = gl; this.float = float && gl.hdr;
    this.tex = gl.createTexture();
    this.fbo = gl.createFramebuffer();
    this.resize(w, h, linear);
  }
  resize(w, h, linear = true) {
    const gl = this.gl; this.w = w | 0; this.h = h | 0;
    gl.bindTexture(gl.TEXTURE_2D, this.tex);
    const ifmt = this.float ? gl.RGBA16F : gl.RGBA8, type = this.float ? gl.HALF_FLOAT : gl.UNSIGNED_BYTE;
    gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, this.w, this.h, 0, gl.RGBA, type, null);
    const filt = linear ? gl.LINEAR : gl.NEAREST;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filt);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.tex, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }
  bind() { const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo); gl.viewport(0, 0, this.w, this.h); return this; }
}

export function bindScreen(gl, w, h) { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); }

/* fullscreen triangle: bind your program + uniforms, then call draw() */
export class Fullscreen {
  constructor(gl) {
    this.gl = gl; this.vao = gl.createVertexArray();
    const buf = gl.createBuffer();
    gl.bindVertexArray(this.vao);
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);
  }
  draw() { const gl = this.gl; gl.bindVertexArray(this.vao); gl.drawArrays(gl.TRIANGLES, 0, 3); gl.bindVertexArray(null); }
}

/* instanced unit quad. instanceAttribs: [{loc, size}] interleaved in one buffer. */
export class InstancedQuad {
  constructor(gl, instanceAttribs) {
    this.gl = gl; this.attribs = instanceAttribs; this.count = 0;
    this.stride = instanceAttribs.reduce((n, a) => n + a.size, 0) * 4;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    // unit quad corners (0..1) as triangle strip
    const qb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qb);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    // instance buffer
    this.ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.ibuf);
    let off = 0;
    for (const a of instanceAttribs) {
      gl.enableVertexAttribArray(a.loc);
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, this.stride, off);
      gl.vertexAttribDivisor(a.loc, 1);
      off += a.size * 4;
    }
    gl.bindVertexArray(null);
  }
  upload(float32, count) {
    const gl = this.gl; this.count = count;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.ibuf);
    gl.bufferData(gl.ARRAY_BUFFER, float32, gl.DYNAMIC_DRAW);
  }
  draw() { if (!this.count) return; const gl = this.gl; gl.bindVertexArray(this.vao); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, this.count); gl.bindVertexArray(null); }
}

/* instanced arbitrary base mesh (e.g. a subdivided grid so each instance is
   built from many tiles). baseVerts: Float32Array, baseSize floats/vertex at
   location 0. instanceAttribs interleaved in one dynamic buffer. */
export class InstancedMesh {
  constructor(gl, baseVerts, baseSize, instanceAttribs) {
    this.gl = gl; this.count = 0; this.baseN = baseVerts.length / baseSize;
    this.stride = instanceAttribs.reduce((n, a) => n + a.size, 0) * 4;
    this.vao = gl.createVertexArray();
    gl.bindVertexArray(this.vao);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb);
    gl.bufferData(gl.ARRAY_BUFFER, baseVerts, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, baseSize, gl.FLOAT, false, 0, 0);
    this.ibuf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, this.ibuf);
    let off = 0;
    for (const a of instanceAttribs) {
      gl.enableVertexAttribArray(a.loc);
      gl.vertexAttribPointer(a.loc, a.size, gl.FLOAT, false, this.stride, off);
      gl.vertexAttribDivisor(a.loc, 1);
      off += a.size * 4;
    }
    gl.bindVertexArray(null);
  }
  upload(f32, count) { const gl = this.gl; this.count = count; gl.bindBuffer(gl.ARRAY_BUFFER, this.ibuf); gl.bufferData(gl.ARRAY_BUFFER, f32, gl.DYNAMIC_DRAW); }
  draw() { if (!this.count) return; const gl = this.gl; gl.bindVertexArray(this.vao); gl.drawArraysInstanced(gl.TRIANGLES, 0, this.baseN, this.count); gl.bindVertexArray(null); }
}

/* subdivided unit-quad mesh: NxM tiles, 6 verts/tile, each vertex carries
   vec4(localUV, tileCenter) so the shader can animate per-tile. */
export function gridMeshVerts(N, M) {
  const v = [];
  for (let j = 0; j < M; j++) for (let i = 0; i < N; i++) {
    const x0 = i / N, x1 = (i + 1) / N, y0 = j / M, y1 = (j + 1) / M;
    const cx = (i + 0.5) / N, cy = (j + 0.5) / M;
    const P = (x, y) => v.push(x, y, cx, cy);
    P(x0, y0); P(x1, y0); P(x1, y1); P(x0, y0); P(x1, y1); P(x0, y1);
  }
  return new Float32Array(v);
}
