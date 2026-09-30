import type { CurvePoint, SpiroParams } from '@/engine/types/spiro';
import { getBoundingBox, getTotalArcLength, scalePoints } from '@/engine/math/parametric';
import { layoutTextOnPath, type GlyphPlacement, type TextMeasurer } from '@/engine/math/textPath';

export interface LayoutTarget {
  width: number;
  height: number;
  /** Fraction of the smaller canvas dimension reserved as empty margin around the curve. */
  padding?: number;
}

export interface SceneLayout {
  /** Curve points already fit-scaled and centered in canvas/SVG coordinate space. */
  points: CurvePoint[];
  /** Glyph placements already fit-scaled and centered — ready to draw with no further transform. */
  glyphs: GlyphPlacement[];
  totalLength: number;
}

/**
 * Fits the raw curve to the target canvas (scale + center), then lays text out along it.
 * Both the live canvas renderer and every exporter call this so on-screen and exported
 * output can never drift apart.
 */
export function computeSceneLayout(
  measurer: TextMeasurer,
  params: SpiroParams,
  rawPoints: CurvePoint[],
  target: LayoutTarget
): SceneLayout {
  const { width, height, padding = 0.1 } = target;

  if (rawPoints.length === 0) {
    return { points: [], glyphs: [], totalLength: 0 };
  }

  const bbox = getBoundingBox(rawPoints);
  const bboxWidth = Math.max(bbox.maxX - bbox.minX, 1e-6);
  const bboxHeight = Math.max(bbox.maxY - bbox.minY, 1e-6);
  const availableW = width * (1 - padding * 2);
  const availableH = height * (1 - padding * 2);
  const fitScale = Math.min(availableW / bboxWidth, availableH / bboxHeight);

  const scaled = scalePoints(rawPoints, fitScale);
  const scaledBbox = getBoundingBox(scaled);
  const offsetX = width / 2 - (scaledBbox.minX + scaledBbox.maxX) / 2;
  const offsetY = height / 2 - (scaledBbox.minY + scaledBbox.maxY) / 2;

  const points = scaled.map((p) => ({ ...p, x: p.x + offsetX, y: p.y + offsetY }));

  const glyphs = layoutTextOnPath(measurer, params.text, points, {
    letterSpacing: params.letterSpacing,
    alignToTangent: params.alignToTangent,
    textCase: params.textCase,
  });

  return { points, glyphs, totalLength: getTotalArcLength(points) };
}
