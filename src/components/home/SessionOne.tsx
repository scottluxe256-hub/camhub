// @ts-nocheck
import { motion } from 'framer-motion';

export default function SessionOne() {
  const features = [
    {
      title: 'Bebas Antre Fisik',
      desc: 'Booking alat langsung dari HP. Datang ke lab hanya untuk verifikasi dan ambil alat.',
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
    },
    {
      title: 'Cek Ketersediaan Cepat',
      desc: 'Lihat status alat secara live, apakah sedang tersedia, dipinjam, atau maintenance.',
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: 'Sistem Slot Jam',
      desc: 'Atur jadwal pinjam hingga 5 hari kerja ke depan dengan pilihan slot waktu yang presisi.',
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 2v2m0 16v2m10-10h-2M4 12H2m15.364-7.364l-1.414 1.414M6.05 17.95l-1.414 1.414m12.728 0l-1.414-1.414M6.05 6.05L4.636 4.636" />
        </svg>
      ),
    },
    {
      title: 'Denda Otomatis',
      desc: 'Sistem web otomatis mencatat waktu keterlambatan pengembalian untuk menjaga kedisiplinan.',
      icon: (
        <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
    },
  ];

  const topFeat = features[0];
  const leftFeat = features[1];
  const rightFeat = features[2];
  const bottomFeat = features[3];

  return (
    <section id="fitur" className="relative w-full overflow-x-clip bg-[#fafaf9]">
      <div className="mx-auto max-w-7xl px-3 pt-12 pb-14 sm:px-8 sm:pt-14 sm:pb-24">
        <div className="mx-auto max-w-2xl text-center md:translate-y-12">
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
            1. TAMPILAN PORTRAIT (< md): FORMASI BELAH KETUPAT RATA TENGAH
           ========================================================= */}
        <div className="mt-9 flex flex-col items-center md:hidden">
          {/* TITIK ATAS */}
          <motion.div
            initial={{ opacity: 0, y: -15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.45 }}
            className="flex max-w-[225px] flex-col items-center text-center"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              {topFeat.icon}
            </div>
            <h3 className="font-['Outfit',sans-serif] text-xs font-extrabold leading-tight text-[#1c1917]">
              {topFeat.title}
            </h3>
            <p className="mt-1 text-[10.5px] font-medium leading-snug text-stone-500">
              {topFeat.desc}
            </p>
          </motion.div>

          {/* BARIS TENGAH: KIRI - KARAKTER ISHAQ - KANAN */}
          <div className="my-1 flex w-full items-center justify-between gap-1.5">
            {/* TITIK KIRI */}
            <motion.div
              initial={{ opacity: 0, x: -15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex min-w-0 flex-1 flex-col items-center text-center"
            >
              <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                {leftFeat.icon}
              </div>
              <h3 className="font-['Outfit',sans-serif] text-[10.5px] font-extrabold leading-tight text-[#1c1917]">
                {leftFeat.title}
              </h3>
              <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                {leftFeat.desc}
              </p>
            </motion.div>

            {/* PUSAT BELAH KETUPAT: KARAKTER */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.5 }}
              className="relative flex h-[320px] w-[134px] shrink-0 items-center justify-center"
            >
              <img
                src="/ishaq.webp"
                alt="Karakter Siswa Multimedia"
                className="relative z-10 h-full w-full translate-y-1 scale-[1.24] object-contain object-center drop-shadow-xl"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = '/1001193092.png';
                }}
              />
            </motion.div>

            {/* TITIK KANAN */}
            <motion.div
              initial={{ opacity: 0, x: 15 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: false, amount: 0.15 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="flex min-w-0 flex-1 flex-col items-center text-center"
            >
              <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                {rightFeat.icon}
              </div>
              <h3 className="font-['Outfit',sans-serif] text-[10.5px] font-extrabold leading-tight text-[#1c1917]">
                {rightFeat.title}
              </h3>
              <p className="mt-1 text-[9.5px] font-medium leading-snug text-stone-500">
                {rightFeat.desc}
              </p>
            </motion.div>
          </div>

          {/* TITIK BAWAH */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.45, delay: 0.15 }}
            className="flex max-w-[225px] flex-col items-center text-center"
          >
            <div className="mb-2 flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 text-orange-600">
              {bottomFeat.icon}
            </div>
            <h3 className="font-['Outfit',sans-serif] text-xs font-extrabold leading-tight text-[#1c1917]">
              {bottomFeat.title}
            </h3>
            <p className="mt-1 text-[10.5px] font-medium leading-snug text-stone-500">
              {bottomFeat.desc}
            </p>
          </motion.div>
        </div>

        {/* =========================================================
            2. TAMPILAN LANDSCAPE / DESKTOP (md+): 2 KIRI - TENGAH - 2 KANAN
           ========================================================= */}
        <div className="mt-2 hidden items-center justify-center gap-8 md:flex lg:mt-4 lg:gap-12">
          {/* KOLOM KIRI */}
          <div className="flex flex-1 translate-y-24 flex-col justify-center gap-10">
            {features.slice(0, 2).map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                className="flex flex-col items-end text-right"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-xs">
                  {feat.icon}
                </div>
                <h3 className="font-['Outfit',sans-serif] text-xl font-extrabold text-[#1c1917] lg:text-2xl">
                  {feat.title}
                </h3>
                <p className="mt-1.5 max-w-[310px] text-sm font-medium leading-relaxed text-stone-500 lg:max-w-[340px] lg:text-base">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* KARAKTER TENGAH */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="relative z-20 flex h-[540px] w-[280px] shrink-0 items-end justify-center lg:h-[600px] lg:w-[310px]"
          >
            <div className="pointer-events-none absolute inset-x-4 top-24 bottom-0 rounded-full bg-orange-500/10 blur-3xl" />
            <img
              src="/ishaq.webp"
              alt="Karakter Siswa Multimedia"
              className="relative z-20 h-full w-full translate-y-25 scale-[1.15] object-contain object-bottom drop-shadow-2xl"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/1001193092.png';
              }}
            />
          </motion.div>

          {/* KOLOM KANAN */}
          <div className="flex flex-1 translate-y-24 flex-col justify-center gap-10">
            {features.slice(2, 4).map((feat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.15 }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                className="flex flex-col items-start text-left"
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-100 text-orange-600 shadow-xs">
                  {feat.icon}
                </div>
                <h3 className="font-['Outfit',sans-serif] text-xl font-extrabold text-[#1c1917] lg:text-2xl">
                  {feat.title}
                </h3>
                <p className="mt-1.5 max-w-[310px] text-sm font-medium leading-relaxed text-stone-500 lg:max-w-[340px] lg:text-base">
                  {feat.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* BANNER BAWAH */}
      <div className="relative mt-8 w-full border-t border-stone-200">
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
