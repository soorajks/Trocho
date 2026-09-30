import type { CurvePoint } from '@/engine/types/spiro';
import { getBoundingBox } from '@/engine/math/parametric';
import type { LayoutTarget } from '@/engine/render/computeLayout';

export interface GlyphPathGroup {
  char: string;
  paths: CurvePoint[][];
  guideContours: CurvePoint[][];
}

/**
 * Scales + centers a raw (word-space) letter layout to fit the target canvas — shared by
 * Letter Fill and Rope Fill so live preview and every exporter agree on the same fit-scale
 * math used by the circular curve engine.
 */
export function fitGlyphLayoutToTarget<T extends GlyphPathGroup>(rawLetters: T[], target: LayoutTarget): T[] {
  const { width, height, padding = 0.1 } = target;

  const allPoints: CurvePoint[] = [];
  for (const letter of rawLetters) {
    for (const path of letter.paths) allPoints.push(...path);
    for (const guide of letter.guideContours) allPoints.push(...guide);
  }
  if (allPoints.length === 0) return [];

  const bbox = getBoundingBox(allPoints);
  const bboxWidth = Math.max(bbox.maxX - bbox.minX, 1e-6);
  const bboxHeight = Math.max(bbox.maxY - bbox.minY, 1e-6);
  const availableW = width * (1 - padding * 2);
  const availableH = height * (1 - padding * 2);
  const fitScale = Math.min(availableW / bboxWidth, availableH / bboxHeight);

  const scaledMinX = bbox.minX * fitScale;
  const scaledMaxX = bbox.maxX * fitScale;
  const scaledMinY = bbox.minY * fitScale;
  const scaledMaxY = bbox.maxY * fitScale;
  const offsetX = width / 2 - (scaledMinX + scaledMaxX) / 2;
  const offsetY = height / 2 - (scaledMinY + scaledMaxY) / 2;

  const transform = (pts: CurvePoint[]): CurvePoint[] =>
    pts.map((p) => ({ ...p, x: p.x * fitScale + offsetX, y: p.y * fitScale + offsetY, distance: p.distance * fitScale }));

  return rawLetters.map((letter) => ({
    ...letter,
    paths: letter.paths.map(transform),
    guideContours: letter.guideContours.map(transform),
  }));
}
