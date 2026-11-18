// @ts-nocheck
import { useState } from 'react';
import Navbar from '../components/layout/Navbar';
import Header from '../components/home/Header';
import SessionOne from '../components/home/SessionOne';
import Katalog from '../components/home/Katalog';
import SessionTwo from '../components/home/SessionTwo';
import Footer from '../components/layout/Footer';
import AuthModal from '../components/auth/AuthModal';

interface LandingPageProps {
  isSplashFinished?: boolean;
}

export default function LandingPage({ isSplashFinished = true }: LandingPageProps) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  // Fungsi pencegat yang akan diteruskan ke komponen anak
  const requireAuth = () => {
    // Nanti di sini kita pasang logika: 
    // Jika belum login -> setIsAuthOpen(true)
    // Jika sudah login -> lanjutkan aksi
    setIsAuthOpen(true); // Untuk sekarang langsung buka modal aja dulu
  };

  return (
    <div className="min-h-screen bg-[#fafaf9] text-stone-800 selection:bg-orange-500 selection:text-white">
      <Navbar
        isSplashFinished={isSplashFinished}
        onRequireAuth={requireAuth}
      />
      <main>
        <Header />
        <SessionOne />
        <Katalog onRequireAuth={requireAuth} />
        <SessionTwo onRequireAuth={requireAuth} />
      </main>
      <Footer />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        defaultView="login"
      />
    </div>
  );
}
