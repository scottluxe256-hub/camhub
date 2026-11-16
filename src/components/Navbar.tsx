import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScroll } from './ScrollAnimate';
import { supabase } from '../lib/supabase';
import { User } from 'lucide-react';
import ProfileView, { type UserProfileData } from './ProfileView';
import NotificationBell from './NotificationBell';
import { getCloudinaryAvatarUrl } from '../utils/cloudinary';
import {
  DEFAULT_AVATAR_FRAME,
  getAvatarFrame,
  type AvatarFrameId,
} from '../utils/avatarFrames';

interface NavbarProps {
  onRequireAuth?: () => void;
  /** Menandakan apakah animasi SplashScreen sudah selesai mendarat di top */
  isSplashFinished?: boolean;
}

const NAVBAR_CACHE_KEY = 'camhub_navbar_user_cache_v1';

interface CachedNavbarUser {
  userId: string;
  userEmail: string;
  profileData: UserProfileData | null;
}

function readNavbarCache(): CachedNavbarUser | null {
  try {
    const raw = localStorage.getItem(NAVBAR_CACHE_KEY);
    return raw ? (JSON.parse(raw) as CachedNavbarUser) : null;
  } catch {
    return null;
  }
}

function writeNavbarCache(data: CachedNavbarUser | null) {
  try {
    if (!data) {
      localStorage.removeItem(NAVBAR_CACHE_KEY);
    } else {
      localStorage.setItem(NAVBAR_CACHE_KEY, JSON.stringify(data));
    }
  } catch {
    // Abaikan jika storage penuh / private mode
  }
}

export default function Navbar({ onRequireAuth, isSplashFinished = true }: NavbarProps) {
  const initialCache = useMemo(() => readNavbarCache(), []);

  // Mulai dalam kondisi bulat tertutup jika menunggu handover dari SplashScreen
  const [isExpanded, setIsExpanded] = useState(isSplashFinished);
  const [isAnimating, setIsAnimating] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(initialCache?.userEmail ?? null);
  const [userId, setUserId] = useState<string | null>(initialCache?.userId ?? null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [profileData, setProfileData] = useState<UserProfileData | null>(
    initialCache?.profileData ?? null
  );

  const [avatarFrame, setAvatarFrame] = useState<AvatarFrameId>(DEFAULT_AVATAR_FRAME);
  const prevSplashFinishedRef = useRef(isSplashFinished);

  // Dengarkan perubahan bingkai real-time dari ProfileView + baca metadata Supabase saat login
  useEffect(() => {
    const onFrameChanged = (e: Event) => {
      const custom = e as CustomEvent<AvatarFrameId>;
      if (custom.detail) setAvatarFrame(custom.detail);
    };
    window.addEventListener('camhub-avatar-frame-changed', onFrameChanged);

    supabase.auth.getSession().then(({ data: { session } }) => {
      const saved = session?.user?.user_metadata?.avatar_frame as AvatarFrameId | undefined;
      if (saved) setAvatarFrame(saved);
    });

    return () => window.removeEventListener('camhub-avatar-frame-changed', onFrameChanged);
  }, []);

  const sectionIds = ['hero', 'katalog', 'sop', 'feedback'];
  const { activeSection } = useScroll(sectionIds, 80);

  const optimizedAvatarUrl = useMemo(
    () => getCloudinaryAvatarUrl(profileData?.foto_url, profileData?.foto_public_id),
    [profileData?.foto_url, profileData?.foto_public_id]
  );

  const activeAvatarFrame = useMemo(() => getAvatarFrame(avatarFrame), [avatarFrame]);

  // Preload & decode foto profil di RAM sejak SplashScreen berjalan agar 0 kedip saat navbar mekar
  useEffect(() => {
    if (!optimizedAvatarUrl) {
      setImageLoaded(false);
      return;
    }

    let cancelled = false;
    const img = new Image();
    img.src = optimizedAvatarUrl;

    if (img.complete) {
      setImageLoaded(true);
      setImageError(false);
    } else {
      img.onload = () => {
        if (!cancelled) {
          setImageLoaded(true);
          setImageError(false);
        }
      };
      img.onerror = () => {
        if (!cancelled) {
          setImageError(true);
        }
      };
    }

    return () => {
      cancelled = true;
    };
  }, [optimizedAvatarUrl]);

  // Trigger mekarnya Dynamic Island hanya saat transisi dari false -> true (kunjungan pertama)
  useEffect(() => {
    if (!prevSplashFinishedRef.current && isSplashFinished) {
      setIsAnimating(true);
      setIsExpanded(true);
    }
    prevSplashFinishedRef.current = isSplashFinished;
  }, [isSplashFinished]);

  const fetchProfile = async (uid: string, email: string | null) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('nama_lengkap, nis, kelas, role, foto_url, foto_public_id')
      .eq('id', uid)
      .single();

    if (!error && data) {
      setProfileData(data);
      setImageError(false);
      if (email) {
        writeNavbarCache({ userId: uid, userEmail: email, profileData: data });
      }
    }
  };

  useEffect(() => {
    let currentChannel: ReturnType<typeof supabase.channel> | null = null;

    const setupRealtime = (uid: string, email: string | null) => {
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }

      currentChannel = supabase
        .channel(`profile_sub_${uid}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${uid}`,
          },
          (payload) => {
            if (payload.new) {
              const updated = payload.new as UserProfileData;
              setProfileData(updated);
              setImageError(false);
              if (email) {
                writeNavbarCache({ userId: uid, userEmail: email, profileData: updated });
              }
            }
          }
        )
        .subscribe();
    };

    const initAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const email = session.user.email ?? null;
        setUserEmail(email);
        setUserId(session.user.id);
        fetchProfile(session.user.id, email);
        setupRealtime(session.user.id, email);
      } else {
        setUserEmail(null);
        setUserId(null);
        setProfileData(null);
        writeNavbarCache(null);
      }
    };

    initAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const email = session.user.email ?? null;
        setUserEmail(email);
        setUserId(session.user.id);
        fetchProfile(session.user.id, email);
        setupRealtime(session.user.id, email);
      } else {
        if (currentChannel) {
          supabase.removeChannel(currentChannel);
          currentChannel = null;
        }
        setUserEmail(null);
        setUserId(null);
        setProfileData(null);
        setIsProfileModalOpen(false);
        writeNavbarCache(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
      if (currentChannel) {
        supabase.removeChannel(currentChannel);
      }
    };
  }, []);

  const handleToggleExpand = () => {
    setIsAnimating(true);
    setIsExpanded((prev) => !prev);
  };

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const targetElement = document.getElementById(id);
    if (targetElement) {
      const headerOffset = 80;
      const offsetPosition =
        targetElement.getBoundingClientRect().top + window.pageYOffset - headerOffset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const navItems = [
    { name: 'Beranda', id: 'hero' },
    { name: 'Katalog', id: 'katalog' },
    { name: 'Panduan', id: 'sop' },
    { name: 'Saran', id: 'feedback' },
  ];

  return (
    <>
      {/* FLOATING DYNAMIC ISLAND WRAPPER */}
      <div className="pointer-events-none fixed inset-x-0 top-3.5 z-40 flex justify-center px-3 sm:top-4">
        <header
          data-camhub-navbar-pill
          style={isSplashFinished ? undefined : { opacity: 0.001 }}
          className={`pointer-events-auto relative flex h-[48px] max-w-[96vw] items-center rounded-full p-[6px] shadow-[0_8px_28px_rgba(234,88,12,0.18),0_2px_12px_rgba(0,0,0,0.12)] sm:h-[54px] sm:p-[7px] ${
            !isExpanded || isAnimating ? 'overflow-hidden' : ''
          }`}
        >
          {/* LAPISAN KACA MATTE / DOFF TIPIS + PANTULAN BIBIR KACA */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[1px] overflow-hidden rounded-full bg-white/[0.14] shadow-[inset_0_1px_1px_rgba(255,255,255,0.65),inset_0_-1px_1px_rgba(28,25,23,0.08)] backdrop-blur-[3.5px] backdrop-saturate-[135%]"
          >
            {/* Tekstur micro-grain etched matte super halus */}
            <div
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 120 120' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E")`,
              }}
              className="h-full w-full"
            />
          </div>

          {/* BORDER RING 2PX PURE CSS MASK */}
          <div
            aria-hidden="true"
            style={{
              padding: '2px',
              WebkitMask:
                'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
              WebkitMaskComposite: 'xor',
              maskComposite: 'exclude',
            }}
            className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-full"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 6.5, repeat: Infinity, ease: 'linear' }}
              style={{
                background:
                  'conic-gradient(from 0deg, #ea580c 0%, #f97316 18%, #ffffff 36%, #fed7aa 50%, #ea580c 68%, #fff7ed 86%, #ea580c 100%)',
              }}
              className="absolute left-1/2 top-1/2 aspect-square w-[900px] -translate-x-1/2 -translate-y-1/2"
            />
          </div>

          {/* KONTEN DYNAMIC ISLAND (z-10 BIAR PILL AKTIF DI ATAS KACA) */}
          <div className="relative z-10 flex items-center">

            {/* LOGO CAMHUB DI PALING KIRI (TOMBOL BUKA / TUTUP) */}
            <motion.button
              type="button"
              onClick={handleToggleExpand}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              aria-label={isExpanded ? 'Tutup menu navigasi' : 'Buka menu navigasi'}
              title={isExpanded ? 'Tutup Menu' : 'Buka Menu CamHub'}
              className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/75 shadow-2xs ring-1 ring-orange-500/25 transition-colors duration-300 hover:bg-white sm:h-10 sm:w-10"
            >
              <motion.img
                src="/logo.webp"
                alt="Logo CamHub"
                animate={{ rotate: isExpanded ? 0 : -360 }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="h-7 w-7 object-contain sm:h-8 sm:w-8"
              />
            </motion.button>

            {/* AREA MENU & AKSI (MELEBAR & MENUTUP RAPI KE DALAM LOGO) */}
            <AnimatePresence initial={false}>
              {isExpanded && (
                <motion.div
                  key="island-content"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{
                    opacity: 1,
                    width: 'auto',
                    transition: {
                      width: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                      opacity: { duration: 0.35, delay: 0.08, ease: 'easeOut' },
                    },
                  }}
                  exit={{
                    opacity: 0,
                    width: 0,
                    transition: {
                      opacity: { duration: 0.2, ease: 'easeOut' },
                      width: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
                    },
                  }}
                  onAnimationStart={() => setIsAnimating(true)}
                  onAnimationComplete={() => setIsAnimating(false)}
                  className={`flex items-center ${
                    !isExpanded || isAnimating ? 'overflow-hidden' : 'overflow-visible'
                  }`}
                >
                  <div className="flex items-center gap-1.5 pl-2 pr-1 sm:gap-3 sm:pl-3 sm:pr-1.5">
                    {/* MENU NAVIGASI DENGAN STAGGER 50MS SESUAI XML */}
                    <nav className="flex items-center gap-0.5 sm:gap-1.5">
                      {navItems.map((item, idx) => {
                        const isActive = activeSection === item.id;
                        return (
                          <motion.a
                            key={item.name}
                            href={`#${item.id}`}
                            onClick={(e) => handleNavClick(e, item.id)}
                            initial={{ opacity: 0, y: 4 }}
                            animate={{
                              opacity: 1,
                              y: 0,
                              transition: {
                                duration: 0.28,
                                delay: 0.12 + idx * 0.05,
                                ease: 'easeOut',
                              },
                            }}
                            className={`relative whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold transition-colors duration-200 sm:px-2.5 sm:text-xs ${
                              isActive ? 'text-orange-600' : 'text-transparent'
                            }`}
                          >
                            {isActive && (
                              <motion.span
                                layoutId="dynamic-island-active-pill"
                                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                                className="absolute inset-0 -z-10 rounded-full bg-white/85 shadow-2xs ring-1 ring-orange-500/30"
                              />
                            )}
                            {item.name}
                          </motion.a>
                        );
                      })}
                    </nav>

                    {/* PEMBATAS TIPIS (DI-RENDER OLEH LAYER DIFFERENCE DI ATASNYA) */}
                    <div className="h-4 w-[1px] shrink-0 opacity-0" />

                    {/* AKSI KANAN: NOTIFIKASI & PROFIL (ZOOM OUT + GESER KIRI SAAT TUTUP) */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.3, x: -24 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        x: 0,
                        transition: { duration: 0.35, delay: 0.22, ease: [0.22, 1, 0.36, 1] },
                      }}
                      exit={{
                        opacity: 0,
                        scale: 0,
                        x: -45,
                        transition: { duration: 0.16, ease: [0.4, 0, 1, 1] },
                      }}
                      className="flex origin-left items-center gap-1.5 sm:gap-2"
                    >
                      <NotificationBell
                        userId={userId}
                        userEmail={userEmail}
                        onRequireAuth={onRequireAuth}
                        onNotificationClick={() => setIsProfileModalOpen(true)}
                      />
                      <button
                        type="button"
                        onClick={userEmail ? () => setIsProfileModalOpen(true) : onRequireAuth}
                        className={`flex shrink-0 items-center rounded-full transition active:scale-95 ${
                          userEmail
                            ? 'bg-transparent p-0 sm:gap-1.5 sm:border sm:border-amber-400/55 sm:bg-white/75 sm:py-0.5 sm:pl-0.5 sm:pr-2.5 sm:shadow-[0_2px_8px_rgba(234,88,12,0.12)] sm:backdrop-blur-xs sm:hover:border-orange-500/80'
                            : 'gap-1.5 border border-amber-400/55 bg-white/65 py-0.5 pl-1 pr-2.5 shadow-[0_2px_8px_rgba(234,88,12,0.12)] backdrop-blur-xs hover:border-orange-500/80'
                        }`}
                      >
                        {userEmail ? (
                          <>
                            {/* PORTRAIT: 1 LINGKARAN TUNGGAL (32PX) | LANDSCAPE: BULAT DI DALAM KAPSUL NAMA (28PX) */}
                            <div className="relative flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full p-[2px] shadow-[0_2px_8px_rgba(234,88,12,0.16)] sm:h-7 sm:w-7 sm:shadow-none">
                              <motion.div
                                animate={activeAvatarFrame.isAnimated ? { rotate: 360 } : { rotate: 0 }}
                                transition={
                                  activeAvatarFrame.isAnimated
                                    ? { duration: 5, repeat: Infinity, ease: 'linear' }
                                    : { duration: 0.2 }
                                }
                                style={{ background: activeAvatarFrame.background }}
                                className="absolute inset-0 rounded-full"
                              />

                              <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-orange-100 text-[11px] font-bold uppercase text-orange-700 sm:text-xs">
                                <span>
                                  {(profileData?.nama_lengkap || userEmail).charAt(0)}
                                </span>
                                {optimizedAvatarUrl && !imageError && (
                                  <img
                                    src={optimizedAvatarUrl}
                                    alt="Avatar"
                                    decoding="async"
                                    onLoad={() => setImageLoaded(true)}
                                    onError={() => setImageError(true)}
                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-200 ${
                                      imageLoaded ? 'opacity-100' : 'opacity-0'
                                    }`}
                                  />
                                )}
                              </div>
                            </div>

                            {/* NAMA MUNCUL SAAT LANDSCAPE / DESKTOP */}
                            <span className="hidden max-w-[90px] truncate text-xs font-semibold capitalize text-[#1c1917] sm:inline">
                              {profileData?.nama_lengkap
                                ? profileData.nama_lengkap.split(' ')[0]
                                : userEmail.split('@')[0]}
                            </span>
                          </>
                        ) : (
                          <>
                            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 ring-1 ring-orange-500/30">
                              <User className="h-3.5 w-3.5" />
                            </div>
                            <span className="whitespace-nowrap text-[11px] font-semibold text-[#1c1917] sm:text-xs">
                              Masuk
                            </span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>
      </div>

      {/* LAYER TEKS ADAPTIF 1-BIT (MURNI PUTIH PEKAT / HITAM PEKAT TANPA WARNA LAIN) */}
      {isSplashFinished && isExpanded && !isAnimating &&
        (
          [
            { key: 'diff', blend: 'mix-blend-difference', color: '#ffffff' },
            { key: 'mono', blend: 'mix-blend-color', color: '#ffffff' },
            { key: 'dodge', blend: 'mix-blend-color-dodge', color: '#737373' },
            { key: 'burn', blend: 'mix-blend-color-burn', color: '#d4d4d4' },
          ] as const
        ).map((layer) => (
          <div
            key={layer.key}
            aria-hidden="true"
            style={{ color: layer.color }}
            className={`pointer-events-none fixed inset-x-0 top-3.5 z-40 flex justify-center px-3 sm:top-4 ${layer.blend}`}
          >
            <div className="flex h-[48px] max-w-[96vw] items-center rounded-full p-[6px] sm:h-[54px] sm:p-[7px]">
              {/* SPACER LOGO */}
              <div className="h-9 w-9 shrink-0 sm:h-10 sm:w-10" />

              <div className="flex items-center gap-1.5 pl-2 pr-1 sm:gap-3 sm:pl-3 sm:pr-1.5">
                {/* TEKS MENU */}
                <div className="flex items-center gap-0.5 sm:gap-1.5">
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <span
                        key={item.name}
                        className={`whitespace-nowrap rounded-full px-2 py-1 text-[11px] font-semibold sm:px-2.5 sm:text-xs ${
                          isActive ? 'opacity-0' : ''
                        }`}
                      >
                        {item.name}
                      </span>
                    );
                  })}
                </div>

                {/* PEMBATAS TIPIS */}
                <div
                  style={{ backgroundColor: layer.color }}
                  className="h-4 w-[1px] shrink-0"
                />

                {/* SPACER LONCENG & PROFIL AGAR POSISI TEKS TERKUNCI 1:1 */}
                <div className="flex items-center gap-1.5 opacity-0 sm:gap-2">
                  <div className="h-8 w-8 shrink-0 sm:h-8.5 sm:w-8.5" />
                  {userEmail ? (
                    <div className="flex shrink-0 items-center sm:gap-1.5 sm:py-0.5 sm:pl-0.5 sm:pr-2.5">
                      <div className="h-8 w-8 shrink-0 sm:h-7 sm:w-7" />
                      <span className="hidden max-w-[90px] truncate text-xs font-semibold capitalize sm:inline">
                        {profileData?.nama_lengkap
                          ? profileData.nama_lengkap.split(' ')[0]
                          : userEmail.split('@')[0]}
                      </span>
                    </div>
                  ) : (
                    <div className="flex shrink-0 items-center gap-1.5 py-0.5 pl-1 pr-2.5">
                      <div className="h-6 w-6 shrink-0" />
                      <span className="whitespace-nowrap text-[11px] font-semibold sm:text-xs">
                        Masuk
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

      {/* POP-UP PROFIL & CROP FOTO TERPISAH */}
      <ProfileView
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        userId={userId}
        userEmail={userEmail}
        profileData={profileData}
        onProfileUpdate={(updated) => {
          setProfileData(updated);
          setImageError(false);
          if (userId && userEmail) {
            writeNavbarCache({ userId, userEmail, profileData: updated });
          }
        }}
      />
    </>
  );
}
