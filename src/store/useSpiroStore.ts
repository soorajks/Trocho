import { create } from 'zustand';
import type { SpiroParams, SpiroState } from '@/engine/types/spiro';

export const DEFAULT_PARAMS: SpiroParams = {
  renderMode: 'letterFill',

  text: 'SPIROTEXT',
  fontFamily: 'sans-serif',
  customFontUrl: null,
  customFontName: null,
  fontSize: 16,
  letterSpacing: 8,
  alignToTangent: true,
  textCase: 'none',

  curveType: 'hypotrochoid',
  R: 200,
  r: 60,
  d: 70,
  revolutions: 6,
  stepSize: 0.02,

  loopFrequency: 16.5,
  loopAmplitude: 16,

  ropeLoopFrequency: 30.2,
  ropeLoopAmplitude: 90,
  ropeRevolutions: 5,

  strokeWidth: 2,
  showGuideCurve: false,
  colorMode: 'rainbow',
  primaryColor: '#6366f1',
  secondaryColor: '#ec4899',
  backgroundColor: '#0f0f14',
  transparentBackground: false,
  glowBlur: 0,

  exportScale: 2,
  exportFormat: 'png',
  pageSize: 'a4',
};

export const useSpiroStore = create<SpiroState>((set) => ({
  ...DEFAULT_PARAMS,

  setParam: (key, value) => set({ [key]: value } as Partial<SpiroState>),
  setMany: (patch) => set(patch as Partial<SpiroState>),
  resetToDefaults: () => set({ ...DEFAULT_PARAMS }),
}));
