import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import ForgotForm from './ForgotForm';
import ResetForm from './ResetForm';

export type AuthView = 'login' | 'register' | 'forgot' | 'reset';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    defaultView?: AuthView;
}

export default function AuthModal({ isOpen, onClose, defaultView = 'login' }: AuthModalProps) {
    const [view, setView] = useState<AuthView>(defaultView);

    // Sinkronisasi view saat modal dibuka kembali
    useEffect(() => {
        if (isOpen) setView(defaultView);
    }, [isOpen, defaultView]);

    // Kunci scroll halaman belakang (landing page) saat modal aktif
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }

        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const leftSideContent = {
        login: {
            title: 'Akses Semua Alat Produksi.',
            desc: 'Masuk untuk mulai meminjam kamera, lensa, dan kelengkapan lab lainnya.'
        },
        register: {
            title: 'Bergabung dengan CamHub.',
            desc: 'Daftarkan data dirimu sebagai siswa untuk mulai menggunakan fasilitas lab.'
        },
        forgot: {
            title: 'Lupa Kata Sandi?',
            desc: 'Tenang, masukkan email sekolahmu dan kami akan mengirimkan tautan pemulihan.'
        },
        reset: {
            title: 'Buat Sandi Baru.',
            desc: 'Pastikan kata sandi barumu kuat dan mudah diingat.'
        }
    };

    const slideTransition = { type: "spring", stiffness: 100, damping: 20 };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
            <motion.div
                initial={{ opacity: 0, scale: 0.96, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96, y: 20 }}
                transition={{ duration: 0.35, ease: 'easeOut' }}
                className={`relative flex w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-2xl h-auto max-h-[90vh] md:h-[650px] ${view === 'register' ? 'md:flex-row-reverse' : 'md:flex-row'
                    }`}
            >
                {/* Tombol Tutup (X) */}
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-5 right-5 z-30 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 text-stone-500 backdrop-blur-sm transition hover:bg-stone-200 hover:text-stone-800"
                >
                    ✕
                </button>

                {/* ================= SISI GAMBAR ================= */}
                <motion.div
                    layout
                    transition={slideTransition}
                    className="relative z-20 flex h-48 shrink-0 flex-col justify-center overflow-hidden p-6 text-center text-white sm:h-56 md:h-full md:w-1/2 shadow-[0_0_40px_rgba(0,0,0,0.1)]"
                >
                    <img
                        src="/sessions2.avif"
                        alt="Multimedia Studio"
                        className="absolute inset-0 h-full w-full object-cover brightness-90 contrast-115"
                    />
                    <div className="absolute inset-0 bg-black/40" />

                    <motion.div
                        key={view}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4 }}
                        className="relative z-10 mx-auto flex max-w-[260px] flex-col items-center justify-center"
                    >
                        <h2 className="font-['Playfair_Display',serif] text-xl font-bold leading-tight text-white md:text-2xl">
                            {leftSideContent[view].title}
                        </h2>
                        <p className="mt-2 text-[11px] leading-relaxed text-stone-200 md:text-xs">
                            {leftSideContent[view].desc}
                        </p>
                    </motion.div>
                </motion.div>

                {/* ================= SISI FORMULIR ================= */}
                <motion.div
                    layout
                    transition={slideTransition}
                    className="relative z-10 flex flex-1 flex-col overflow-y-auto bg-white md:w-1/2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
                >
                    <div className="flex flex-col px-8 py-10 sm:px-12 m-auto w-full">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={view}
                                initial={{ opacity: 0, x: view === 'register' ? -15 : 15 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: view === 'register' ? 15 : -15 }}
                                transition={{ duration: 0.3 }}
                                className="flex flex-col w-full"
                            >
                                {view === 'login' && <LoginForm onSwitchView={setView} />}
                                {view === 'register' && <RegisterForm onSwitchView={setView} />}
                                {view === 'forgot' && <ForgotForm onSwitchView={setView} />}
                                {view === 'reset' && <ResetForm onSwitchView={setView} />}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </motion.div>

            </motion.div>
        </div>
    );
}