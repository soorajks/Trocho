import type { CurvePoint } from '@/engine/types/spiro';
import type { RawPoint } from '@/engine/letterFill/traceGlyph';

/** Converts a closed polygon (raw points, cyclic) into CurvePoints with tangent angle (central difference, wrapping) and cumulative arc length. */
export function contourToCurvePoints(raw: RawPoint[]): CurvePoint[] {
  const n = raw.length;
  if (n < 3) return [];

  const points: CurvePoint[] = [];
  let distance = 0;
  for (let i = 0; i < n; i++) {
    const prev = raw[(i - 1 + n) % n];
    const next = raw[(i + 1) % n];
    const angle = Math.atan2(next.y - prev.y, next.x - prev.x);
    if (i > 0) distance += Math.hypot(raw[i].x - raw[i - 1].x, raw[i].y - raw[i - 1].y);
    points.push({ x: raw[i].x, y: raw[i].y, angle, distance });
  }
  return points;
}

/**
 * Wraps an open (clamped) CurvePoint list into a closed one usable with `getPointAtDistance` —
 * appends a synthetic closing point back to the start so distance-based lookup can treat the
 * contour as periodic instead of clamping at its ends.
 */
export function buildClosedLookup(points: CurvePoint[]): { lookup: CurvePoint[]; total: number } {
  if (points.length === 0) return { lookup: [], total: 0 };
  const last = points[points.length - 1];
  const first = points[0];
  const wrapDistance = Math.hypot(first.x - last.x, first.y - last.y);
  const total = last.distance + wrapDistance;
  return { lookup: [...points, { ...first, distance: total }], total };
}
