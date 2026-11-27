import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { AuthView } from '../../logics/auth/auth.config';
import { useRegisterForm } from '../../logics/auth/useRegisterForm';
import { useGoogleIdAuth } from '../../logics/auth/useGoogleIdAuth';

interface RegisterFormProps {
  onSwitchView: (view: AuthView) => void;
  onClose: () => void;
}

export default function RegisterForm({
  onSwitchView,
  onClose,
}: RegisterFormProps) {
  const {
    formData,
    showPassword,
    setShowPassword,
    loading,
    errorMsg,
    handleChange,
    handleRegister,
  } = useRegisterForm({ onClose });

  const {
    googleLoading,
    googleReady,
    buttonOverlayRef,
    handleFallbackClick,
  } = useGoogleIdAuth({
    onSuccess: onClose,
    errorTitle: 'Gagal Daftar dengan Google',
  });

  const isBusy = loading || googleLoading;

  return (
    <div className="flex w-full flex-col">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2.5">
        <img src="/logo.webp" alt="Logo" className="w-full object-contain" />
      </div>
      <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-extrabold text-[#1c1917] sm:text-3xl">
        Pendaftaran
      </h3>
      <p className="mb-6 mt-1 text-center text-xs font-medium text-stone-500">
        Gunakan email untuk membuat akun baru.
      </p>

      {errorMsg && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50 p-3 text-center text-xs font-semibold text-red-600">
          {errorMsg}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleRegister}>
        <div>
          <label className="text-[11px] font-extrabold text-stone-500 uppercase">
            Email
          </label>
          <div className="relative mt-1.5">
            <Mail className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              disabled={isBusy}
              placeholder="nama@gmail.com"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pr-4 pl-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
            />
          </div>
        </div>

        <div>
          <label className="text-[11px] font-extrabold text-stone-500 uppercase">
            Buat Kata Sandi
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              disabled={isBusy}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pr-11 pl-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-4 -translate-y-1/2 text-stone-400 hover:text-stone-600"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isBusy}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#1c1917] py-3.5 text-xs font-extrabold text-white transition hover:bg-black disabled:opacity-70"
        >
          {loading ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            'Buat Akun Sekarang'
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
          {googleLoading ? 'Menghubungkan Google...' : 'Daftar dengan Google'}
        </button>

        {googleReady && !isBusy && (
          <div
            ref={buttonOverlayRef}
            aria-hidden="true"
            className="absolute inset-0 z-10 flex items-center justify-center overflow-hidden opacity-[0.01]"
          />
        )}
      </div>

      <p className="mt-6 pb-2 text-center text-[11px] font-medium text-stone-500">
        Sudah punya akun?{' '}
        <button
          type="button"
          onClick={() => onSwitchView('login')}
          className="font-bold text-orange-600 hover:underline"
        >
          Masuk di sini
        </button>
      </p>
    </div>
  );
}
