import { useRef, useState, type ChangeEvent } from 'react';
import { supabase } from '../../lib/supabase';
import { CustomSwal } from '../../lib/CustomSwal';
import { uploadToCloudinary } from '../../utils/cloudinary';
import type { Database } from '../../types/database';
import { getAuthErrorMessage } from './auth.config';

type ProfileInsert = Database['public']['Tables']['profiles']['Insert'];

interface UseOnboardingModalParams {
  userId: string;
  onComplete: () => void;
}

export function useOnboardingModal({
  userId,
  onComplete,
}: UseOnboardingModalParams) {
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
        text: 'Harap isi Nama, NIS, dan Kelas dulu ya, Bro!',
      });
      return;
    }
    setStep(2);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoUrl(URL.createObjectURL(file));
    }
  };

  const handleFinalize = async (skipPhoto: boolean = false) => {
    setIsLoading(true);
    try {
      let finalPhotoUrl: string | null = null;
      let publicId: string | null = null;

      if (!skipPhoto && photoFile) {
        const uploadResult = await uploadToCloudinary(photoFile);

        if (!uploadResult) {
          throw new Error('Gagal mengunggah foto ke Cloudinary.');
        }

        finalPhotoUrl = uploadResult.imageUrl;
        publicId = uploadResult.publicId;
      }

      const newProfile: ProfileInsert = {
        id: userId,
        nama_lengkap: nama,
        nis,
        kelas,
        role: 'siswa',
        foto_url: finalPhotoUrl,
        foto_public_id: publicId,
      };

      const { error } = await supabase.from('profiles').upsert(newProfile);

      if (error) throw error;

      await CustomSwal.fire({
        icon: 'success',
        title: 'Profil Berhasil Dibuat!',
        text: 'Selamat datang di CamHub, akunmu sudah siap digunakan.',
        confirmButtonText: 'Mulai Jelajah',
      });

      onComplete();
    } catch (error) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan',
        text: getAuthErrorMessage(
          error,
          'Terjadi kesalahan saat menyimpan data profil.'
        ),
        confirmButtonText: 'Coba Lagi',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
