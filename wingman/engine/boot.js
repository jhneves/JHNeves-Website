/* =====================================================================
   BOOT — wire a scene to the screen. The layer REGISTRY maps the string
   types used in scene configs to their classes; add new layers here.
   ===================================================================== */
import { Scene } from "./scene.js";
import { Timeline } from "./timeline.js";
import { Host } from "./host.js";
import { buildUI } from "./ui.js";
import { IsoGrid } from "../layers/isoGrid.js";
import { BentoBuild } from "../layers/bentoBuild.js";

const REGISTRY = { isoGrid: IsoGrid, bentoBuild: BentoBuild };

export async function boot({ canvas, audio, panel, config, dev }) {
  const timeline = await Timeline.load(config.timelineUrl);
  const scene = new Scene(config, timeline, REGISTRY);
  audio.src = config.audioUrl;
  audio.preload = "auto";
  const host = new Host(canvas, scene, audio);
  if (dev) { buildUI(host, scene, panel); window.studio = { host, scene }; }   // transport + console handle: dev only
  return { host, scene };
}
