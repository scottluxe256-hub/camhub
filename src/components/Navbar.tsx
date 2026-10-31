import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll } from './ScrollAnimate';
import { supabase } from '../lib/supabase';
import { CustomSwal, Toast } from '../lib/CustomSwal';
import { uploadToCloudinary } from '../utils/cloudinary';
import { 
  LogOut, 
  User, 
  Camera, 
  ShieldCheck, 
  Mail, 
  CreditCard, 
  GraduationCap, 
  Loader2,
  Pencil
} from 'lucide-react';

interface NavbarProps {
  onRequireAuth?: () => void;
}

export default function Navbar({ onRequireAuth }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [profileData, setProfileData] = useState<{
    nama_lengkap: string;
    nis: string;
    kelas: string;
    role: string;
    foto_url: string | null;
    foto_public_id: string | null;
  } | null>(null);

  const [editName, setEditName] = useState('');

  const sectionIds = ['hero', 'katalog', 'sop', 'feedback'];
  const { activeSection } = useScroll(sectionIds, 80);

  const fetchProfile = async (uid: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nama_lengkap, nis, kelas, role, foto_url, foto_public_id')
      .eq('id', uid)
      .single();

    if (!error && data) {
      setProfileData(data);
      setEditName(data.nama_lengkap || '');
      setImageError(false);
    }
  };

  useEffect(() => {
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = (uid: string) => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }

      // Berikan penanda waktu unik agar tidak tabrakan dengan channel sebelumnya
      currentChannel = supabase
        .channel(`profile_sub_${uid}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${uid}`
          },
          (payload) => {
            if (payload.new) {
              const updated = payload.new as any;
              setProfileData(updated);
              setEditName(updated.nama_lengkap || '');
              setImageError(false);
            }
          }
        )
        .subscribe();
    };

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchProfile(session.user.id);
        setupRealtime(session.user.id);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUserEmail(session.user.email ?? null);
        setUserId(session.user.id);
        fetchProfile(session.user.id);
        setupRealtime(session.user.id);
      } else {
        if (currentChannel) {
          supabase.removeChannel(currentChannel);
          currentChannel = null;
        }
        setUserEmail(null);
        setUserId(null);
        setProfileData(null);
        setIsProfileModalOpen(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }
    };
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    setIsUploadingPhoto(true);

    try {
      const uploadResult = await uploadToCloudinary(file);
      if (!uploadResult) throw new Error("Gagal mengunggah foto ke Cloudinary.");

      const oldPublicId = profileData?.foto_public_id;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          foto_url: uploadResult.imageUrl,
          foto_public_id: uploadResult.publicId
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      if (oldPublicId) {
        try {
          await fetch('/api/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: oldPublicId }),
          });
        } catch (delErr) {
          console.warn("Gagal menghapus file lama di Cloudinary:", delErr);
        }
      }

      setProfileData((prev) => prev ? {
        ...prev,
        foto_url: uploadResult.imageUrl,
        foto_public_id: uploadResult.publicId
      } : null);
      setImageError(false);

      Toast.fire({
        icon: 'success',
        title: 'Foto profil diperbarui!'
      });

    } catch (err: any) {
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Ganti Foto',
        text: err.message || 'Terjadi kesalahan saat memproses gambar.'
      });
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleNameBlur = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === profileData?.nama_lengkap) {
      setEditName(profileData?.nama_lengkap || '');
      return;
    }
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nama_lengkap: trimmed })
        .eq('id', userId);

      if (error) throw error;

      setProfileData((prev) => prev ? { ...prev, nama_lengkap: trimmed } : null);
      Toast.fire({
        icon: 'success',
        title: 'Nama berhasil diubah!'
      });
    } catch {
      setEditName(profileData?.nama_lengkap || '');
      Toast.fire({
        icon: 'error',
        title: 'Gagal mengubah nama'
      });
    }
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setIsMobileMenuOpen(false);
    const targetElement = document.getElementById(id);
    if (targetElement) {
      const headerOffset = 70;
      const offsetPosition = targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const handleLogout = () => {
    setIsProfileModalOpen(false);
    CustomSwal.fire({
      title: 'Keluar dari CamHub?',
      text: "Anda harus masuk kembali untuk meminjam alat.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        Toast.fire({
          icon: 'success',
          title: 'Berhasil keluar'
        });
      }
    });
  };

  const navItems = [
    { name: 'Beranda', id: 'hero' },
    { name: 'Katalog', id: 'katalog' },
    { name: 'Panduan', id: 'sop' },
    { name: 'Saran', id: 'feedback' },
  ];

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="sticky top-0 z-40 w-full border-b border-stone-200/80 bg-[#fafaf9]/85 backdrop-blur-md"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 sm:px-8">
          <a href="#hero" onClick={(e) => handleNavClick(e, 'hero')} className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-orange-500/10 p-1">
              <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <span className="text-lg font-bold tracking-tight text-[#1c1917]">
              Cam<span className="font-semibold text-orange-600">Hub</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 md:flex">
            {navItems.map((item) => {
              const isActive = activeSection === item.id;
              return (
                <motion.a
                  key={item.name}
                  href={`#${item.id}`}
                  onClick={(e) => handleNavClick(e, item.id)}
                  animate={{ scale: isActive ? 1.08 : 1, y: isActive ? -2 : 0 }}
                  whileHover={isActive ? {} : { scale: 1.08, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative pb-2 text-xs sm:text-sm font-semibold outline-none transition-colors duration-200 ${
                    isActive ? 'text-orange-600' : 'text-stone-500 hover:text-stone-800'
                  }`}
                >
                  <span>{item.name}</span>
                  {isActive && (
                    <motion.div layoutId="underline-navbar" className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-orange-600" />
                  )}
                </motion.a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={userEmail ? undefined : onRequireAuth}
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-700 shadow-xs transition hover:border-orange-300 hover:text-orange-600 active:scale-95"
            >
              <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>

            {/* TOMBOL AKUN NAVBAR */}
            <button
              type="button"
              onClick={userEmail ? () => setIsProfileModalOpen(true) : onRequireAuth}
              className={`flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pr-3 shadow-xs transition active:scale-95 ${
                userEmail ? 'pl-1 hover:border-stone-300' : 'pl-1.5 hover:border-orange-300'
              }`}
            >
              {userEmail ? (
                <>
                  <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-orange-100 text-orange-700 ring-1 ring-orange-500/30 font-bold text-xs uppercase shrink-0">
                    {profileData?.foto_url && !imageError ? (
                      <img 
                        src={profileData.foto_url} 
                        alt="Avatar" 
                        className="h-full w-full object-cover" 
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      (profileData?.nama_lengkap || userEmail).charAt(0)
                    )}
                  </div>
                  <span className="text-xs font-semibold text-[#1c1917] capitalize max-w-[80px] sm:max-w-[120px] truncate">
                    {profileData?.nama_lengkap ? profileData.nama_lengkap.split(' ')[0] : userEmail.split('@')[0]}
                  </span>
                </>
              ) : (
                <>
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-500 ring-1 ring-orange-500/30">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-xs font-semibold text-[#1c1917]">Masuk</span>
                </>
              )}
            </button>

            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-stone-200 text-stone-700 md:hidden hover:bg-stone-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMobileMenuOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
              </svg>
            </button>
          </div>
        </div>

        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="border-t border-stone-200 bg-[#fafaf9] px-6 py-4 md:hidden overflow-hidden">
              <div className="flex flex-col gap-3">
                {navItems.map((item) => (
                  <a key={item.name} href={`#${item.id}`} onClick={(e) => handleNavClick(e, item.id)} className={`text-sm font-semibold transition-colors ${activeSection === item.id ? 'text-orange-600' : 'text-stone-600'}`}>
                    {item.name}
                  </a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* POP-UP MODAL PROFIL */}
      <AnimatePresence>
        {isProfileModalOpen && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" 
            onClick={(e) => e.target === e.currentTarget && setIsProfileModalOpen(false)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white shadow-2xl"
            >
              <input 
                type="file" 
                id="avatar-file-input"
                onChange={handlePhotoUpload} 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
              />

              {/* HEADER MODAL */}
              <div className="flex items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-6 py-4">
                <span className="font-['Outfit',sans-serif] text-base font-bold text-[#1c1917]">
                  Profil <span className="text-orange-600">Siswa</span>
                </span>
                <button 
                  onClick={() => setIsProfileModalOpen(false)} 
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/50 text-stone-500 transition hover:bg-stone-200"
                >
                  ✕
                </button>
              </div>

              <div className="p-6">
                <div className="flex flex-col items-center mb-6">
                  {/* Avatar & Tombol Kamera */}
                  <div className="relative mb-3">
                    <label 
                      htmlFor="avatar-file-input"
                      className="flex h-24 w-24 cursor-pointer items-center justify-center overflow-hidden rounded-full bg-orange-100 text-orange-700 text-3xl font-black uppercase ring-4 ring-orange-50 transition hover:ring-orange-200"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
                      ) : profileData?.foto_url && !imageError ? (
                        <img 
                          src={profileData.foto_url} 
                          alt="Avatar Siswa" 
                          className="h-full w-full object-cover" 
                          onError={() => setImageError(true)}
                        />
                      ) : (
                        (profileData?.nama_lengkap || userEmail || 'U').charAt(0)
                      )}
                    </label>

                    <label 
                      htmlFor="avatar-file-input"
                      title="Ubah Foto Profil"
                      className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white shadow-md border-2 border-white hover:bg-orange-500 transition active:scale-95"
                    >
                      <Camera className="h-4 w-4" />
                    </label>
                  </div>

                  {/* EDIT NAMA INLINE */}
                  <div className="w-full max-w-[260px] relative group mt-1">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onBlur={handleNameBlur}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                      }}
                      placeholder="Masukkan nama..."
                      className="w-full text-center font-['Outfit',sans-serif] text-base font-bold text-[#1c1917] bg-stone-50/60 border border-stone-200/70 rounded-xl px-7 py-1.5 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20"
                    />
                    <Pencil className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone-400 pointer-events-none group-focus-within:text-orange-500 transition-colors" />
                  </div>

                  <span className="text-xs font-medium text-stone-500 flex items-center gap-1 mt-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Siswa Aktif
                  </span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase ml-1">Email</label>
                    <div className="mt-1 flex items-center gap-3 rounded-xl bg-stone-50 border border-stone-200/80 px-4 py-2.5 opacity-90 cursor-not-allowed">
                      <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                      <span className="text-sm font-medium text-stone-600 truncate">{userEmail}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase ml-1">NIS</label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200/80 px-3 py-2.5 opacity-90 cursor-not-allowed">
                        <CreditCard className="h-4 w-4 text-stone-400 shrink-0" />
                        <span className="text-sm font-medium text-stone-600 truncate">{profileData?.nis || '-'}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold tracking-wider text-stone-400 uppercase ml-1">Kelas</label>
                      <div className="mt-1 flex items-center gap-2 rounded-xl bg-stone-50 border border-stone-200/80 px-3 py-2.5 opacity-90 cursor-not-allowed">
                        <GraduationCap className="h-4 w-4 text-stone-400 shrink-0" />
                        <span className="text-sm font-medium text-stone-600 truncate">{profileData?.kelas || '-'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-col gap-3">
                  <button 
                    onClick={handleLogout} 
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                  >
                    <LogOut className="h-4 w-4" /> Keluar Akun
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
