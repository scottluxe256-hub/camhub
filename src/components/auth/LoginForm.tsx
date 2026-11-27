import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import type { AuthView } from '../../logics/auth/auth.config';
import { useLoginForm } from '../../logics/auth/useLoginForm';
import { useGoogleIdAuth } from '../../logics/auth/useGoogleIdAuth';

interface LoginFormProps {
  onSwitchView: (view: AuthView) => void;
  onClose: () => void;
  onGoToOtp: (email: string) => void;
}

export default function LoginForm({
  onSwitchView,
  onClose,
  onGoToOtp,
}: LoginFormProps) {
  const {
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
  } = useLoginForm({ onClose, onGoToOtp });

  const {
    googleLoading,
    googleReady,
    buttonOverlayRef,
    handleFallbackClick,
  } = useGoogleIdAuth({
    onSuccess: onClose,
    errorTitle: 'Gagal Masuk dengan Google',
  });

  const isBusy = loading || googleLoading;

  return (
    <div className="flex w-full flex-col py-2">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2.5">
        <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
      </div>
      <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-extrabold text-[#1c1917] sm:text-3xl">
        Masuk Akun
      </h3>
      <p className="mb-6 mt-1 text-center text-xs font-medium text-stone-500">
        Gunakan email yang terdaftar.
      </p>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
          {errorMsg}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleLogin}>
        <div>
          <label className="text-[11px] font-extrabold tracking-wider text-stone-500 uppercase">
            Email
          </label>
          <motion.div
            key={shakeEmail}
            animate={shakeEmail > 0 ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
            transition={{ duration: 0.35 }}
            className="relative mt-1.5"
          >
            <Mail
              className={`absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 transition-colors ${
                emailCallbackError ? 'text-red-500' : 'text-stone-400'
              }`}
            />
            <input
              ref={emailInputRef}
              type="email"
              required
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              disabled={isBusy}
              placeholder="nama@gmail.com"
              className={`w-full rounded-2xl border py-3 pr-4 pl-11 text-xs font-medium text-stone-800 outline-none transition disabled:opacity-60 ${
                emailCallbackError
                  ? 'border-red-400 bg-red-50/40 ring-2 ring-red-500/20 focus:border-red-500'
                  : 'border-stone-200 bg-stone-50/60 focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20'
              }`}
            />
          </motion.div>
          {emailCallbackError && (
            <p className="mt-1.5 ml-1 text-[11px] font-semibold text-red-600">
              {emailCallbackError}
            </p>
          )}
        </div>

        <div>
          <label className="text-[11px] font-extrabold tracking-wider text-stone-500 uppercase">
            Kata Sandi
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isBusy}
              placeholder="Masukkan kata sandi"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pr-11 pl-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <div className="mt-2 flex w-full justify-end">
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={isBusy}
              className={`text-[11px] font-bold transition disabled:opacity-60 ${
                isEmailReady
                  ? 'cursor-pointer text-orange-600 hover:underline'
                  : 'text-stone-400 hover:text-stone-500'
              }`}
            >
              Lupa sandi?
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-extrabold text-white transition hover:bg-orange-500 disabled:opacity-70"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <>
              Masuk Sekarang <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="relative my-6 flex items-center justify-center">
        <div className="w-full border-t border-stone-200" />
        <span className="absolute bg-white px-3 text-[11px] font-extrabold text-stone-400 uppercase">
          atau
        </span>
      </div>

      {/* Tombol Google Custom + Overlay GIS Resmi */}
      <div className="relative w-full overflow-hidden rounded-full">
        <button
          type="button"
          onClick={handleFallbackClick}
          disabled={isBusy}
          className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 py-3 text-xs font-extrabold text-stone-700 transition hover:bg-stone-50 active:scale-95 disabled:opacity-60"
        >
          {googleLoading ? (
            <Loader2 size={16} className="animate-spin text-orange-600" />
          ) : (
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              className="h-4 w-4"
              alt="Google"
            />
          )}
          {googleLoading ? 'Menghubungkan Google...' : 'Masuk dengan Google'}
        </button>

        {googleReady && !isBusy && (
          <div
            ref={buttonOverlayRef}
            aria-hidden="true"
            className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.01]"
          />
        )}
      </div>

      <p className="mt-6 pb-4 text-center text-[11px] font-medium text-stone-500">
        Belum punya akun?{' '}
        <button
          type="button"
          onClick={() => onSwitchView('register')}
          className="font-bold text-orange-600 hover:underline"
        >
          Daftar di sini
        </button>
      </p>
    </div>
  );
}
