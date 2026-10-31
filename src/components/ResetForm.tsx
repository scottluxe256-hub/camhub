import { useState } from 'react';
import { Lock } from 'lucide-react';
import type { AuthView } from './AuthModal';

export default function ResetForm({ onSwitchView }: { onSwitchView: (view: AuthView) => void }) {
    const [showPassword, setShowPassword] = useState(false);

    return (
        <>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-center font-['Playfair_Display',serif] text-2xl font-bold text-[#1c1917] sm:text-3xl">Sandi Baru</h3>
            <p className="mt-1 text-center text-xs text-stone-500 mb-6">Silakan buat kata sandi baru untuk akun Anda.</p>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSwitchView('login'); }}>
                <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Kata Sandi Baru</label>
                    <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Minimal 6 karakter" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-11 text-xs text-stone-800 outline-none focus:border-orange-500" />
                    </div>
                </div>
                <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Ulangi Sandi Baru</label>
                    <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input type={showPassword ? 'text' : 'password'} placeholder="Ketik ulang sandi" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-11 text-xs text-stone-800 outline-none focus:border-orange-500" />
                    </div>
                </div>

                <div className="flex items-center gap-2 mt-2 mb-4">
                    <input type="checkbox" id="show-pwd" checked={showPassword} onChange={() => setShowPassword(!showPassword)} className="rounded border-stone-300 text-orange-600 focus:ring-orange-500" />
                    <label htmlFor="show-pwd" className="text-xs text-stone-600">Tampilkan sandi</label>
                </div>

                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-bold text-white transition hover:bg-orange-500">
                    Simpan Sandi & Masuk
                </button>
            </form>
        </>
    );
}