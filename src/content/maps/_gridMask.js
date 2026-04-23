export function buildBuildableMask(waypoints, { gridCols, gridRows, cellSize, buffer = 1 }) {
  const mask = new Uint8Array(gridCols * gridRows).fill(1);

  if (waypoints.length < 2) return mask;

  const blocked = new Set();
  const step = cellSize / 4;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const ax = waypoints[i].x;
    const ay = waypoints[i].y;
    const bx = waypoints[i + 1].x;
    const by = waypoints[i + 1].y;
    const dx = bx - ax;
    const dy = by - ay;
    const segLen = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.ceil(segLen / step);

    for (let s = 0; s <= steps; s++) {
      const t = steps === 0 ? 0 : s / steps;
      const x = ax + t * dx;
      const y = ay + t * dy;
      const col = Math.floor(x / cellSize);
      const row = Math.floor(y / cellSize);
      if (col >= 0 && col < gridCols && row >= 0 && row < gridRows) {
        blocked.add(row * gridCols + col);
      }
    }
  }

  for (const idx of blocked) {
    const baseRow = Math.floor(idx / gridCols);
    const baseCol = idx % gridCols;
    for (let dr = -buffer; dr <= buffer; dr++) {
      for (let dc = -buffer; dc <= buffer; dc++) {
        const r = baseRow + dr;
        const c = baseCol + dc;
        if (r >= 0 && r < gridRows && c >= 0 && c < gridCols) {
          mask[r * gridCols + c] = 0;
        }
      }
    }
  }

  return mask;
}
