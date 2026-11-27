import type { SupabaseClient } from '@supabase/supabase-js';
import { Lock, Loader2, Check } from 'lucide-react';
import type { AuthView } from '../../logics/auth/auth.config';
import { useResetForm } from '../../logics/auth/useResetForm';

interface ResetFormProps {
  email: string;
  recoveryClient: SupabaseClient | null;
  onSwitchView: (view: AuthView) => void;
  onSuccess: () => void;
}

export default function ResetForm({
  email,
  recoveryClient,
  onSwitchView,
  onSuccess,
}: ResetFormProps) {
  const {
    newPassword,
    setNewPassword,
    confirmPassword,
    setConfirmPassword,
    showPassword,
    setShowPassword,
    isSaving,
    handleSavePassword,
  } = useResetForm({ email, recoveryClient, onSwitchView, onSuccess });

  return (
    <>
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-orange-500/20 bg-orange-500/10 p-2.5">
        <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
      </div>
      <h3 className="text-center font-['Playfair_Display',serif] text-2xl font-bold text-[#1c1917] sm:text-3xl">
        Sandi Baru
      </h3>
      <p className="mb-6 mt-1 text-center text-xs text-stone-500">
        Silakan buat kata sandi baru untuk akun Anda.
      </p>

      <form className="space-y-4" onSubmit={handleSavePassword}>
        <div>
          <label className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
            Kata Sandi Baru
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isSaving}
              placeholder="Minimal 6 karakter"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pr-4 pl-11 text-xs text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
            />
          </div>
        </div>
        <div>
          <label className="text-[11px] font-bold tracking-wider text-stone-500 uppercase">
            Ulangi Sandi Baru
          </label>
          <div className="relative mt-1.5">
            <Lock className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isSaving}
              placeholder="Ketik ulang sandi"
              className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pr-4 pl-11 text-xs text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
            />
          </div>
        </div>

        <div className="mt-2 mb-4 flex items-center gap-2">
          <input
            type="checkbox"
            id="show-pwd"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="rounded border-stone-300 text-orange-600 focus:ring-orange-500"
          />
          <label htmlFor="show-pwd" className="text-xs text-stone-600">
            Tampilkan sandi
          </label>
        </div>

        <button
          type="submit"
          disabled={isSaving}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-500 active:scale-[0.98] disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan & Masuk...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" /> Simpan Sandi & Masuk
            </>
          )}
        </button>
      </form>
    </>
  );
}
