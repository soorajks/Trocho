'use client';

import { Download, FileCode2, FileOutput, ImageDown, Loader2 } from 'lucide-react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { ControlSection } from '@/components/ui/ControlSection';
import { Field } from '@/components/ui/Field';
import { Select } from '@/components/ui/Select';
import { useExportRunner } from '@/components/controls/useExportRunner';
import type { PageSize } from '@/engine/types/spiro';

const SCALES: Array<1 | 2 | 4> = [1, 2, 4];
const PAGE_SIZES: { value: PageSize; label: string }[] = [
  { value: 'a4', label: 'A4' },
  { value: 'letter', label: 'Letter' },
  { value: 'square', label: 'Square' },
  { value: 'poster', label: 'Poster (18×24in)' },
];

export function ExportControls() {
  const { exportScale, pageSize, setParam } = useSpiroStore();
  const { busy, error, run } = useExportRunner();

  return (
    <ControlSection title="Export" icon={<Download size={13} />}>
      <Field label="PNG Scale">
        <div className="flex gap-1.5">
          {SCALES.map((s) => (
            <button
              key={s}
              onClick={() => setParam('exportScale', s)}
              className={`h-9 flex-1 rounded-md border text-sm font-medium transition-colors ${
                exportScale === s
                  ? 'border-indigo-400/50 bg-indigo-500/15 text-indigo-200'
                  : 'border-white/[0.08] bg-white/[0.03] text-neutral-400 hover:border-white/[0.16] hover:text-neutral-200'
              }`}
            >
              {s}×
            </button>
          ))}
        </div>
      </Field>

      <Field label="PDF Page Size">
        <Select value={pageSize} onChange={(v) => setParam('pageSize', v as PageSize)}>
          {PAGE_SIZES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </Select>
      </Field>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={() => run('png')}
          disabled={busy !== null}
          title="Download PNG"
          className="flex h-10 items-center justify-center gap-2 rounded-md bg-gradient-to-r from-indigo-500 to-pink-500 px-3 text-sm font-medium text-white shadow-[0_4px_16px_-4px_rgba(129,140,248,0.5)] transition-transform hover:brightness-110 active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100"
        >
          {busy === 'png' ? <Loader2 size={15} className="animate-spin" /> : <ImageDown size={15} />}
          {busy === 'png' ? 'Exporting…' : 'Download PNG'}
        </button>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => run('svg')}
            disabled={busy !== null}
            title="Download SVG"
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-neutral-200 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] disabled:opacity-50"
          >
            {busy === 'svg' ? <Loader2 size={13} className="animate-spin" /> : <FileCode2 size={13} />}
            SVG
          </button>
          <button
            onClick={() => run('pdf')}
            disabled={busy !== null}
            title="Download PDF (print-ready)"
            className="flex h-9 items-center justify-center gap-1.5 rounded-md border border-white/[0.08] bg-white/[0.03] text-xs font-medium text-neutral-200 transition-colors hover:border-white/[0.16] hover:bg-white/[0.06] disabled:opacity-50"
          >
            {busy === 'pdf' ? <Loader2 size={13} className="animate-spin" /> : <FileOutput size={13} />}
            PDF
          </button>
        </div>
      </div>

      {error && <p className="text-[11px] text-red-400">{error}</p>}
    </ControlSection>
  );
}
