import {
  useEffect,
  useRef,
  useState,
  type ClipboardEvent,
  type FormEvent,
  type KeyboardEvent,
} from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import { getAuthErrorMessage, type AuthView } from './auth.config';

interface UseOtpFormParams {
  email: string;
  onSwitchView: (view: AuthView) => void;
  onVerified: (client: SupabaseClient) => void;
}

export function useOtpForm({
  email,
  onSwitchView,
  onVerified,
}: UseOtpFormParams) {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [isSendingInitial, setIsSendingInitial] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const hasSentInitialRef = useRef(false);

  // Kirim OTP otomatis begitu masuk ke halaman OTP
  useEffect(() => {
    if (!email) {
      onSwitchView('login');
      return;
    }
    if (hasSentInitialRef.current) return;
    hasSentInitialRef.current = true;

    const sendInitialOtp = async () => {
      setIsSendingInitial(true);
      try {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;

        setCooldown(60);
        Toast.fire({
          icon: 'success',
          title: 'Kode OTP 6 digit terkirim ke email!',
        });
      } catch (err) {
        const rawMsg = getAuthErrorMessage(err, 'Gagal mengirim kode OTP ke email.');
        CustomSwal.fire({
          icon: 'error',
          title: 'Gagal Mengirim OTP',
          text: rawMsg.toLowerCase().includes('rate limit')
            ? 'Terlalu banyak permintaan. Tunggu 60 detik lalu tekan kirim ulang.'
            : rawMsg,
        });
        setCooldown(0);
      } finally {
        setIsSendingInitial(false);
        setTimeout(() => {
          inputRefs.current[0]?.focus();
        }, 100);
      }
    };

    sendInitialOtp();
  }, [email, onSwitchView]);

  useEffect(() => {
    if (isSendingInitial || cooldown <= 0) return;
    const timer = window.setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [isSendingInitial, cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = ['', '', '', '', '', ''];
    pasted.split('').forEach((char, idx) => {
      next[idx] = char;
    });
    setOtp(next);

    const focusIndex = Math.min(pasted.length, 5);
    inputRefs.current[focusIndex]?.focus();
  };

  const handleResendOtp = async () => {
    if (cooldown > 0 || isResending || isSendingInitial || !email) return;

    setIsResending(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;

      setOtp(['', '', '', '', '', '']);
      setCooldown(60);
      inputRefs.current[0]?.focus();
      Toast.fire({
        icon: 'success',
        title: 'Kode OTP baru telah dikirim!',
      });
    } catch (err) {
      Toast.fire({
        icon: 'error',
        title: getAuthErrorMessage(err, 'Gagal mengirim ulang kode OTP'),
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e: FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (!email) {
      onSwitchView('login');
      return;
    }

    if (otpCode.length !== 6) {
      Toast.fire({
        icon: 'warning',
        title: 'Masukkan 6 digit kode OTP terlebih dahulu',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const internalClient = supabase as unknown as {
        supabaseUrl: string;
        supabaseKey: string;
      };

      // Client terisolasi di memori agar sesi utama TIDAK otomatis login sebelum sandi baru disimpan
      const ephemeralClient = createClient(
        internalClient.supabaseUrl,
        internalClient.supabaseKey,
        {
          auth: {
            persistSession: false,
            autoRefreshToken: false,
            detectSessionInUrl: false,
          },
        }
      );

      const { data, error } = await ephemeralClient.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      });
      if (error) throw error;
      if (!data.session) throw new Error('Sesi pemulihan tidak ditemukan.');

      Toast.fire({
        icon: 'success',
        title: 'OTP valid! Silakan buat sandi baru.',
      });
      onVerified(ephemeralClient);
    } catch (err) {
      const rawMsg = getAuthErrorMessage(
        err,
        'Terjadi kesalahan saat memverifikasi kode.'
      );
      const lower = rawMsg.toLowerCase();
      CustomSwal.fire({
        icon: 'error',
        title: 'Kode OTP Tidak Valid',
        text:
          lower.includes('expired') ||
          lower.includes('invalid') ||
          lower.includes('token')
            ? 'Kode OTP salah atau sudah kedaluwarsa. Periksa kembali atau kirim ulang kode.'
            : rawMsg,
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return {
    otp,
    isSendingInitial,
    isVerifying,
    isResending,
    cooldown,
    inputRefs,
    handleOtpChange,
    handleOtpKeyDown,
    handleOtpPaste,
    handleResendOtp,
    handleVerifyOtp,
  };
}
