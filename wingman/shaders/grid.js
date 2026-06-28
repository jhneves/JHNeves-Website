/* Procedural isometric DOT lattice (fullscreen). Reconstructs world (col,row)
   per pixel, finds the nearest lattice node, draws a soft dot. Dots glow amber
   and swell on the beat flash (HDR so the bloom catches them). Additive. */
import { COMMON } from "./common.js";

export const GRID_FRAG = /* glsl */`#version 300 es
precision highp float;
${COMMON}
uniform vec2 uViewport; uniform float uZoom; uniform vec2 uCam;
uniform float uStep, uFlash, uRest, uColorMix, uGridFade, uMapFade, uLevelFade;
out vec4 frag;
const float ISO_W = 34.0, ISO_H = 17.0;
void main(){
  vec2 px = vec2(gl_FragCoord.x, uViewport.y - gl_FragCoord.y);   // top-down to match cards
  vec2 c = vec2(uViewport.x * 0.5 + uCam.x, uViewport.y * 0.5 + uCam.y);
  float hw = ISO_W * 0.5 * uZoom, hh = ISO_H * 0.5 * uZoom;
  float A = (px.x - c.x) / hw, B = (px.y - c.y) / hh;
  float col = (A + B) * 0.5, row = (B - A) * 0.5;
  // nearest lattice node (stepped), back to screen px
  float ci = floor(col / uStep + 0.5) * uStep, ri = floor(row / uStep + 0.5) * uStep;
  vec2 node = vec2((ci - ri) * hw + c.x, (ci + ri) * hh + c.y);
  float d = length(px - node);
  float radius = 1.7;                                  // constant size — the beat only changes colour/brightness
  float dot = 1.0 - smoothstep(radius - 1.2, radius + 0.7, d);
  float rad = length((px - c) / uViewport);
  // reach the screen edges + corners (the "unsafe" outer areas) instead of fading out in a
  // tight disc: edges (rad~0.5) stay near full, only the extreme corners softly taper.
  float fade = 1.0 - smoothstep(0.4, 1.15, rad);
  float inten = (uRest + uFlash * 0.55) * uGridFade * uMapFade * fade;   // gentler beat lift
  vec3 color = mix(BONE, AMBER, uColorMix);
  frag = vec4(color * inten * dot * 1.35 * uLevelFade, 0.0);   // uLevelFade cross-fades LOD levels
}`;
