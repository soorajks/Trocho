import type { ColorMode } from '@/engine/types/spiro';

export interface ColorOptions {
  colorMode: ColorMode;
  primaryColor: string;
  secondaryColor: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace('#', '');
  const bigint = parseInt(
    normalized.length === 3
      ? normalized.split('').map((c) => c + c).join('')
      : normalized,
    16
  );
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Resolves the draw color for a point at normalized progress `t` (0-1) along the curve.
 * - solid: primaryColor everywhere.
 * - gradient: linear interpolation from primaryColor to secondaryColor along the curve.
 * - rainbow: full hue sweep driven by t, independent of the picked colors.
 */
export function getColorAt(t: number, options: ColorOptions): string {
  const { colorMode, primaryColor, secondaryColor } = options;

  if (colorMode === 'rainbow') {
    const hue = (t * 360) % 360;
    return `hsl(${hue}, 85%, 55%)`;
  }

  if (colorMode === 'gradient') {
    const [r1, g1, b1] = hexToRgb(primaryColor);
    const [r2, g2, b2] = hexToRgb(secondaryColor);
    const r = Math.round(lerp(r1, r2, t));
    const g = Math.round(lerp(g1, g2, t));
    const b = Math.round(lerp(b1, b2, t));
    return `rgb(${r}, ${g}, ${b})`;
  }

  return primaryColor;
}
