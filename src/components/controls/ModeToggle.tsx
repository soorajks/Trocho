'use client';

import { Cable, LetterText, Spline } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import type { RenderMode } from '@/engine/types/spiro';

const MODES: { value: RenderMode; label: string; hint: string; icon: typeof LetterText }[] = [
  { value: 'letterFill', label: 'Letter Fill', hint: 'Loops trace each letter', icon: LetterText },
  { value: 'ropeFill', label: 'Rope Fill', hint: 'Loops fill the stroke + holes', icon: Cable },
  { value: 'curveText', label: 'Text on Curve', hint: 'Text rides one big curve', icon: Spline },
];

export function ModeToggle() {
  const { renderMode, setParam } = useSpiroStore();

  return (
    <div className="flex flex-col gap-2 py-3.5 first:pt-0">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-white/50">Mode</span>
      <div className="grid grid-cols-3 gap-1 rounded-lg border border-white/[0.08] bg-white/[0.02] p-1">
        {MODES.map((m) => {
          const Icon = m.icon;
          const active = renderMode === m.value;
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => setParam('renderMode', m.value)}
              title={m.hint}
              aria-pressed={active}
              className={`flex min-h-[52px] flex-col items-center justify-center gap-1 rounded-md px-1 py-2 text-center transition-all duration-150 ${
                active
                  ? 'bg-gradient-to-br from-indigo-500/90 to-pink-500/80 text-white shadow-[0_2px_10px_-3px_rgba(129,140,248,0.6)]'
                  : 'text-white/45 hover:bg-white/[0.05] hover:text-white/80'
              }`}
            >
              <Icon size={14} />
              <span className="text-[10px] font-medium leading-tight">{m.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
