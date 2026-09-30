import { saveAs } from 'file-saver';
import type { CurvePoint, SpiroParams } from '@/engine/types/spiro';
import { buildSvgElement, serializeSvg } from '@/engine/exporters/svgBuilder';

const BASE_SIZE = 1200;

export function exportSvg(params: SpiroParams, rawPoints: CurvePoint[]): void {
  const svg = buildSvgElement(params, rawPoints, { width: BASE_SIZE, height: BASE_SIZE });
  const xml = serializeSvg(svg);
  const blob = new Blob([xml], { type: 'image/svg+xml;charset=utf-8' });
  saveAs(blob, `spirotext-${Date.now()}.svg`);
}
