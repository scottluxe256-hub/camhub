import { motion } from 'framer-motion';

export default function Header() {
  const stats = [
    { topLabel: 'Unit Kamera', value: '12+', bottomLabel: 'Siap Pakai di Lab' },
    { topLabel: 'Peminjaman', value: '450+', bottomLabel: 'Sesi Karya Sukses' },
    { topLabel: 'Aksesoris', value: '24+', bottomLabel: 'Lensa & Rig Stabilizer' },
    { topLabel: 'Rating Alat', value: '4.9★', bottomLabel: 'Kondisi Sensor Bersih' },
  ];

  const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      const headerOffset = 70;
      const elementPosition = target.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <section id="hero" className="relative overflow-hidden bg-[#1c1917]">
      <motion.img
        initial={{ scale: 1.15, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        src="/hero.avif"
        alt="Latar Belakang Hero"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover object-right-bottom sm:object-center"
      />

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#1c1917]/95 via-[#292524]/75 to-transparent" />
      <div className="pointer-events-none absolute -top-20 -left-20 h-80 w-80 rounded-full bg-orange-500/15 blur-[100px]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-24 sm:h-32 bg-gradient-to-t from-[#fafaf9] via-[#fafaf9]/70 to-transparent backdrop-blur-[3px]" />

      <div className="relative mx-auto flex min-h-[85vh] max-w-7xl flex-col justify-between px-5 pt-6 pb-12 sm:px-8 sm:pt-10 sm:pb-16">
        
        <div className="max-w-xl text-left">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-bold tracking-[0.2em] uppercase text-amber-400 sm:text-sm"
          >
            Ruang Kreativitas Multimedia
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-2.5 font-['Outfit',sans-serif] text-3xl font-black leading-[1.18] tracking-tight sm:text-5xl sm:leading-[1.15]"
          >
            <span className="block text-white drop-shadow-md">Abadikan Setiap Karya</span>
            <span className="mt-1 block bg-gradient-to-r from-amber-300 via-orange-400 to-amber-200 bg-clip-text text-transparent drop-shadow-sm">
              & Momen Terbaik Sekolah
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mt-4 max-w-md text-xs leading-relaxed font-medium text-stone-200 sm:text-sm"
          >
            Satu pintu untuk semua kebutuhan produksi visualmu. Pinjam kamera profesional, lensa pilihan, dan perlengkapan liputan sekolah kapan pun inspirasi datang.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 flex flex-wrap items-center gap-4 sm:mt-7"
          >
            <a
              href="#katalog"
              onClick={(e) => scrollTo(e, 'katalog')}
              className="rounded-full bg-orange-600 px-6 py-2.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 hover:scale-105 active:scale-95"
            >
              Pinjam Sekarang
            </a>

            <a
              href="#fitur"
              onClick={(e) => scrollTo(e, 'fitur')}
              className="group flex items-center gap-2.5 text-xs sm:text-sm font-extrabold text-white transition hover:text-amber-300"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-orange-600 shadow-md transition group-hover:scale-110">
                <svg className="h-3.5 w-3.5 ml-0.5 fill-current" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
              <span className="tracking-wide">Jelajahi Fitur</span>
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.4 }}
          className="relative z-20 mt-10 grid grid-cols-2 gap-3 sm:mt-12 sm:grid-cols-4 sm:gap-4"
        >
          {stats.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-center justify-center rounded-2xl border border-white/80 bg-white/90 p-3.5 text-center shadow-lg shadow-stone-900/10 backdrop-blur-md transition hover:-translate-y-1 hover:bg-white sm:rounded-3xl sm:p-4.5"
            >
              <span className="text-[10px] font-bold tracking-wide text-stone-500 sm:text-xs">
                {item.topLabel}
              </span>
              <span className="my-0.5 font-['Outfit',sans-serif] text-2xl font-black tracking-tight text-[#1c1917] sm:text-3xl">
                {item.value}
              </span>
              <span className="text-[10px] font-medium text-stone-600 sm:text-[11px]">
                {item.bottomLabel}
              </span>
            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
