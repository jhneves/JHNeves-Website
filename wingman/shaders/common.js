/* Shared GLSL: palette + hashes + sdf/easing helpers. Prepended into fragment shaders. */
export const COMMON = /* glsl */`
const vec3 BONE    = vec3(0.878, 0.886, 0.902);
const vec3 BONE_HI = vec3(0.961, 0.969, 0.980);
const vec3 AMBER   = vec3(0.961, 0.773, 0.259);
const vec3 AMBER_D = vec3(0.878, 0.592, 0.165);

float hash11(float p){ p = fract(p*0.1031); p *= p+33.33; p *= p+p; return fract(p); }
float hash21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
float sdBox(vec2 p, vec2 b){ vec2 d = abs(p)-b; return length(max(d,0.0)) + min(max(d.x,d.y),0.0); }
float vnoise(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  float a=hash21(i), b=hash21(i+vec2(1,0)), c=hash21(i+vec2(0,1)), d=hash21(i+vec2(1,1));
  return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
float fbm(vec2 p){ float s=0.0, a=0.5; for(int i=0;i<4;i++){ s+=a*vnoise(p); p*=2.03; a*=0.5; } return s; }
float bar(float x, float a, float b, float aa){ return smoothstep(a-aa, a+aa, x) * (1.0 - smoothstep(b-aa, b+aa, x)); }
float easeOut(float t){ return 1.0 - pow(1.0-t, 3.0); }
// soft filled rect [a,b]
float sbox(vec2 p, vec2 a, vec2 b, float aa){
  vec2 lo = smoothstep(a-aa, a+aa, p), hi = 1.0 - smoothstep(b-aa, b+aa, p);
  return lo.x*lo.y*hi.x*hi.y;
}
float disc(vec2 p, vec2 c, float r, float aa){ return 1.0 - smoothstep(r-aa, r+aa, length(p-c)); }
// a smudge: a soft mass whose coordinates are domain-warped (smeared) into an irregular
// shape, with a fuzzy falloff and internal density variation — not a defined ball.
float blob(vec2 p, vec2 c, float r, float sd){
  vec2 d = (p - c) / r;
  vec2 w = d + 0.75 * vec2(fbm(d * 1.1 + sd * 3.0) - 0.5, fbm(d * 1.1 + sd * 3.0 + 11.0) - 0.5);
  float fall = smoothstep(1.3, 0.18, length(w));        // soft irregular edge
  float tex = 0.45 + 0.6 * fbm(d * 2.4 + sd * 5.0);      // patchy interior
  return clamp(fall * tex, 0.0, 1.0);
}
// right-pointing play triangle around center c, size s
float tri(vec2 p, vec2 c, float s){ p -= c; float m = step(-s, p.x) * step(p.x, s); return m * step(abs(p.y), (s - p.x)*0.7); }
// brand-ish accents (browser cards) — muted so the bloom stays tasteful
const vec3 RED = vec3(0.93,0.27,0.22), BLUE = vec3(0.27,0.52,0.96), GREEN = vec3(0.22,0.73,0.42), YEL = vec3(0.98,0.74,0.06), PURP = vec3(0.55,0.36,0.96);
`;
