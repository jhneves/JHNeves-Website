/* Instanced card mesh. Each card is a subdivided grid of mini-tiles; the
   vertex shader flies each tile in from a nearby offset with a per-tile delay
   (the "come together from blocks" assembly), then they settle into the card.
   The fragment shader draws the procedural content + a shimmer sweep on appear. */
import { COMMON } from "./common.js";
import { CONTENT } from "./content.js";

export const CARD_VERT = /* glsl */`#version 300 es
layout(location=0) in vec4 aVert;       // localUV.xy , tileCenter.zw  (0..1 card space)
layout(location=1) in vec4 aRect;       // col,row,w,h (world cells)
layout(location=2) in vec4 aMeta;       // spawnT, type, seed, deathT (idle dissolve; 0 = never)
uniform vec2 uViewport; uniform float uZoom; uniform vec2 uCam; uniform float uTime;
uniform float uAsmSlow, uAsmFast, uKickStart, uKickEnd;
out vec2 vUv; out float vType; out float vSeed; out float vTileRev; out float vSweep; out float vDis; out float vAge; out float vAspect;
const float ISO_W = 34.0, ISO_H = 17.0;
float h21(vec2 p){ vec3 q = fract(vec3(p.xyx)*0.1031); q += dot(q, q.yzx+33.33); return fract((q.x+q.y)*q.z); }
void main(){
  vec2 luv = aVert.xy, tc = aVert.zw;
  float age = uTime - aMeta.x;
  // SLOW & careful assembly for cards placed before the kick, snappy after (spawnT = aMeta.x)
  float adur = mix(uAsmSlow, uAsmFast, smoothstep(uKickStart, uKickEnd, aMeta.x));
  // each tile lands on its OWN schedule, spread across most of the window -> pieced together one by one
  float delay = h21(tc + aMeta.z*7.13) * adur * 0.74;
  float trev = 1.0 - pow(1.0 - clamp((age - delay) / (adur*0.34), 0.0, 1.0), 3.0);
  float ang = h21(tc + aMeta.z*3.1) * 6.2831;
  vec2 off = vec2(cos(ang), sin(ang)) * (0.4 + 0.7*h21(tc + aMeta.z*5.7)) * (1.0 - trev);  // fly in from nearby
  float sc = mix(0.45, 1.0, trev);                                    // pop/grow toward tile centre
  vec2 uv = tc + (luv - tc) * sc + off;
  vUv = luv; vType = aMeta.y; vSeed = aMeta.z; vTileRev = trev; vAspect = aRect.z / max(aRect.w, 0.0001);
  vSweep = clamp(age / (adur*1.05), 0.0, 1.4);
  vDis = aMeta.w > 0.5 ? clamp(1.0 - (uTime - aMeta.w) / 0.7, 0.0, 1.0) : 1.0;   // idle cards dissolve at deathT
  vAge = max(0.0, age);                                                          // per-card clock for animated content
  vec2 cr = aRect.xy + uv * aRect.zw;                                 // world (col,row)
  float sx = (cr.x - cr.y) * (ISO_W*0.5) * uZoom + uViewport.x*0.5 + uCam.x;
  float sy = (cr.x + cr.y) * (ISO_H*0.5) * uZoom + uViewport.y*0.5 + uCam.y;
  gl_Position = vec4(sx / uViewport.x * 2.0 - 1.0, 1.0 - sy / uViewport.y * 2.0, 0.0, 1.0);
}`;

export const CARD_FRAG = /* glsl */`#version 300 es
precision highp float;
${COMMON}
${CONTENT}
in vec2 vUv; in float vType; in float vSeed; in float vTileRev; in float vSweep; in float vDis; in float vAge; in float vAspect;
uniform float uMapFade;
out vec4 frag;
// soft-focus the procedural content (5-tap) so buckets read hazy/mysterious, not crisp
vec3 inkBlur(float type, vec2 uv, float seed, float t){
  float r = 0.012;
  return cardInk(type, uv, seed, t) * 0.36
       + cardInk(type, uv + vec2(r,0.0), seed, t) * 0.16
       + cardInk(type, uv - vec2(r,0.0), seed, t) * 0.16
       + cardInk(type, uv + vec2(0.0,r), seed, t) * 0.16
       + cardInk(type, uv - vec2(0.0,r), seed, t) * 0.16;
}
void main(){
  vec2 uv = vUv;
  // LOD: 5-tap soft focus on big (close) cards; single tap when the card is tiny on screen
  // (the blur is invisible there) — keeps the climax of ~900 sim'd cards cheap.
  float texel = max(fwidth(uv.x), fwidth(uv.y));
  vec3 ink = texel > 0.02 ? cardInk(vType, uv, vSeed, vAge) : inkBlur(vType, uv, vSeed, vAge);
  vec3 col = vec3(0.030, 0.034, 0.045) + ink;                              // glass panel + content
  // rounded-rect distance field (aspect-corrected) — drives BOTH the edge glow and the corner
  // mask, so the glow follows the rounded corners instead of being clipped to a square.
  vec2 rp = (uv - 0.5) * vec2(vAspect, 1.0);
  vec2 rq = abs(rp) - vec2(0.5*vAspect, 0.5) + 0.11;
  float rsd = length(max(rq, 0.0)) + min(max(rq.x, rq.y), 0.0) - 0.11;
  float em = max(-rsd, 0.0);                                               // distance inside from the rounded edge
  col += AMBER * 0.16 * (1.0 - smoothstep(0.0, 0.06, em));            // soft warm edge glow (no hard white border)
  col *= 0.65 + 0.35 * smoothstep(0.0, 0.013, em);                    // gentle inner-shadow edge for separation
  // shimmer: a bright sweep crosses the card as it assembles — TEXTURED (irregular edge +
  // sparkle grain) so it reads like light catching a real frosted surface, not a clean band.
  float d = (uv.x + uv.y) * 0.5;
  float edge = (fbm(uv*6.0 + vSeed*3.1) - 0.5) * 0.09;                  // irregular leading/trailing edge
  float band = exp(-pow((d + edge - vSweep), 2.0) / 0.007);
  float lod = 1.0 - smoothstep(0.012, 0.03, texel);                    // grain only where the card is big
  float spark = mix(1.0, (0.45 + 0.7*fbm(uv*34.0 + vSeed*9.0 + vSweep*4.0))
                        * (0.65 + 0.6*fbm(uv*88.0 - vSweep*5.0)), lod); // sparkle/grain within the sweep
  float win = smoothstep(0.0, 0.12, vSweep) * (1.0 - smoothstep(1.0, 1.32, vSweep));
  col += (BONE_HI*1.5 + AMBER*0.6) * band * spark * win;
  // rounded-corner mask (reuses the same SDF as the edge glow above)
  float caa = max(1.5*texel, 0.004);
  float corner = 1.0 - smoothstep(-caa, caa, rsd);
  float A = 0.92 * vTileRev * vDis * uMapFade * corner;
  frag = vec4(col * A, A);
}`;
