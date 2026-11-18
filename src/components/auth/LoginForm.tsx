// @ts-nocheck
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2 } from 'lucide-react';
import type { AuthView } from './AuthModal';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import OneSignal from 'react-onesignal';

interface LoginFormProps {
    onSwitchView: (view: AuthView) => void;
    onClose: () => void;
    onGoToOtp: (email: string) => void;
}

export default function LoginForm({ onSwitchView, onClose, onGoToOtp }: LoginFormProps) {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [emailCallbackError, setEmailCallbackError] = useState('');
    const [shakeEmail, setShakeEmail] = useState(0);

    const emailInputRef = useRef<HTMLInputElement>(null);

    const trimmedEmail = email.trim().toLowerCase();
    const isEmailReady = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);

    const handleLogin = async (e: React.FormEvent) => {
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
        } else {
            try {
                await OneSignal.Notifications.requestPermission();
            } catch (err) {
                console.error("Gagal memuat pop-up OneSignal:", err);
            }

            setLoading(false);
            onClose();
            Toast.fire({
                icon: 'success',
                title: 'Berhasil masuk ke CamHub!',
            });
        }
    };

    const handleForgotPassword = () => {
        if (loading) return;

        // Callback langsung ke kotak EMAIL di atas kalau belum diisi / belum valid
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

        // Langsung pindah ke halaman OTP (proses & animasi kirim OTP berjalan di halaman OTP)
        setEmailCallbackError('');
        onGoToOtp(trimmedEmail);
    };

    const handleGoogleLogin = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });

            if (error) throw error;

        } catch (error: any) {
            console.error("Error Google Login:", error.message);
            CustomSwal.fire({
                icon: 'error',
                title: 'Gagal Masuk dengan Google',
                text: error.message,
            });
        }
    };

    return (
        <div className="flex flex-col w-full py-2">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-extrabold text-[#1c1917] sm:text-3xl">Masuk Akun</h3>
            <p className="mt-1 text-center text-xs font-medium text-stone-500 mb-6">Gunakan email yang terdaftar.</p>

            {errorMsg && <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-xs font-semibold text-red-600 border border-red-100">{errorMsg}</div>}

            <form className="space-y-4" onSubmit={handleLogin}>
                <div>
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Email</label>
                    <motion.div
                        key={shakeEmail}
                        animate={shakeEmail > 0 ? { x: [-6, 6, -4, 4, 0] } : { x: 0 }}
                        transition={{ duration: 0.35 }}
                        className="relative mt-1.5"
                    >
                        <Mail
                            className={`absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors ${
                                emailCallbackError ? 'text-red-500' : 'text-stone-400'
                            }`}
                        />
                        <input
                            ref={emailInputRef}
                            type="email"
                            required
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                if (emailCallbackError) setEmailCallbackError('');
                            }}
                            disabled={loading}
                            placeholder="nama@gmail.com"
                            className={`w-full rounded-2xl border py-3 pl-11 pr-4 text-xs font-medium text-stone-800 outline-none transition disabled:opacity-60 ${
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
                    <label className="text-[11px] font-extrabold uppercase tracking-wider text-stone-500">Kata Sandi</label>
                    <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={loading}
                            placeholder="Masukkan kata sandi"
                            className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                    <div className="mt-2 flex w-full justify-end">
                        <button
                            type="button"
                            onClick={handleForgotPassword}
                            disabled={loading}
                            className={`text-[11px] font-bold transition disabled:opacity-60 ${
                                isEmailReady
                                    ? 'text-orange-600 hover:underline cursor-pointer'
                                    : 'text-stone-400 hover:text-stone-500'
                            }`}
                        >
                            Lupa sandi?
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-extrabold text-white transition hover:bg-orange-500 disabled:opacity-70"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <>Masuk Sekarang <ArrowRight size={14} /></>}
                </button>
            </form>

            <div className="relative my-6 flex items-center justify-center">
                <div className="w-full border-t border-stone-200" />
                <span className="absolute bg-white px-3 text-[11px] font-extrabold uppercase text-stone-400">atau</span>
            </div>

            <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-stone-200 py-3 text-xs font-extrabold text-stone-700 transition hover:bg-stone-50 active:scale-95 disabled:opacity-60"
            >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="h-4 w-4" alt="Google" />
                Masuk dengan Google
            </button>

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
