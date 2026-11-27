import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { SupabaseClient } from '@supabase/supabase-js';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import OtpForm from './OtpForm';
import ResetForm from './ResetForm';
import {
  AUTH_MODAL_CONTENT,
  AUTH_SLIDE_TRANSITION,
  type AuthView,
} from '../../logics/auth/auth.config';

export type { AuthView };

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultView?: AuthView;
}

export default function AuthModal({
  isOpen,
  onClose,
  defaultView = 'login',
}: AuthModalProps) {
  const [view, setView] = useState<AuthView>(defaultView);
  const [recoveryEmail, setRecoveryEmail] = useState('');
  const [recoveryClient, setRecoveryClient] = useState<SupabaseClient | null>(
    null
  );

  useEffect(() => {
    if (isOpen) {
      setView(defaultView);
      if (defaultView !== 'otp' && defaultView !== 'reset') {
        setRecoveryEmail('');
        setRecoveryClient(null);
      }
    } else {
      setRecoveryEmail('');
      setRecoveryClient(null);
    }
  }, [isOpen, defaultView]);

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 20 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className={`relative flex h-auto max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-[2.5rem] border border-white/10 bg-white shadow-2xl md:h-[650px] ${
          view === 'register' ? 'md:flex-row-reverse' : 'md:flex-row'
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
          transition={AUTH_SLIDE_TRANSITION}
          className="relative z-20 flex h-48 shrink-0 flex-col justify-center overflow-hidden p-6 text-center text-white shadow-[0_0_40px_rgba(0,0,0,0.1)] sm:h-56 md:h-full md:w-1/2"
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
              {AUTH_MODAL_CONTENT[view].title}
            </h2>
            <p className="mt-2 text-[11px] leading-relaxed text-stone-200 md:text-xs">
              {AUTH_MODAL_CONTENT[view].desc}
            </p>
          </motion.div>
        </motion.div>

        {/* ================= SISI FORMULIR ================= */}
        <motion.div
          layout
          transition={AUTH_SLIDE_TRANSITION}
          className="relative z-10 flex flex-1 flex-col overflow-y-auto bg-white md:w-1/2 [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
        >
          <div className="m-auto flex w-full flex-col px-8 py-10 sm:px-12">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, x: view === 'register' ? -15 : 15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: view === 'register' ? 15 : -15 }}
                transition={{ duration: 0.3 }}
                className="flex w-full flex-col"
              >
                {view === 'login' && (
                  <LoginForm
                    onSwitchView={setView}
                    onClose={onClose}
                    onGoToOtp={(email) => {
                      setRecoveryEmail(email);
                      setRecoveryClient(null);
                      setView('otp');
                    }}
                  />
                )}
                {view === 'register' && (
                  <RegisterForm onSwitchView={setView} onClose={onClose} />
                )}
                {view === 'otp' && (
                  <OtpForm
                    email={recoveryEmail}
                    onSwitchView={setView}
                    onVerified={(client) => {
                      setRecoveryClient(client);
                      setView('reset');
                    }}
                  />
                )}
                {view === 'reset' && (
                  <ResetForm
                    email={recoveryEmail}
                    recoveryClient={recoveryClient}
                    onSwitchView={setView}
                    onSuccess={onClose}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
