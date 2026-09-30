export type CurveType = 'hypotrochoid' | 'epitrochoid' | 'rose' | 'lissajous';

/** 'curveText' = letters travel along one big spirograph curve. 'letterFill' = each letter's own glyph outline becomes the track that a rolling pen loops along (loops trace the letter's silhouette, incl. its holes). 'ropeFill' = the glyph's ink and holes are eroded into concentric layers, each looped — loops stay bounded by the actual stroke width, and holes fill with a converging spiral. */
export type RenderMode = 'curveText' | 'letterFill' | 'ropeFill';

export type ColorMode = 'solid' | 'gradient' | 'rainbow';

export type TextCase = 'none' | 'upper' | 'lower' | 'title';

export type ExportFormat = 'png' | 'svg' | 'pdf';

export type PageSize = 'a4' | 'letter' | 'square' | 'poster';

/** A single point sampled along a parametric curve, with local tangent direction and cumulative arc length. */
export interface CurvePoint {
  x: number;
  y: number;
  /** Tangent angle in radians at this point on the curve. */
  angle: number;
  /** Cumulative arc length from the start of the curve to this point. */
  distance: number;
}

export interface SpiroState {
  renderMode: RenderMode;

  // Text Config
  text: string;
  fontFamily: string;
  customFontUrl: string | null;
  customFontName: string | null;
  fontSize: number;
  letterSpacing: number;
  alignToTangent: boolean;
  textCase: TextCase;

  // Pattern Math Config
  curveType: CurveType;
  R: number;
  r: number;
  d: number;
  revolutions: number;
  stepSize: number;

  // Letter Fill Config (renderMode: 'letterFill' only)
  /** How many small loops the pen makes per single traversal of the glyph's outline. Non-integer values are recommended — an integer frequency re-traces the exact same loops every pass instead of precessing to fill the band. */
  loopFrequency: number;
  /** Loop size, as a percentage of fontSize (keeps it proportional regardless of fontSize). */
  loopAmplitude: number;

  // Rope Fill Config (renderMode: 'ropeFill' only)
  /** Small loops per single traversal of a contour's centerline. Non-integer values recommended — see loopFrequency. */
  ropeLoopFrequency: number;
  /** How far the loop reaches into the local stroke/counter half-width, as a percentage (100% = touches both walls exactly). */
  ropeLoopAmplitude: number;
  /** How many times the pen traverses the whole contour — precession from a non-integer loopFrequency is what fills the band across these passes. */
  ropeRevolutions: number;

  // Styling Config
  strokeWidth: number;
  showGuideCurve: boolean;
  colorMode: ColorMode;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  transparentBackground: boolean;
  glowBlur: number;

  // Export Settings
  exportScale: 1 | 2 | 4;
  exportFormat: ExportFormat;
  pageSize: PageSize;

  // Actions
  setParam: <K extends keyof SpiroParams>(key: K, value: SpiroParams[K]) => void;
  setMany: (patch: Partial<SpiroParams>) => void;
  resetToDefaults: () => void;
}

/** The subset of SpiroState that is plain data (no actions) — used for persistence and export payloads. */
export type SpiroParams = Omit<SpiroState, 'setParam' | 'setMany' | 'resetToDefaults'>;
