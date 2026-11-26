import { useCallback, useEffect, useRef, useState } from 'react';
import {
  type TracePolyline,
  computeDesktopTraces,
  computePortraitTraces,
} from './s1.traces';
import { useCircuitCanvas } from './useCircuitCanvas';

function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    setIsDesktop(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return isDesktop;
}

export function useSessionOne() {
  const isDesktop = useIsDesktop();
  const [inView, setInView] = useState(true);
  const [mascotVisible, setMascotVisible] = useState(false);
  const [scrollDir, setScrollDir] = useState<'down' | 'up'>('down');
  const [traces, setTraces] = useState<TracePolyline[] | null>(null);

  const sectionRef = useRef<HTMLElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const mascotRef = useRef<HTMLDivElement | null>(null);
  const iconRefs = useRef<(HTMLDivElement | null)[]>([]);

  const canvasRef = useCircuitCanvas(traces, inView, wrapRef);

  const recomputeTraces = useCallback(() => {
    const wrap = wrapRef.current;
    const mascot = mascotRef.current;
    if (!wrap || !mascot) return;

    const next = isDesktop
      ? computeDesktopTraces(wrap, mascot, iconRefs.current)
      : computePortraitTraces(wrap, mascot, iconRefs.current);

    if (next) {
      setTraces(next);
    }
  }, [isDesktop]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: '250px 0px', threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

    useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      if (Math.abs(currentY - lastY) < 2) return;
      const nextDir = currentY > lastY ? 'down' : 'up';
      lastY = currentY;
      setScrollDir((prev) => (prev === nextDir ? prev : nextDir));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot) return;

    const observer = new IntersectionObserver(
      ([entry]) => setMascotVisible(entry.isIntersecting),
      { threshold: 0.08 }
    );
    observer.observe(mascot);
    return () => observer.disconnect();
  }, [isDesktop]);

  useEffect(() => {
    recomputeTraces();
    const rafId = requestAnimationFrame(recomputeTraces);
    const timerId = window.setTimeout(recomputeTraces, 250);

    const observer = new ResizeObserver(() => {
      recomputeTraces();
    });

    if (wrapRef.current) observer.observe(wrapRef.current);
    window.addEventListener('resize', recomputeTraces);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      observer.disconnect();
      window.removeEventListener('resize', recomputeTraces);
    };
  }, [recomputeTraces]);

  const setIconRef = useCallback((idx: number) => {
    return (el: HTMLDivElement | null) => {
      iconRefs.current[idx] = el;
    };
  }, []);

  return {
    isDesktop,
    inView,
    mascotVisible,
    scrollDir,
    canvasRef,
    sectionRef,
    wrapRef,
    mascotRef,
    setIconRef,
  };
}
