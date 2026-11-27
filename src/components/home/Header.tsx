import type { MouseEvent } from 'react';
import { motion, type Variants } from 'framer-motion';

const smoothEase = [0.22, 1, 0.36, 1] as const;
const expoOutEase = [0.16, 1, 0.3, 1] as const;

const eyebrowWords = ['Ruang', 'Kreativitas', 'Siswa'];
const titleLineOneWords = ['Abadikan', 'Setiap', 'Karya'];
const titleLineTwoWords = ['&', 'Momen', 'Terbaik', 'Sekolah'];
const descriptionWords =
  'Satu pintu untuk semua kebutuhan produksi visualmu. Pinjam kamera profesional, lensa pilihan, dan perlengkapan liputan sekolah kapan pun inspirasi datang.'.split(
    ' '
  );

// 1. Eyebrow: Muncul dari bawah + rotasi tipis per kata (sesuai referensi Alight Motion)
const eyebrowWordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    rotate: 4.5,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    rotate: 0,
    transition: {
      duration: 0.52,
      delay: 0.02 + i * 0.095,
      ease: smoothEase,
    },
  }),
};

// 2. Judul Baris 1: Masked reveal vertikal yang tegas per kata
const titleLineOneVariants: Variants = {
  hidden: {
    opacity: 0,
    y: '105%',
  },
  visible: (i: number) => ({
    opacity: 1,
    y: '0%',
    transition: {
      duration: 0.58,
      delay: 0.3 + i * 0.085,
      ease: expoOutEase,
    },
  }),
};

// 3. Judul Baris 2: Soft scale + lift per kata
const titleLineTwoVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
    scale: 0.9,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.56,
      delay: 0.56 + i * 0.08,
      ease: smoothEase,
    },
  }),
};

// 4. Deskripsi: Aliran halus rapat per kata agar tetap nyaman dibaca
const descriptionWordVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 9,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.46,
      delay: 0.88 + i * 0.032,
      ease: smoothEase,
    },
  }),
};

// 5. Tombol CTA: Masuk bergantian dari kiri
const ctaItemVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -16,
  },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.52,
      delay: 1.18 + i * 0.14,
      ease: smoothEase,
    },
  }),
};

// 6. Kartu Statistik Desktop: Muncul berurutan dari kiri ke kanan
const desktopStatVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 18,
  },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      delay: 1.42 + i * 0.085,
      ease: smoothEase,
    },
  }),
};

export default function Header() {
  const stats = [
    { topLabel: 'Unit Kamera', value: '12+', bottomLabel: 'Siap Pakai di Lab' },
    { topLabel: 'Peminjaman', value: '450+', bottomLabel: 'Sesi Karya Sukses' },
    { topLabel: 'Aksesoris', value: '24+', bottomLabel: 'Lensa & Rig Stabilizer' },
    { topLabel: 'Rating Alat', value: '4.9★', bottomLabel: 'Kondisi Sensor Bersih' },
  ];

  const scrollTo = (e: MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const headerOffset = 70;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.scrollY - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hero" className="relative overflow-x-clip bg-[#fafaf9] sm:bg-[#1c1917]">
      {/* BANNER FOTO HERO */}
      <div className="relative overflow-hidden bg-[#1c1917] sm:flex sm:min-h-[85vh] sm:flex-col sm:justify-between">
        {/* Foto statis tanpa animasi scale agar 60fps & LCP instan */}
        <img
          src="/hero.avif"
          alt="Latar Belakang Hero"
          loading="eager"
          fetchPriority="high"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right opacity-100 sm:object-center"
        />

        {/* Overlay gelap kiri-ke-kanan agar kontras teks tetap tajam */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1c1917]/95 via-[#1c1917]/80 to-[#1c1917]/45 sm:via-[#292524]/75 sm:to-transparent" />

        {/* Ambient glow oranye via radial-gradient murni (pengganti blur-[100px]) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full"
          style={{
            background:
              'radial-gradient(circle, rgba(249, 115, 22, 0.16) 0%, rgba(249, 115, 22, 0) 70%)',
          }}
        />

        {/* Tepian feather bawah tanpa blur untuk Portrait & Landscape */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-20 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/75 to-transparent sm:h-36"
        />

        {/* KONTEN TEKS UTAMA (Satu timeline sinkron per kata) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.15 }}
          className="relative z-10 mx-auto w-full max-w-7xl px-5 pt-8 pb-16 sm:px-8 sm:pt-10 sm:pb-0"
        >
          <div className="max-w-xl text-left">
            {/* Eyebrow */}
            <p className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400 sm:text-sm">
              {eyebrowWords.map((word, idx) => (
                <motion.span
                  key={`${word}-${idx}`}
                  custom={idx}
                  variants={eyebrowWordVariants}
                  className="mr-[0.42em] inline-block origin-bottom-left will-change-transform last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </p>

            {/* Judul Utama */}
            <h1 className="mt-2.5 font-['Outfit',sans-serif] text-3xl font-black leading-[1.18] tracking-tight sm:text-5xl sm:leading-[1.15]">
              {/* Baris 1 */}
              <span className="block text-white drop-shadow-md">
                {titleLineOneWords.map((word, idx) => (
                  <span
                    key={`${word}-${idx}`}
                    className="mr-[0.26em] -mb-[0.12em] inline-block overflow-hidden pb-[0.12em] align-bottom last:mr-0"
                  >
                    <motion.span
                      custom={idx}
                      variants={titleLineOneVariants}
                      className="inline-block will-change-transform"
                    >
                      {word}
                    </motion.span>
                  </span>
                ))}
              </span>

              {/* Baris 2 */}
              <span className="mt-1 block drop-shadow-sm">
                {titleLineTwoWords.map((word, idx) => (
                  <motion.span
                    key={`${word}-${idx}`}
                    custom={idx}
                    variants={titleLineTwoVariants}
                    className="mr-[0.26em] inline-block bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent will-change-transform last:mr-0"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </h1>

            {/* Deskripsi */}
            <p className="mt-4 max-w-md text-xs leading-relaxed font-medium text-stone-200 sm:text-sm">
              {descriptionWords.map((word, idx) => (
                <motion.span
                  key={`${word}-${idx}`}
                  custom={idx}
                  variants={descriptionWordVariants}
                  className="mr-[0.3em] inline-block will-change-transform last:mr-0"
                >
                  {word}
                </motion.span>
              ))}
            </p>

            {/* Tombol CTA */}
            <div className="mt-6 flex flex-wrap items-center gap-4 sm:mt-7">
              <motion.div custom={0} variants={ctaItemVariants}>
                <a
                  href="#katalog"
                  onClick={(e) => scrollTo(e, 'katalog')}
                  className="inline-block rounded-full bg-orange-600 px-6 py-2.5 text-xs font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:scale-105 hover:bg-orange-500 active:scale-95 sm:text-sm"
                >
                  Pinjam Sekarang
                </a>
              </motion.div>

              <motion.div custom={1} variants={ctaItemVariants}>
                <a
                  href="#fitur"
                  onClick={(e) => scrollTo(e, 'fitur')}
                  className="group flex items-center gap-2.5 text-xs font-extrabold text-white transition hover:text-amber-300 sm:text-sm"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600 shadow-md transition group-hover:scale-110">
                    <svg className="ml-0.5 h-3.5 w-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                  <span className="tracking-wide">Jelajahi Fitur</span>
                </a>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* 4 KOTAK STATISTIK - MODE LANDSCAPE / DESKTOP (Glass ringan tanpa backdrop-blur) */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: false, amount: 0.1 }}
          className="relative z-20 mx-auto mt-12 hidden w-full max-w-7xl grid-cols-4 gap-4 px-8 pb-16 sm:grid"
        >
          {stats.map((item, idx) => (
            <motion.div
              key={item.topLabel}
              custom={idx}
              variants={desktopStatVariants}
              className="flex flex-col items-center justify-center rounded-3xl border border-white/90 bg-gradient-to-b from-white/95 to-white/88 p-4.5 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_24px_-6px_rgba(28,25,23,0.14)] transition hover:-translate-y-1 hover:bg-white"
            >
              <span className="text-xs font-bold tracking-wide text-stone-500">
                {item.topLabel}
              </span>
              <span className="my-0.5 font-['Outfit',sans-serif] text-3xl font-black tracking-tight text-[#1c1917]">
                {item.value}
              </span>
              <span className="text-[11px] font-medium text-stone-600">
                {item.bottomLabel}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* 4 KOTAK STATISTIK - MODE PORTRAIT */}
      <div className="relative z-20 -mt-6 grid grid-cols-2 gap-3 px-5 pb-6 sm:hidden">
        {stats.map((item, idx) => (
          <motion.div
            key={item.topLabel}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{
              duration: 0.48,
              delay: 0.15 + idx * 0.08,
              ease: smoothEase,
            }}
            className="flex flex-col items-center justify-center rounded-2xl border border-stone-200/80 bg-white p-3.5 text-center shadow-md shadow-stone-200/60"
          >
            <span className="text-[10px] font-bold tracking-wide text-stone-500">
              {item.topLabel}
            </span>
            <span className="my-0.5 font-['Outfit',sans-serif] text-2xl font-black tracking-tight text-[#1c1917]">
              {item.value}
            </span>
            <span className="text-[10px] font-medium text-stone-600">
              {item.bottomLabel}
            </span>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
