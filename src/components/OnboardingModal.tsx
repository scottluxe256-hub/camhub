import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Hash, GraduationCap, Camera, Loader2, ImagePlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomSwal } from '../lib/CustomSwal';
import { uploadToCloudinary } from '../utils/cloudinary'; // Sesuaikan path jika berbeda

interface OnboardingProps {
    userId: string;
    onComplete: () => void;
}

export default function OnboardingModal({ userId, onComplete }: OnboardingProps) {
    const [step, setStep] = useState<1 | 2>(1);
    
    // Step 1 States (Data Akademik)
    const [nama, setNama] = useState('');
    const [nis, setNis] = useState('');
    const [kelas, setKelas] = useState('');
    
    // Step 2 States (Foto Profil)
    const [photoUrl, setPhotoUrl] = useState<string | null>(null);
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const [isLoading, setIsLoading] = useState(false);

        const handleNext = () => {
        if (!nama || !nis || !kelas) {
            CustomSwal.fire({ 
                icon: 'warning', 
                title: 'Data Belum Lengkap',
                text: 'Harap isi Nama, NIS, dan Kelas dulu ya, Bro!' 
            });
            return;
        }
        setStep(2);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPhotoFile(file);
            setPhotoUrl(URL.createObjectURL(file)); 
        }
    };

        const handleFinalize = async (skipPhoto: boolean = false) => {
        setIsLoading(true);
        try {
            let finalPhotoUrl = null;
            let publicId = null;

            if (!skipPhoto && photoFile) {
                // Eksekusi upload ke Cloudinary
                const uploadResult = await uploadToCloudinary(photoFile);
                
                if (!uploadResult) {
                    throw new Error("Gagal mengunggah foto ke Cloudinary.");
                }
                
                finalPhotoUrl = uploadResult.imageUrl;
                publicId = uploadResult.publicId;
            }

            // Simpan Data Akademik (dan URL foto) ke Tabel Profiles
            const { error } = await supabase.from('profiles').upsert({
                id: userId,
                nama_lengkap: nama,
                nis: nis,
                kelas: kelas,
                role: 'siswa',
                foto_url: finalPhotoUrl, 
                foto_public_id: publicId
            });

            if (error) throw error;

            // Munculkan SweetAlert2 di tengah dan tunggu siswa klik tombol konfirmasi
            await CustomSwal.fire({
                icon: 'success',
                title: 'Profil Berhasil Dibuat!',
                text: 'Selamat datang di CamHub, akunmu sudah siap digunakan.',
                confirmButtonText: 'Mulai Jelajah',
            });

            onComplete(); 
        } catch (error: any) {
            CustomSwal.fire({
                icon: 'error',
                title: 'Gagal Menyimpan',
                text: error.message || 'Terjadi kesalahan saat menyimpan data profil.',
                confirmButtonText: 'Coba Lagi',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-stone-900/80 p-4 sm:p-5 backdrop-blur-md">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
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
                                <h3 className="font-['Outfit',sans-serif] text-2xl font-black text-[#1c1917] leading-tight">Data Akademik</h3>
                                <p className="mt-2 text-xs font-medium text-stone-500 mb-8">
                                    Lengkapi identitasmu sesuai absensi sekolah untuk memvalidasi peminjaman.
                                </p>

                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[11px] font-extrabold uppercase text-stone-500">Nama Lengkap</label>
                                        <div className="relative mt-1.5">
                                            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                            <input type="text" value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Sesuai Absen" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-extrabold uppercase text-stone-500">NIS (Nomor Induk)</label>
                                        <div className="relative mt-1.5">
                                            <Hash className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                            <input type="text" value={nis} onChange={(e) => setNis(e.target.value)} placeholder="Contoh: 10293847" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[11px] font-extrabold uppercase text-stone-500">Kelas</label>
                                        <div className="relative mt-1.5">
                                            <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                                            <input type="text" value={kelas} onChange={(e) => setKelas(e.target.value)} placeholder="Contoh: XII MM 1" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3.5 pl-11 pr-4 text-sm font-bold text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white" />
                                        </div>
                                    </div>
                                </div>

                                <button onClick={handleNext} className="mt-8 flex w-full items-center justify-center rounded-full bg-[#1c1917] py-3.5 text-sm font-extrabold text-white transition hover:bg-black active:scale-95">
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
                                <h3 className="font-['Outfit',sans-serif] text-2xl font-black text-[#1c1917] text-center">Foto Profil</h3>
                                <p className="mt-2 text-xs font-medium text-stone-500 text-center mb-8">
                                    Tambahkan foto wajahmu agar admin mudah mengenali saat pengambilan alat.
                                </p>

                                <div className="relative mb-10 group">
                                    <div className="flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-stone-100 ring-4 ring-orange-50 transition-all group-hover:ring-orange-100">
                                        {photoUrl ? (
                                            <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
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
                                        className="absolute bottom-1 right-2 flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg border-4 border-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                                    >
                                        {photoUrl ? <Camera className="h-4 w-4" /> : <ImagePlus className="h-4 w-4" />}
                                    </button>
                                </div>

                                <div className="w-full space-y-3">
                                    <button 
                                        onClick={() => handleFinalize(false)} 
                                        disabled={isLoading || !photoFile}
                                        className={`flex w-full items-center justify-center rounded-full py-3.5 text-sm font-extrabold transition ${
                                            !photoFile 
                                            ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                                            : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 active:scale-95'
                                        }`}
                                    >
                                        {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Simpan & Selesai'}
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
