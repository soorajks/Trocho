'use client';

import { Shapes } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { ControlSection } from '@/components/ui/ControlSection';
import { Field } from '@/components/ui/Field';
import { Slider } from '@/components/ui/Slider';
import { Select } from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import type { CurveType } from '@/engine/types/spiro';

const CURVES: { value: CurveType; label: string }[] = [
  { value: 'hypotrochoid', label: 'Hypotrochoid' },
  { value: 'epitrochoid', label: 'Epitrochoid' },
  { value: 'rose', label: 'Rose Curve' },
  { value: 'lissajous', label: 'Lissajous' },
];

export function GeometryControls() {
  const store = useSpiroStore();
  const { renderMode, revolutions, stepSize, showGuideCurve, setParam } = store;
  const isLetterFill = renderMode === 'letterFill';
  const isRopeFill = renderMode === 'ropeFill';

  return (
    <ControlSection title="Geometry" icon={<Shapes size={13} />}>
      {isRopeFill ? (
        <>
          <Slider
            label="Loop Frequency"
            value={store.ropeLoopFrequency}
            min={2}
            max={40}
            step={0.1}
            onChange={(v) => setParam('ropeLoopFrequency', v)}
            formatValue={(v) => v.toFixed(1)}
          />
          <Slider
            label="Loop Amplitude"
            value={store.ropeLoopAmplitude}
            min={10}
            max={140}
            onChange={(v) => setParam('ropeLoopAmplitude', v)}
            formatValue={(v) => `${v}%`}
          />
          <Slider
            label="Revolutions"
            value={store.ropeRevolutions}
            min={1}
            max={12}
            onChange={(v) => setParam('ropeRevolutions', v)}
          />
        </>
      ) : isLetterFill ? (
        <>
          <Slider
            label="Loop Frequency"
            value={store.loopFrequency}
            min={2}
            max={60}
            step={0.1}
            onChange={(v) => setParam('loopFrequency', v)}
            formatValue={(v) => v.toFixed(1)}
          />
          <Slider
            label="Loop Amplitude"
            value={store.loopAmplitude}
            min={1}
            max={40}
            onChange={(v) => setParam('loopAmplitude', v)}
            formatValue={(v) => `${v}%`}
          />
        </>
      ) : (
        <>
          <Field label="Curve Type">
            <Select value={store.curveType} onChange={(v) => setParam('curveType', v as CurveType)}>
              {CURVES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>

          <Slider label="Outer Radius (R)" value={store.R} min={10} max={500} onChange={(v) => setParam('R', v)} />
          <Slider label="Inner Radius (r)" value={store.r} min={1} max={300} onChange={(v) => setParam('r', v)} />
          <Slider label="Pen Distance (d)" value={store.d} min={0} max={300} onChange={(v) => setParam('d', v)} />
        </>
      )}

      {!isRopeFill && (
        <Slider
          label={isLetterFill ? 'Passes' : 'Revolutions'}
          value={revolutions}
          min={1}
          max={50}
          onChange={(v) => setParam('revolutions', v)}
        />
      )}
      <Slider
        label="Step Resolution"
        value={stepSize}
        min={0.001}
        max={0.1}
        step={0.001}
        onChange={(v) => setParam('stepSize', v)}
        formatValue={(v) => v.toFixed(3)}
      />

      <Switch
        label={isLetterFill || isRopeFill ? 'Show letter outline guide' : 'Show guide curve'}
        checked={showGuideCurve}
        onChange={(v) => setParam('showGuideCurve', v)}
      />
    </ControlSection>
  );
}
