import type { CurvePoint } from '@/engine/types/spiro';
import { getPointAtDistance } from '@/engine/math/parametric';
import { buildClosedLookup } from '@/engine/letterFill/contourPath';

export interface LoopyParams {
  /** Small loops per single traversal of the base contour. Prefer non-integer values — an integer frequency re-traces the same loops every pass instead of precessing to fill the band (same reason classic spirograph needs a non-integer R/r ratio). */
  loopFrequency: number;
  /** Loop radius, in the same units as the base contour's coordinates. */
  loopAmplitude: number;
  /** How many times to traverse the whole contour. */
  revolutions: number;
  /** Sampling step in theta (radians), same convention as the circular curve engine. */
  stepSize: number;
}

/**
 * Generalizes the hypotrochoid decomposition — "a point rotating in the rolling circle's local
 * frame, riding a base point that travels around a circle" — to ride an arbitrary closed path
 * instead of a circle. The base point travels along `baseContour` (looping every 2*PI of theta);
 * the pen offset rotates in the path's own local tangent/normal frame at `loopFrequency` full
 * turns per traversal. Multiple `revolutions` with a non-integer frequency make the loops
 * precess around the contour, building up the dense woven-loop fill.
 */
export function generateLoopyPath(baseContour: CurvePoint[], params: LoopyParams): CurvePoint[] {
  const { lookup, total } = buildClosedLookup(baseContour);
  if (total <= 0) return [];

  const thetaMax = 2 * Math.PI * Math.max(params.revolutions, 0.001);
  const step = Math.max(params.stepSize, 0.0005);

  const result: CurvePoint[] = [];
  let distance = 0;
  let prevX = 0;
  let prevY = 0;

  for (let theta = 0; theta <= thetaMax + step / 2; theta += step) {
    const rawS = (theta / (2 * Math.PI)) * total;
    const s = ((rawS % total) + total) % total;
    const base = getPointAtDistance(lookup, s);
    if (!base) continue;

    const loopAngle = params.loopFrequency * theta;
    const tx = Math.cos(base.angle);
    const ty = Math.sin(base.angle);
    const nx = -ty;
    const ny = tx;

    const cosL = Math.cos(loopAngle);
    const sinL = Math.sin(loopAngle);
    const x = base.x + params.loopAmplitude * (cosL * tx + sinL * nx);
    const y = base.y + params.loopAmplitude * (cosL * ty + sinL * ny);

    if (result.length > 0) distance += Math.hypot(x - prevX, y - prevY);
    result.push({ x, y, angle: 0, distance });
    prevX = x;
    prevY = y;
  }

  return result;
}
