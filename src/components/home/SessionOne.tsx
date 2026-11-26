// @ts-nocheck
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import IshaqMascot from './IshaqMascot';

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

const FeatureCircleIcon = React.forwardRef<
  HTMLDivElement,
  {
    icon: React.ReactNode;
    isBell?: boolean;
    size?: 'xs' | 'sm' | 'md';
  }
>(({ icon, isBell = false, size = 'md' }, ref) => {
  const dim =
    size === 'xs'
      ? 'h-9 w-9'
      : size === 'sm'
      ? 'h-10 w-10'
      : 'h-12 w-12 lg:h-14 lg:w-14';

  return (
    <div
      ref={ref}
      className={`relative flex shrink-0 items-center justify-center ${dim}`}
    >
      {/* Cincin respon tajam tanpa blur (GPU transform-only) */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-full border-[1.5px] border-amber-400 animate-[iconRingPulse_4s_ease-out_infinite] will-change-transform"
      />
      {/* Wadah ikon bulat penuh */}
      <div className="relative z-10 flex h-full w-full items-center justify-center rounded-full border border-transparent bg-orange-100 text-orange-600 animate-[iconCircleGoldIgnite_4s_ease-out_infinite] will-change-transform">
        <div
          className={
            isBell
              ? 'origin-top animate-[bellRingSwing_4s_ease-in-out_infinite] will-change-transform'
              : 'animate-[iconMicroShake_4s_ease-in-out_infinite] will-change-transform'
          }
        >
          {icon}
        </div>
      </div>
    </div>
  );
});

function buildHorizontalPcbTrace(cx: number, cy: number, ix: number, iy: number): string {
  const dx = ix - cx;
  const dy = iy - cy;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const signX = dx >= 0 ? 1 : -1;

  const stem = Math.min(absX * 0.3, 72);
  if (stem + absY <= absX) {
    const diagEndX = cx + signX * (stem + absY);
    return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${(cx + signX * stem).toFixed(1)} ${cy.toFixed(1)} L ${diagEndX.toFixed(1)} ${iy.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
  }
  const diagX = absX * 0.42;
  const midX = cx + dx * 0.5;
  return `M ${cx.toFixed(1)} ${cy.toFixed(1)} L ${(midX - signX * diagX * 0.5).toFixed(1)} ${cy.toFixed(1)} L ${(midX + signX * diagX * 0.5).toFixed(1)} ${iy.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
}

function CircuitOverlaySvg({
  paths,
  gradPrefix,
}: {
  paths: string[];
  gradPrefix: string;
}) {
  if (!paths.length) return null;

  return (
    <svg
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
    >
      <defs>
        <linearGradient id={`${gradPrefix}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ca8a04" />
          <stop offset="45%" stopColor="#facc15" />
          <stop offset="85%" stopColor="#fef08a" />
          <stop offset="100%" stopColor="#ffffff" />
        </linearGradient>
      </defs>

      {/* 1. Jalur dasar sirkuit abu-abu batu */}
      <g
        stroke="#e7e5e4"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path key={`track-${i}`} d={d} />
        ))}
      </g>

      {/* 2. Pendaran emas lembut di tepi kabel (tanpa filter blur) */}
      <g
        stroke="#facc15"
        strokeWidth="5.5"
        strokeOpacity="0.24"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path
            key={`sheen-${i}`}
            d={d}
            pathLength={100}
            strokeDasharray="26 140"
            className="animate-[circuitGoldStream_4s_linear_infinite]"
          />
        ))}
      </g>

      {/* 3. Badan aliran emas berkilau */}
      <g
        stroke={`url(#${gradPrefix}-gold)`}
        strokeWidth="3.2"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path
            key={`gold-${i}`}
            d={d}
            pathLength={100}
            strokeDasharray="26 140"
            className="animate-[circuitGoldStream_4s_linear_infinite]"
          />
        ))}
      </g>

      {/* 4. Filamen inti putih-emas di tengah arus */}
      <g
        stroke="#fefce8"
        strokeWidth="1.25"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {paths.map((d, i) => (
          <path
            key={`spark-${i}`}
            d={d}
            pathLength={100}
            strokeDasharray="16 150"
            className="animate-[circuitGoldStream_4s_linear_infinite]"
          />
        ))}
      </g>
    </svg>
  );
}

export default function SessionOne() {
  const isDesktop = useIsDesktop();

  // Refs untuk mengukur titik punggung Ishaq & titik tengah tiap ikon
  const portraitWrapRef = useRef<HTMLDivElement | null>(null);
  const portraitMascotRef = useRef<HTMLDivElement | null>(null);
  const portraitIconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [portraitPaths, setPortraitPaths] = useState<string[]>([]);

  const desktopWrapRef = useRef<HTMLDivElement | null>(null);
  const desktopMascotRef = useRef<HTMLDivElement | null>(null);
  const desktopIconRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [desktopPaths, setDesktopPaths] = useState<string[]>([]);

  const recomputeTraces = useCallback(() => {
    // Ukur posisi layout asli tanpa terpengaruh animasi transform/scroll
    const getOffsetBox = (el: HTMLElement, container: HTMLElement) => {
      let x = 0;
      let y = 0;
      let curr: HTMLElement | null = el;
      while (curr && curr !== container) {
        x += curr.offsetLeft;
        y += curr.offsetTop;
        curr = curr.offsetParent as HTMLElement | null;
      }
      return { x, y, width: el.offsetWidth, height: el.offsetHeight };
    };

    // 1. Jalur Portrait
    if (portraitWrapRef.current && portraitMascotRef.current) {
      const wrap = portraitWrapRef.current;
      const mascotBox = getOffsetBox(portraitMascotRef.current, wrap);

      if (wrap.offsetWidth > 0 && mascotBox.width > 0) {
        const cx = mascotBox.x + mascotBox.width * 0.5;
        const cyUpper = mascotBox.y + mascotBox.height * 0.28;
        const cyMid = mascotBox.y + mascotBox.height * 0.28;
        const cyLower = mascotBox.y + mascotBox.height * 0.34;

        const nextPaths = portraitIconRefs.current
          .slice(0, 6)
          .map((el, idx) => {
            if (!el) return '';
            const box = getOffsetBox(el, wrap);
            const ix = box.x + box.width * 0.5;
            const iy = box.y + box.height * 0.5;

            // Jalur atas Portrait (0 & 1): miring dari punggung -> lurus vertikal 30px ke ikon
            if (idx <= 1) {
              const bendY = iy + 30;
              return `M ${cx.toFixed(1)} ${cyUpper.toFixed(1)} L ${ix.toFixed(1)} ${bendY.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
            }

            // Jalur bawah Portrait (4 & 5): miring dari punggung -> lurus vertikal 42px ke ikon bawah
            if (idx >= 4) {
              const bendY = iy - 42;
              return `M ${cx.toFixed(1)} ${cyLower.toFixed(1)} L ${ix.toFixed(1)} ${bendY.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
            }

            // Jalur tengah kiri & kanan Portrait (2 & 3)
            return buildHorizontalPcbTrace(cx, cyMid, ix, iy);
          })
          .filter(Boolean);

        if (nextPaths.length === 6) {
          setPortraitPaths(nextPaths);
        }
      }
    }

    // 2. Jalur Landscape / Desktop
    if (desktopWrapRef.current && desktopMascotRef.current) {
      const wrap = desktopWrapRef.current;
      const mascotBox = getOffsetBox(desktopMascotRef.current, wrap);

      if (wrap.offsetWidth > 0 && mascotBox.width > 0) {
        const cx = mascotBox.x + mascotBox.width * 0.5;
        const cyTop = mascotBox.y + mascotBox.height * 0.28;

        const nextPaths = desktopIconRefs.current
          .slice(0, 6)
          .map((el, idx) => {
            if (!el) return '';
            const box = getOffsetBox(el, wrap);
            const ix = box.x + box.width * 0.5;
            const iy = box.y + box.height * 0.5;

            // Jalur bawah Landscape (Sistem Slot Jam & Tiket Digital)
            if (idx === 2 || idx === 5) {
              const signX = ix >= cx ? 1 : -1;
              const bendX = cx + signX * (mascotBox.width * 0.32);
              const bendY = mascotBox.y + mascotBox.height * 0.57;
              return `M ${cx.toFixed(1)} ${cyTop.toFixed(1)} L ${bendX.toFixed(1)} ${bendY.toFixed(1)} L ${ix.toFixed(1)} ${iy.toFixed(1)}`;
            }

            return buildHorizontalPcbTrace(cx, cyTop, ix, iy);
          })
          .filter(Boolean);

        if (nextPaths.length === 6) {
          setDesktopPaths(nextPaths);
        }
      }
    }
  }, []);

  useEffect(() => {
    recomputeTraces();
    const rafId = requestAnimationFrame(recomputeTraces);
    const timerId = window.setTimeout(recomputeTraces, 250);

    const observer = new ResizeObserver(() => {
      recomputeTraces();
    });

    if (portraitWrapRef.current) observer.observe(portraitWrapRef.current);
    if (desktopWrapRef.current) observer.observe(desktopWrapRef.current);
    window.addEventListener('resize', recomputeTraces);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
      observer.disconnect();
      window.removeEventListener('resize', recomputeTraces);
    };
  }, [isDesktop, recomputeTraces]);

  const features = [
    {
      title: 'Bebas Antre Fisik',
      desc: 'Booking alat langsung dari HP. Datang ke lab hanya untuk verifikasi dan ambil alat.',
      isBell: false,
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="6" y="2.5" width="12" height="19" rx="2.5" strokeWidth={1.7} />
          <path strokeLinecap="round" strokeWidth={1.7} d="M11 18.5h2" />
          <line
            x1="8"
            y1="9"
            x2="16"
            y2="9"
            strokeWidth={1.8}
            strokeLinecap="round"
            className="animate-[phoneScanBeam_1.8s_ease-in-out_infinite] opacity-85"
          />
        </svg>
      ),
    },
    {
      title: 'Cek Live Ketersediaan',
      desc: 'Lihat status alat secara live, apakah sedang tersedia, dipinjam, atau dalam perawatan.',
      isBell: false,
      icon: (
        <div className="relative flex h-4.5 w-4.5 items-center justify-center md:h-5 md:w-5">
          <span className="absolute h-4 w-4 rounded-full border-[1.6px] border-current animate-[liveRadarWave_2s_ease-out_infinite]" />
          <svg className="relative z-10 h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <circle cx="12" cy="12" r="2.6" fill="currentColor" />
            <path
              strokeLinecap="round"
              strokeWidth={1.7}
              d="M7.5 16.5a6.4 6.4 0 010-9m9 0a6.4 6.4 0 010 9"
            />
          </svg>
        </div>
      ),
    },
    {
      title: 'Sistem Slot Jam',
      desc: 'Atur jadwal pinjam hingga 5 hari kerja ke depan dengan pilihan slot waktu yang presisi.',
      isBell: false,
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" strokeWidth={1.7} />
          <path strokeLinecap="round" strokeWidth={1.7} d="M8 2.5v3.5M16 2.5v3.5M3.5 9.5h17" />
          <circle cx="8.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="12" cy="13.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="8.5" cy="17" r="1" fill="currentColor" />
          <circle cx="12" cy="17" r="1" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'Denda Otomatis',
      desc: 'Sistem web otomatis mencatat waktu keterlambatan pengembalian untuk menjaga kedisiplinan.',
      isBell: false,
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="8.5" strokeWidth={1.7} />
          <circle cx="12" cy="5.5" r="0.7" fill="currentColor" />
          <g transform="translate(12 12)">
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-4.2"
              strokeWidth={1.9}
              strokeLinecap="round"
              className="animate-[clockHourToTwelve_4s_linear_infinite]"
            />
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="-6"
              strokeWidth={1.5}
              strokeLinecap="round"
              className="animate-[clockMinuteToTwelve_4s_linear_infinite]"
            />
          </g>
          <circle cx="12" cy="12" r="1.1" fill="currentColor" />
        </svg>
      ),
    },
    {
      title: 'Pengingat Jadwal Kembali',
      desc: 'Notifikasi otomatis menjelang batas waktu peminjaman berakhir agar alat kembali tepat waktu.',
      isBell: true,
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      ),
    },
    {
      title: 'Tiket & Riwayat Digital',
      desc: 'Bukti peminjaman dan riwayat transaksi tersimpan otomatis di akun tanpa formulir kertas.',
      isBell: false,
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.7}
            d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2.5a2 2 0 100 5V17a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.5a2 2 0 100-5V7z"
          />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.5 12l1.8 1.8 3.4-3.6" />
        </svg>
      ),
    },
  ];

  const desktopRows = [
    { leftIdx: 0, rightIdx: 3 },
    { leftIdx: 1, rightIdx: 4 },
    { leftIdx: 2, rightIdx: 5 },
  ];

  return (
    <section id="fitur" className="relative w-full overflow-x-clip bg-[#fafaf9]">
      <div className="mx-auto max-w-7xl px-3 pt-12 pb-14 sm:px-8 sm:pt-14 md:pb-0">
        <div className="mx-auto max-w-2xl text-center md:translate-y-3">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="font-['Outfit',sans-serif] text-3xl font-extrabold text-[#1c1917] sm:text-4xl"
          >
            Mekanisme Sistem CamHub
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-3 text-sm font-medium text-stone-500"
          >
            Aplikasi inventaris terintegrasi yang mendigitalkan{' '}
            <br className="hidden sm:block" />
            proses perizinan dan pendataan alat produksi di sekolah.
          </motion.p>
        </div>

        {/* =========================================================
            1. TAMPILAN PORTRAIT (< md): 2 ATAS - 2 TENGAH - 2 BAWAH
           ========================================================= */}
        <div
          ref={portraitWrapRef}
          className="relative mx-auto mt-10 flex max-w-[440px] flex-col items-center md:hidden"
        >
          <CircuitOverlaySvg paths={portraitPaths} gradPrefix="portrait" />

          {/* BARIS 1: 2 FITUR ATAS */}
          <div className="relative z-20 grid w-full grid-cols-2 gap-4 px-1">
            {features.slice(0, 2).map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: -12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <FeatureCircleIcon
                  ref={(el) => {
                    portraitIconRefs.current[idx] = el;
                  }}
                  icon={feat.icon}
                  isBell={feat.isBell}
                  size="sm"
                />
                <h3 className="mt-2 font-['Outfit',sans-serif] text-[12px] font-extrabold leading-tight text-[#1c1917]">
                  {feat.title}
                </h3>
                <p className="mt-1 text-[10px] font-medium leading-snug text-stone-500">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* BARIS 2 (TENGAH): FITUR KIRI - KARAKTER ISHAQ POLOS - FITUR KANAN */}
          <div className="relative z-10 my-2 flex w-full items-center justify-between gap-1">
            <motion.div
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative z-20 flex min-w-0 flex-1 flex-col items-center text-center"
            >
              <FeatureCircleIcon
                ref={(el) => {
                  portraitIconRefs.current[2] = el;
                }}
                icon={features[2].icon}
                isBell={features[2].isBell}
                size="xs"
              />
              <h3 className="mt-1.5 font-['Outfit',sans-serif] text-[11px] font-extrabold leading-tight text-[#1c1917]">
                {features[2].title}
              </h3>
              <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                {features[2].desc}
              </p>
            </motion.div>

            <motion.div
              ref={portraitMascotRef}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: false }}
              transition={{ duration: 0.5 }}
              className="pointer-events-none relative -mx-2 flex h-[312px] w-[176px] shrink-0 items-center justify-center"
            >
              {!isDesktop && <IshaqMascot className="relative z-20 h-full w-full" />}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative z-20 flex min-w-0 flex-1 flex-col items-center text-center"
            >
              <FeatureCircleIcon
                ref={(el) => {
                  portraitIconRefs.current[3] = el;
                }}
                icon={features[3].icon}
                isBell={features[3].isBell}
                size="xs"
              />
              <h3 className="mt-1.5 font-['Outfit',sans-serif] text-[11px] font-extrabold leading-tight text-[#1c1917]">
                {features[3].title}
              </h3>
              <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                {features[3].desc}
              </p>
            </motion.div>
          </div>

          {/* BARIS 3: 2 FITUR BAWAH */}
          <div className="relative z-20 grid w-full grid-cols-2 gap-4 px-1">
            {features.slice(4, 6).map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                className="flex flex-col items-center text-center"
              >
                <FeatureCircleIcon
                  ref={(el) => {
                    portraitIconRefs.current[4 + idx] = el;
                  }}
                  icon={feat.icon}
                  isBell={feat.isBell}
                  size="sm"
                />
                <h3 className="mt-2 font-['Outfit',sans-serif] text-[12px] font-extrabold leading-tight text-[#1c1917]">
                  {feat.title}
                </h3>
                <p className="mt-1 text-[10px] font-medium leading-snug text-stone-500">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* =========================================================
            2. TAMPILAN LANDSCAPE / DESKTOP (md+): 3 BARIS SEJAJAR SIMETRIS
           ========================================================= */}
        <div
          ref={desktopWrapRef}
          className="relative mt-6 hidden md:grid md:grid-cols-[1fr_auto_1fr] md:items-center md:gap-x-4 md:gap-y-5 lg:gap-x-8 lg:gap-y-7"
        >
          <CircuitOverlaySvg paths={desktopPaths} gradPrefix="desktop" />

          {/* KARAKTER TENGAH POLOS */}
          <motion.div
            ref={desktopMascotRef}
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: false }}
            transition={{ duration: 0.6 }}
            className="pointer-events-none relative z-10 col-start-2 row-span-3 row-start-1 flex h-[540px] w-[304px] shrink-0 items-end justify-center self-end lg:h-[780px] lg:w-[439px]"
          >
            {isDesktop && (
              <IshaqMascot className="relative top-[12px] z-20 h-full w-full lg:top-[16px]" />
            )}
          </motion.div>

          {/* 3 BARIS FITUR KIRI & KANAN */}
          {desktopRows.map(({ leftIdx, rightIdx }, rowIndex) => {
            const leftFeat = features[leftIdx];
            const rightFeat = features[rightIdx];
            const rowClass =
              rowIndex === 0
                ? 'row-start-1'
                : rowIndex === 1
                ? 'row-start-2'
                : 'row-start-3';

            return (
              <React.Fragment key={rowIndex}>
                {/* FITUR KIRI */}
                <motion.div
                  initial={{ opacity: 0, x: -24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: rowIndex * 0.1 }}
                  className={`relative z-20 col-start-1 ${rowClass} flex items-start justify-end gap-3.5 self-start lg:gap-4`}
                >
                  <div className="max-w-[245px] lg:max-w-[300px]">
                    <h3 className="text-right font-['Outfit',sans-serif] text-base font-extrabold text-[#1c1917] lg:text-xl">
                      {leftFeat.title}
                    </h3>
                    <p className="mt-1 text-right text-xs font-medium leading-relaxed text-stone-500 lg:mt-1.5 lg:text-sm">
                      {leftFeat.desc}
                    </p>
                  </div>
                  <FeatureCircleIcon
                    ref={(el) => {
                      desktopIconRefs.current[leftIdx] = el;
                    }}
                    icon={leftFeat.icon}
                    isBell={leftFeat.isBell}
                    size="md"
                  />
                </motion.div>

                {/* FITUR KANAN */}
                <motion.div
                  initial={{ opacity: 0, x: 24 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: rowIndex * 0.1 }}
                  className={`relative z-20 col-start-3 ${rowClass} flex items-start justify-start gap-3.5 self-start lg:gap-4`}
                >
                  <FeatureCircleIcon
                    ref={(el) => {
                      desktopIconRefs.current[rightIdx] = el;
                    }}
                    icon={rightFeat.icon}
                    isBell={rightFeat.isBell}
                    size="md"
                  />
                  <div className="max-w-[245px] lg:max-w-[300px]">
                    <h3 className="text-left font-['Outfit',sans-serif] text-base font-extrabold text-[#1c1917] lg:text-xl">
                      {rightFeat.title}
                    </h3>
                    <p className="mt-1 text-left text-xs font-medium leading-relaxed text-stone-500 lg:mt-1.5 lg:text-sm">
                      {rightFeat.desc}
                    </p>
                  </div>
                </motion.div>
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* BANNER BAWAH */}
      <div className="relative mt-8 w-full border-t border-stone-200 md:mt-0">
        <div className="relative h-auto w-full overflow-hidden bg-[#292524] py-16 sm:h-[400px] sm:py-0">
          <motion.img
            initial={{ scale: 1.1, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.6 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            src="/sessions1.avif"
            alt="Latar Ruang Server & Studio"
            className="absolute inset-0 h-full w-full object-cover sm:opacity-100"
          />

          <div className="absolute inset-0 bg-black/40 sm:bg-black/20" />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-6 px-5 sm:flex-row sm:gap-8 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="flex w-full max-w-md flex-col justify-between rounded-2xl border-t border-l border-white/30 border-b-white/10 border-r-white/10 bg-gradient-to-br from-white/10 to-white/0 p-6 shadow-xl backdrop-blur-sm sm:h-[220px]"
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider text-orange-400 uppercase">
                  Peruntukan
                </span>
                <h4 className="mt-1 font-['Outfit',sans-serif] text-xl font-extrabold text-white drop-shadow-md">
                  Khusus Internal Sekolah
                </h4>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-200 drop-shadow-sm">
                  Platform ini didedikasikan murni untuk siswa multimedia. Semua riwayat transaksi terikat dengan NIS dan terintegrasi untuk kebutuhan Ujikom, tugas praktik, atau dokumentasi OSIS.
                </p>
              </div>
              <div className="mt-5 w-fit rounded-full border border-white/20 bg-black/20 px-5 py-2 text-[11px] font-bold text-stone-300">
                Data Terenkripsi
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex w-full max-w-md flex-col justify-between rounded-2xl border-t border-l border-white/30 border-b-white/10 border-r-white/10 bg-gradient-to-br from-white/10 to-white/0 p-6 shadow-xl backdrop-blur-sm sm:h-[220px]"
            >
              <div>
                <span className="text-[10px] font-bold tracking-wider text-amber-400 uppercase drop-shadow-md">
                  Transparansi
                </span>
                <h4 className="mt-1 font-['Outfit',sans-serif] text-xl font-extrabold text-white drop-shadow-md">
                  Sinkronisasi & QC Terpadu
                </h4>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-200 drop-shadow-sm">
                  Web CamHub mengunci slot jadwal secara presisi untuk mencegah bentrok, namun serah-terima alat fisik wajib dibarengi Quality Control (cek sensor/baterai) bersama admin lab.
                </p>
              </div>
              <div className="mt-5 w-fit rounded-full border border-white/20 bg-black/20 px-5 py-2 text-[11px] font-bold text-stone-300">
                Pencatatan Realtime
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
