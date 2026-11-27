import { useCallback, useEffect, useRef, useState } from 'react';
import { MARQUEE_SPEED_PX_PER_SEC, RESUME_DELAY_MS } from './katalog.config';

interface UseKatalogMarqueeParams {
  active: boolean;
  resetKey: string;
}

export function useKatalogMarquee({ active, resetKey }: UseKatalogMarqueeParams) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const primarySetRef = useRef<HTMLDivElement | null>(null);
  const cloneSetRef = useRef<HTMLDivElement | null>(null);

  const [inView, setInView] = useState(true);

  const isInteractingRef = useRef(false);
  const virtualOffsetRef = useRef(0);
  const loopWidthRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  // Batas mentok kiri-kanan (sebatas 1 set katalog asli) saat dipegang user
  const dragBoundsRef = useRef({ min: 0, max: 0 });
  const dragStartXRef = useRef(0);
  const dragStartYRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const gestureLockRef = useRef<'horizontal' | 'vertical' | null>(null);
  const isMouseDownRef = useRef(false);
  const hasDraggedRef = useRef(false);

  const applyTransform = useCallback((offset: number) => {
    if (trackRef.current) {
      trackRef.current.style.transform = `translate3d(${-offset}px, 0, 0)`;
    }
  }, []);

  const measureLoopWidth = useCallback(() => {
    const primary = primarySetRef.current;
    const clone = cloneSetRef.current;
    if (primary && clone) {
      const exactSpan = clone.offsetLeft - primary.offsetLeft;
      if (exactSpan > 0) {
        loopWidthRef.current = exactSpan;
        return exactSpan;
      }
    }

    const track = trackRef.current;
    if (track) {
      const fallback = track.scrollWidth / 2;
      loopWidthRef.current = fallback;
      return fallback;
    }

    return 0;
  }, []);

  // Pantau apakah section katalog sedang terlihat di layar
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '200px 0px', threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Ukur ulang lebar tepat 1 siklus loop setiap kali ukuran layar/kartu berubah
  useEffect(() => {
    if (!active) {
      loopWidthRef.current = 0;
      return;
    }

    measureLoopWidth();

    const track = trackRef.current;
    if (!track || typeof ResizeObserver === 'undefined') return;

    const resizeObserver = new ResizeObserver(() => {
      const prevLoop = loopWidthRef.current;
      const nextLoop = measureLoopWidth();
      if (nextLoop > 0 && prevLoop > 0 && virtualOffsetRef.current >= nextLoop) {
        virtualOffsetRef.current = virtualOffsetRef.current % nextLoop;
        applyTransform(virtualOffsetRef.current);
      }
    });

    resizeObserver.observe(track);
    return () => resizeObserver.disconnect();
  }, [active, resetKey, measureLoopWidth, applyTransform]);

  // Reset posisi ke awal kiri setiap kali kategori filter atau ukuran layar berubah
  useEffect(() => {
    virtualOffsetRef.current = 0;
    isInteractingRef.current = false;
    hasDraggedRef.current = false;
    applyTransform(0);
    measureLoopWidth();
  }, [resetKey, active, applyTransform, measureLoopWidth]);

  // Loop berjalan otomatis ke kiri via GPU translate3d (tanpa layout read di dalam rAF)
  useEffect(() => {
    if (!active || !inView) return;

    if (loopWidthRef.current <= 0) {
      measureLoopWidth();
    }

    let rafId = 0;
    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      if (!isInteractingRef.current) {
        const loopWidth = loopWidthRef.current || measureLoopWidth();
        if (loopWidth > 0) {
          virtualOffsetRef.current += MARQUEE_SPEED_PX_PER_SEC * dt;
          if (virtualOffsetRef.current >= loopWidth) {
            virtualOffsetRef.current -= loopWidth;
          }
          applyTransform(virtualOffsetRef.current);
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, [active, inView, applyTransform, measureLoopWidth]);

  // Hitung batas mentok kiri & kanan untuk 1 set katalog asli saat user mulai menyentuh
  const beginManualControl = useCallback(
    (clientX: number, clientY: number) => {
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }

      isInteractingRef.current = true;
      hasDraggedRef.current = false;
      gestureLockRef.current = null;
      dragStartXRef.current = clientX;
      dragStartYRef.current = clientY;

      const viewport = viewportRef.current;
      const loopWidth = loopWidthRef.current || measureLoopWidth();
      if (!viewport || loopWidth <= 0) return;

      const viewWidth = viewport.clientWidth;

      // Normalisasi posisi ke dalam 1 siklus [0, loopWidth) tanpa lompatan visual
      const normalized =
        ((virtualOffsetRef.current % loopWidth) + loopWidth) % loopWidth;
      virtualOffsetRef.current = normalized;
      applyTransform(normalized);

      const maxSpan = Math.max(0, loopWidth - viewWidth);
      if (normalized <= maxSpan) {
        dragBoundsRef.current = { min: 0, max: maxSpan };
      } else {
        dragBoundsRef.current = {
          min: Math.max(0, normalized - maxSpan),
          max: normalized,
        };
      }

      dragStartOffsetRef.current = normalized;
    },
    [applyTransform, measureLoopWidth]
  );

  const scheduleAutoResume = useCallback(() => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      isInteractingRef.current = false;
    }, RESUME_DELAY_MS);
  }, []);

  // Touch handlers (Mobile)
  const onTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      beginManualControl(touch.clientX, touch.clientY);
    },
    [beginManualControl]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      if (!isInteractingRef.current) return;
      const touch = e.touches[0];
      if (!touch) return;

      const dx = touch.clientX - dragStartXRef.current;
      const dy = touch.clientY - dragStartYRef.current;

      if (gestureLockRef.current === null) {
        if (Math.abs(dx) < 5 && Math.abs(dy) < 5) return;
        gestureLockRef.current =
          Math.abs(dx) >= Math.abs(dy) ? 'horizontal' : 'vertical';
      }

      if (gestureLockRef.current === 'vertical') return;

      hasDraggedRef.current = true;
      const { min, max } = dragBoundsRef.current;
      const next = Math.min(max, Math.max(min, dragStartOffsetRef.current - dx));
      virtualOffsetRef.current = next;
      applyTransform(next);
    },
    [applyTransform]
  );

  const onTouchEnd = useCallback(() => {
    gestureLockRef.current = null;
    scheduleAutoResume();
  }, [scheduleAutoResume]);

  // Mouse drag handlers (Desktop / Landscape)
  const onMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      isMouseDownRef.current = true;
      beginManualControl(e.clientX, e.clientY);
    },
    [beginManualControl]
  );

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isMouseDownRef.current) return;
      const dx = e.clientX - dragStartXRef.current;
      if (Math.abs(dx) > 6) {
        hasDraggedRef.current = true;
      }
      const { min, max } = dragBoundsRef.current;
      const next = Math.min(max, Math.max(min, dragStartOffsetRef.current - dx));
      virtualOffsetRef.current = next;
      applyTransform(next);
    },
    [applyTransform]
  );

  const onMouseUpOrLeave = useCallback(() => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;
    scheduleAutoResume();
  }, [scheduleAutoResume]);

  const consumeWasDragged = useCallback(() => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return true;
    }
    return false;
  }, []);

  return {
    sectionRef,
    viewportRef,
    trackRef,
    primarySetRef,
    cloneSetRef,
    consumeWasDragged,
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp: onMouseUpOrLeave,
      onMouseLeave: onMouseUpOrLeave,
    },
  };
}
