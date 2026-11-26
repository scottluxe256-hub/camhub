import { type RefObject, useEffect, useRef } from 'react';
import { type TracePolyline, extractSubPolyline } from './s1.traces';

const CYCLE_MS = 4000;
const PULSE_LENGTH = 0.22;

function strokePolyline(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[]
) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
}

function syncCssTimeline(container: HTMLElement | null, elapsedMs: number) {
  if (!container || typeof container.getAnimations !== 'function') return;
  const animations = container.getAnimations({ subtree: true });
  for (let i = 0; i < animations.length; i++) {
    const anim = animations[i];
    const duration = anim.effect?.getTiming().duration;
    if (duration === CYCLE_MS) {
      anim.currentTime = elapsedMs;
    }
  }
}

export function useCircuitCanvas(
  traces: TracePolyline[] | null,
  active: boolean,
  syncContainerRef?: RefObject<HTMLElement | null>
) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const elapsedMsRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !traces || traces.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const syncCanvasSize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = Math.max(1, Math.round(parent.offsetWidth));
      const h = Math.max(1, Math.round(parent.offsetHeight));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    };

    const drawStaticTracks = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = '#e7e5e4';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      for (let i = 0; i < traces.length; i++) {
        strokePolyline(ctx, traces[i].points);
      }
      ctx.restore();
    };

    syncCanvasSize();
    drawStaticTracks();

    if (!active) return;

    syncCssTimeline(syncContainerRef?.current ?? null, elapsedMsRef.current);

    let rafId = 0;
    let lastTime = performance.now();
    let warmupFrames = 2;

    const renderFrame = (now: number) => {
      const dtMs = Math.max(0, now - lastTime);
      lastTime = now;
      elapsedMsRef.current = (elapsedMsRef.current + dtMs) % CYCLE_MS;

      if (warmupFrames > 0) {
        warmupFrames -= 1;
        syncCssTimeline(syncContainerRef?.current ?? null, elapsedMsRef.current);
      }

      syncCanvasSize();
      drawStaticTracks();

      const phase = elapsedMsRef.current / CYCLE_MS;

      // Cahaya melesat 5% -> 65% (tiba di ikon & jam pas 12:00 di 65%), ekor habis masuk di 78%
      if (phase >= 0.05 && phase <= 0.78) {
        const headFrac = (phase - 0.05) / (0.65 - 0.05);
        const tailFrac = headFrac - PULSE_LENGTH;
        const fadeIn = Math.min(1, headFrac / 0.12);

        ctx.save();
        ctx.globalAlpha = fadeIn;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        for (let i = 0; i < traces.length; i++) {
          const seg = extractSubPolyline(traces[i], tailFrac, headFrac);
          if (!seg) continue;

          const grad = ctx.createLinearGradient(
            seg.tail.x,
            seg.tail.y,
            seg.head.x,
            seg.head.y
          );
          grad.addColorStop(0.0, 'rgba(250, 204, 21, 0)');
          grad.addColorStop(0.35, 'rgba(250, 204, 21, 0.78)');
          grad.addColorStop(0.55, '#facc15');
          grad.addColorStop(0.72, '#ffffff');
          grad.addColorStop(0.88, '#fde047');
          grad.addColorStop(1.0, 'rgba(254, 240, 138, 0.25)');

          ctx.strokeStyle = grad;
          strokePolyline(ctx, seg.points);
        }

        ctx.restore();
      }

      rafId = requestAnimationFrame(renderFrame);
    };

    rafId = requestAnimationFrame(renderFrame);

    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [traces, active, syncContainerRef]);

  return canvasRef;
}
