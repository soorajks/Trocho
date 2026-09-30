import type { CurvePoint, CurveType } from '@/engine/types/spiro';

export interface ParametricParams {
  curveType: CurveType;
  R: number;
  r: number;
  d: number;
  revolutions: number;
  stepSize: number;
}

interface DerivativeSample {
  x: number;
  y: number;
  dx: number;
  dy: number;
}

/** A safe non-zero divisor — guards against division by zero when r approaches 0 from the UI sliders. */
function safe(value: number): number {
  return Math.abs(value) < 1e-6 ? (value < 0 ? -1e-6 : 1e-6) : value;
}

function sampleHypotrochoid(theta: number, R: number, r: number, d: number): DerivativeSample {
  const k = (R - r) / safe(r);
  const x = (R - r) * Math.cos(theta) + d * Math.cos(k * theta);
  const y = (R - r) * Math.sin(theta) - d * Math.sin(k * theta);
  const dx = -(R - r) * Math.sin(theta) - d * k * Math.sin(k * theta);
  const dy = (R - r) * Math.cos(theta) - d * k * Math.cos(k * theta);
  return { x, y, dx, dy };
}

function sampleEpitrochoid(theta: number, R: number, r: number, d: number): DerivativeSample {
  const k = (R + r) / safe(r);
  const x = (R + r) * Math.cos(theta) - d * Math.cos(k * theta);
  const y = (R + r) * Math.sin(theta) - d * Math.sin(k * theta);
  const dx = -(R + r) * Math.sin(theta) + d * k * Math.sin(k * theta);
  const dy = (R + r) * Math.cos(theta) - d * k * Math.cos(k * theta);
  return { x, y, dx, dy };
}

/** Rose curve r(theta) = R*cos(k*theta), petal count/shape driven by k = R/r. `d` is unused here (reserved). */
function sampleRose(theta: number, R: number, r: number): DerivativeSample {
  const k = R / safe(r);
  const radius = R * Math.cos(k * theta);
  const dRadius = -R * k * Math.sin(k * theta);
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const x = radius * cosT;
  const y = radius * sinT;
  const dx = dRadius * cosT - radius * sinT;
  const dy = dRadius * sinT + radius * cosT;
  return { x, y, dx, dy };
}

/**
 * Lissajous figure. There's no natural mapping from a single `d` slider to the classic
 * integer frequency ratio (a:b), so `d` (0-300) is quantized into a small b/a frequency
 * step and the phase offset — enough range for visually distinct figures from existing UI.
 */
function sampleLissajous(theta: number, R: number, r: number, d: number): DerivativeSample {
  const a = 3;
  const b = Math.max(1, Math.round(d / 25) + 1);
  const phase = Math.PI / 2;
  const x = R * Math.sin(a * theta + phase);
  const y = r * Math.sin(b * theta);
  const dx = R * a * Math.cos(a * theta + phase);
  const dy = r * b * Math.cos(b * theta);
  return { x, y, dx, dy };
}

function sampleAt(theta: number, params: ParametricParams): DerivativeSample {
  const { curveType, R, r, d } = params;
  switch (curveType) {
    case 'hypotrochoid':
      return sampleHypotrochoid(theta, R, r, d);
    case 'epitrochoid':
      return sampleEpitrochoid(theta, R, r, d);
    case 'rose':
      return sampleRose(theta, R, r);
    case 'lissajous':
      return sampleLissajous(theta, R, r, d);
  }
}

/**
 * Generates points along the selected parametric curve from theta=0 to theta=2*PI*revolutions,
 * with tangent angle (for text/character rotation) and cumulative arc length (for text placement).
 */
export function generateCurvePoints(params: ParametricParams): CurvePoint[] {
  const { revolutions, stepSize } = params;
  const thetaMax = 2 * Math.PI * Math.max(revolutions, 0.001);
  const step = Math.max(stepSize, 0.0005);

  const points: CurvePoint[] = [];
  let distance = 0;
  let prevX = 0;
  let prevY = 0;

  for (let theta = 0; theta <= thetaMax + step / 2; theta += step) {
    const { x, y, dx, dy } = sampleAt(theta, params);
    const angle = Math.atan2(dy, dx);

    if (points.length > 0) {
      distance += Math.hypot(x - prevX, y - prevY);
    }

    points.push({ x, y, angle, distance });
    prevX = x;
    prevY = y;
  }

  return points;
}

export function getTotalArcLength(points: CurvePoint[]): number {
  return points.length > 0 ? points[points.length - 1].distance : 0;
}

/**
 * Finds the point at a given cumulative arc-length distance along the curve, linearly
 * interpolating between the two nearest samples. Used to place characters evenly by width
 * rather than by theta (which does not correspond to constant visual spacing).
 */
export function getPointAtDistance(points: CurvePoint[], targetDistance: number): CurvePoint | null {
  if (points.length === 0) return null;
  if (targetDistance <= points[0].distance) return points[0];
  const last = points[points.length - 1];
  if (targetDistance >= last.distance) return last;

  // Binary search for the segment containing targetDistance.
  let lo = 0;
  let hi = points.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (points[mid].distance <= targetDistance) lo = mid;
    else hi = mid;
  }

  const a = points[lo];
  const b = points[hi];
  const span = b.distance - a.distance;
  const t = span > 0 ? (targetDistance - a.distance) / span : 0;

  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: a.angle + (b.angle - a.angle) * t,
    distance: targetDistance,
  };
}

/** Uniformly scales point coordinates and cumulative distance (angle is scale-invariant). */
export function scalePoints(points: CurvePoint[], scale: number): CurvePoint[] {
  return points.map((p) => ({ x: p.x * scale, y: p.y * scale, angle: p.angle, distance: p.distance * scale }));
}

export function getBoundingBox(points: CurvePoint[]): { minX: number; minY: number; maxX: number; maxY: number } {
  if (points.length === 0) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of points) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}
