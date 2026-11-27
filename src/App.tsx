import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import InputCamera from './InputCamera';
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

  const isEditCameraMode =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('edit-kamera') === '1';

  // Tutup pre-react boot loader jika masuk ke mode edit kamera (karena SplashScreen dilewati)
  useEffect(() => {
    if (!isEditCameraMode) return;
    window.__CAMHUB_REACT_READY__ = true;
    document.getElementById('camhub-boot-loader')?.remove();
  }, [isEditCameraMode]);

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

  if (isEditCameraMode) {
    return <InputCamera />;
  }

  const needsOnboarding = !loadingAuth && Boolean(user) && (!profile || !profile.nis);
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
