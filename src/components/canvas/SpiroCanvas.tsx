'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSpiroStore } from '@/store/useSpiroStore';
import { generateCurvePoints } from '@/engine/math/parametric';
import { renderSpiroScene } from '@/engine/render/renderScene';
import { renderLetterFillScene } from '@/engine/render/renderLetterFillScene';
import { renderRopeFillScene } from '@/engine/render/renderRopeFillScene';
import type { SpiroParams } from '@/engine/types/spiro';

export function SpiroCanvas() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [size, setSize] = useState({ width: 600, height: 600 });

  const params = useSpiroStore();

  // Geometry recompute is the expensive step — only re-run it when curve-shape params change,
  // not on every color/style tweak (those just re-draw the already-computed points).
  const geometryKey = useMemo(
    () => [params.curveType, params.R, params.r, params.d, params.revolutions, params.stepSize] as const,
    [params.curveType, params.R, params.r, params.d, params.revolutions, params.stepSize]
  );

  const curvePoints = useMemo(() => {
    if (params.renderMode !== 'curveText') return [];
    return generateCurvePoints({
      curveType: geometryKey[0],
      R: geometryKey[1],
      r: geometryKey[2],
      d: geometryKey[3],
      revolutions: geometryKey[4],
      stepSize: geometryKey[5],
    });
  }, [params.renderMode, geometryKey]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const box = entry.contentBoxSize?.[0];
      const w = box ? box.inlineSize : entry.contentRect.width;
      const h = box ? box.blockSize : entry.contentRect.height;
      setSize({ width: Math.max(w, 100), height: Math.max(h, 100) });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.width * dpr;
    canvas.height = size.height * dpr;
    canvas.style.width = `${size.width}px`;
    canvas.style.height = `${size.height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const spiroParams: SpiroParams = params;
    const layoutTarget = { width: size.width, height: size.height };
    if (spiroParams.renderMode === 'letterFill') {
      renderLetterFillScene(ctx, spiroParams, layoutTarget);
    } else if (spiroParams.renderMode === 'ropeFill') {
      renderRopeFillScene(ctx, spiroParams, layoutTarget);
    } else {
      renderSpiroScene(ctx, spiroParams, curvePoints, layoutTarget);
    }
  }, [size, curvePoints, params]);

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full min-h-0 min-w-0 overflow-hidden rounded-lg border border-white/[0.06] bg-canvas shadow-[inset_0_1px_0_0_rgba(255,255,255,0.02)]"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute right-3 bottom-2.5 rounded-md bg-black/40 px-2 py-1 font-mono text-[10px] tabular-nums text-white/40 backdrop-blur-sm">
        {Math.round(size.width)} × {Math.round(size.height)}
      </div>
    </div>
  );
}
