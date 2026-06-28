/* =====================================================================
   SCENE: Wingman intro. Pure data — no logic. Tune params here in code;
   author a NEW scene by copying this shape, pointing at a different
   timeline/audio, and composing layers.
   ===================================================================== */
export default {
  seed: 20260619,
  duration: 51,
  audioUrl: "./wingmanintro.mp3",
  timelineUrl: "./assets/wingman-intro.timeline.json",

  camera: { startZoom: 0.42, stepEarly: 0.94, stepLate: 0.98, floor: 0.15 },   // start at the gallery zoom (0.42); ends ~0.15 so the FULL disc fills the window at the climax

  layers: [
    { type: "isoGrid" },
    // meticulous, one-piece-at-a-time start; surges when the beats crowd (~33s). Higher fillPower
    // keeps the early count tiny; slower trickle + assembly lets each bucket be savored.
    { type: "bentoBuild", params: { radius: 168, cellCount: 1300, fillPower: 2.85, introRate: 1.3,
        asmSlow: 2.6, asmFast: 0.55, kickStart: 26, kickEnd: 38, onsetCap: 10, beatCap: 90 } },
  ],

  finale: { fadeStartOffset: 0, fadeDur: 2.1, freezeCamera: true },

  // post stack (the "look"): bloom + filmic tonemap + amber grade + aberration + grain
  // murk = how submerged-in-fog (0..1); exposure = base brightness; bloom punches accents through
  post: { bloom: 1.7, threshold: 0.26, grade: 0.9, aberration: 0.7, vignette: 0.45, grain: 0.05, exposure: 1.0, murk: 0.22 },
};
