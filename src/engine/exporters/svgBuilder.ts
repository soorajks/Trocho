import type { CurvePoint, SpiroParams } from '@/engine/types/spiro';
import { getColorAt } from '@/engine/color';
import { computeSceneLayout, type LayoutTarget } from '@/engine/render/computeLayout';
import { computeLetterFillLayout } from '@/engine/render/computeLetterFillLayout';
import { computeRopeFillLayout } from '@/engine/render/computeRopeFillLayout';
import type { LetterGlyphPaths } from '@/engine/letterFill/layoutWord';

const SVG_NS = 'http://www.w3.org/2000/svg';

/** A canvas 2D context used purely for text-width measurement — never attached to the DOM. */
function createMeasurer(fontFamily: string, fontSize: number): CanvasRenderingContext2D {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable — cannot measure text for export.');
  ctx.font = `${fontSize}px ${fontFamily}`;
  return ctx;
}

function createSvgRoot(width: number, height: number, backgroundColor: string, transparentBackground: boolean): SVGSVGElement {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('xmlns', SVG_NS);
  svg.setAttribute('width', String(width));
  svg.setAttribute('height', String(height));
  svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

  if (!transparentBackground) {
    const bg = document.createElementNS(SVG_NS, 'rect');
    bg.setAttribute('x', '0');
    bg.setAttribute('y', '0');
    bg.setAttribute('width', String(width));
    bg.setAttribute('height', String(height));
    bg.setAttribute('fill', backgroundColor);
    svg.appendChild(bg);
  }

  return svg;
}

function appendGlowFilter(svg: SVGSVGElement, group: SVGGElement, glowBlur: number): void {
  const filterId = 'spiro-glow';
  const defs = document.createElementNS(SVG_NS, 'defs');
  const filter = document.createElementNS(SVG_NS, 'filter');
  filter.setAttribute('id', filterId);
  filter.setAttribute('x', '-200%');
  filter.setAttribute('y', '-200%');
  filter.setAttribute('width', '500%');
  filter.setAttribute('height', '500%');
  const blur = document.createElementNS(SVG_NS, 'feGaussianBlur');
  blur.setAttribute('stdDeviation', String(glowBlur / 2));
  blur.setAttribute('result', 'blur');
  const merge = document.createElementNS(SVG_NS, 'feMerge');
  const mergeBlur = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeBlur.setAttribute('in', 'blur');
  const mergeSource = document.createElementNS(SVG_NS, 'feMergeNode');
  mergeSource.setAttribute('in', 'SourceGraphic');
  merge.appendChild(mergeBlur);
  merge.appendChild(mergeSource);
  filter.appendChild(blur);
  filter.appendChild(merge);
  defs.appendChild(filter);
  svg.appendChild(defs);
  group.setAttribute('filter', `url(#${filterId})`);
}

function buildCurveTextSvg(params: SpiroParams, rawPoints: CurvePoint[], target: LayoutTarget): SVGSVGElement {
  const { width, height } = target;
  const svg = createSvgRoot(width, height, params.backgroundColor, params.transparentBackground);
  if (rawPoints.length === 0) return svg;

  const measurer = createMeasurer(params.fontFamily, params.fontSize);
  const { points, glyphs, totalLength } = computeSceneLayout(measurer, params, rawPoints, target);

  if (params.showGuideCurve && points.length > 0) {
    const d = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
    const path = document.createElementNS(SVG_NS, 'path');
    path.setAttribute('d', d);
    path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
    path.setAttribute('stroke-width', String(params.strokeWidth));
    path.setAttribute('fill', 'none');
    svg.appendChild(path);
  }

  if (totalLength <= 0) return svg;

  const textGroup = document.createElementNS(SVG_NS, 'g');
  if (params.glowBlur > 0) appendGlowFilter(svg, textGroup, params.glowBlur);

  for (const glyph of glyphs) {
    const t = glyph.distance / totalLength;
    const color = getColorAt(t, params);
    const angleDeg = (glyph.angle * 180) / Math.PI;

    const textEl = document.createElementNS(SVG_NS, 'text');
    textEl.setAttribute('x', glyph.x.toFixed(2));
    textEl.setAttribute('y', glyph.y.toFixed(2));
    textEl.setAttribute('transform', `rotate(${angleDeg.toFixed(3)}, ${glyph.x.toFixed(2)}, ${glyph.y.toFixed(2)})`);
    textEl.setAttribute('text-anchor', 'middle');
    textEl.setAttribute('dominant-baseline', 'middle');
    textEl.setAttribute('font-family', params.fontFamily);
    textEl.setAttribute('font-size', String(params.fontSize));
    textEl.setAttribute('fill', color);
    if (params.strokeWidth > 1) {
      textEl.setAttribute('stroke', color);
      textEl.setAttribute('stroke-width', String(params.strokeWidth * 0.3));
      textEl.setAttribute('paint-order', 'stroke fill');
    }
    textEl.textContent = glyph.char;
    textGroup.appendChild(textEl);
  }

  svg.appendChild(textGroup);
  return svg;
}

/** Shared by Letter Fill and Rope Fill — both are "a set of loopy strokes per letter" once their layout is computed. */
function buildGlyphPathSvg(letters: LetterGlyphPaths[], params: SpiroParams, target: LayoutTarget): SVGSVGElement {
  const { width, height } = target;
  const svg = createSvgRoot(width, height, params.backgroundColor, params.transparentBackground);
  if (letters.length === 0) return svg;

  if (params.showGuideCurve) {
    const guideGroup = document.createElementNS(SVG_NS, 'g');
    for (const letter of letters) {
      for (const contour of letter.guideContours) {
        if (contour.length < 2) continue;
        const d = `${contour.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ')} Z`;
        const path = document.createElementNS(SVG_NS, 'path');
        path.setAttribute('d', d);
        path.setAttribute('stroke', 'rgba(255,255,255,0.15)');
        path.setAttribute('stroke-width', '1');
        path.setAttribute('fill', 'none');
        guideGroup.appendChild(path);
      }
    }
    svg.appendChild(guideGroup);
  }

  const strokeGroup = document.createElementNS(SVG_NS, 'g');
  strokeGroup.setAttribute('fill', 'none');
  strokeGroup.setAttribute('stroke-linejoin', 'round');
  if (params.glowBlur > 0) appendGlowFilter(svg, strokeGroup, params.glowBlur);

  const letterCount = letters.length;
  letters.forEach((letter, letterIndex) => {
    const t = letterCount > 1 ? letterIndex / (letterCount - 1) : 0;
    const color = getColorAt(t, params);

    for (const path of letter.paths) {
      if (path.length < 2) continue;
      const d = path.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(' ');
      const pathEl = document.createElementNS(SVG_NS, 'path');
      pathEl.setAttribute('d', d);
      pathEl.setAttribute('stroke', color);
      pathEl.setAttribute('stroke-width', String(params.strokeWidth));
      strokeGroup.appendChild(pathEl);
    }
  });

  svg.appendChild(strokeGroup);
  return svg;
}

/**
 * Builds an in-memory (unattached) SVG element matching the live canvas preview exactly — same
 * fit-scale/centering/layout math as the canvas renderers. Reused by both the SVG download and
 * the vector PDF exporter (via svg2pdf.js).
 */
export function buildSvgElement(params: SpiroParams, rawPoints: CurvePoint[], target: LayoutTarget): SVGSVGElement {
  if (params.renderMode === 'letterFill') {
    return buildGlyphPathSvg(computeLetterFillLayout(params, target).letters, params, target);
  }
  if (params.renderMode === 'ropeFill') {
    return buildGlyphPathSvg(computeRopeFillLayout(params, target).letters, params, target);
  }
  return buildCurveTextSvg(params, rawPoints, target);
}

export function serializeSvg(svg: SVGSVGElement): string {
  return `<?xml version="1.0" encoding="UTF-8"?>\n${new XMLSerializer().serializeToString(svg)}`;
}
