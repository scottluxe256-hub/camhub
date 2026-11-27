import { useState, type ChangeEvent, type FormEvent } from 'react';
import OneSignal from 'react-onesignal';
import { supabase } from '../../lib/supabase';
import { CustomSwal } from '../../lib/CustomSwal';
import { getAuthErrorMessage } from './auth.config';

interface UseRegisterFormParams {
  onClose: () => void;
}

export function useRegisterForm({ onClose }: UseRegisterFormParams) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegister = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const { error: authError } = await supabase.auth.signUp({
        email: formData.email.trim(),
        password: formData.password,
      });

      if (authError) throw authError;

      try {
        await OneSignal.Notifications.requestPermission();
      } catch (err) {
        console.error('Gagal memuat pop-up OneSignal:', err);
      }

      setLoading(false);
      onClose();

      CustomSwal.fire({
        icon: 'success',
        title: 'Pendaftaran Berhasil!',
        text: 'Akun CamHub kamu sudah aktif dan siap digunakan.',
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      setErrorMsg(getAuthErrorMessage(err, 'Terjadi kesalahan saat mendaftar.'));
      setLoading(false);
    }
  };

  return {
    formData,
    showPassword,
    setShowPassword,
    loading,
    errorMsg,
    handleChange,
    handleRegister,
  };
}
