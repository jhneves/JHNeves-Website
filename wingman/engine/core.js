/* =====================================================================
   ENGINE CORE — tiny deterministic primitives shared by everything.
   Pure functions + a seeded RNG + a spring integrator. No DOM, no time
   of day, no Math.random — so the whole animation is reproducible from a
   seed and a virtual clock (that's what makes scrubbing & export exact).
   ===================================================================== */

export const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
export const lerp = (a, b, t) => a + (b - a) * t;
export const inv = (a, b, x) => (b === a ? 0 : clamp((x - a) / (b - a), 0, 1));

export const easeOut = t => 1 - Math.pow(1 - t, 3);
export const easeIn = t => t * t * t;
export const easeInOut = t => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* seeded RNG (mulberry32). .fork(salt) gives an independent stream so a
   layer can draw randoms without perturbing any other layer's sequence. */
export function makeRNG(seed) {
  let s = seed >>> 0;
  const rng = () => {
    s |= 0; s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  rng.seed = seed >>> 0;
  rng.fork = salt => makeRNG((seed ^ Math.imul((salt | 0) + 1, 0x9e3779b1)) >>> 0);
  return rng;
}

/* A 1-D critically-tunable spring. State { x, v }. Step it once per fixed
   sim tick toward `target`. k = stiffness, c = damping. */
export function springStep(st, target, dt, k, c) {
  st.v += (-c * st.v + k * (target - st.x)) * dt;
  st.x += st.v * dt;
  return st.x;
}

/* A flash/pulse envelope: quick ease-in to 1, smooth ease-out to 0.
   `since` = seconds since the trigger; returns 0 outside [0,dur]. */
export function flashEnvelope(since, dur, attackFrac = 0.16) {
  if (since < 0 || since > dur) return 0;
  const x = since / dur;
  return x < attackFrac ? easeOut(x / attackFrac) : 1 - easeInOut((x - attackFrac) / (1 - attackFrac));
}
