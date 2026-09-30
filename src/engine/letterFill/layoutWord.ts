import type { CurvePoint } from '@/engine/types/spiro';
import { applyTextCase } from '@/engine/math/textPath';
import { traceGlyphOutline } from '@/engine/letterFill/traceGlyph';
import { contourToCurvePoints } from '@/engine/letterFill/contourPath';
import { generateLoopyPath, type LoopyParams } from '@/engine/letterFill/loopyPath';

export interface LetterGlyphPaths {
  char: string;
  /** One looped-pen stroke per glyph contour (outer silhouette + any holes). */
  paths: CurvePoint[][];
  /** The glyph's own (undecorated) outline contours, in the same layout-space coordinates — for the optional guide overlay. */
  guideContours: CurvePoint[][];
}

const SPACE_ADVANCE_EM = 0.3;

/** Lays out `text` left to right, tracing each glyph's outline and generating its loopy-pen paths. */
export function layoutLetterFillWord(
  text: string,
  fontFamily: string,
  fontSize: number,
  letterSpacing: number,
  textCase: import('@/engine/types/spiro').TextCase,
  loopyParams: LoopyParams
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

    const positionedContours = outline.contours.map((contour) =>
      contour.points.map((p) => ({ x: p.x * fontSize + cursorX, y: p.y * fontSize }))
    );

    const baseCurves = positionedContours.map(contourToCurvePoints);
    const paths = baseCurves.map((base) => generateLoopyPath(base, loopyParams));

    results.push({ char: ch, paths, guideContours: baseCurves });

    cursorX += outline.advanceWidth * fontSize + letterSpacing;
  }

  return results;
}
