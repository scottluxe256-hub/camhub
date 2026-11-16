import { Mail, ShieldCheck, Camera, CheckCircle2, Zap } from 'lucide-react';
import { FaInstagram, FaTiktok, FaTelegram, FaWhatsapp } from 'react-icons/fa6';
import { motion } from 'framer-motion';

export default function Footer() {
  const highlights = [
    { icon: ShieldCheck, label: 'Verifikasi NIS Valid' },
    { icon: Camera, label: 'QC Sensor & Baterai' },
    { icon: CheckCircle2, label: 'Khusus Internal Sekolah' },
    { icon: Zap, label: 'Slot Booking 5 Hari' },
  ];

  return (
    <footer className="relative z-10 overflow-hidden border-t border-stone-800 font-['Outfit',sans-serif] text-white">
      {/* BACKGROUND GAMBAR */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.12, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.85 }}
          viewport={{ once: false, amount: 0.1 }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          src="/footer.avif"
          alt="Footer Background"
          className="h-full w-full object-cover brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10">
                {/* VALUE PROPOSITION BAR (4 BADGE SEJAJAR VERTIKAL & RATA TENGAH) */}
        <div className="border-b border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md">
          <div className="mx-auto grid w-fit max-w-4xl grid-cols-2 gap-x-6 gap-y-3 text-xs font-bold text-stone-200 sm:gap-x-10 md:w-full md:grid-cols-4">
            {highlights.map((item, idx) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: -12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="flex items-center justify-start gap-2 text-left md:justify-center"
                >
                  <Icon className="shrink-0 text-orange-500" size={16} />
                  <span className="text-[11px] sm:text-xs">{item.label}</span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* KONTEN UTAMA FOOTER (2 KOLOM DI PORTRAIT, 4 KOLOM DI DESKTOP) */}
        <div className="mx-auto max-w-7xl px-4 pt-12 pb-8 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.12 }}
            transition={{ duration: 0.55 }}
            className="rounded-[2rem] border border-white/20 bg-white/10 p-6 shadow-2xl backdrop-blur-sm sm:p-12"
          >
            <div className="mb-10 flex justify-center sm:mb-12">
              <div className="grid w-full max-w-5xl grid-cols-2 gap-x-5 gap-y-8 sm:gap-8 md:grid-cols-4">
                {/* KOLOM 1: IDENTITAS LAB */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: 0.05 }}
                  className="space-y-2.5 sm:space-y-3"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black tracking-tight text-white sm:text-base">
                      Cam<span className="text-orange-500">Hub</span> Studio
                    </span>
                  </div>
                  <p className="text-[11px] font-normal leading-relaxed text-stone-300 sm:text-xs">
                    Sistem informasi reservasi peralatan laboratorium multimedia. Dikelola terpusat untuk kelancaran tugas praktik, dokumentasi kegiatan, dan proyek Ujikom.
                  </p>
                  <p className="text-[10.5px] font-semibold text-orange-400 sm:text-[11px]">
                    Lokasi: Ruang Studio Multimedia Lt. 2
                  </p>
                </motion.div>

                {/* KOLOM 2: FOKUS LAYANAN */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: 0.12 }}
                  className="space-y-2.5 sm:space-y-3"
                >
                  <h3 className="text-[11px] font-black tracking-wider text-orange-400 uppercase sm:text-xs">
                    Fokus Layanan
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-200 sm:text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">▹</span>
                      <span>Manajemen Inventaris Alat</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">▹</span>
                      <span>Reservasi & Booking Slot</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">▹</span>
                      <span>Edukasi Perawatan Gear</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">▹</span>
                      <span>Penerimaan Aspirasi Siswa</span>
                    </li>
                  </ul>
                </motion.div>

                {/* KOLOM 3: KETENTUAN LAB */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: 0.18 }}
                  className="space-y-2.5 sm:space-y-3"
                >
                  <h3 className="text-[11px] font-black tracking-wider text-orange-400 uppercase sm:text-xs">
                    Ketentuan Lab
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-200 sm:text-xs">
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">•</span>
                      <span>Wajib membawa Kartu Pelajar asli</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">•</span>
                      <span>Pengecekan fisik (QC) alat di lab</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">•</span>
                      <span>Format memori wajib di dalam kamera</span>
                    </li>
                    <li className="flex items-start gap-1.5">
                      <span className="text-orange-500">•</span>
                      <span>Denda keterlambatan berlaku otomatis</span>
                    </li>
                  </ul>
                </motion.div>

                {/* KOLOM 4: JAM OPERASIONAL STUDIO */}
                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.15 }}
                  transition={{ duration: 0.45, delay: 0.24 }}
                  className="space-y-2.5 sm:space-y-3"
                >
                  <h3 className="text-[11px] font-black tracking-wider text-orange-400 uppercase sm:text-xs">
                    Jam Operasional
                  </h3>
                  <ul className="space-y-2 text-[11px] font-medium text-stone-200 sm:space-y-2.5 sm:text-xs">
                    <li className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                      <span>Senin – Jumat</span>
                      <span className="font-bold text-white">08.00 – 15.00</span>
                    </li>
                    <li className="flex items-center justify-between gap-2 border-b border-white/10 pb-1.5">
                      <span>Istirahat Siang</span>
                      <span className="font-bold text-stone-400">12.00 – 13.00</span>
                    </li>
                    <li className="flex items-center justify-between gap-2">
                      <span>Sabtu – Minggu</span>
                      <span className="font-bold text-orange-400">Libur / Tutup</span>
                    </li>
                  </ul>
                </motion.div>
              </div>
            </div>

            {/* BAR BAWAH: LEGAL & SOCIAL */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="flex flex-col items-center justify-between gap-5 border-t border-white/15 pt-6 text-[11px] font-medium text-stone-300 md:flex-row"
            >
              <div className="flex flex-1 justify-center gap-3 md:justify-start">
                <span>CamHub Studio V.1.0</span>
                <span className="text-stone-600">|</span>
                <span>Sistem Terpusat Studio</span>
              </div>

              <div className="flex flex-1 justify-center text-center">
                <p>
                  © {new Date().getFullYear()} <span className="font-bold text-white">CamHub</span>. Proyek Ujikom oleh <span className="font-bold text-orange-400">Ishaq Nirwasita</span>.
                </p>
              </div>

              <div className="flex flex-1 items-center justify-center space-x-5 text-stone-300 md:justify-end">
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
