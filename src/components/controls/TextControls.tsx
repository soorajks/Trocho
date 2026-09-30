'use client';

import { Type } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { ControlSection } from '@/components/ui/ControlSection';
import { Field } from '@/components/ui/Field';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import type { TextCase } from '@/engine/types/spiro';

const GOOGLE_FONTS = ['sans-serif', 'serif', 'monospace', 'Poppins', 'Playfair Display', 'Bebas Neue', 'Caveat'];
const TEXT_CASES: { value: TextCase; label: string }[] = [
  { value: 'none', label: 'As typed' },
  { value: 'upper', label: 'UPPERCASE' },
  { value: 'lower', label: 'lowercase' },
  { value: 'title', label: 'Title Case' },
];

export function TextControls() {
  const { text, fontFamily, fontSize, letterSpacing, alignToTangent, textCase, renderMode, setParam } = useSpiroStore();

  return (
    <ControlSection title="Text" icon={<Type size={13} />}>
      <Field label="Text">
        <input
          value={text}
          onChange={(e) => setParam('text', e.target.value)}
          placeholder="Type your text…"
          className="h-9 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-neutral-100 outline-none transition-colors placeholder:text-neutral-600 hover:border-white/[0.16] focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/30"
        />
      </Field>

      <Field label="Font">
        <Select value={fontFamily} onChange={(v) => setParam('fontFamily', v)}>
          {GOOGLE_FONTS.map((font) => (
            <option key={font} value={font}>
              {font}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Case">
        <Select value={textCase} onChange={(v) => setParam('textCase', v as TextCase)}>
          {TEXT_CASES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </Select>
      </Field>

      <Slider label="Font Size" value={fontSize} min={6} max={72} onChange={(v) => setParam('fontSize', v)} formatValue={(v) => `${v}px`} />
      <Slider label="Letter Spacing" value={letterSpacing} min={-4} max={40} onChange={(v) => setParam('letterSpacing', v)} formatValue={(v) => `${v}px`} />

      {renderMode === 'curveText' && (
        <Switch label="Align text to curve tangent" checked={alignToTangent} onChange={(v) => setParam('alignToTangent', v)} />
      )}
    </ControlSection>
  );
}
