import { useRef, useState, type FormEvent } from 'react';
import OneSignal from 'react-onesignal';
import { supabase } from '../../lib/supabase';
import { Toast } from '../../lib/CustomSwal';
import { isValidEmail } from './auth.config';

interface UseLoginFormParams {
  onClose: () => void;
  onGoToOtp: (email: string) => void;
}

export function useLoginForm({ onClose, onGoToOtp }: UseLoginFormParams) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [emailCallbackError, setEmailCallbackError] = useState('');
  const [shakeEmail, setShakeEmail] = useState(0);

  const emailInputRef = useRef<HTMLInputElement>(null);

  const trimmedEmail = email.trim().toLowerCase();
  const isEmailReady = isValidEmail(trimmedEmail);

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailCallbackError) setEmailCallbackError('');
  };

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setEmailCallbackError('');

    const { error } = await supabase.auth.signInWithPassword({
      email: trimmedEmail,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
      setLoading(false);
      return;
    }

    try {
      await OneSignal.Notifications.requestPermission();
    } catch (err) {
      console.error('Gagal memuat pop-up OneSignal:', err);
    }

    setLoading(false);
    onClose();
    Toast.fire({
      icon: 'success',
      title: 'Berhasil masuk ke CamHub!',
    });
  };

  const handleForgotPassword = () => {
    if (loading) return;

    if (!isEmailReady) {
      setEmailCallbackError(
        !trimmedEmail
          ? 'Isi alamat email di atas terlebih dahulu sebelum reset sandi!'
          : 'Format email di atas belum valid!'
      );
      setShakeEmail((prev) => prev + 1);
      emailInputRef.current?.focus();
      return;
    }

    setEmailCallbackError('');
    onGoToOtp(trimmedEmail);
  };

  return {
    showPassword,
    setShowPassword,
    email,
    handleEmailChange,
    password,
    setPassword,
    loading,
    errorMsg,
    emailCallbackError,
    shakeEmail,
    emailInputRef,
    isEmailReady,
    handleLogin,
    handleForgotPassword,
  };
}
