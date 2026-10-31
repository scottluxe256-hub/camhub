import { Mail, ShieldCheck, Camera, CheckCircle2, Zap } from 'lucide-react';
import { FaInstagram, FaTiktok, FaTelegram, FaWhatsapp } from 'react-icons/fa6';
import { motion } from 'framer-motion';

export default function Footer() {
  return (
    <footer className="relative z-10 overflow-hidden border-t border-stone-800 text-white font-['Outfit',sans-serif]">

      {/* BACKGROUND GAMBAR */}
      <div className="absolute inset-0 z-0">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.85 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src="/footer.avif"
          alt="Footer Background"
          className="h-full w-full object-cover brightness-90 contrast-110"
        />
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-[2px]" />
      </div>

      <div className="relative z-10">

        {/* VALUE PROPOSITION BAR */}
        <div className="border-b border-white/10 bg-black/40 px-4 py-4 backdrop-blur-md">
          <div className="flex justify-center">
            <div className="grid w-full max-w-4xl grid-cols-2 gap-4 text-xs font-bold text-stone-200 sm:gap-8 md:grid-cols-4">
              <div className="flex items-center justify-start gap-2.5">
                <ShieldCheck className="shrink-0 text-orange-500" size={17} />
                <span className="text-[11px] sm:text-xs">Verifikasi NIS Valid</span>
              </div>
              <div className="flex items-center justify-start gap-2.5">
                <Camera className="shrink-0 text-orange-500" size={17} />
                <span className="text-[11px] sm:text-xs">QC Sensor & Baterai</span>
              </div>
              <div className="flex items-center justify-start gap-2.5">
                <CheckCircle2 className="shrink-0 text-orange-500" size={17} />
                <span className="text-[11px] sm:text-xs">Khusus Internal Sekolah</span>
              </div>
              <div className="flex items-center justify-start gap-2.5">
                <Zap className="shrink-0 text-orange-500" size={17} />
                <span className="text-[11px] sm:text-xs">Slot Booking 7 Hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* KONTEN UTAMA FOOTER (STATIS / DIAM) */}
        <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">
          <div className="rounded-[2rem] border border-white/20 bg-white/10 p-8 shadow-2xl backdrop-blur-sm sm:p-12">

            <div className="mb-12 flex justify-center">
              <div className="grid w-full max-w-5xl grid-cols-1 gap-10 sm:grid-cols-2 md:grid-cols-4 sm:gap-8">

                {/* KOLOM 1: IDENTITAS LAB */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black tracking-tight text-white">
                      Cam<span className="text-orange-500">Hub</span> Studio
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-stone-300 font-normal">
                    Sistem informasi reservasi peralatan laboratorium multimedia. Dikelola terpusat untuk kelancaran tugas praktik, dokumentasi kegiatan, dan proyek Ujikom.
                  </p>
                  <p className="text-[11px] font-semibold text-orange-400">
                    Lokasi: Ruang Studio Multimedia Lt. 2
                  </p>
                </div>

                {/* KOLOM 2: FOKUS LAYANAN (Bukan Link) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Fokus Layanan
                  </h3>
                  <ul className="space-y-2 text-xs font-medium text-stone-200">
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
                </div>

                {/* KOLOM 3: KETENTUAN LAB (Bukan Link) */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Ketentuan Lab
                  </h3>
                  <ul className="space-y-2 text-xs font-medium text-stone-200">
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
                </div>

                {/* KOLOM 4: JAM OPERASIONAL STUDIO */}
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-wider text-orange-400">
                    Jam Operasional
                  </h3>
                  <ul className="space-y-2.5 text-xs text-stone-200 font-medium">
                    <li className="flex justify-between items-center border-b border-white/10 pb-1.5">
                      <span>Senin – Jumat</span>
                      <span className="font-bold text-white">08.00 – 15.00</span>
                    </li>
                    <li className="flex justify-between items-center border-b border-white/10 pb-1.5">
                      <span>Istirahat Siang</span>
                      <span className="font-bold text-stone-400">12.00 – 13.00</span>
                    </li>
                    <li className="flex justify-between items-center">
                      <span>Sabtu – Minggu</span>
                      <span className="font-bold text-orange-400">Libur / Tutup</span>
                    </li>
                  </ul>
                </div>

              </div>
            </div>

            {/* BAR BAWAH: LEGAL & SOCIAL */}
            <div className="flex flex-col items-center justify-between gap-6 border-t border-white/15 pt-6 text-[11px] text-stone-300 font-medium md:flex-row">

              {/* Teks Statis Kiri Bawah (Menggantikan Link Bantuan) */}
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

              {/* Ikon Sosial Media (Link kosong "#" siap lu isi) */}
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

            </div>

          </div>
        </div>
      </div>
    </footer>
  );
}
