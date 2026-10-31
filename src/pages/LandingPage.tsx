import { useState } from 'react';
import Navbar from '../components/Navbar';
import Header from '../components/Header';
import SessionOne from '../components/SessionOne';
import Katalog from '../components/Katalog';
import SessionTwo from '../components/SessionTwo';
import Footer from '../components/Footer';
import AuthModal from '../components/AuthModal';

export default function LandingPage() {
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
      <Navbar onRequireAuth={requireAuth} />
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