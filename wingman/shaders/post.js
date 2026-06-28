/* Post stack: background gradient, bright-pass, separable blur (bloom), and
   the composite (bloom add + ACES tonemap + amber grade + chromatic
   aberration + vignette + dithered grain). Tune the look here. */
import { COMMON } from "./common.js";

export const BG_FRAG = /* glsl */`#version 300 es
precision highp float;
uniform vec2 uViewport;
out vec4 frag;
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport;
  float r = length((uv - vec2(0.5, 0.44)) * vec2(1.0, 1.1));
  vec3 c = mix(vec3(0.078,0.082,0.094), vec3(0.022,0.025,0.033), smoothstep(0.0, 0.7, r));
  frag = vec4(c, 1.0);
}`;

export const BRIGHT_FRAG = /* glsl */`#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uViewport; uniform float uThreshold;
out vec4 frag;
void main(){
  vec3 c = texture(uTex, gl_FragCoord.xy / uViewport).rgb;
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  frag = vec4(c * (max(0.0, l - uThreshold) / max(l, 1e-4)), 1.0);
}`;

export const BLUR_FRAG = /* glsl */`#version 300 es
precision highp float;
uniform sampler2D uTex; uniform vec2 uViewport; uniform vec2 uDir;
out vec4 frag;
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport, texel = uDir / uViewport;
  float w[5]; w[0]=0.227; w[1]=0.194; w[2]=0.121; w[3]=0.054; w[4]=0.016;
  vec3 s = texture(uTex, uv).rgb * w[0];
  for(int i=1;i<5;i++){ vec2 o = texel * float(i); s += texture(uTex, uv+o).rgb*w[i] + texture(uTex, uv-o).rgb*w[i]; }
  frag = vec4(s, 1.0);
}`;

export const COMPOSITE_FRAG = /* glsl */`#version 300 es
precision highp float;
${COMMON}
uniform sampler2D uScene; uniform sampler2D uBloom; uniform vec2 uViewport; uniform float uTime;
uniform float uBloomAmt, uGrade, uAberr, uVignette, uGrain, uExposure, uMurk;
out vec4 frag;
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0); }
void main(){
  vec2 uv = gl_FragCoord.xy / uViewport;
  vec2 d = uv - 0.5; float r = dot(d, d);
  float ab = uAberr * 0.012 * r;
  vec3 scn = vec3(texture(uScene, uv + d*ab).r, texture(uScene, uv).g, texture(uScene, uv - d*ab).b);
  vec3 bloom = texture(uBloom, uv).rgb;

  // FOG OF WAR — a patchy, slowly drifting haze veils the whole scene. The BASE is dimmed and
  // veiled (so you read silhouettes + faint colour), but the bloom is added on top, so bright
  // accents pierce the murk. Familiar shapes, half-seen in the dark.
  // FLUID fog: domain-warped fbm (flow noise) that swirls and slowly drifts
  vec2 fl = uv * 2.3;
  vec2 q = vec2(fbm(fl + vec2(0.0, uTime*0.045)), fbm(fl + vec2(5.2, 1.3) - uTime*0.035));
  vec2 w = vec2(fbm(fl + 3.0*q + vec2(1.7, 9.2) + uTime*0.02), fbm(fl + 3.0*q + vec2(8.3, 2.8) - uTime*0.025));
  float haze = fbm(fl + 3.4*w);
  float veil = mix(1.0, mix(0.28, 0.92, smoothstep(0.2, 0.85, haze)), uMurk);  // patchy, flowing visibility
  scn *= veil * uExposure;

  vec3 c = scn + bloom * uBloomAmt;                               // highlights glow through
  c = aces(c);
  c = mix(c, c * vec3(1.06, 1.0, 0.90), uGrade * 0.5);           // warm amber grade
  c *= 1.0 - uVignette * smoothstep(0.16, 0.62, length(d) + (haze - 0.5)*0.18);  // ragged edge fog
  c += vec3(0.009, 0.013, 0.021) * (0.6 + 0.4*(1.0 - haze)) * uMurk;            // cool ambient -> murk, not void
  float l = dot(c, vec3(0.299, 0.587, 0.114));
  c = mix(vec3(l), c, mix(1.0, 0.82, uMurk));                    // mute the colour a touch
  c += (hash21(uv * uViewport + uTime) - 0.5) * uGrain;
  frag = vec4(c, 1.0);
}`;
