'use client';

import { useState } from 'react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { generateCurvePoints } from '@/engine/math/parametric';
import { exportPng } from '@/engine/exporters/pngExporter';
import { exportSvg } from '@/engine/exporters/svgExporter';
import { exportPdf } from '@/engine/exporters/pdfExporter';
import type { SpiroParams } from '@/engine/types/spiro';

export type ExportKind = 'png' | 'svg' | 'pdf';

/** Shared by the sidebar Export section and the top bar's quick-export button, so both trigger the same export path. */
export function useExportRunner() {
  const store = useSpiroStore();
  const [busy, setBusy] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: ExportKind) {
    const paramsSnapshot: SpiroParams = store;
    setError(null);
    setBusy(kind);
    try {
      const points =
        paramsSnapshot.renderMode === 'letterFill'
          ? []
          : generateCurvePoints({
              curveType: paramsSnapshot.curveType,
              R: paramsSnapshot.R,
              r: paramsSnapshot.r,
              d: paramsSnapshot.d,
              revolutions: paramsSnapshot.revolutions,
              stepSize: paramsSnapshot.stepSize,
            });
      if (kind === 'png') await exportPng(paramsSnapshot, points);
      if (kind === 'svg') exportSvg(paramsSnapshot, points);
      if (kind === 'pdf') await exportPdf(paramsSnapshot, points);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Export failed.');
    } finally {
      setBusy(null);
    }
  }

  return { busy, error, run };
}
