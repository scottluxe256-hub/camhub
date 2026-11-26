import { useEffect, useRef, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface SplashScreenProps {
  onComplete: () => void;
  isRefresh?: boolean;
}

declare global {
  interface Window {
    __CAMHUB_BOOT_PROGRESS__?: number;
    __CAMHUB_REACT_READY__?: boolean;
    __CAMHUB_IS_REFRESH__?: boolean;
  }
}

export const SPLASH_SESSION_KEY = 'camhub_splash_seen';

function markSplashSeen() {
  try {
    sessionStorage.setItem(SPLASH_SESSION_KEY, '1');
  } catch {
    // Abaikan jika storage dibatasi browser
  }
}

export default function SplashScreen({ onComplete, isRefresh = false }: SplashScreenProps) {
  const [percent, setPercent] = useState<number>(() => window.__CAMHUB_BOOT_PROGRESS__ ?? 0);
  const [phase, setPhase] = useState<'counting' | 'implode' | 'logo' | 'glide' | 'done'>('counting');
  const [isRefreshClosing, setIsRefreshClosing] = useState(false);

  const isMountedRef = useRef(true);
  const hasStartedRef = useRef(false);
  const circleRef = useRef<HTMLDivElement>(null);

  const loaderGroupControls = useAnimationControls();
  const circleControls = useAnimationControls();
  const logoSpinControls = useAnimationControls();
  const brandTextControls = useAnimationControls();
  const backdropControls = useAnimationControls();

  // Hitung koordinat target eksak langsung dari elemen Navbar asli di DOM
  const getTargetMetrics = () => {
    const isDesktop = window.innerWidth >= 640;
    const initialOuterSize = isDesktop ? 120 : 108;
    const targetOuterSize = isDesktop ? 54 : 48;
    const targetTopOffset = isDesktop ? 16 : 14;

    const navEl = document.querySelector('[data-camhub-navbar-pill]');
    const splashEl = circleRef.current;

    if (navEl && splashEl) {
      const navRect = navEl.getBoundingClientRect();
      const splashRect = splashEl.getBoundingClientRect();

      const navCenterX = navRect.left + navRect.width / 2;
      const navCenterY = navRect.top + navRect.height / 2;
      const splashCenterX = splashRect.left + splashRect.width / 2;
      const splashCenterY = splashRect.top + splashRect.height / 2;

      return {
        isDesktop,
        targetScale: navRect.height / initialOuterSize,
        deltaX: navCenterX - splashCenterX,
        deltaY: navCenterY - splashCenterY,
      };
    }

    const targetCenterY = targetTopOffset + targetOuterSize / 2;
    const viewportCenterY = window.innerHeight / 2;

    return {
      isDesktop,
      targetScale: targetOuterSize / initialOuterSize,
      deltaX: 0,
      deltaY: targetCenterY - viewportCenterY,
    };
  };

  // Kunci scroll halaman selama splash penuh berjalan
  useEffect(() => {
    isMountedRef.current = true;
    if (isRefresh) {
      return () => {
        isMountedRef.current = false;
      };
    }

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      isMountedRef.current = false;
      document.body.style.overflow = prevOverflow;
    };
  }, [isRefresh]);

  // Mode Refresh: Hapus pre-boot HTML lalu tampilkan kapsul simpel "Memuat CamHub..." & pudar cepat
  useEffect(() => {
    if (!isRefresh) return;

    window.__CAMHUB_REACT_READY__ = true;
    const bootEl = document.getElementById('camhub-boot-loader');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (bootEl) bootEl.remove();
      });
    });

    const holdTimer = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setIsRefreshClosing(true);
    }, 260);

    const doneTimer = window.setTimeout(() => {
      if (!isMountedRef.current) return;
      setPhase('done');
      onComplete();
    }, 520);

    return () => {
      window.clearTimeout(holdTimer);
      window.clearTimeout(doneTimer);
    };
  }, [isRefresh, onComplete]);

  // Jalankan sequence penuh kunjungan pertama tanpa terputus perubahan state
  const runSequence = async () => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    const metrics = getTargetMetrics();

    // 1. Implosion (reverse elastic: Loading & 100% tersedot ke titik tengah)
    setPhase('implode');
    await loaderGroupControls.start({
      scale: 0,
      opacity: 0,
      transition: {
        duration: 0.24,
        ease: [0.6, -0.35, 0.735, 0.045],
      },
    });
    if (!isMountedRef.current) return;

    // 2. Pop-In Lingkaran CamHub (elastic spring)
    setPhase('logo');
    await circleControls.start({
      scale: 1,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 320,
        damping: 17,
        mass: 0.9,
      },
    });
    if (!isMountedRef.current) return;

    // 3. Munculkan tipografi CAM (hitam) & HUB (oranye) di bawah logo
    await brandTextControls.start({
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.36,
        ease: [0.22, 1, 0.36, 1],
      },
    });
    if (!isMountedRef.current) return;

    // Hold branding sebentar
    await new Promise((resolve) => window.setTimeout(resolve, 680));
    if (!isMountedRef.current) return;

    // 4A. Anticipation: mundur lembut sambil turun sedikit (+28px)
    setPhase('glide');

    brandTextControls.start({
      opacity: 0,
      y: -6,
      scale: 0.94,
      transition: { duration: 0.3, ease: [0.4, 0, 1, 1] },
    });

    logoSpinControls.start({
      rotate: -360,
      transition: {
        duration: 1.34,
        ease: [0.37, 0, 0.63, 1],
      },
    });

    // Pudarkan background putih secara bertahap saat logo mulai naik ke atas
    backdropControls.start({
      opacity: 0,
      transition: {
        duration: 0.58,
        delay: 0.45,
        ease: 'easeInOut',
      },
    });

    const midScale = 1 - (1 - metrics.targetScale) * 0.42;

    await circleControls.start({
      y: 28,
      scale: midScale,
      transition: {
        duration: 0.42,
        ease: [0.37, 0, 0.63, 1],
      },
    });
    if (!isMountedRef.current) return;

    // 4B. Smooth Launch: meluncur halus ke posisi atas Navbar
    await circleControls.start({
      x: metrics.deltaX,
      y: metrics.deltaY,
      scale: metrics.targetScale,
      transition: {
        duration: 0.92,
        ease: [0.25, 0.8, 0.25, 1],
      },
    });
    if (!isMountedRef.current) return;

    // Tandai sesi ini sudah melihat splash penuh agar refresh berikutnya pakai loader simpel
    markSplashSeen();
    document.body.style.overflow = '';
    setPhase('done');
    onComplete();
  };

  // Tahap 0 (Kunjungan Pertama): Handover presisi dari index.html & tuntaskan hitungan sampai 100%
  useEffect(() => {
    if (isRefresh) return;

    window.__CAMHUB_REACT_READY__ = true;
    const bootEl = document.getElementById('camhub-boot-loader');
    const startVal = window.__CAMHUB_BOOT_PROGRESS__ ?? 0;
    setPercent(startVal);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (bootEl) bootEl.remove();
      });
    });

    let current = startVal;
    const interval = window.setInterval(() => {
      current += current < 85 ? 8 : 5;
      if (current >= 100) {
        current = 100;
        setPercent(100);
        window.clearInterval(interval);
        runSequence();
      } else {
        setPercent(current);
      }
    }, 24);

    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRefresh]);

  if (phase === 'done') return null;

  // TAMPILAN SIMPEL SAAT REFRESH
  if (isRefresh) {
    return (
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 1 }}
        animate={{ opacity: isRefreshClosing ? 0 : 1 }}
        transition={{ duration: 0.24, ease: 'easeOut' }}
        className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-[#fafaf9]/88 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 1, opacity: 1 }}
          animate={{
            scale: isRefreshClosing ? 0.95 : 1,
            opacity: isRefreshClosing ? 0 : 1,
          }}
          transition={{ duration: 0.24, ease: 'easeOut' }}
          className="flex items-center gap-2.5 rounded-full border border-orange-500/20 bg-white px-5 py-2.5 shadow-[0_8px_24px_rgba(234,88,12,0.12),0_2px_8px_rgba(0,0,0,0.06)]"
        >
          <span className="h-[18px] w-[18px] animate-spin rounded-full border-[2.5px] border-orange-200 border-t-orange-600" />
          <span className="text-[13px] font-semibold tracking-[0.01em] text-[#1c1917]">
            Memuat CamHub...
          </span>
        </motion.div>
      </motion.div>
    );
  }

  // TAMPILAN SPLASH PENUH SAAT PERTAMA KALI BUKA WEBSITE
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
    >
      {/* BACKGROUND PUTIH SPLASH YANG MEMUDAR SAAT LOGO MELUNCUR KE ATAS */}
      <motion.div
        initial={{ opacity: 1 }}
        animate={backdropControls}
        className="absolute inset-0 bg-white"
      />

      {/* FASE 0: INDIKATOR LOADING KEDIP + PERSENTASE 0-100% (JARAK RAPAT 6PX) */}
      {(phase === 'counting' || phase === 'implode') && (
        <div className="absolute inset-0 z-10 flex items-center justify-center">
          <motion.div
            initial={{ scale: 1, opacity: 1 }}
            animate={loaderGroupControls}
            className="flex flex-col items-center justify-center gap-1.5 select-none"
          >
            <motion.span
              animate={{ opacity: [1, 0.15, 1] }}
              transition={{ duration: 0.52, repeat: Infinity, ease: 'easeInOut' }}
              className="text-[15px] leading-[20px] font-semibold tracking-[0.04em] text-black"
            >
              Loading
            </motion.span>
            <span className="text-[16px] leading-[22px] font-semibold tabular-nums text-black">
              {percent}%
            </span>
          </motion.div>
        </div>
      )}

    {/* FASE 1 - 2: KAPSUL LOGO CAMHUB (SIMETRIS PRESISI 4 SISI — ANGKA GENAP BULAT) */}
      <div className="fixed inset-0 z-20 flex items-center justify-center">
        <motion.div
          ref={circleRef}
          initial={{ scale: 0, opacity: 0, x: 0, y: 0 }}
          animate={circleControls}
          style={{ transformOrigin: 'center center' }}
          className="relative flex h-[108px] w-[108px] items-center justify-center rounded-full shadow-[0_8px_28px_rgba(234,88,12,0.18),0_2px_12px_rgba(0,0,0,0.12)] sm:h-[120px] sm:w-[120px]"
        >
          {/* LAPISAN KACA MATTE / DOFF TIPIS (SINKRON 1:1 DENGAN NAVBAR) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[2px] overflow-hidden rounded-full bg-white/[0.14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_1px_rgba(28,25,23,0.08)] backdrop-blur-[3.5px] backdrop-saturate-[135%]"
          >
            <div
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
              }}
              className="h-full w-full"
            />
          </div>

          {/* BORDER RING GRADIEN BERPUTAR MENEMPEL PERSIS DI TEPI LUAR (GENAP 4PX) */}
          <div
            style={{
              padding: '4px',
              WebkitMask:
                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
              style={{
                background:
                  'conic-gradient(from 0deg, #ea580c 0%, #f97316 18%, #ffffff 36%, #fed7aa 50%, #ea580c 68%, #fff7ed 86%, #ea580c 100%)',
              }}
              className="absolute left-1/2 top-1/2 aspect-square w-[260px] -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          {/* LINGKARAN DALAM PUTIH + LOGO CAMHUB (GENAP 80PX & 62PX) */}
          <div className="relative z-10 flex h-[80px] w-[80px] items-center justify-center rounded-full bg-white/75 shadow-2xs ring-1 ring-orange-500/25 sm:h-[88px] sm:w-[88px]">
            <motion.img
              src="/logo.webp"
              alt="Logo CamHub"
              initial={{ rotate: 0, scale: 1 }}
              animate={logoSpinControls}
              className="h-[62px] w-[62px] object-contain sm:h-[70px] sm:w-[70px]"
            />
          </div>
        </motion.div>
      </div>

      {/* TIPOGRAFI CAM (HITAM) & HUB (ORANYE) DI BAWAH LOGO */}
      <div className="absolute inset-0 z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={brandTextControls}
          className="mt-[165px] flex items-center gap-2 select-none sm:mt-[185px]"
        >
          <span className="text-2xl font-black tracking-wider text-black sm:text-3xl">
            CAM
          </span>
          <span className="text-2xl font-black tracking-wider text-[#ea580c] sm:text-3xl">
            HUB
          </span>
        </motion.div>
      </div>
    </div>
  );
}
