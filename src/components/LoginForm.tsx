import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import type { AuthView } from './AuthModal';
import { supabase } from '../lib/supabase';
import OneSignal from 'react-onesignal';

export default function LoginForm({ onSwitchView }: { onSwitchView: (view: AuthView) => void }) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setErrorMsg(error.message);
            setLoading(false);
        } else {
            // Login sukses, tutup modal dengan mereload state otentikasi
            // Asumsi sementara: memuat ulang halaman untuk memicu useEffect session di App.tsx
            window.location.reload(); 
        }
    };

    const handleGoogleLogin = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({ 
            provider: 'google',
            options: {
                // Paksa Supabase buat balik ke URL saat ini (localhost:5173)
                redirectTo: window.location.origin 
            }
        });

        if (error) throw error;
        
    } catch (error: any) {
        console.error("Error Google Login:", error.message);
        alert("Gagal masuk dengan Google: " + error.message);
    }
};

    return (
        <div className="flex flex-col w-full py-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-extrabold text-[#1c1917] sm:text-3xl">Masuk Akun</h3>
            <p className="mt-1 text-center text-xs font-medium text-stone-500 mb-6">Gunakan email sekolah yang terdaftar.</p>

            {errorMsg && <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-xs font-semibold text-red-600 border border-red-100">{errorMsg}</div>}

            <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Email Sekolah</label>
                    <div className="relative mt-1.5">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="nama@sekolah.sch.id" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-4 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20" />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Kata Sandi</label>
                    <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Masukkan kata sandi" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20" />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600">
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="mt-2 flex w-full justify-end">
                        <button type="button" onClick={() => onSwitchView('forgot')} className="text-[11px] font-bold text-orange-600 hover:underline">
                            Lupa sandi?
                        </button>
                    </div>
                </div>

                <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-extrabold text-white transition hover:bg-orange-500 disabled:opacity-70">
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Masuk Sekarang <ArrowRight size={14} /></>}
                </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-stone-200" />
                <span className="absolute bg-white px-3 text-[11px] font-extrabold uppercase text-stone-400">atau</span>
            </div>

            <button type="button" onClick={handleGoogleLogin} className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 py-3 text-xs font-extrabold text-stone-700 transition hover:bg-stone-50 active:scale-95">
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-4 w-4" alt="Google" />
                Masuk dengan Google
            </button>

            <p className="mt-6 pb-4 text-center text-[11px] font-medium text-stone-500">
                Belum punya akun? <button onClick={() => onSwitchView('register')} className="font-bold text-orange-600 hover:underline">Daftar di sini</button>
            </p>
        </div>
    );
}
