import type { SpiroParams } from '@/engine/types/spiro';
import type { LayoutTarget } from '@/engine/render/computeLayout';
import { fitGlyphLayoutToTarget } from '@/engine/render/fitGlyphLayout';
import { layoutLetterFillWord, type LetterGlyphPaths } from '@/engine/letterFill/layoutWord';
import type { LoopyParams } from '@/engine/letterFill/loopyPath';

export interface LetterFillLayout {
  letters: LetterGlyphPaths[];
}

/** Fits the raw (word-space) letter layout to the target canvas — same scale+center approach as computeSceneLayout, so live preview and every exporter agree. */
export function computeLetterFillLayout(params: SpiroParams, target: LayoutTarget): LetterFillLayout {
  const loopyParams: LoopyParams = {
    loopFrequency: params.loopFrequency,
    loopAmplitude: (params.loopAmplitude / 100) * params.fontSize,
    revolutions: params.revolutions,
    stepSize: params.stepSize,
  };

  const rawLetters = layoutLetterFillWord(
    params.text,
    params.fontFamily,
    params.fontSize,
    params.letterSpacing,
    params.textCase,
    loopyParams
  );

  return { letters: fitGlyphLayoutToTarget(rawLetters, target) };
}
