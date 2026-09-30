# Architecture

## Project structure

```
src/
  app/                 Next.js app router entry (layout, page, global styles)
  components/
    canvas/            <SpiroCanvas> — the main render surface
    controls/          Sidebar controls (mode, text, geometry, color, export)
    layout/             Top bar
    ui/                Shared low-level UI primitives (Slider, Select, Switch, ...)
  engine/
    math/               Parametric curve + text-path math
    render/             Layout + scene rendering for each mode
    letterFill/         Glyph tracing, contour, and loop-fill logic
    exporters/          PNG / SVG / PDF export
    types/               Shared TypeScript types
  store/                 Zustand store holding all spirograph parameters
```

## How it works

1. Text is converted into vector glyph outlines (via `opentype.js` for custom fonts, or the browser's own font rendering otherwise).
2. Depending on the selected mode, the engine either:
   - traces each glyph's outline with a rolling-loop pen (**Letter Fill**),
   - erodes the glyph into concentric bands and loops each one (**Rope Fill**), or
   - lays text along a parametric curve (**Text on Curve**).
3. The result is rendered live to a `<canvas>`, and can be exported to PNG (via canvas rasterization), SVG (via `svg2pdf.js`/custom SVG building), or PDF (via `jspdf`).
