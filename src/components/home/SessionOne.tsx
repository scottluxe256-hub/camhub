import React from 'react';
import { motion } from 'framer-motion';
import IshaqMascot from './IshaqMascot';
import { DESKTOP_ROWS, S1_FEATURES } from '../../logics/S1/s1.data';
import { useSessionOne } from '../../logics/S1/useSessionOne';

const FeatureCircleIcon = React.forwardRef<
  HTMLDivElement,
  {
    icon: React.ReactNode;
    isBell?: boolean;
    size?: 'xs' | 'sm' | 'md';
    paused?: boolean;
  }
>(({ icon, isBell = false, size = 'md', paused = false }, ref) => {
  const dim =
    size === 'xs'
      ? 'h-9 w-9'
      : size === 'sm'
      ? 'h-10 w-10'
      : 'h-12 w-12 lg:h-14 lg:w-14';

  const playState = paused ? 'paused' : 'running';

  return (
    <div
      ref={ref}
      className={`relative flex shrink-0 items-center justify-center ${dim}`}
    >
      <span
        aria-hidden="true"
        style={{ animationPlayState: playState }}
        className="pointer-events-none absolute inset-0 rounded-full border-[1.5px] border-amber-400 animate-[iconRingPulse_4s_ease-out_infinite] will-change-transform"
      />

      <div
        style={{ animationPlayState: playState }}
        className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-orange-100 text-orange-600 animate-[iconCirclePop_4s_ease-out_infinite] will-change-transform"
      >
        <span
          aria-hidden="true"
          style={{ animationPlayState: playState }}
          className="pointer-events-none absolute inset-0 rounded-full border border-yellow-500/85 bg-amber-200 animate-[iconGoldOverlayFlash_4s_ease-out_infinite] will-change-opacity"
        />

        <div
          style={{ animationPlayState: playState }}
          className={
            isBell
              ? 'relative z-10 origin-top animate-[bellRingSwing_4s_ease-in-out_infinite] will-change-transform'
              : 'relative z-10 animate-[iconMicroShake_4s_ease-in-out_infinite] will-change-transform'
          }
        >
          {icon}
        </div>
      </div>
    </div>
  );
});

export default function SessionOne() {
  const {
    isDesktop,
    inView,
    mascotVisible,
    scrollDir,
    canvasRef,
    sectionRef,
    wrapRef,
    mascotRef,
    setIconRef,
  } = useSessionOne();

  const paused = !inView;

  return (
    <section
      ref={sectionRef}
      id="fitur"
      className="relative w-full overflow-x-clip bg-[#fafaf9]"
    >
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

        {!isDesktop ? (
          /* =========================================================
              1. TAMPILAN PORTRAIT (< md): 2 ATAS - 2 TENGAH - 2 BAWAH
             ========================================================= */
          <div
            ref={wrapRef}
            className="relative mx-auto mt-10 flex max-w-[440px] flex-col items-center"
          >
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            />

            {/* BARIS 1: 2 FITUR ATAS */}
            <div className="relative z-20 grid w-full grid-cols-2 gap-4 px-1">
              {S1_FEATURES.slice(0, 2).map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex flex-col items-center text-center"
                >
                  <FeatureCircleIcon
                    ref={setIconRef(idx)}
                    icon={feat.icon}
                    isBell={feat.isBell}
                    size="sm"
                    paused={paused}
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

            {/* BARIS 2 (TENGAH): FITUR KIRI - KARAKTER ISHAQ - FITUR KANAN */}
            <div className="relative z-10 mt-3 mb-2 flex w-full items-center justify-between gap-1">
              <motion.div
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative z-20 flex min-w-0 flex-1 flex-col items-center text-center"
              >
                <FeatureCircleIcon
                  ref={setIconRef(2)}
                  icon={S1_FEATURES[2].icon}
                  isBell={S1_FEATURES[2].isBell}
                  size="xs"
                  paused={paused}
                />
                <h3 className="mt-1.5 font-['Outfit',sans-serif] text-[11px] font-extrabold leading-tight text-[#1c1917]">
                  {S1_FEATURES[2].title}
                </h3>
                <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                  {S1_FEATURES[2].desc}
                </p>
              </motion.div>

              <div
                ref={mascotRef}
                className="pointer-events-none relative -mx-7 flex h-[405px] w-[228px] shrink-0 items-center justify-center sm:-mx-6 sm:h-[448px] sm:w-[252px]"
              >
                <motion.div
                  initial={false}
                  animate={{
                    opacity: mascotVisible ? 1 : 0,
                    y: mascotVisible ? 0 : scrollDir === 'down' ? 16 : -16,
                  }}
                  transition={{
                    duration: mascotVisible ? 0.55 : 0.25,
                    ease: 'easeOut',
                  }}
                  transformTemplate={(_, generated) =>
                    generated === 'none'
                      ? 'translate3d(0, 0, 0)'
                      : `${generated} translate3d(0, 0, 0)`
                  }
                  style={{ willChange: 'transform, opacity' }}
                  className="h-full w-full"
                >
                  <IshaqMascot className="relative top-[20px] z-20 h-full w-full sm:top-[24px]" />
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, x: 12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="relative z-20 flex min-w-0 flex-1 flex-col items-center text-center"
              >
                <FeatureCircleIcon
                  ref={setIconRef(3)}
                  icon={S1_FEATURES[3].icon}
                  isBell={S1_FEATURES[3].isBell}
                  size="xs"
                  paused={paused}
                />
                <h3 className="mt-1.5 font-['Outfit',sans-serif] text-[11px] font-extrabold leading-tight text-[#1c1917]">
                  {S1_FEATURES[3].title}
                </h3>
                <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                  {S1_FEATURES[3].desc}
                </p>
              </motion.div>
            </div>


            {/* BARIS 3: 2 FITUR BAWAH */}
            <div className="relative z-20 grid w-full grid-cols-2 gap-4 px-1">
              {S1_FEATURES.slice(4, 6).map((feat, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex flex-col items-center text-center"
                >
                  <FeatureCircleIcon
                    ref={setIconRef(4 + idx)}
                    icon={feat.icon}
                    isBell={feat.isBell}
                    size="sm"
                    paused={paused}
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
        ) : (
          /* =========================================================
              2. TAMPILAN LANDSCAPE / DESKTOP (md+): 3 BARIS SEJAJAR SIMETRIS
             ========================================================= */
          <div
            ref={wrapRef}
            className="relative mt-6 grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 gap-y-5 lg:gap-x-8 lg:gap-y-7"
          >
            <canvas
              ref={canvasRef}
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full"
            />

            {/* KARAKTER TENGAH */}
            <div
              ref={mascotRef}
              className="pointer-events-none relative z-10 col-start-2 row-span-3 row-start-1 -mx-6 flex h-[675px] w-[380px] shrink-0 items-end justify-center self-end lg:-mx-10 lg:h-[1000px] lg:w-[562px]"
            >
              <motion.div
                initial={false}
                animate={{
                  opacity: mascotVisible ? 1 : 0,
                  y: mascotVisible ? 0 : scrollDir === 'down' ? 18 : -18,
                }}
                transition={{
                  duration: mascotVisible ? 0.6 : 0.25,
                  ease: 'easeOut',
                }}
                transformTemplate={(_, generated) =>
                  generated === 'none'
                    ? 'translate3d(0, 0, 0)'
                    : `${generated} translate3d(0, 0, 0)`
                }
                style={{ willChange: 'transform, opacity' }}
                className="h-full w-full"
              >
                <IshaqMascot className="relative top-[15px] z-20 h-full w-full lg:top-[21px]" />
              </motion.div>
            </div>

            {/* 3 BARIS FITUR KIRI & KANAN */}
            {DESKTOP_ROWS.map(({ leftIdx, rightIdx }, rowIndex) => {
              const leftFeat = S1_FEATURES[leftIdx];
              const rightFeat = S1_FEATURES[rightIdx];
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
                      ref={setIconRef(leftIdx)}
                      icon={leftFeat.icon}
                      isBell={leftFeat.isBell}
                      size="md"
                      paused={paused}
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
                      ref={setIconRef(rightIdx)}
                      icon={rightFeat.icon}
                      isBell={rightFeat.isBell}
                      size="md"
                      paused={paused}
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
        )}
      </div>

      {/* BANNER BAWAH */}
      <div className="relative mt-8 w-full border-t border-stone-200 md:mt-0">
        <div className="relative h-auto w-full overflow-hidden bg-[#292524] py-16 sm:h-[400px] sm:py-0">
          <img
            src="/sessions1.avif"
            alt="Latar Ruang Server & Studio"
            loading="lazy"
            decoding="async"
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-100"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-stone-950/30"
          />

          <div className="relative mx-auto flex h-full max-w-7xl flex-col items-center justify-center gap-6 px-5 sm:flex-row sm:gap-8 sm:px-8">
            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              style={{ willChange: 'transform, opacity' }}
              className="relative flex w-full max-w-md flex-col justify-between overflow-hidden rounded-2xl border-t border-l border-white/40 border-r border-b border-white/15 bg-stone-950/30 bg-gradient-to-br from-white/[0.2] via-white/[0.08] to-white/[0.02] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(0,0,0,0.22),0_20px_40px_rgba(0,0,0,0.35)] sm:h-[220px]"
            >
              <div
                aria-hidden="true"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
                }}
                className="pointer-events-none absolute inset-0"
              />
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-wider text-orange-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                  Peruntukan
                </span>
                <h4 className="mt-1 font-['Outfit',sans-serif] text-xl font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
                  Khusus Internal Sekolah
                </h4>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                  Platform ini didedikasikan murni untuk siswa multimedia. Semua riwayat transaksi terikat dengan NIS dan terintegrasi untuk kebutuhan Ujikom, tugas praktik, atau dokumentasi OSIS.
                </p>
              </div>
              <div className="relative z-10 mt-5 w-fit rounded-full border border-white/25 bg-white/[0.08] px-5 py-2 text-[11px] font-bold text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                Data Terenkripsi
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.5, delay: 0.12, ease: 'easeOut' }}
              style={{ willChange: 'transform, opacity' }}
              className="relative flex w-full max-w-md flex-col justify-between overflow-hidden rounded-2xl border-t border-l border-white/40 border-r border-b border-white/15 bg-stone-950/30 bg-gradient-to-br from-white/[0.2] via-white/[0.08] to-white/[0.02] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(0,0,0,0.22),0_20px_40px_rgba(0,0,0,0.35)] sm:h-[220px]"
            >
              <div
                aria-hidden="true"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
                }}
                className="pointer-events-none absolute inset-0"
              />
              <div className="relative z-10">
                <span className="text-[10px] font-bold tracking-wider text-amber-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                  Transparansi
                </span>
                <h4 className="mt-1 font-['Outfit',sans-serif] text-xl font-extrabold text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.65)]">
                  Sinkronisasi & QC Terpadu
                </h4>
                <p className="mt-2 text-xs font-medium leading-relaxed text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]">
                  Web CamHub mengunci slot jadwal secara presisi untuk mencegah bentrok, namun serah-terima alat fisik wajib dibarengi Quality Control (cek sensor/baterai) bersama admin lab.
                </p>
              </div>
              <div className="relative z-10 mt-5 w-fit rounded-full border border-white/25 bg-white/[0.08] px-5 py-2 text-[11px] font-bold text-stone-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.35)]">
                Pencatatan Realtime
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
