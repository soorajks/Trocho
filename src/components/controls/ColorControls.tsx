'use client';

import { Palette } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { ControlSection } from '@/components/ui/ControlSection';
import { Field } from '@/components/ui/Field';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { ColorSwatch } from '@/components/ui/ColorSwatch';
import { Switch } from '@/components/ui/Switch';
import type { ColorMode } from '@/engine/types/spiro';

const COLOR_MODES: { value: ColorMode; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'gradient', label: 'Gradient' },
  { value: 'rainbow', label: 'Rainbow (hue shift)' },
];

export function ColorControls() {
  const {
    colorMode,
    primaryColor,
    secondaryColor,
    backgroundColor,
    transparentBackground,
    strokeWidth,
    glowBlur,
    setParam,
  } = useSpiroStore();

  return (
    <ControlSection title="Appearance" icon={<Palette size={13} />}>
      <Field label="Color Mode">
        <Select value={colorMode} onChange={(v) => setParam('colorMode', v as ColorMode)}>
          {COLOR_MODES.map((m) => (
            <option key={m.value} value={m.value}>
              {m.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex gap-3">
        <div className="flex-1">
          <ColorSwatch label={colorMode === 'gradient' ? 'Color A' : 'Color'} value={primaryColor} onChange={(v) => setParam('primaryColor', v)} />
        </div>
        {colorMode === 'gradient' && (
          <div className="flex-1">
            <ColorSwatch label="Color B" value={secondaryColor} onChange={(v) => setParam('secondaryColor', v)} />
          </div>
        )}
      </div>

      <ColorSwatch label="Background" value={backgroundColor} disabled={transparentBackground} onChange={(v) => setParam('backgroundColor', v)} />

      <Switch label="Transparent background (for export)" checked={transparentBackground} onChange={(v) => setParam('transparentBackground', v)} />

      <Slider label="Stroke / Glyph Weight" value={strokeWidth} min={0.5} max={20} step={0.5} onChange={(v) => setParam('strokeWidth', v)} formatValue={(v) => `${v}px`} />
      <Slider label="Glow" value={glowBlur} min={0} max={40} onChange={(v) => setParam('glowBlur', v)} formatValue={(v) => (v === 0 ? 'off' : `${v}px`)} />
    </ControlSection>
  );
}
