import type { SpiroParams } from '@/engine/types/spiro';
import type { LayoutTarget } from '@/engine/render/computeLayout';
import { fitGlyphLayoutToTarget } from '@/engine/render/fitGlyphLayout';
import { layoutRopeFillWord, type RopeFillParams } from '@/engine/letterFill/ropeFillLayout';
import type { LetterGlyphPaths } from '@/engine/letterFill/layoutWord';

export interface RopeFillLayout {
  letters: LetterGlyphPaths[];
}

export function computeRopeFillLayout(params: SpiroParams, target: LayoutTarget): RopeFillLayout {
  const ropeParams: RopeFillParams = {
    loopFrequency: params.ropeLoopFrequency,
    amplitudeFraction: params.ropeLoopAmplitude / 100,
    revolutions: params.ropeRevolutions,
    stepSize: params.stepSize,
  };

  const rawLetters = layoutRopeFillWord(params.text, params.fontFamily, params.fontSize, params.letterSpacing, params.textCase, ropeParams);

  return { letters: fitGlyphLayoutToTarget(rawLetters, target) };
}
