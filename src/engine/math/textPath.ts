import type { CurvePoint, TextCase } from '@/engine/types/spiro';
import { getPointAtDistance, getTotalArcLength } from '@/engine/math/parametric';

export interface GlyphPlacement {
  char: string;
  x: number;
  y: number;
  /** Rotation to apply when drawing the glyph, in radians. */
  angle: number;
  /** Cumulative arc-length distance of this glyph's center along the curve. */
  distance: number;
}

/** Anything that can report the pixel width of a character for the active font — a 2D canvas context satisfies this. */
export interface TextMeasurer {
  measureText(text: string): { width: number };
}

export function applyTextCase(text: string, textCase: TextCase): string {
  switch (textCase) {
    case 'upper':
      return text.toUpperCase();
    case 'lower':
      return text.toLowerCase();
    case 'title':
      return text.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
    case 'none':
    default:
      return text;
  }
}

export interface TextPathOptions {
  letterSpacing: number;
  alignToTangent: boolean;
  textCase: TextCase;
}

/**
 * Lays text out along a curve by arc length (not by theta, since equal theta steps are not
 * equal visual distances on most of these curves). The text repeats to fill the entire curve
 * length, per the "infinite curve looping" requirement.
 */
export function layoutTextOnPath(
  measurer: TextMeasurer,
  rawText: string,
  points: CurvePoint[],
  options: TextPathOptions
): GlyphPlacement[] {
  const text = applyTextCase(rawText, options.textCase);
  if (!text || points.length === 0) return [];

  const totalLength = getTotalArcLength(points);
  if (totalLength <= 0) return [];

  const glyphs: GlyphPlacement[] = [];
  let distance = 0;
  let charIndex = 0;

  // Repeat the text around the curve until we've covered its full arc length.
  while (distance < totalLength) {
    const char = text[charIndex % text.length];
    charIndex++;

    const width = char === ' ' ? measurer.measureText(' ').width : measurer.measureText(char).width;
    const halfWidth = width / 2;
    const centerDistance = distance + halfWidth;
    if (centerDistance > totalLength) break;

    if (char !== ' ') {
      const point = getPointAtDistance(points, centerDistance);
      if (point) {
        glyphs.push({
          char,
          x: point.x,
          y: point.y,
          angle: options.alignToTangent ? point.angle : 0,
          distance: centerDistance,
        });
      }
    }

    distance += width + options.letterSpacing;
  }

  return glyphs;
}
