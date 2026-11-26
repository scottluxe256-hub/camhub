import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import OnboardingModal from './components/auth/OnboardingModal';
import SplashScreen, { SPLASH_SESSION_KEY } from './components/layout/SplashScreen';
import { initOneSignal, setOneSignalUser, logoutOneSignal } from './lib/onesignal';
import { useAuth } from './context/AuthContext';

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
  const { user, profile, loadingAuth, refreshProfile } = useAuth();
  const [isRefreshVisit] = useState<boolean>(() => checkIsRefreshVisit());
  const [isSplashFinished, setIsSplashFinished] = useState(false);

  // Sinkronisasi OneSignal di background (non-blocking) setiap status user berubah
  useEffect(() => {
    let active = true;

    const syncOneSignal = async () => {
      await initOneSignal();
      if (!active) return;

      if (user?.id) {
        await setOneSignalUser(user.id);
      } else {
        await logoutOneSignal();
      }
    };

    syncOneSignal();

    return () => {
      active = false;
    };
  }, [user?.id]);

  // Otomatis deteksi wajib onboarding dari state global tanpa query ulang
  const needsOnboarding = !loadingAuth && Boolean(user) && (!profile || !profile.nis);

  // Saat refresh, Navbar langsung siap di atas tanpa menunggu handover luncuran logo
  const isNavbarReady = isSplashFinished || isRefreshVisit;

  return (
    <>
      {!isSplashFinished && (
        <SplashScreen
          isRefresh={isRefreshVisit}
          onComplete={() => setIsSplashFinished(true)}
        />
      )}

      {isSplashFinished && needsOnboarding && user && (
        <OnboardingModal
          userId={user.id}
          onComplete={async () => {
            await refreshProfile();
          }}
        />
      )}

      {/* Nanti di Part 4, percabangan Role Guard isAdmin dipasang tepat di sini */}
      <LandingPage isSplashFinished={isNavbarReady} />
    </>
  );
}
