interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
}

export function Slider({ label, value, min, max, step = 1, onChange, formatValue }: SliderProps) {
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;
  const trackStyle = {
    background: `linear-gradient(to right, #818cf8 0%, #818cf8 ${percent}%, rgba(255,255,255,0.08) ${percent}%, rgba(255,255,255,0.08) 100%)`,
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-neutral-400">{label}</span>
        <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[11px] tabular-nums text-neutral-300">
          {formatValue ? formatValue(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={trackStyle}
        className="spiro-slider w-full"
      />
    </div>
  );
}
