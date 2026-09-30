interface ColorSwatchProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function ColorSwatch({ label, value, onChange, disabled }: ColorSwatchProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-neutral-400">{label}</span>
      <div
        className={`flex h-9 items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.03] pl-1.5 pr-3 transition-colors ${
          disabled ? 'opacity-40' : 'hover:border-white/[0.16]'
        }`}
      >
        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/15">
          <input
            type="color"
            value={value}
            disabled={disabled}
            onChange={(e) => onChange(e.target.value)}
            className="spiro-color-swatch h-full w-full cursor-pointer disabled:cursor-not-allowed"
          />
        </div>
        <span className="font-mono text-xs uppercase tracking-wide text-neutral-300">{value}</span>
      </div>
    </div>
  );
}
