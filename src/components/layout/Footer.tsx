import { Mail, ShieldCheck, Camera, CheckCircle2, Zap } from 'lucide-react';
import { FaInstagram, FaTiktok, FaTelegram, FaWhatsapp } from 'react-icons/fa6';
import { motion, type Variants } from 'framer-motion';

const HIGHLIGHTS = [
  { icon: ShieldCheck, label: 'Verifikasi NIS Valid' },
  { icon: Camera, label: 'QC Sensor & Baterai' },
  { icon: CheckCircle2, label: 'Khusus Internal Sekolah' },
  { icon: Zap, label: 'Slot Booking 5 Hari' },
] as const;

const GLASS_GRAIN_BG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`;

const barContainerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const barItemVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

const cardContainerVariants: Variants = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: 'easeOut',
      staggerChildren: 0.07,
      delayChildren: 0.05,
    },
  },
};

const columnItemVariants: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export default function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-stone-800 bg-stone-950 font-['Outfit',sans-serif] text-white">
      {/* BACKGROUND GAMBAR 100% OPACITY (0 SCALE & 0 BACKDROP-BLUR AGAR 60FPS) */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0">
        <img
          src="/footer.avif"
          alt=""
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover opacity-100"
        />
        {/* Vignette ringan agar foto tetap jelas tembus di balik kaca namun teks tetap terbaca */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/45 via-stone-950/35 to-stone-950/60" />
      </div>

      <div className="relative z-10">
        {/* VALUE PROPOSITION BAR (GLASS STRIP TANPA BLUR) */}
        <div className="border-b border-white/20 bg-stone-950/45 bg-gradient-to-r from-white/[0.1] via-white/[0.04] to-white/[0.1] px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
          <motion.div
            variants={barContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.15 }}
            className="mx-auto grid w-fit max-w-4xl grid-cols-2 gap-x-6 gap-y-3 text-xs font-bold text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)] sm:gap-x-10 md:w-full md:grid-cols-4"
          >
            {HIGHLIGHTS.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  variants={barItemVariants}
                  className="flex items-center justify-start gap-2 text-left md:justify-center"
                >
                  <Icon className="shrink-0 text-orange-400" size={16} />
                  <span className="text-[11px] sm:text-xs">{item.label}</span>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* KONTEN UTAMA FOOTER (GLASSMORPHISM ALA NAVBAR TANPA BLUR) */}
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
          <motion.div
            variants={cardContainerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: false, amount: 0.1 }}
            style={{ willChange: 'transform, opacity' }}
            className="relative overflow-hidden rounded-[2rem] border-t border-l border-white/40 border-r border-b border-white/15 bg-stone-950/35 bg-gradient-to-br from-white/[0.18] via-white/[0.08] to-white/[0.03] p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.6),inset_0_-1px_1px_rgba(0,0,0,0.25),0_20px_45px_rgba(0,0,0,0.4)] sm:p-12"
          >
            {/* Tekstur micro-grain etched matte statis ala Navbar */}
            <div
              aria-hidden="true"
              style={{ backgroundImage: GLASS_GRAIN_BG }}
              className="pointer-events-none absolute inset-0"
            />

            <div className="relative z-10 mb-10 flex justify-center sm:mb-12">
              <div className="grid w-full max-w-5xl grid-cols-2 gap-x-5 gap-y-8 sm:gap-8 md:grid-cols-4">
                {/* KOLOM 1: IDENTITAS LAB */}
                <motion.div variants={columnItemVariants} className="space-y-2.5 sm:space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-tight text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-base">
                      Cam<span className="text-orange-400">Hub</span> Studio
                    </span>
                  </div>
                  <p className="text-[11px] font-normal leading-relaxed text-stone-100/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    Sistem informasi reservasi peralatan laboratorium multimedia. Dikelola terpusat untuk kelancaran tugas praktik, dokumentasi kegiatan, dan proyek Ujikom.
                  </p>
                  <p className="text-[10.5px] font-semibold text-orange-300 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-[11px]">
                    Lokasi: Ruang Studio Multimedia Lt. 2
                  </p>
                </motion.div>

                {/* KOLOM 2: FOKUS LAYANAN */}
                <motion.div variants={columnItemVariants} className="space-y-2.5 sm:space-y-3">
                  <h3 className="text-[11px] font-black tracking-wider text-orange-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    Fokus Layanan
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">▹</span>
                      <span>Manajemen Inventaris Alat</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">▹</span>
                      <span>Reservasi & Booking Slot</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">▹</span>
                      <span>Edukasi Perawatan Gear</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">▹</span>
                      <span>Penerimaan Aspirasi Siswa</span>
                    </li>
                  </ul>
                </motion.div>

                {/* KOLOM 3: KETENTUAN LAB */}
                <motion.div variants={columnItemVariants} className="space-y-2.5 sm:space-y-3">
                  <h3 className="text-[11px] font-black tracking-wider text-orange-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    Ketentuan Lab
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">•</span>
                      <span>Wajib membawa Kartu Pelajar asli</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">•</span>
                      <span>Pengecekan fisik (QC) alat di lab</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">•</span>
                      <span>Format memori wajib di dalam kamera</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-400">•</span>
                      <span>Denda keterlambatan berlaku otomatis</span>
                    </li>
                  </ul>
                </motion.div>

                {/* KOLOM 4: JAM OPERASIONAL STUDIO */}
                <motion.div variants={columnItemVariants} className="space-y-2.5 sm:space-y-3">
                  <h3 className="text-[11px] font-black tracking-wider text-orange-300 uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:text-xs">
                    Jam Operasional
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-100 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] sm:space-y-2.5 sm:text-xs">
                    <li className="flex items-center justify-between gap-2 border-b border-white/15 pb-1.5">
                      <span>Senin – Jumat</span>
                      <span className="font-bold text-white">08.00 – 15.00</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 border-b border-white/15 pb-1.5">
                      <span>Istirahat Siang</span>
                      <span className="font-bold text-stone-300">12.00 – 13.00</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span>Sabtu – Minggu</span>
                      <span className="font-bold text-orange-300">Libur / Tutup</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>

            {/* BAR BAWAH: LEGAL & SOCIAL */}
            <motion.div
              variants={columnItemVariants}
              className="relative z-10 flex flex-col items-center justify-between gap-5 border-t border-white/20 pt-6 text-[11px] font-medium text-stone-200 drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)] md:flex-row"
            >
              <div className="flex flex-1 justify-center gap-3 md:justify-start">
                <span>CamHub Studio V.1.0</span>
                <span className="text-white/30">|</span>
                <span>Sistem Terpusat Studio</span>
              </div>

              <div className="flex flex-1 justify-center text-center">
                <p>
                  © {new Date().getFullYear()} <span className="font-bold text-white">CamHub</span>. Proyek Ujikom oleh <span className="font-bold text-orange-300">Ishaq Nirwasita</span>.
                </p>
              </div>

              <div className="flex flex-1 items-center justify-center space-x-5 text-stone-200 md:justify-end">
                <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-orange-400" aria-label="Instagram">
                  <FaInstagram size={17} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-orange-400" aria-label="TikTok">
                  <FaTiktok size={16} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-orange-400" aria-label="WhatsApp">
                  <FaWhatsapp size={17} />
                </a>
                <a href="#" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-orange-400" aria-label="Telegram">
                  <FaTelegram size={17} />
                </a>
                <a href="#" className="transition-colors hover:text-orange-400" aria-label="Email Studio">
                  <Mail size={17} />
                </a>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
