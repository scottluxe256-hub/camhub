// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { ArrowLeft, Loader2, RotateCw, ShieldCheck, Send } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import type { AuthView } from './AuthModal';

interface OtpFormProps {
    email: string;
    onSwitchView: (view: AuthView) => void;
    onVerified: (client: SupabaseClient) => void;
}

export default function OtpForm({ email, onSwitchView, onVerified }: OtpFormProps) {
    const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
    const [isSendingInitial, setIsSendingInitial] = useState(true);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isResending, setIsResending] = useState(false);
    const [cooldown, setCooldown] = useState(60);

    const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
    const hasSentInitialRef = useRef(false);

    // Kirim OTP otomatis begitu masuk ke halaman OTP
    useEffect(() => {
        if (!email) {
            onSwitchView('login');
            return;
        }
        if (hasSentInitialRef.current) return;
        hasSentInitialRef.current = true;

        const sendInitialOtp = async () => {
            setIsSendingInitial(true);
            try {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;

                setCooldown(60);
                Toast.fire({
                    icon: 'success',
                    title: 'Kode OTP 6 digit terkirim ke email!',
                });
            } catch (err: any) {
                const msg = err?.message?.toLowerCase() || '';
                CustomSwal.fire({
                    icon: 'error',
                    title: 'Gagal Mengirim OTP',
                    text: msg.includes('rate limit')
                        ? 'Terlalu banyak permintaan. Tunggu 60 detik lalu tekan kirim ulang.'
                        : err?.message || 'Gagal mengirim kode OTP ke email.',
                });
                setCooldown(0);
            } finally {
                setIsSendingInitial(false);
                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            }
        };

        sendInitialOtp();
    }, [email, onSwitchView]);

    useEffect(() => {
        if (isSendingInitial || cooldown <= 0) return;
        const timer = setInterval(() => {
            setCooldown((prev) => (prev > 0 ? prev - 1 : 0));
        }, 1000);
        return () => clearInterval(timer);
    }, [isSendingInitial, cooldown]);

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
        if (cooldown > 0 || isResending || isSendingInitial || !email) return;

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

        if (!email) {
            onSwitchView('login');
            return;
        }

        if (otpCode.length !== 6) {
            Toast.fire({ icon: 'warning', title: 'Masukkan 6 digit kode OTP terlebih dahulu' });
            return;
        }

        setIsVerifying(true);
        try {
            // Client terisolasi di memori saja agar sesi aplikasi utama TIDAK otomatis login
            const ephemeralClient = createClient(
                (supabase as any).supabaseUrl,
                (supabase as any).supabaseKey,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false,
                    },
                }
            );

            const { data, error } = await ephemeralClient.auth.verifyOtp({
                email,
                token: otpCode,
                type: 'recovery',
            });
            if (error) throw error;
            if (!data.session) throw new Error('Sesi pemulihan tidak ditemukan.');

            Toast.fire({
                icon: 'success',
                title: 'OTP valid! Silakan buat sandi baru.',
            });
            onVerified(ephemeralClient);
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

    return (
        <>
            <button
                type="button"
                onClick={() => onSwitchView('login')}
                disabled={isVerifying || isSendingInitial}
                className="absolute top-8 left-8 flex items-center gap-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-stone-700 disabled:opacity-50"
            >
                <ArrowLeft size={14} /> Ubah Email
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
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
                        Sedang mengirim ke <span className="font-semibold text-stone-700">{email}</span>
                    </p>
                </div>
            ) : (
                <>
                    <p className="mt-1.5 text-center text-xs text-stone-500 mb-6 leading-relaxed">
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
                                        className="h-12 sm:h-13 w-full rounded-2xl border border-stone-200 bg-stone-50/70 text-center font-['Outfit',sans-serif] text-lg font-extrabold text-[#1c1917] outline-none transition focus:border-orange-500 focus:bg-white focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
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
