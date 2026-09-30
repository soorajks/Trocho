import { saveAs } from 'file-saver';
import type { CurvePoint, SpiroParams } from '@/engine/types/spiro';
import { renderSpiroScene } from '@/engine/render/renderScene';
import { renderLetterFillScene } from '@/engine/render/renderLetterFillScene';
import { renderRopeFillScene } from '@/engine/render/renderRopeFillScene';

const BASE_SIZE = 1200;

/**
 * Renders a high-resolution PNG. `exportScale` (1x/2x/4x) multiplies canvas dimensions AND
 * every absolute-pixel style value (font size, letter spacing, stroke, glow) so the exported
 * image is a clean upscale of the preview rather than the same size text on a bigger canvas.
 */
export async function exportPng(params: SpiroParams, rawPoints: CurvePoint[]): Promise<void> {
  const scale = params.exportScale;
  const size = BASE_SIZE * scale;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable for PNG export.');

  const scaledParams: SpiroParams = {
    ...params,
    fontSize: params.fontSize * scale,
    letterSpacing: params.letterSpacing * scale,
    strokeWidth: params.strokeWidth * scale,
    glowBlur: params.glowBlur * scale,
  };

  if (scaledParams.renderMode === 'letterFill') {
    renderLetterFillScene(ctx, scaledParams, { width: size, height: size });
  } else if (scaledParams.renderMode === 'ropeFill') {
    renderRopeFillScene(ctx, scaledParams, { width: size, height: size });
  } else {
    renderSpiroScene(ctx, scaledParams, rawPoints, { width: size, height: size });
  }

  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (!blob) throw new Error('Failed to encode PNG.');
  saveAs(blob, `spirotext-${Date.now()}.png`);
}
