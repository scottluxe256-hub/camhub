import { useCallback, useEffect, useRef, useState } from 'react';
import OneSignal from 'react-onesignal';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import { getAuthErrorMessage } from './auth.config';

interface GoogleCredentialResponse {
  credential: string;
  select_by?: string;
}

interface GoogleIdConfiguration {
  client_id: string;
  callback: (response: GoogleCredentialResponse) => void;
  auto_select?: boolean;
  cancel_on_tap_outside?: boolean;
  use_fedcm_for_prompt?: boolean;
}

interface GoogleButtonConfiguration {
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfiguration) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfiguration
          ) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

const GSI_SCRIPT_ID = 'google-identity-services-script';
const GSI_SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

function loadGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.google?.accounts?.id) return Promise.resolve();

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(
      GSI_SCRIPT_ID
    ) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener(
        'error',
        () => reject(new Error('Gagal memuat layanan login Google.')),
        { once: true }
      );
      return;
    }

    const script = document.createElement('script');
    script.id = GSI_SCRIPT_ID;
    script.src = GSI_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error('Gagal terhubung ke Google Identity Services.'));
    document.head.appendChild(script);
  });
}

interface UseGoogleIdAuthParams {
  onSuccess: () => void;
  errorTitle?: string;
}

export function useGoogleIdAuth({
  onSuccess,
  errorTitle = 'Gagal Masuk dengan Google',
}: UseGoogleIdAuthParams) {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleReady, setGoogleReady] = useState(false);

  const buttonOverlayRef = useRef<HTMLDivElement | null>(null);
  const onSuccessRef = useRef(onSuccess);
  const errorTitleRef = useRef(errorTitle);
  onSuccessRef.current = onSuccess;
  errorTitleRef.current = errorTitle;

  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
  const isGoogleConfigured = Boolean(clientId);

  const handleCredentialCallback = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        CustomSwal.fire({
          icon: 'error',
          title: errorTitleRef.current,
          text: 'Token kredensial Google tidak ditemukan.',
        });
        return;
      }

      setGoogleLoading(true);
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'google',
          token: response.credential,
        });

        if (error) throw error;

        try {
          await OneSignal.Notifications.requestPermission();
        } catch (err) {
          console.error('Gagal memuat pop-up OneSignal:', err);
        }

        onSuccessRef.current();
        Toast.fire({
          icon: 'success',
          title: 'Berhasil masuk ke CamHub!',
        });
      } catch (err) {
        CustomSwal.fire({
          icon: 'error',
          title: errorTitleRef.current,
          text: getAuthErrorMessage(err, 'Gagal menghubungkan akun Google.'),
        });
      } finally {
        setGoogleLoading(false);
      }
    },
    []
  );

  // Muat script Google Identity Services & inisialisasi
  useEffect(() => {
    if (!clientId) return;

    let cancelled = false;

    loadGoogleIdentityScript()
      .then(() => {
        if (cancelled || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialCallback,
          auto_select: false,
          cancel_on_tap_outside: true,
          use_fedcm_for_prompt: true,
        });

        setGoogleReady(true);
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('Google Identity Error:', err);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, handleCredentialCallback]);

  // Render tombol resmi Google secara transparan mengikuti lebar tombol custom
  useEffect(() => {
    const container = buttonOverlayRef.current;
    if (!googleReady || !container || !window.google?.accounts?.id) return;

    const renderOverlay = () => {
      if (!container || !window.google?.accounts?.id) return;
      const width = Math.max(200, Math.floor(container.offsetWidth || 320));
      container.innerHTML = '';
      window.google.accounts.id.renderButton(container, {
        theme: 'outline',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        width,
      });
    };

    renderOverlay();

    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(() => renderOverlay());
    observer.observe(container);
    return () => observer.disconnect();
  }, [googleReady]);

  const handleFallbackClick = useCallback(() => {
    if (!isGoogleConfigured) {
      CustomSwal.fire({
        icon: 'warning',
        title: 'Konfigurasi Google Belum Lengkap',
        text: 'Tambahkan VITE_GOOGLE_CLIENT_ID pada environment terlebih dahulu.',
      });
      return;
    }

    if (googleReady && window.google?.accounts?.id) {
      window.google.accounts.id.prompt();
    }
  }, [isGoogleConfigured, googleReady]);

  return {
    googleLoading,
    googleReady,
    isGoogleConfigured,
    buttonOverlayRef,
    handleFallbackClick,
  };
}
