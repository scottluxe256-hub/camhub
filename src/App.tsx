import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import OnboardingModal from './components/OnboardingModal';
import SplashScreen, { SPLASH_SESSION_KEY } from './components/SplashScreen';
import { supabase } from './lib/supabase';
import { initOneSignal, setOneSignalUser, logoutOneSignal } from './lib/onesignal';

function checkIsRefreshVisit(): boolean {
  if (typeof window === 'undefined') return false;
  if (typeof window.__CAMHUB_IS_REFRESH__ === 'boolean') {
    return window.__CAMHUB_IS_REFRESH__;
  }
  try {
    return sessionStorage.getItem(SPLASH_SESSION_KEY) === '1';
  } catch {
    return false;
  }
}

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isRefreshVisit] = useState<boolean>(() => checkIsRefreshVisit());
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      // 1. Tunggu OneSignal beres inisialisasi dulu
      await initOneSignal();

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
        // 2. Baru ikat user.id Supabase ke OneSignal
        await setOneSignalUser(session.user.id);
        
        // Cek apakah profil ada dan NIS sudah terisi
        const { data: profile } = await supabase
          .from('profiles')
          .select('nis')
          .eq('id', session.user.id)
          .single();
        
        // Kalau gak nemu NIS, berarti wajib isi form Onboarding
        if (!profile || !profile.nis) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } else {
        setUserId(null);
        setNeedsOnboarding(false);
      }
    };
    
    checkUserStatus();

    // Dengerin kalau ada yang baru login atau logout
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        checkUserStatus();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setNeedsOnboarding(false);
        await logoutOneSignal();
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // Saat refresh, Navbar langsung siap di atas tanpa menunggu handover luncuran logo
  const isNavbarReady = isSplashFinished || isRefreshVisit;

  return (
    <>
      {/* Kunjungan pertama: Splash penuh -> Logo -> Navbar | Refresh: Kapsul simpel "Memuat CamHub..." */}
      {!isSplashFinished && (
        <SplashScreen
          isRefresh={isRefreshVisit}
          onComplete={() => setIsSplashFinished(true)}
        />
      )}

      {/* Tunggu loader selesai baru tampilkan OnboardingModal kalau wajib */}
      {isSplashFinished && needsOnboarding && userId && (
        <OnboardingModal 
          userId={userId} 
          onComplete={() => setNeedsOnboarding(false)} 
        />
      )}
      
      <LandingPage isSplashFinished={isNavbarReady} />
    </>
  );
}
