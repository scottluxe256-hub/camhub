import { useCallback, useEffect, useRef, useState } from 'react';

export function useMascotViewport() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(true);
  const [canvasReady, setCanvasReady] = useState(false);

  const [targetDpr, setTargetDpr] = useState(() => {
    if (typeof window === 'undefined') return 3.5;
    const isWide = window.innerWidth >= 768;
    return isWide ? 1.5 : 3.5;
  });

  useEffect(() => {
    const updateDpr = () => {
      const isWide = window.innerWidth >= 768;
      setTargetDpr(isWide ? 2.0 : 3.5);
    };
    window.addEventListener('resize', updateDpr);
    return () => window.removeEventListener('resize', updateDpr);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        setInView(visible);
        if (!visible) setCanvasReady(false);
      },
      {
        rootMargin: '900px 0px',
        threshold: 0,
      }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const markCanvasReady = useCallback(() => {
    setCanvasReady(true);
  }, []);

  return {
    containerRef,
    inView,
    canvasReady,
    targetDpr,
    markCanvasReady,
  };
}
