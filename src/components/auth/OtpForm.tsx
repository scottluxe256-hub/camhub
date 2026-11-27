import type { SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Loader2, RotateCw, ShieldCheck, Send } from 'lucide-react';
import type { AuthView } from '../../logics/auth/auth.config';
import { useOtpForm } from '../../logics/auth/useOtpForm';

interface OtpFormProps {
  email: string;
  onSwitchView: (view: AuthView) => void;
  onVerified: (client: SupabaseClient) => void;
}

export default function OtpForm({
  email,
  onSwitchView,
  onVerified,
}: OtpFormProps) {
  const {
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
  } = useOtpForm({ email, onSwitchView, onVerified });

  return (
    <>
      <button
        type="button"
        onClick={() => onSwitchView('login')}
        disabled={isVerifying || isSendingInitial}
        className="absolute top-8 left-8 flex items-center gap-1.5 text-[11px] font-bold text-stone-400 uppercase hover:text-stone-700 disabled:opacity-50"
      >
        <ArrowLeft size={14} /> Ubah Email
      </button>

      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2.5">
        <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
      </div>
      <h3 className="text-center font-['Playfair_Display',serif] text-2xl font-bold text-[#1c1917] sm:text-3xl">
        Masukkan OTP
      </h3>

      {isSendingInitial ? (
        <div className="my-8 flex flex-col items-center justify-center rounded-2xl border border-orange-100 bg-orange-50/50 px-5 py-7 text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600">
            <Send className="h-5 w-5 animate-pulse" />
          </div>
          <p className="text-xs font-bold text-stone-800">
            Mengirim Kode OTP 6 Digit...
          </p>
          <p className="mt-1 text-[11px] text-stone-500">
            Sedang mengirim ke{' '}
            <span className="font-semibold text-stone-700">{email}</span>
          </p>
        </div>
      ) : (
        <>
          <p className="mb-6 mt-1.5 text-center text-xs leading-relaxed text-stone-500">
            Kode 6 digit telah dikirim ke{' '}
            <span className="font-bold text-stone-800">{email}</span>
          </p>

          <form className="space-y-5" onSubmit={handleVerifyOtp}>
            <div>
              <div className="grid grid-cols-6 gap-2 sm:gap-2.5">
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
                    className="h-12 w-full rounded-2xl border border-stone-200 bg-stone-50/70 text-center font-['Outfit',sans-serif] text-lg font-extrabold text-[#1c1917] outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60 sm:h-13"
                  />
                ))}
              </div>

              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={cooldown > 0 || isResending}
                  className="flex items-center gap-1.5 text-xs font-bold text-orange-600 transition hover:text-orange-500 disabled:text-stone-400"
                >
                  {isResending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <RotateCw className="h-3.5 w-3.5" />
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
              className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-extrabold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-500 active:scale-[0.98] disabled:opacity-60"
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
          </form>
        </>
      )}
    </>
  );
}
