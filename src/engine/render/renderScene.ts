import type { CurvePoint, SpiroParams } from '@/engine/types/spiro';
import { getColorAt } from '@/engine/color';
import { computeSceneLayout, type LayoutTarget } from '@/engine/render/computeLayout';

/**
 * Draws the full spirograph scene (background, optional guide curve, text-on-path) into a
 * 2D context. Framework-agnostic and resolution-agnostic — the live preview canvas and every
 * exporter call this same function so the output always matches what's on screen.
 */
export function renderSpiroScene(
  ctx: CanvasRenderingContext2D,
  params: SpiroParams,
  rawPoints: CurvePoint[],
  target: LayoutTarget
): void {
  const { width, height } = target;

  ctx.clearRect(0, 0, width, height);

  if (!params.transparentBackground) {
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  if (rawPoints.length === 0) return;

  ctx.font = `${params.fontSize}px ${params.fontFamily}`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const { points, glyphs, totalLength } = computeSceneLayout(ctx, params, rawPoints, target);

  if (params.showGuideCurve) {
    ctx.save();
    ctx.beginPath();
    points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = params.strokeWidth;
    ctx.stroke();
    ctx.restore();
  }

  if (glyphs.length === 0 || totalLength <= 0) return;

  if (params.glowBlur > 0) {
    ctx.shadowBlur = params.glowBlur;
  }

  for (const glyph of glyphs) {
    const t = glyph.distance / totalLength;
    const color = getColorAt(t, params);

    ctx.save();
    ctx.translate(glyph.x, glyph.y);
    ctx.rotate(glyph.angle);
    ctx.fillStyle = color;
    if (params.glowBlur > 0) ctx.shadowColor = color;
    ctx.fillText(glyph.char, 0, 0);
    if (params.strokeWidth > 1) {
      ctx.strokeStyle = color;
      ctx.lineWidth = params.strokeWidth * 0.3;
      ctx.strokeText(glyph.char, 0, 0);
    }
    ctx.restore();
  }
}
