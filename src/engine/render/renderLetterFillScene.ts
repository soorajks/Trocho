import type { SpiroParams } from '@/engine/types/spiro';
import { getColorAt } from '@/engine/color';
import { computeLetterFillLayout } from '@/engine/render/computeLetterFillLayout';
import type { LayoutTarget } from '@/engine/render/computeLayout';

/** Draws the letter-fill scene: each glyph's outline (silhouette + holes) becomes a track that a rolling pen loops along. */
export function renderLetterFillScene(ctx: CanvasRenderingContext2D, params: SpiroParams, target: LayoutTarget): void {
  const { width, height } = target;

  ctx.clearRect(0, 0, width, height);
  if (!params.transparentBackground) {
    ctx.fillStyle = params.backgroundColor;
    ctx.fillRect(0, 0, width, height);
  }

  const { letters } = computeLetterFillLayout(params, target);
  if (letters.length === 0) return;

  if (params.showGuideCurve) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    for (const letter of letters) {
      for (const contour of letter.guideContours) {
        if (contour.length < 2) continue;
        ctx.beginPath();
        contour.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  if (params.glowBlur > 0) ctx.shadowBlur = params.glowBlur;
  ctx.lineWidth = params.strokeWidth;
  ctx.lineJoin = 'round';

  const letterCount = letters.length;
  letters.forEach((letter, letterIndex) => {
    const t = letterCount > 1 ? letterIndex / (letterCount - 1) : 0;
    const color = getColorAt(t, params);
    ctx.strokeStyle = color;
    if (params.glowBlur > 0) ctx.shadowColor = color;

    for (const path of letter.paths) {
      if (path.length < 2) continue;
      ctx.beginPath();
      path.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();
    }
  });
}
