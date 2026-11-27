import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Hash,
  GraduationCap,
  Camera,
  Loader2,
  ImagePlus,
} from 'lucide-react';
import { useOnboardingModal } from '../../logics/auth/useOnboardingModal';

interface OnboardingProps {
  userId: string;
  onComplete: () => void;
}

export default function OnboardingModal({
  userId,
  onComplete,
}: OnboardingProps) {
  const {
    step,
    nama,
    setNama,
    nis,
    setNis,
    kelas,
    setKelas,
    photoUrl,
    photoFile,
    fileInputRef,
    isLoading,
    handleNext,
    handleFileChange,
    handleFinalize,
  } = useOnboardingModal({ userId, onComplete });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 p-4 backdrop-blur-md sm:p-5">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="relative flex w-full max-w-sm flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-2xl"
      >
        <div className="h-1.5 w-full bg-stone-100">
          <motion.div
            initial={{ width: '50%' }}
            animate={{ width: step === 1 ? '50%' : '100%' }}
            className="h-full bg-orange-600 transition-all duration-500 ease-out"
          />
        </div>

        <div className="flex-1 px-8 py-10">
          <AnimatePresence mode="wait">
            {step === 1 ? (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex flex-col"
              >
                <h3 className="font-['Outfit',sans-serif] text-2xl font-black leading-tight text-[#1c1917]">
                  Data Akademik
                </h3>
                <p className="mb-8 mt-2 text-xs font-medium text-stone-500">
                  Lengkapi identitasmu sesuai absensi sekolah untuk memvalidasi peminjaman.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="text-[11px] font-extrabold text-stone-500 uppercase">
                      Nama Lengkap
                    </label>
                    <div className="relative mt-1.5">
                      <User className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Sesuai Absen"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pr-4 pl-11 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-stone-500 uppercase">
                      NIS (Nomor Induk)
                    </label>
                    <div className="relative mt-1.5">
                      <Hash className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={nis}
                        onChange={(e) => setNis(e.target.value)}
                        placeholder="Contoh: 10293847"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pr-4 pl-11 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[11px] font-extrabold text-stone-500 uppercase">
                      Kelas
                    </label>
                    <div className="relative mt-1.5">
                      <GraduationCap className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
                      <input
                        type="text"
                        value={kelas}
                        onChange={(e) => setKelas(e.target.value)}
                        placeholder="Contoh: XII MM 1"
                        className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pr-4 pl-11 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleNext}
                  className="mt-8 flex w-full items-center justify-center rounded-full bg-[#1c1917] py-3.5 text-sm font-extrabold text-white transition hover:bg-black active:scale-95"
                >
                  Berikutnya
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center"
              >
                <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-black text-[#1c1917]">
                  Foto Profil
                </h3>
                <p className="mb-8 mt-2 text-center text-xs font-medium text-stone-500">
                  Tambahkan foto wajahmu agar admin mudah mengenali saat pengambilan alat.
                </p>

                <div className="group relative mb-10">
                  <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-4 ring-orange-50 transition-all group-hover:ring-orange-100">
                    {photoUrl ? (
                      <img
                        src={photoUrl}
                        alt="Preview"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-14 w-14 text-stone-300" />
                    )}
                  </div>

                  <input
                    type="file"
                    accept="image/jpeg, image/png, image/webp"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                  />

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="absolute right-2 bottom-1 flex h-10 w-10 items-center justify-center rounded-full border-4 border-white bg-orange-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                  >
                    {photoUrl ? (
                      <Camera className="h-4 w-4" />
                    ) : (
                      <ImagePlus className="h-4 w-4" />
                    )}
                  </button>
                </div>

                <div className="w-full space-y-3">
                  <button
                    onClick={() => handleFinalize(false)}
                    disabled={isLoading || !photoFile}
                    className={`flex w-full items-center justify-center rounded-full py-3.5 text-sm font-extrabold transition ${
                      !photoFile
                        ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                        : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 active:scale-95'
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Simpan & Selesai'
                    )}
                  </button>

                  <button
                    onClick={() => handleFinalize(true)}
                    disabled={isLoading}
                    className="flex w-full items-center justify-center rounded-full py-2.5 text-xs font-bold text-stone-400 transition hover:text-stone-600 active:scale-95 disabled:opacity-50"
                  >
                    Lewati Langkah Ini
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
