import { useEffect, useState } from 'react';
import LandingPage from './pages/LandingPage';
import OnboardingModal from './components/OnboardingModal';
import { supabase } from './lib/supabase';

export default function App() {
  const [userId, setUserId] = useState<string | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  useEffect(() => {
    const checkUserStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
        
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
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        checkUserStatus();
      } else if (event === 'SIGNED_OUT') {
        setUserId(null);
        setNeedsOnboarding(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    }
  }, []);

  return (
    <>
      {/* Kalau wajib isi data, Modal ini bakal nutupin LandingPage */}
      {needsOnboarding && userId && (
        <OnboardingModal 
          userId={userId} 
          onComplete={() => setNeedsOnboarding(false)} 
        />
      )}
      
      <LandingPage />
    </>
  );
}
