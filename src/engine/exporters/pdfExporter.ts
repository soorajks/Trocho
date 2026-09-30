import { jsPDF } from 'jspdf';
import { svg2pdf } from 'svg2pdf.js';
import type { CurvePoint, PageSize, SpiroParams } from '@/engine/types/spiro';
import { buildSvgElement } from '@/engine/exporters/svgBuilder';

/** Page dimensions in points (1/72 inch), portrait orientation. */
const PAGE_SIZES_PT: Record<PageSize, { width: number; height: number }> = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  square: { width: 800, height: 800 },
  poster: { width: 1296, height: 1728 }, // 18x24 in
};

const MARGIN_PT = 36; // 0.5in

/**
 * Produces a true vector PDF: the same SVG built for the SVG export is embedded directly via
 * svg2pdf.js, so text and curve paths stay crisp at any print size instead of being a
 * rasterized image.
 */
export async function exportPdf(params: SpiroParams, rawPoints: CurvePoint[]): Promise<void> {
  const page = PAGE_SIZES_PT[params.pageSize];
  const contentWidth = page.width - MARGIN_PT * 2;
  const contentHeight = page.height - MARGIN_PT * 2;

  const svg = buildSvgElement(params, rawPoints, { width: contentWidth, height: contentHeight });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'pt', format: [page.width, page.height] });

  await svg2pdf(svg, pdf, { x: MARGIN_PT, y: MARGIN_PT, width: contentWidth, height: contentHeight });

  pdf.save(`spirotext-${Date.now()}.pdf`);
}
