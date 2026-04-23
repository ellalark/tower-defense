export function buildPath(waypoints) {
  if (waypoints.length < 2) {
    return { waypoints, segments: [], totalLength: 0 };
  }

  const segments = [];
  let totalLength = 0;

  for (let i = 0; i < waypoints.length - 1; i++) {
    const dx = waypoints[i + 1].x - waypoints[i].x;
    const dy = waypoints[i + 1].y - waypoints[i].y;
    const length = Math.sqrt(dx * dx + dy * dy);
    totalLength += length;
    segments.push({ length, dx, dy });
  }

  return { waypoints, segments, totalLength };
}

export function pointAtDistance(path, d) {
  const { waypoints, segments, totalLength } = path;

  if (waypoints.length === 0) {
    return { x: 0, y: 0, segmentIndex: 0 };
  }

  if (waypoints.length === 1) {
    return { x: waypoints[0].x, y: waypoints[0].y, segmentIndex: 0 };
  }

  if (d < 0) {
    return { x: waypoints[0].x, y: waypoints[0].y, segmentIndex: 0 };
  }

  if (d >= totalLength) {
    return {
      x: waypoints[waypoints.length - 1].x,
      y: waypoints[waypoints.length - 1].y,
      segmentIndex: segments.length - 1,
    };
  }

  let accumulated = 0;
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    const segEnd = accumulated + seg.length;

    if (d < segEnd || (d === segEnd && i === segments.length - 1)) {
      const t = seg.length === 0 ? 0 : (d - accumulated) / seg.length;
      return {
        x: waypoints[i].x + t * seg.dx,
        y: waypoints[i].y + t * seg.dy,
        segmentIndex: i,
      };
    }

    accumulated = segEnd;
  }

  return {
    x: waypoints[waypoints.length - 1].x,
    y: waypoints[waypoints.length - 1].y,
    segmentIndex: segments.length - 1,
  };
}
