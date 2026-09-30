'use client';

import { ImageDown, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { useExportRunner } from '@/components/controls/useExportRunner';
import type { RenderMode } from '@/engine/types/spiro';

const MODE_LABELS: Record<RenderMode, string> = {
  letterFill: 'Letter Fill',
  ropeFill: 'Rope Fill',
  curveText: 'Text on Curve',
};

export function TopBar() {
  const renderMode = useSpiroStore((s) => s.renderMode);
  const resetToDefaults = useSpiroStore((s) => s.resetToDefaults);
  const { busy, run } = useExportRunner();

  return (
    <header className="flex h-[52px] shrink-0 items-center justify-between gap-4 border-b border-white/[0.06] bg-app/95 px-4 backdrop-blur">
      <div className="flex min-w-0 items-center gap-3">
        <h1 className="flex items-center gap-2 text-[13px] font-semibold tracking-tight whitespace-nowrap">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-pink-500 shadow-[0_2px_10px_-2px_rgba(129,140,248,0.6)]">
            <Sparkles size={14} className="text-white" />
          </span>
          <span>
            SpiroText{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-pink-400 bg-clip-text text-transparent">Studio</span>
          </span>
        </h1>
        <span className="hidden items-center whitespace-nowrap rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 text-[11px] font-medium text-white/50 sm:flex">
          {MODE_LABELS[renderMode]}
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={resetToDefaults}
          title="Reset all controls to defaults"
          aria-label="Reset all controls to defaults"
          className="flex items-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] hover:text-neutral-100"
        >
          <RotateCcw size={12} />
          <span className="hidden sm:inline">Reset</span>
        </button>

        <div className="mx-0.5 h-4 w-px bg-white/[0.08]" aria-hidden />

        <button
          type="button"
          onClick={() => run('png')}
          disabled={busy !== null}
          title="Export as PNG"
          aria-label="Export as PNG"
          className="flex items-center gap-1.5 rounded-md bg-gradient-to-r from-indigo-500 to-pink-500 px-3 py-1.5 text-xs font-medium text-white shadow-[0_2px_10px_-3px_rgba(129,140,248,0.55)] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {busy === 'png' ? <Loader2 size={12} className="animate-spin" /> : <ImageDown size={12} />}
          Export
        </button>
      </div>
    </header>
  );
}
