export interface RawPoint {
  x: number;
  y: number;
}

export interface GlyphContour {
  points: RawPoint[];
  /** 'outer' = the glyph's own silhouette edge(s); 'hole' = an interior counter (e.g. the triangle inside 'A'). */
  kind: 'outer' | 'hole';
  /** Typical half-width of the ink ('outer') or counter ('hole') this contour bounds — the median of several ray-marched samples from the boundary to the nearest opposite wall. A single robust number per contour, used to size a loop riding it so the loop stays roughly within the actual stroke/counter width. */
  halfThickness: number;
}

export interface GlyphOutline {
  /** All coordinates in em units (fontSize=1 → multiply by desired px size). */
  contours: GlyphContour[];
  /** Horizontal advance to the next letter, in em units. */
  advanceWidth: number;
}

const RASTER_EM = 300; // px per em used for tracing resolution
const ALPHA_THRESHOLD = 100;
const MIN_COMPONENT_PIXELS = 3;

let measureCtx: CanvasRenderingContext2D | null = null;
function getMeasureCtx(): CanvasRenderingContext2D {
  if (!measureCtx) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context unavailable — cannot trace glyph outlines.');
    measureCtx = ctx;
  }
  return measureCtx;
}

/** 8 Moore neighbors, clockwise starting at North. */
const DIRS: [number, number][] = [
  [0, -1],
  [1, -1],
  [1, 0],
  [1, 1],
  [0, 1],
  [-1, 1],
  [-1, 0],
  [-1, -1],
];

function dirIndexOf(dx: number, dy: number): number {
  for (let i = 0; i < 8; i++) if (DIRS[i][0] === dx && DIRS[i][1] === dy) return i;
  return 6; // fallback: West
}

/**
 * Moore-neighbor boundary tracing. `startX,startY` must be a pixel where `isFg` is true and its
 * West neighbor is false (guaranteed when the start pixel is the first found in a raster scan
 * of its connected component — see labelComponents' topLeftMost selection).
 */
function traceBoundary(isFg: (x: number, y: number) => boolean, startX: number, startY: number): RawPoint[] {
  const boundary: RawPoint[] = [{ x: startX, y: startY }];
  let bx = startX - 1;
  let by = startY;
  let cx = startX;
  let cy = startY;
  const maxSteps = 300_000;

  for (let steps = 0; steps < maxSteps; steps++) {
    const bDir = dirIndexOf(bx - cx, by - cy);
    let found = false;
    let nx = 0;
    let ny = 0;
    let newBx = 0;
    let newBy = 0;

    for (let i = 1; i <= 8; i++) {
      const dir = (bDir + i) % 8;
      const [dx, dy] = DIRS[dir];
      const px = cx + dx;
      const py = cy + dy;
      if (isFg(px, py)) {
        nx = px;
        ny = py;
        const prevDir = (dir - 1 + 8) % 8;
        newBx = cx + DIRS[prevDir][0];
        newBy = cy + DIRS[prevDir][1];
        found = true;
        break;
      }
    }

    if (!found) break; // isolated pixel
    if (nx === startX && ny === startY) break; // closed the loop

    cx = nx;
    cy = ny;
    bx = newBx;
    by = newBy;
    boundary.push({ x: cx, y: cy });
  }

  return boundary;
}

function labelComponents(mask: Uint8Array, w: number, h: number, targetValue: 0 | 1, connectivity: 4 | 8): RawPoint[][] {
  const visited = new Uint8Array(w * h);
  const components: RawPoint[][] = [];
  const neighborOffsets: [number, number][] =
    connectivity === 4
      ? [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ]
      : DIRS;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (visited[idx] || mask[idx] !== targetValue) continue;

      const comp: RawPoint[] = [];
      const queue: number[] = [idx];
      visited[idx] = 1;

      while (queue.length > 0) {
        const cur = queue.pop() as number;
        const cx = cur % w;
        const cy = (cur / w) | 0;
        comp.push({ x: cx, y: cy });

        for (const [dx, dy] of neighborOffsets) {
          const nx = cx + dx;
          const ny = cy + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const nidx = ny * w + nx;
          if (!visited[nidx] && mask[nidx] === targetValue) {
            visited[nidx] = 1;
            queue.push(nidx);
          }
        }
      }

      components.push(comp);
    }
  }

  return components;
}

function topLeftMost(comp: RawPoint[]): RawPoint {
  let best = comp[0];
  for (const p of comp) {
    if (p.y < best.y || (p.y === best.y && p.x < best.x)) best = p;
  }
  return best;
}

/** Background pixels reachable from the raster border without crossing foreground — i.e. "outside" the glyph, as opposed to an enclosed hole. */
function findOutsideMask(mask: Uint8Array, w: number, h: number): Uint8Array {
  const outside = new Uint8Array(w * h);
  const queue: number[] = [];

  const tryPush = (x: number, y: number) => {
    const idx = y * w + x;
    if (mask[idx] === 0 && !outside[idx]) {
      outside[idx] = 1;
      queue.push(idx);
    }
  };
  for (let x = 0; x < w; x++) {
    tryPush(x, 0);
    tryPush(x, h - 1);
  }
  for (let y = 0; y < h; y++) {
    tryPush(0, y);
    tryPush(w - 1, y);
  }

  while (queue.length > 0) {
    const cur = queue.pop() as number;
    const cx = cur % w;
    const cy = (cur / w) | 0;
    const neighbors: [number, number][] = [
      [cx + 1, cy],
      [cx - 1, cy],
      [cx, cy + 1],
      [cx, cy - 1],
    ];
    for (const [nx, ny] of neighbors) {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
      const nidx = ny * w + nx;
      if (mask[nidx] === 0 && !outside[nidx]) {
        outside[nidx] = 1;
        queue.push(nidx);
      }
    }
  }

  return outside;
}

/** Corner-cutting subdivision (Chaikin's algorithm) — turns the pixel-staircase boundary into a smooth closed curve. */
function chaikinSmooth(points: RawPoint[], iterations: number): RawPoint[] {
  let pts = points;
  for (let iter = 0; iter < iterations; iter++) {
    const next: RawPoint[] = [];
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const p0 = pts[i];
      const p1 = pts[(i + 1) % n];
      next.push({ x: 0.75 * p0.x + 0.25 * p1.x, y: 0.75 * p0.y + 0.25 * p1.y });
      next.push({ x: 0.25 * p0.x + 0.75 * p1.x, y: 0.25 * p0.y + 0.75 * p1.y });
    }
    pts = next;
  }
  return pts;
}

/** Keeps every Nth point — thins out the dense 1px-step Moore trace before smoothing. */
function decimate(points: RawPoint[], stride: number): RawPoint[] {
  if (stride <= 1) return points;
  const out: RawPoint[] = [];
  for (let i = 0; i < points.length; i += stride) out.push(points[i]);
  return out.length >= 3 ? out : points;
}

function sampleMask(mask: Uint8Array, w: number, h: number, x: number, y: number): 0 | 1 {
  const ix = Math.round(x);
  const iy = Math.round(y);
  if (ix < 0 || iy < 0 || ix >= w || iy >= h) return 0;
  return mask[iy * w + ix] as 0 | 1;
}

/**
 * Ray-marches along the inward normal from several sample points around a closed contour,
 * through the raster mask, to the nearest opposite wall (`targetValue` = the pixel value marched
 * *through*: 1=ink for an outer contour, 0=empty for a hole; marching stops the instant it hits
 * the opposite value). Returns the MEDIAN of those samples as one robust half-thickness number
 * for the whole contour — deliberately not per-point, since per-point values swing wildly near
 * corners/junctions and everything downstream (loop amplitude) is far more stable riding the
 * contour's already-smooth boundary with one representative size than trying to hug a thickness
 * profile that jumps around.
 */
function estimateHalfThickness(mask: Uint8Array, w: number, h: number, points: RawPoint[], targetValue: 0 | 1, maxSearch: number): number {
  const n = points.length;
  const stopValue: 0 | 1 = targetValue === 1 ? 0 : 1;
  const searchCap = Math.min(maxSearch, Math.max(w, h) / 3);
  const sampleCount = Math.min(n, 48);
  const stride = Math.max(1, Math.floor(n / sampleCount));

  const samples: number[] = [];
  for (let i = 0; i < n; i += stride) {
    const p = points[i];
    const prev = points[(i - 1 + n) % n];
    const next = points[(i + 1) % n];
    const tx = next.x - prev.x;
    const ty = next.y - prev.y;
    const len = Math.hypot(tx, ty);
    if (len < 1e-6) continue;

    let nx = -ty / len;
    let ny = tx / len;
    const probe = 1.5;
    const plus = sampleMask(mask, w, h, p.x + nx * probe, p.y + ny * probe);
    const minus = sampleMask(mask, w, h, p.x - nx * probe, p.y - ny * probe);
    if (plus !== targetValue && minus === targetValue) {
      nx = -nx;
      ny = -ny;
    } else if (plus !== targetValue && minus !== targetValue) {
      continue; // ambiguous — skip rather than march in a possibly-wrong direction
    }

    for (let d = 1; d <= searchCap; d++) {
      if (sampleMask(mask, w, h, p.x + nx * d, p.y + ny * d) === stopValue) {
        samples.push(d / 2);
        break;
      }
    }
  }

  if (samples.length === 0) return 1;
  samples.sort((a, b) => a - b);
  return samples[Math.floor(samples.length / 2)];
}

function extractContours(mask: Uint8Array, w: number, h: number): GlyphContour[] {
  const contours: GlyphContour[] = [];
  const smooth = (c: RawPoint[]) => chaikinSmooth(decimate(c, 3), 3);
  const maxSearch = Math.max(w, h);
  const isFgAt = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && mask[y * w + x] === 1;

  const fgComponents = labelComponents(mask, w, h, 1, 8);
  for (const comp of fgComponents) {
    if (comp.length < MIN_COMPONENT_PIXELS) continue;
    const start = topLeftMost(comp);
    const boundary = smooth(traceBoundary(isFgAt, start.x, start.y));
    if (boundary.length >= 3) {
      const halfThickness = estimateHalfThickness(mask, w, h, boundary, 1, maxSearch);
      contours.push({ points: boundary, kind: 'outer', halfThickness });
    }
  }

  const outside = findOutsideMask(mask, w, h);
  const holeMask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) holeMask[i] = mask[i] === 0 && outside[i] === 0 ? 1 : 0;
  const isHoleAt = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && holeMask[y * w + x] === 1;

  const holeComponents = labelComponents(holeMask, w, h, 1, 4);
  for (const comp of holeComponents) {
    if (comp.length < MIN_COMPONENT_PIXELS) continue;
    const start = topLeftMost(comp);
    const boundary = smooth(traceBoundary(isHoleAt, start.x, start.y));
    if (boundary.length >= 3) {
      const halfThickness = estimateHalfThickness(mask, w, h, boundary, 0, maxSearch);
      contours.push({ points: boundary, kind: 'hole', halfThickness });
    }
  }

  return contours;
}

const glyphCache = new Map<string, GlyphOutline>();

/** Rasterizes one character with the given font, traces its outline (silhouette + holes), and caches the result. */
export function traceGlyphOutline(char: string, fontFamily: string): GlyphOutline {
  const cacheKey = `${fontFamily}::${char}`;
  const cached = glyphCache.get(cacheKey);
  if (cached) return cached;

  const ctx = getMeasureCtx();
  ctx.font = `900 ${RASTER_EM}px ${fontFamily}`;
  const metrics = ctx.measureText(char);
  const advanceWidth = metrics.width / RASTER_EM;

  if (!char.trim()) {
    const outline: GlyphOutline = { contours: [], advanceWidth };
    glyphCache.set(cacheKey, outline);
    return outline;
  }

  const left = Math.max(0, Math.floor(metrics.actualBoundingBoxLeft ?? 0));
  const right = Math.max(1, Math.ceil(metrics.actualBoundingBoxRight ?? metrics.width));
  const ascent = Math.max(1, Math.ceil(metrics.actualBoundingBoxAscent ?? RASTER_EM * 0.8));
  const descent = Math.max(0, Math.ceil(metrics.actualBoundingBoxDescent ?? RASTER_EM * 0.2));

  const PAD = 4;
  const w = left + right + PAD * 2;
  const h = ascent + descent + PAD * 2;

  if (w <= 2 || h <= 2) {
    const outline: GlyphOutline = { contours: [], advanceWidth };
    glyphCache.set(cacheKey, outline);
    return outline;
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const rasterCtx = canvas.getContext('2d', { willReadFrequently: true });
  if (!rasterCtx) throw new Error('Canvas 2D context unavailable — cannot trace glyph outlines.');

  rasterCtx.font = `900 ${RASTER_EM}px ${fontFamily}`;
  rasterCtx.fillStyle = '#000';
  rasterCtx.textBaseline = 'alphabetic';
  rasterCtx.textAlign = 'left';
  rasterCtx.fillText(char, PAD + left, PAD + ascent);

  const imageData = rasterCtx.getImageData(0, 0, w, h).data;
  const mask = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) mask[i] = imageData[i * 4 + 3] >= ALPHA_THRESHOLD ? 1 : 0;

  const rawContours = extractContours(mask, w, h);

  // Map raster px (at RASTER_EM font size, canvas-local origin) back to em units with x=0 at the
  // glyph's natural left-bearing origin and y=0 at the baseline — the standard glyph coordinate frame.
  const originX = PAD + left;
  const originY = PAD + ascent;
  const toEm = (p: RawPoint) => ({ x: (p.x - originX) / RASTER_EM, y: (p.y - originY) / RASTER_EM });
  const contours: GlyphContour[] = rawContours.map((c) => ({
    kind: c.kind,
    points: c.points.map(toEm),
    halfThickness: c.halfThickness / RASTER_EM,
  }));

  const outline: GlyphOutline = { contours, advanceWidth };
  glyphCache.set(cacheKey, outline);
  return outline;
}
