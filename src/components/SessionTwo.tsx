import { useState } from 'react';
import { motion } from 'framer-motion';
import { Star, CalendarClock, UserCheck, CheckCircle2, Loader2 } from 'lucide-react';
import PenjelasanModal, { type PenjelasanData } from './PenjelasanModal';
import { supabase } from '../lib/supabase';
import { showFeedbackAlert } from '../lib/CustomSwal'; // <-- Import CustomSwal kita

interface SessionTwoProps {
  onRequireAuth?: () => void;
}

export default function SessionTwo({ onRequireAuth }: SessionTwoProps) {
  const [feedbackCategory, setFeedbackCategory] = useState<'request' | 'fasilitas' | 'layanan'>('request');
  const [feedbackText, setFeedbackText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // State untuk Modal Penjelasan
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedData, setSelectedData] = useState<PenjelasanData | null>(null);

  // DATA UNTUK MODAL ATURAN DENDA (Tanpa Gambar)
  const aturanDendaData: PenjelasanData = {
    title: 'Aturan Denda & Sanksi',
    fullDesc: 'Setiap pelanggaran waktu pengembalian dan kerusakan alat akan dikenakan sanksi sesuai SOP Laboratorium Multimedia:\n\n1. Keterlambatan Harian: Telat mengembalikan alat dari batas slot waktu akan dicatat. Jika terulang hingga 3 kali, akun akan dibekukan (suspend) selama 1 minggu.\n2. Kerusakan Ringan/Berat: Peminjam wajib melapor. Biaya perbaikan akan dibebankan kepada peminjam setelah dievaluasi oleh teknisi sekolah.\n3. Kehilangan Komponen: Menghilangkan alat atau aksesoris (seperti baterai, tutup lensa, memori) wajib diganti dengan barang berspesifikasi sama persis.\n\nHarap disiplin dan jaga barang bersama demi kelancaran tugas semua siswa!'
  };

  const tips = [
    {
      title: 'Setting Shutter Speed & ISO',
      desc: 'Panduan mengatasi kondisi minim cahaya di aula sekolah tanpa bikin foto/video jadi banyak noise.',
      fullDesc: 'Saat merekam di dalam aula sekolah yang minim cahaya, jangan terburu-buru menaikkan ISO ke angka tertinggi karena akan menimbulkan noise (bintik-bintik pada gambar).\n\nLangkah yang benar:\n1. Buka Aperture (diafragma) selebar mungkin (misal f/1.8 atau f/2.8).\n2. Atur Shutter Speed minimal di angka 1/50 untuk video 25fps agar gerakan terlihat natural.\n3. Baru naikkan ISO secara perlahan (maksimal 3200 untuk kamera APS-C) hingga exposure terlihat pas di layar.\n\nJika masih gelap, sangat disarankan menggunakan lighting tambahan (LED panel) yang tersedia di lab.',
      image: '/satu.avif',
    },
    {
      title: 'Cara Aman Ganti Lensa',
      desc: 'Tips posisi bodi kamera menghadap ke bawah saat menukar lensa di lokasi berdebu atau berangin.',
      fullDesc: 'Mengganti lensa sembarangan di lapangan terbuka sangat berisiko membuat sensor kamera kemasukan debu, yang nantinya akan terlihat sebagai bercak hitam di hasil fotomu.\n\nSOP Mengganti Lensa:\n1. Cari tempat yang teduh dan aman dari hembusan angin langsung.\n2. Siapkan lensa pengganti, kendorkan tutup belakangnya.\n3. Matikan kamera (OFF).\n4. Arahkan moncong bodi kamera ke BAWAH (menghadap tanah).\n5. Lepas lensa lama, dan segera pasang lensa baru dengan cepat.\n\nJangan pernah membiarkan bodi kamera terbuka tanpa lensa menghadap ke atas!',
      image: '/dua.avif',
    },
    {
      title: 'Trik Pasang Wireless Mic',
      desc: 'Penggunaan deadcat dan posisi clip-on yang tepat pada narasumber wawancara sekolah.',
      fullDesc: 'Audio yang buruk bisa merusak video yang bagus. Saat menggunakan mic wireless (seperti Saramonic/Rode) untuk wawancara guru atau siswa:\n\n1. Posisi Ideal: Jepit transmitter (clip-on) di kerah baju atau bagian tengah dada, sekitar sejengkal (15-20cm) dari mulut narasumber.\n2. Cegah Noise Angin: Selalu pasang bulu peredam angin (deadcat) jika wawancara dilakukan di luar ruangan (outdoor) atau di area berangin.\n3. Cek Level: Pastikan indikator audio di layar kamera bergerak di kisaran -12dB hingga -6dB. Jangan sampai menyentuh warna merah (clipping/pecah).',
      image: '/tiga.avif',
    },
    {
      title: 'Aturan In-Camera Format',
      desc: 'Selalu format kartu memori di dalam kamera (bukan di laptop) setelah file selesai dibackup.',
      fullDesc: 'Ini adalah aturan paling fatal yang sering dilanggar pemula. JANGAN PERNAH memformat kartu SD menggunakan fitur "Format" bawaan laptop (Windows/Mac)!\n\nSistem operasi komputer seringkali menulis file indexing tersembunyi yang membuat struktur folder kamera menjadi error atau corrupt saat memori dimasukkan kembali.\n\nAlur yang Benar:\n1. Pindahkan (Copy) seluruh file rekaman dari SD Card ke laptop.\n2. Masukkan kembali SD Card ke dalam kamera.\n3. Gunakan menu "Format" yang ada di dalam Pengaturan Kamera untuk membersihkan isi memori.\n\nKamera selalu tahu struktur folder terbaik untuk dirinya sendiri.',
      image: '/empat.avif',
    },
  ];

  const steps = [
    {
      icon: CalendarClock,
      title: '1. Booking Slot Jadwal',
      desc: 'Cari alat di katalog, pilih tanggal hingga 5 hari kerja ke depan, lalu tentukan slot jam kosong.',
    },
    {
      icon: UserCheck,
      title: '2. Verifikasi Fisik Studio',
      desc: 'Datang langsung ke ruang studio membawa Kartu Pelajar atau KTP asli untuk validasi oleh operator.',
    },
    {
      icon: CheckCircle2,
      title: '3. QC & Tepat Waktu',
      desc: 'Lakukan cek kelengkapan bodi & lensa bersama admin. Pastikan alat kembali sebelum batas slot habis.',
    },
  ];

  const openModal = (data: PenjelasanData) => {
    setSelectedData(data);
    setIsModalOpen(true);
  };

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setIsSubmitting(true);

    try {
      const finalMessage = `[Kategori: ${feedbackCategory.toUpperCase()}] - ${feedbackText}`;

      const { error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: session.user.id,
          pesan: finalMessage,
        });

      if (error) throw error;

      await showFeedbackAlert(
        'Aspirasi Terkirim! 🎉',
        'Keren! Ide dan masukanmu sudah masuk ke sistem dan siap dievaluasi operator lab.'
      );

      setFeedbackText('');
      
    } catch (error: any) {
      console.error('Error kirim feedback:', error);
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Mengirim',
        text: error.message || 'Terjadi kesalahan saat mengirim aspirasi.',
        confirmButtonText: 'Coba Lagi',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="w-full bg-[#fafaf9] overflow-hidden">
      
      {/* Modal Detail Pop-up */}
      <PenjelasanModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        data={selectedData} 
      />

      {/* BANNER PANDUAN UTAMA */}
      <div id="sop" className="relative w-full min-h-[440px] bg-[#1c1917] overflow-hidden flex items-center">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.65 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src="/sessions2.avif"
          alt="Banner Panduan Lab"
          className="absolute inset-0 h-full w-full object-cover object-right sm:object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1c1917] via-[#1c1917]/85 to-transparent" />

        <div className="relative mx-auto w-full max-w-7xl px-5 py-16 sm:px-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            className="max-w-xl text-left"
          >
            <h2 className="font-['Outfit',sans-serif] text-3xl font-black tracking-tight text-white sm:text-4xl lg:text-5xl leading-tight">
              Pinjam Nyaman, <br className="hidden sm:inline" />Karya Maksimal.
            </h2>

            <p className="mt-4 text-sm font-medium leading-relaxed text-stone-300">
              CamHub menggunakan sistem peminjaman berbasis slot jam presisi. Disiplin waktu dan tanggung jawab menjaga kondisi fisik alat adalah komitmen bersama demi kelancaran produksi seluruh siswa.
            </p>

            {/* TOMBOL ATURAN DENDA */}
            <div className="mt-7">
              <button
                onClick={() => openModal(aturanDendaData)}
                className="inline-block rounded-full bg-orange-600 px-7 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95"
              >
                Aturan Denda
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* KARTU ALUR CEPAT */}
      <div id="alur-pinjam" className="mx-auto -mt-8 max-w-7xl px-5 sm:px-8 relative z-20">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, margin: "-50px" }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-start gap-4 rounded-2xl border border-stone-200/80 bg-white p-5 shadow-lg shadow-stone-200/50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-['Outfit',sans-serif] font-extrabold text-[#1c1917] text-sm sm:text-base">{step.title}</h3>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-stone-500">{step.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* TESTIMONI */}
      <div className="mx-auto max-w-7xl px-5 pt-24 pb-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          className="text-center mb-16"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Pengalaman Siswa</span>
          <h2 className="mt-2 font-['Outfit',sans-serif] text-3xl font-black text-[#1c1917] sm:text-4xl">
            Kata Teman-Teman Multimedia
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            className="relative flex flex-col sm:flex-row items-center rounded-3xl bg-white shadow-xl shadow-stone-200/50 pt-24 sm:pt-0"
          >
            <div className="absolute -top-16 sm:static sm:top-0 h-48 w-40 sm:h-64 sm:w-56 shrink-0 overflow-hidden rounded-t-3xl sm:rounded-tr-none sm:rounded-l-3xl">
              <img src="/ishaq2.webp" alt="Ishaq" className="h-full w-full object-cover object-top drop-shadow-md bg-stone-100" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/1001193092.png'; }} />
            </div>
            <div className="p-6 sm:p-8 text-center sm:text-left flex-1">
              <p className="text-sm italic font-medium leading-relaxed text-stone-600">
                "Pinjam Sony A7 III seharian buat dokumentasi Pensi sekolah, baterai dikasih full dan sensor kameranya bener-bener bersih!"
              </p>
              <div className="mt-4 flex justify-center sm:justify-start gap-1 text-orange-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-orange-500" />)}
              </div>
              <h4 className="mt-3 font-['Outfit',sans-serif] text-lg font-extrabold text-[#1c1917]">Ishaq Nirwasita</h4>
              <span className="text-xs font-semibold text-stone-400">XII RPL 2</span>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            className="relative flex flex-col sm:flex-row items-center rounded-3xl bg-white shadow-xl shadow-stone-200/50 pt-24 sm:pt-0 mt-12 sm:mt-0"
          >
            <div className="absolute -top-16 sm:static sm:top-0 h-48 w-40 sm:h-64 sm:w-56 shrink-0 overflow-hidden rounded-t-3xl sm:rounded-tr-none sm:rounded-l-3xl">
              <img src="/areka.webp" alt="Areka" className="h-full w-full object-cover object-top drop-shadow-md bg-stone-100" onError={(e) => { (e.currentTarget as HTMLImageElement).src = '/1001193092.png'; }} />
            </div>
            <div className="p-6 sm:p-8 text-center sm:text-left flex-1">
              <p className="text-sm italic font-medium leading-relaxed text-stone-600">
                "SOP-nya jelas banget. Kalau bingung ganti lensa di lapangan, tinggal baca tips di portal ini. Alat lab kerawat dengan baik."
              </p>
              <div className="mt-4 flex justify-center sm:justify-start gap-1 text-orange-500">
                {[...Array(5)].map((_, i) => <Star key={i} className="h-4 w-4 fill-orange-500" />)}
              </div>
              <h4 className="mt-3 font-['Outfit',sans-serif] text-lg font-extrabold text-[#1c1917]">Areka Putra</h4>
              <span className="text-xs font-semibold text-stone-400">XII RPL 1</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* EDUKASI & TIPS PRODUKSI */}
      <div id="tips" className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, margin: "-50px" }}
          className="text-center"
        >
          <span className="text-xs font-extrabold uppercase tracking-wider text-orange-600">Best Practices</span>
          <h2 className="mt-1 font-['Outfit',sans-serif] text-3xl font-black text-[#1c1917]">Pojok Edukasi & Tips Produksi</h2>
          <p className="mt-3 text-sm font-medium text-stone-500">Panduan singkat penggunaan dan perawatan unit agar hasil karya selalu maksimal.</p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {tips.map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ delay: idx * 0.1 }}
              className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-lg shadow-stone-200/50 transition hover:-translate-y-2 hover:shadow-xl"
            >
              <div className="h-48 w-full overflow-hidden">
                <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-500 group-hover:scale-110" />
              </div>
              <div className="flex flex-1 flex-col justify-between p-6">
                <div>
                  <span className="text-[10px] font-extrabold tracking-wider text-orange-500 uppercase">Panduan Lab</span>
                  <h3 className="mt-2 font-['Outfit',sans-serif] text-lg font-extrabold text-[#1c1917] leading-snug">{item.title}</h3>
                  <p className="mt-3 text-xs font-medium leading-relaxed text-stone-500">{item.desc}</p>
                </div>
                {/* TOMBOL PICU MODAL */}
                <button 
                  onClick={() => openModal(item)}
                  className="mt-6 w-fit rounded-full border border-stone-200 px-6 py-2.5 text-xs font-bold text-[#1c1917] transition group-hover:border-orange-600 group-hover:bg-orange-600 group-hover:text-white"
                >
                  Baca Selengkapnya
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* KOTAK SARAN & REQUEST ALAT */}
      <div id="feedback" className="relative mt-10 w-full py-24 px-5 bg-[#1c1917] overflow-hidden">
        <motion.img
          initial={{ scale: 1.1, opacity: 0 }}
          whileInView={{ scale: 1, opacity: 0.35 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          src="/sessions3.avif"
          alt="Latar Kotak Saran"
          className="absolute inset-0 h-full w-full object-cover"
        />

        <div className="relative z-10 mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
          >
            <h2 className="font-['Outfit',sans-serif] text-3xl font-black text-white sm:text-4xl lg:text-5xl leading-tight">
              Ada Gear Impian yang Belum Masuk Lab?
            </h2>
            <p className="mt-4 text-sm font-medium text-stone-300 max-w-xl mx-auto leading-relaxed">
              Butuh lensa potret khusus buat tugas akhir, aksesoris audio, atau punya evaluasi sistem lab? Beri tahu tim operator di sini.
            </p>
          </motion.div>

          <motion.form
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ delay: 0.1 }}
            onSubmit={handleFeedbackSubmit}
            className="mt-10 rounded-3xl border border-white/25 bg-gradient-to-b from-white/12 to-white/[0.03] p-5 sm:p-7 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] shadow-inner text-left"
          >
            {/* Kategori chips */}
            <div className="mb-4 flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => setFeedbackCategory('request')}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  feedbackCategory === 'request'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'border border-white/10 bg-white/5 text-stone-300 hover:bg-white/15'
                }`}
              >
                Usulan Alat Baru
              </button>
              <button
                type="button"
                onClick={() => setFeedbackCategory('fasilitas')}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  feedbackCategory === 'fasilitas'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'border border-white/10 bg-white/5 text-stone-300 hover:bg-white/15'
                }`}
              >
                Lapor Kerusakan Fisik
              </button>
              <button
                type="button"
                onClick={() => setFeedbackCategory('layanan')}
                className={`rounded-full px-4 py-2 text-xs font-extrabold transition ${
                  feedbackCategory === 'layanan'
                    ? 'bg-orange-600 text-white shadow-md shadow-orange-600/30'
                    : 'border border-white/10 bg-white/5 text-stone-300 hover:bg-white/15'
                }`}
              >
                Saran Pelayanan Lab
              </button>
            </div>

            <textarea
              rows={3}
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              placeholder="Contoh: Butuh penambahan lensa fix 85mm f/1.8 atau mic clip-on wireless cadangan untuk dokumentasi ujian..."
              className="w-full resize-none rounded-2xl border border-white/15 bg-black/25 p-4 text-sm font-medium text-white placeholder-stone-400 outline-none backdrop-blur-md transition focus:border-orange-500 focus:bg-black/35 focus:ring-1 focus:ring-orange-500"
              required
            />

            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs font-medium text-stone-400">
                Masukanmu akan ditinjau langsung oleh Admin & Operator Studio.
              </span>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto shrink-0 rounded-full bg-orange-600 px-8 py-3 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95 disabled:opacity-70"
              >
                {isSubmitting ? <Loader2 className="animate-spin mx-auto h-5 w-5" /> : 'Kirim Aspirasi'}
              </button>
            </div>
          </motion.form>
        </div>
      </div>

    </section>
  );
}
