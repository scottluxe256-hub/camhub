export interface TracePoint {
  x: number;
  y: number;
}

export interface TracePolyline {
  points: TracePoint[];
  cumLengths: number[];
  totalLength: number;
}

export interface SubPolylineSegment {
  points: TracePoint[];
  tail: TracePoint;
  head: TracePoint;
}

function getOffsetBox(el: HTMLElement, container: HTMLElement) {
  let x = 0;
  let y = 0;
  let curr: HTMLElement | null = el;
  while (curr && curr !== container) {
    x += curr.offsetLeft;
    y += curr.offsetTop;
    curr = curr.offsetParent as HTMLElement | null;
  }
  return { x, y, width: el.offsetWidth, height: el.offsetHeight };
}

function buildTracePolyline(points: TracePoint[]): TracePolyline {
  const cumLengths: number[] = [0];
  let total = 0;

  for (let i = 1; i < points.length; i++) {
    const dx = points[i].x - points[i - 1].x;
    const dy = points[i].y - points[i - 1].y;
    total += Math.hypot(dx, dy);
    cumLengths.push(total);
  }

  return { points, cumLengths, totalLength: total };
}

function buildHorizontalPcbPoints(
  cx: number,
  cy: number,
  ix: number,
  iy: number
): TracePoint[] {
  const dx = ix - cx;
  const dy = iy - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const signX = dx >= 0 ? 1 : -1;

  const stem = Math.min(absX * 0.3, 72);
  if (stem + absY <= absX) {
    const diagEndX = cx + signX * (stem + absY);
    return [
      { x: cx, y: cy },
      { x: cx + signX * stem, y: cy },
      { x: diagEndX, y: iy },
      { x: ix, y: iy },
    ];
  }

  const diagX = absX * 0.42;
  const midX = cx + dx * 0.5;
  return [
    { x: cx, y: cy },
    { x: midX - signX * diagX * 0.5, y: cy },
    { x: midX + signX * diagX * 0.5, y: iy },
    { x: ix, y: iy },
  ];
}

export function extractSubPolyline(
  trace: TracePolyline,
  startFrac: number,
  endFrac: number
): SubPolylineSegment | null {
  const { points, cumLengths, totalLength } = trace;
  if (totalLength <= 0) return null;

  const s = Math.max(0, startFrac) * totalLength;
  const e = Math.min(1, endFrac) * totalLength;
  if (e - s < 1) return null;

  const result: TracePoint[] = [];

  for (let i = 0; i < points.length - 1; i++) {
    const d0 = cumLengths[i];
    const d1 = cumLengths[i + 1];
    const segLen = d1 - d0;
    if (segLen <= 0) continue;

    if (d1 < s || d0 > e) continue;

    const p0 = points[i];
    const p1 = points[i + 1];

    if (result.length === 0) {
      const tStart = Math.max(0, (s - d0) / segLen);
      result.push({
        x: p0.x + (p1.x - p0.x) * tStart,
        y: p0.y + (p1.y - p0.y) * tStart,
      });
    }

    if (d1 >= e) {
      const tEnd = Math.min(1, (e - d0) / segLen);
      result.push({
        x: p0.x + (p1.x - p0.x) * tEnd,
        y: p0.y + (p1.y - p0.y) * tEnd,
      });
      break;
    } else {
      result.push({ x: p1.x, y: p1.y });
    }
  }

  if (result.length < 2) return null;

  return {
    points: result,
    tail: result[0],
    head: result[result.length - 1],
  };
}

export function computePortraitTraces(
  wrap: HTMLElement,
  mascot: HTMLElement,
  icons: (HTMLDivElement | null)[]
): TracePolyline[] | null {
  const mascotBox = getOffsetBox(mascot, wrap);
  if (wrap.offsetWidth <= 0 || mascotBox.width <= 0) return null;

  const cx = mascotBox.x + mascotBox.width * 0.5;
  const cyUpper = mascotBox.y + mascotBox.height * 0.28;
  const cyMid = mascotBox.y + mascotBox.height * 0.28;
  const cyLower = mascotBox.y + mascotBox.height * 0.34;

  const traces: TracePolyline[] = [];

  for (let idx = 0; idx < 6; idx++) {
    const el = icons[idx];
    if (!el) return null;

    const box = getOffsetBox(el, wrap);
    const ix = box.x + box.width * 0.5;
    const iy = box.y + box.height * 0.5;

    if (idx <= 1) {
      traces.push(
        buildTracePolyline([
          { x: cx, y: cyUpper },
          { x: ix, y: iy + 30 },
          { x: ix, y: iy },
        ])
      );
    } else if (idx >= 4) {
      traces.push(
        buildTracePolyline([
          { x: cx, y: cyLower },
          { x: ix, y: iy - 42 },
          { x: ix, y: iy },
        ])
      );
    } else {
      traces.push(buildTracePolyline(buildHorizontalPcbPoints(cx, cyMid, ix, iy)));
    }
  }

  return traces;
}

export function computeDesktopTraces(
  wrap: HTMLElement,
  mascot: HTMLElement,
  icons: (HTMLDivElement | null)[]
): TracePolyline[] | null {
  const mascotBox = getOffsetBox(mascot, wrap);
  if (wrap.offsetWidth <= 0 || mascotBox.width <= 0) return null;

  const cx = mascotBox.x + mascotBox.width * 0.5;
  const cyTop = mascotBox.y + mascotBox.height * 0.28;

  const traces: TracePolyline[] = [];

  for (let idx = 0; idx < 6; idx++) {
    const el = icons[idx];
    if (!el) return null;

    const box = getOffsetBox(el, wrap);
    const ix = box.x + box.width * 0.5;
    const iy = box.y + box.height * 0.5;

    if (idx === 2 || idx === 5) {
      const signX = ix >= cx ? 1 : -1;
      const bendX = cx + signX * (mascotBox.width * 0.32);
      const bendY = mascotBox.y + mascotBox.height * 0.57;
      traces.push(
        buildTracePolyline([
          { x: cx, y: cyTop },
          { x: bendX, y: bendY },
          { x: ix, y: iy },
        ])
      );
    } else {
      traces.push(buildTracePolyline(buildHorizontalPcbPoints(cx, cyTop, ix, iy)));
    }
  }

  return traces;
}
