/* =====================================================================
   PROJECTION — world (col,row,height) -> screen. Isometric for now, but
   it's an isolated object so a scene could swap in ortho/3D later.
   A Camera owns zoom/pan; project() reads it. Everything (grid, blocks)
   shares this one projection so layers always line up.
   ===================================================================== */
export const ISO = { w: 34, h: 17, zh: 20 };   // tile half-extents; cube height

export function makeIsoProjection(cam, view) {
  return function project(col, row, h = 0) {
    const z = cam.zoom;
    return {
      x: (col - row) * (ISO.w * 0.5) * z + view.W * 0.5 + cam.x,
      y: (col + row) * (ISO.h * 0.5) * z - h * ISO.zh * z + view.H * 0.5 + cam.y,
    };
  };
}

/* inverse: visible col/row span of the screen rectangle (for grid bounds) */
export function visibleColRow(cam, view, margin = 90) {
  const hw = ISO.w * 0.5 * cam.zoom, hh = ISO.h * 0.5 * cam.zoom;
  const cx = view.W * 0.5 + cam.x, cy = view.H * 0.5 + cam.y;
  const Amin = (-margin - cx) / hw, Amax = (view.W + margin - cx) / hw;
  const Bmin = (-margin - cy) / hh, Bmax = (view.H + margin - cy) / hh;
  return {
    colMin: Math.floor((Amin + Bmin) / 2), colMax: Math.ceil((Amax + Bmax) / 2),
    rowMin: Math.floor((Bmin - Amax) / 2), rowMax: Math.ceil((Bmax - Amin) / 2),
    cellPx: Math.hypot(hw, hh),
  };
}
