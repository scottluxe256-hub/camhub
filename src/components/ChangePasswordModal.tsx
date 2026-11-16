import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Loader2, RotateCw, ShieldCheck, Check, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomSwal, Toast } from '../lib/CustomSwal';

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  email: string;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  email,
}: ChangePasswordModalProps) {
  const [step, setStep] = useState<'otp' | 'reset'>('otp');
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [cooldown, setCooldown] = useState(60);

  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep('otp');
    setOtp(['', '', '', '', '', '']);
    setNewPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setCooldown(60);

    const timer = setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || step !== 'otp' || cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [isOpen, step, cooldown]);

  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
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
    if (cooldown > 0 || isResending || !email) return;

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
    } catch (err: any) {
      Toast.fire({
        icon: 'error',
        title: err?.message || 'Gagal mengirim ulang kode OTP',
      });
    } finally {
      setIsResending(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpCode = otp.join('');

    if (otpCode.length !== 6) {
      Toast.fire({ icon: 'warning', title: 'Masukkan 6 digit kode OTP terlebih dahulu' });
      return;
    }

    setIsVerifying(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otpCode,
        type: 'recovery',
      });
      if (error) throw error;

      Toast.fire({
        icon: 'success',
        title: 'OTP valid! Silakan buat sandi baru.',
      });
      setStep('reset');
    } catch (err: any) {
      const msg = err?.message?.toLowerCase() || '';
      CustomSwal.fire({
        icon: 'error',
        title: 'Kode OTP Tidak Valid',
        text:
          msg.includes('expired') || msg.includes('invalid') || msg.includes('token')
            ? 'Kode OTP salah atau sudah kedaluwarsa. Periksa kembali atau kirim ulang kode.'
            : err?.message || 'Terjadi kesalahan saat memverifikasi kode.',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      Toast.fire({ icon: 'warning', title: 'Kata sandi baru minimal 6 karakter' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.fire({ icon: 'error', title: 'Konfirmasi kata sandi tidak cocok' });
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;

      Toast.fire({
        icon: 'success',
        title: 'Kata sandi berhasil diperbarui!',
      });
      onClose();
    } catch (err: any) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Menyimpan Sandi',
        text: err?.message || 'Terjadi kesalahan saat memperbarui sandi.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isVerifying && !isSaving) {
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[350px] overflow-hidden rounded-[1.85rem] border border-stone-100 bg-white shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-5 py-3.5">
              <span className="font-['Outfit',sans-serif] text-sm font-bold text-[#1c1917]">
                {step === 'otp' ? 'Verifikasi' : 'Reset'}{' '}
                <span className="text-orange-600">
                  {step === 'otp' ? 'Kode OTP' : 'Kata Sandi'}
                </span>
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={isVerifying || isSaving}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200/60 text-stone-500 transition hover:bg-stone-200 disabled:opacity-50"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-6">
              <AnimatePresence mode="wait">
                {step === 'otp' ? (
                  <motion.form
                    key="step-otp"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleVerifyOtp}
                    className="space-y-5"
                  >
                    <div className="text-center">
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2">
                        <img
                          src="/logo.webp"
                          alt="CamHub"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <h4 className="font-['Playfair_Display',serif] text-xl font-bold text-[#1c1917]">
                        Masukkan OTP
                      </h4>
                      <p className="mt-1 text-[11px] leading-relaxed text-stone-500">
                        Kode 6 digit otomatis dikirim ke{' '}
                        <span className="font-bold text-stone-800">{email}</span>
                      </p>
                    </div>

                    <div>
                      <div className="grid grid-cols-6 gap-2">
                        {otp.map((digit, idx) => (
                          <input
                            key={idx}
                            ref={(el) => {
                              inputRefs.current[idx] = el;
                            }}
                            type="text"
                            inputMode="numeric"
                            autoComplete={idx === 0 ? 'one-time-code' : 'off'}
                            maxLength={1}
                            value={digit}
                            disabled={isVerifying}
                            onChange={(e) => handleOtpChange(idx, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                            onPaste={handleOtpPaste}
                            className="h-11 w-full rounded-xl border border-stone-200 bg-stone-50/70 text-center font-['Outfit',sans-serif] text-base font-extrabold text-[#1c1917] outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
                          />
                        ))}
                      </div>

                      <div className="mt-3 flex justify-center">
                        <button
                          type="button"
                          onClick={handleResendOtp}
                          disabled={cooldown > 0 || isResending}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-orange-600 transition hover:text-orange-500 disabled:text-stone-400"
                        >
                          {isResending ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <RotateCw className="h-3 w-3" />
                          )}
                          {cooldown > 0
                            ? `Kirim ulang kode dalam ${cooldown}d`
                            : 'Tidak menerima email? Kirim ulang'}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isVerifying || otp.join('').length !== 6}
                      className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-600/25 transition hover:bg-orange-500 active:scale-95 disabled:opacity-60"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Memeriksa Kode...
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="h-4 w-4" /> Verifikasi Kode OTP
                        </>
                      )}
                    </button>
                  </motion.form>
                ) : (
                  <motion.form
                    key="step-reset"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.2 }}
                    onSubmit={handleSavePassword}
                    className="space-y-3.5"
                  >
                    <div className="mb-2 text-center">
                      <h4 className="font-['Playfair_Display',serif] text-xl font-bold text-[#1c1917]">
                        Buat Sandi Baru
                      </h4>
                      <p className="mt-1 text-[11px] text-stone-500">
                        Masukkan kata sandi baru untuk akun Anda.
                      </p>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Kata Sandi Baru
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          disabled={isSaving}
                          placeholder="Minimal 6 karakter"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-2.5 pl-10 pr-4 text-xs text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold uppercase tracking-wider text-stone-500">
                        Ulangi Sandi Baru
                      </label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          disabled={isSaving}
                          placeholder="Ketik ulang sandi"
                          className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-2.5 pl-10 pr-4 text-xs text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-0.5">
                      <input
                        type="checkbox"
                        id="profile-show-pwd"
                        checked={showPassword}
                        onChange={() => setShowPassword(!showPassword)}
                        className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
                      />
                      <label htmlFor="profile-show-pwd" className="text-xs text-stone-600">
                        Tampilkan sandi
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSaving}
                      className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-600 py-3 text-xs font-extrabold text-white shadow-md shadow-orange-600/25 transition hover:bg-orange-500 active:scale-95 disabled:opacity-60"
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                        </>
                      ) : (
                        <>
                          <Check className="h-4 w-4" /> Simpan Kata Sandi
                        </>
                      )}
                    </button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
