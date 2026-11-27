import { useState, type FormEvent } from 'react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import { getAuthErrorMessage, type AuthView } from './auth.config';

interface UseResetFormParams {
  email: string;
  recoveryClient: SupabaseClient | null;
  onSwitchView: (view: AuthView) => void;
  onSuccess: () => void;
}

export function useResetForm({
  email,
  recoveryClient,
  onSwitchView,
  onSuccess,
}: UseResetFormParams) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSavePassword = async (e: FormEvent) => {
    e.preventDefault();

    if (!recoveryClient || !email) {
      Toast.fire({
        icon: 'error',
        title: 'Sesi verifikasi tidak ditemukan, silakan ulangi.',
      });
      onSwitchView('login');
      return;
    }

    if (newPassword.length < 6) {
      Toast.fire({
        icon: 'warning',
        title: 'Kata sandi baru minimal 6 karakter',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.fire({
        icon: 'error',
        title: 'Konfirmasi kata sandi tidak cocok',
      });
      return;
    }

    setIsSaving(true);
    try {
      const { error: updateError } = await recoveryClient.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      const { error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password: newPassword,
      });
      if (loginError) throw loginError;

      Toast.fire({
        icon: 'success',
        title: 'Kata sandi berhasil diperbarui & otomatis masuk!',
      });
      onSuccess();
    } catch (err) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Sandi',
        text: getAuthErrorMessage(
          err,
          'Sesi pemulihan berakhir. Silakan ulangi dari Lupa Sandi.'
        ),
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSaving,
    handleSavePassword,
  };
}
