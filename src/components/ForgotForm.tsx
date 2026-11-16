import { useState } from 'react';
import { ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { CustomSwal, Toast } from '../lib/CustomSwal';
import type { AuthView } from './AuthModal';

interface ForgotFormProps {
    onSwitchView: (view: AuthView) => void;
    onOtpSent: (email: string) => void;
}

export default function ForgotForm({ onSwitchView, onOtpSent }: ForgotFormProps) {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedEmail = email.trim().toLowerCase();

        if (!trimmedEmail) {
            Toast.fire({ icon: 'warning', title: 'Masukkan email terdaftar terlebih dahulu' });
            return;
        }

        setIsLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail);
            if (error) throw error;

            Toast.fire({
                icon: 'success',
                title: 'Kode OTP 6 digit terkirim ke email!',
            });
            onOtpSent(trimmedEmail);
        } catch (err: any) {
            const msg = err?.message?.toLowerCase() || '';
            CustomSwal.fire({
                icon: 'error',
                title: 'Gagal Mengirim OTP',
                text: msg.includes('rate limit')
                    ? 'Terlalu banyak permintaan. Tunggu 60 detik lalu coba lagi.'
                    : err?.message || 'Pastikan alamat email benar dan terhubung ke internet.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => onSwitchView('login')}
                disabled={isLoading}
                className="absolute top-8 left-8 flex items-center gap-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-stone-700 disabled:opacity-50"
            >
                <ArrowLeft size={14} /> Kembali
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-center font-['Playfair_Display',serif] text-2xl font-bold text-[#1c1917] sm:text-3xl">
                Pulihkan Sandi
            </h3>
            <p className="mt-1 text-center text-xs text-stone-500 mb-6">
                Kami akan mengirimkan 6 digit kode OTP ke email Anda.
            </p>

            <form className="space-y-4" onSubmit={handleSendOtp}>
                <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">
                        Email Terdaftar
                    </label>
                    <div className="relative mt-1.5">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={isLoading}
                            placeholder="nama@sekolah.sch.id"
                            className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-4 text-xs text-stone-800 outline-none transition focus:border-orange-500 focus:bg-white disabled:opacity-60"
                        />
                    </div>
                </div>
                <button
                    type="submit"
                    disabled={isLoading}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-bold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-500 active:scale-[0.98] disabled:opacity-60"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" /> Mengirim Kode OTP...
                        </>
                    ) : (
                        'Kirim Kode OTP'
                    )}
                </button>
            </form>
        </>
    );
}
