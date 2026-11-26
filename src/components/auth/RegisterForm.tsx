import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import type { AuthView } from './AuthModal';
import { supabase } from '../../lib/supabase';
import { CustomSwal } from '../../lib/CustomSwal';
import OneSignal from 'react-onesignal';

interface RegisterFormProps {
    onSwitchView: (view: AuthView) => void;
    onClose: () => void;
}

export default function RegisterForm({ onSwitchView, onClose }: RegisterFormProps) {
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            // 1. Daftarkan akun ke Supabase Auth
            const { error: authError } = await supabase.auth.signUp({
                email: formData.email.trim(),
                password: formData.password,
            });

            if (authError) throw authError;

            // 2. Minta izin notifikasi ke pengguna baru
            try {
                await OneSignal.Notifications.requestPermission();
            } catch (err) {
                console.error("Gagal memuat pop-up OneSignal:", err);
            }

            // 3. Tutup modal otomatis tanpa refresh halaman (Navbar otomatis update ke inisial akun)
            setLoading(false);
            onClose();

            // 4. Tampilkan SweetAlert sukses di atas halaman utama
            CustomSwal.fire({
                icon: 'success',
                title: 'Pendaftaran Berhasil!',
                text: 'Akun CamHub kamu sudah aktif dan siap digunakan.',
                timer: 2500,
                showConfirmButton: false,
            });

        } catch (error: any) {
            setErrorMsg(error.message || 'Terjadi kesalahan saat mendaftar.');
            setLoading(false);
        }
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
                title: 'Gagal Daftar dengan Google',
                text: error.message,
            });
        }
    };

    return (
        <div className="flex flex-col w-full">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="w-full object-contain" />
            </div>
            <h3 className="text-center font-['Outfit',sans-serif] text-2xl font-extrabold text-[#1c1917] sm:text-3xl">Pendaftaran</h3>
            <p className="mt-1 text-center text-xs font-medium text-stone-500 mb-6">Gunakan email untuk membuat akun baru.</p>

            {errorMsg && <div className="mb-4 rounded-xl bg-red-50 p-3 text-center text-xs font-semibold text-red-600 border border-red-100">{errorMsg}</div>}

            <form className="space-y-4" onSubmit={handleRegister}>
                <div>
                    <label className="text-[11px] font-extrabold uppercase text-stone-500">Email</label>
                    <div className="relative mt-1.5">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="nama@gmail.com"
                            className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-4 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-[11px] font-extrabold uppercase text-stone-500">Buat Kata Sandi</label>
                    <div className="relative mt-1.5">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type={showPassword ? 'text' : 'password'}
                            name="password"
                            required
                            minLength={6}
                            value={formData.password}
                            onChange={handleChange}
                            disabled={loading}
                            placeholder="Minimal 6 karakter"
                            className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-11 text-xs font-medium text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                        >
                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-[#1c1917] py-3.5 text-xs font-extrabold text-white transition hover:bg-black disabled:opacity-70"
                >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : 'Buat Akun Sekarang'}
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
                Daftar dengan Google
            </button>

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
