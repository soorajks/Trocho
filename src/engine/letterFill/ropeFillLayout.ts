import type { CurvePoint, TextCase } from '@/engine/types/spiro';
import { applyTextCase } from '@/engine/math/textPath';
import { traceGlyphOutline } from '@/engine/letterFill/traceGlyph';
import { contourToCurvePoints } from '@/engine/letterFill/contourPath';
import { generateLoopyPath, type LoopyParams } from '@/engine/letterFill/loopyPath';
import type { LetterGlyphPaths } from '@/engine/letterFill/layoutWord';

const SPACE_ADVANCE_EM = 0.3;

export interface RopeFillParams {
  loopFrequency: number;
  /** Fraction of the contour's own measured half-thickness the loop reaches out to (1.0 = touches both walls; <1 stays clear of them; >1 deliberately overlaps). */
  amplitudeFraction: number;
  revolutions: number;
  stepSize: number;
}

/**
 * Lays text out left to right where each glyph contour (outer silhouette + each hole) is ridden
 * by one continuous loopy pen pass — same math and same stable boundary as Letter Fill — except
 * the amplitude isn't a flat percentage of fontSize, it's derived per contour from that contour's
 * own measured stroke/counter half-thickness (see traceGlyph). That's what keeps the loops
 * roughly confined to the actual ink and lets a hole's loop naturally sweep toward its center,
 * instead of a fixed-size ring that's arbitrary relative to the letter's real proportions.
 */
export function layoutRopeFillWord(
  text: string,
  fontFamily: string,
  fontSize: number,
  letterSpacing: number,
  textCase: TextCase,
  params: RopeFillParams
): LetterGlyphPaths[] {
  const cased = applyTextCase(text, textCase);
  const results: LetterGlyphPaths[] = [];
  let cursorX = 0;

  for (const ch of cased) {
    if (ch === ' ') {
      cursorX += SPACE_ADVANCE_EM * fontSize + letterSpacing;
      continue;
    }

    const outline = traceGlyphOutline(ch, fontFamily);
    const position = (pts: { x: number; y: number }[]) => pts.map((p) => ({ x: p.x * fontSize + cursorX, y: p.y * fontSize }));

    const paths: CurvePoint[][] = [];
    const guideContours: CurvePoint[][] = [];

    for (const contour of outline.contours) {
      const baseCurve = contourToCurvePoints(position(contour.points));
      if (baseCurve.length < 3) continue;

      const loopy: LoopyParams = {
        loopFrequency: params.loopFrequency,
        loopAmplitude: contour.halfThickness * fontSize * params.amplitudeFraction,
        revolutions: params.revolutions,
        stepSize: params.stepSize,
      };
      paths.push(generateLoopyPath(baseCurve, loopy));
      guideContours.push(baseCurve);
    }

    results.push({ char: ch, paths, guideContours });

    cursorX += outline.advanceWidth * fontSize + letterSpacing;
  }

  return results;
}
