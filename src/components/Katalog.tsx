import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Aperture,
  Timer,
  Hammer,
  AlertCircle,
  Zap,
  Clock,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../types/database';
import BookingModal from './BookingModal';
import {
  type StudioSettings,
  DEFAULT_STUDIO_SETTINGS,
  parseStudioBounds,
  getAvailableWeekdays,
  formatLocalDateISO,
} from '../utils/bookingSlots';

type CameraItem = Database['public']['Tables']['cameras']['Row'];

interface KatalogProps {
  onRequireAuth?: () => void;
}

export default function Katalog({ onRequireAuth }: KatalogProps) {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [queuedCameraIds, setQueuedCameraIds] = useState<Set<string>>(new Set());
  const [targetDateStr, setTargetDateStr] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua Alat');
  const filters = ['Semua Alat', 'Paket Bundling', 'Kamera', 'Lensa', 'Aksesoris'];

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);
  const [isDesktopMd, setIsDesktopMd] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  // Refs untuk kontrol Infinite Marquee & sentuhan jari / drag mouse
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const isInteractingRef = useRef(false);
  const virtualScrollRef = useRef(0);
  const resumeTimerRef = useRef<number | null>(null);

  // Refs khusus drag mouse di desktop/landscape
  const isMouseDownRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartScrollRef = useRef(0);
  const hasDraggedRef = useRef(false);

  // Deteksi ukuran layar (Portrait < 768px vs Landscape/Desktop >= 768px)
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktopMd(e.matches);
    setIsDesktopMd(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // 1. Ambil daftar unit kamera & sinkronkan tanggal operasional aktif dari studio_settings
  useEffect(() => {
    const syncTargetDate = (settings: StudioSettings) => {
      const bounds = parseStudioBounds(settings);
      const activeWeekdays = getAvailableWeekdays(bounds);
      if (activeWeekdays.length > 0) {
        setTargetDateStr(formatLocalDateISO(activeWeekdays[0]));
      }
    };

    const initCatalog = async () => {
      await fetchCameras();

      const { data: settingsData } = await supabase
        .from('studio_settings')
        .select('jam_buka, jam_tutup, istirahat_mulai, istirahat_selesai')
        .eq('id', 1)
        .single();

      syncTargetDate(settingsData || DEFAULT_STUDIO_SETTINGS);
    };

    initCatalog();

    const cameraChannel = supabase
      .channel('realtime_cameras_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cameras' },
        () => {
          fetchCameras();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'studio_settings',
          filter: 'id=eq.1',
        },
        (payload) => {
          if (payload.new) {
            syncTargetDate(payload.new as StudioSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cameraChannel);
    };
  }, []);

  // 2. Cek antrian harian pada tanggal operasional aktif & pantau realtime borrow_requests
  useEffect(() => {
    if (!targetDateStr) return;

    fetchDailyQueue(targetDateStr);

    const queueChannel = supabase
      .channel(`realtime_queue_catalog_${targetDateStr}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'borrow_requests' },
        () => {
          fetchDailyQueue(targetDateStr);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, [targetDateStr]);

  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setCameras(data);
    } catch (err) {
      console.error('Gagal mengambil data kamera:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyQueue = async (dateStr: string) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('camera_id')
        .eq('tanggal_pinjam', dateStr)
        .in('status_request', ['Pending', 'Approved']);

      if (error) throw error;

      const ids = new Set<string>(
        (data || [])
          .map((row) => row.camera_id)
          .filter((id): id is string => Boolean(id))
      );
      setQueuedCameraIds(ids);
    } catch (err) {
      console.error('Gagal mengecek antrian harian:', err);
    }
  };

  const filterMatch = (item: CameraItem, filter: string) => {
    if (filter === 'Semua Alat') return true;
    if (!item.tipe) return false;
    const t = item.tipe.toLowerCase();

    if (filter === 'Kamera') return t.includes('kamera');
    if (filter === 'Lensa') return t.includes('lensa');
    if (filter === 'Paket Bundling') return t.includes('paket') || t.includes('bundling');
    if (filter === 'Aksesoris') {
      return (
        t.includes('gimbal') ||
        t.includes('stabilizer') ||
        t.includes('mic') ||
        t.includes('audio') ||
        t.includes('tripod') ||
        t.includes('aksesoris') ||
        t.includes('lighting')
      );
    }
    return t.includes(filter.toLowerCase());
  };

  const filteredCameras = cameras.filter((item) => filterMatch(item, activeFilter));

  // Kapasitas tampilan diam: Portrait maksimal 4 (2x2), Landscape/Desktop maksimal 8 (4x2)
  const maxStaticItems = isDesktopMd ? 8 : 4;
  const isMarqueeActive = filteredCameras.length > maxStaticItems;

  // Reset posisi scroll saat kategori filter atau orientasi berubah
  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    el.scrollLeft = 0;
    virtualScrollRef.current = 0;
    isInteractingRef.current = false;
  }, [activeFilter, filteredCameras.length, isMarqueeActive]);

  // Mesin Infinite Loop Marquee (geser terus-menerus ke kiri tanpa putus)
  useEffect(() => {
    if (loading || !isMarqueeActive) return;

    let rafId: number;
    let lastTime = performance.now();
    const speedPxPerSec = 38; // Kecepatan geser ke kiri (px per detik)

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.05);
      lastTime = now;

      const el = sliderRef.current;
      if (el && !isInteractingRef.current && !isBookingModalOpen) {
        const halfWidth = el.scrollWidth / 2;

        if (halfWidth > 0) {
          virtualScrollRef.current += speedPxPerSec * dt;

          // Begitu Set A lewat sepenuhnya, reset mulus ke awal tanpa terlihat lompatan
          if (virtualScrollRef.current >= halfWidth) {
            virtualScrollRef.current -= halfWidth;
          }

          el.scrollLeft = virtualScrollRef.current;
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
      }
    };
  }, [loading, isMarqueeActive, isBookingModalOpen]);

  // Jaga agar saat user menggeser manual sampai ujung Set A/B tetap mulus berputar
  const handleManualScroll = () => {
    if (!isInteractingRef.current || !sliderRef.current) return;
    const el = sliderRef.current;
    const halfWidth = el.scrollWidth / 2;
    if (halfWidth <= 0) return;

    if (el.scrollLeft >= halfWidth) {
      el.scrollLeft -= halfWidth;
    } else if (el.scrollLeft <= 1) {
      el.scrollLeft += halfWidth;
    }
    virtualScrollRef.current = el.scrollLeft;
  };

  // Handler sentuhan jari (Mobile)
  const handleTouchStart = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }
    isInteractingRef.current = true;
  };

  const handleTouchEnd = () => {
    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      if (sliderRef.current) {
        virtualScrollRef.current = sliderRef.current.scrollLeft;
      }
      isInteractingRef.current = false;
    }, 900);
  };

  // Handler drag mouse (Desktop / Landscape)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = sliderRef.current;
    if (!el) return;

    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = null;
    }

    isInteractingRef.current = true;
    isMouseDownRef.current = true;
    hasDraggedRef.current = false;
    dragStartXRef.current = e.pageX;
    dragStartScrollRef.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !sliderRef.current) return;
    const dx = e.pageX - dragStartXRef.current;
    if (Math.abs(dx) > 6) {
      hasDraggedRef.current = true;
    }
    sliderRef.current.scrollLeft = dragStartScrollRef.current - dx;
  };

  const handleMouseUpOrLeave = () => {
    if (!isMouseDownRef.current) return;
    isMouseDownRef.current = false;

    if (resumeTimerRef.current) {
      window.clearTimeout(resumeTimerRef.current);
    }
    resumeTimerRef.current = window.setTimeout(() => {
      if (sliderRef.current) {
        virtualScrollRef.current = sliderRef.current.scrollLeft;
      }
      isInteractingRef.current = false;
    }, 900);
  };

  const handleOpenBooking = async (item: CameraItem) => {
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }

    setSelectedCamera(item);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    if (targetDateStr) {
      fetchDailyQueue(targetDateStr);
    }
  };

  // Helper render kartu kamera (dipakai oleh mode Statis Center maupun Infinite Marquee)
  const renderCameraCard = (item: CameraItem, keyId: string, extraClass = '') => {
    const isMaintenance = item.status === 'Maintenance';
    const hasQueueToday = queuedCameraIds.has(item.id);

    return (
      <div
        key={keyId}
        className={`relative flex flex-col justify-between rounded-3xl bg-white p-3.5 pt-16 shadow-lg shadow-stone-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/60 sm:rounded-[2rem] sm:p-6 sm:pt-24 ${extraClass}`}
      >
        {/* Badge Status */}
        <div
          className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-xl border shadow-xs transition-transform hover:scale-110 sm:top-4 sm:left-4 sm:h-9 sm:w-9 sm:rounded-2xl ${
            isMaintenance
              ? 'border-amber-200 bg-amber-50 text-amber-600'
              : hasQueueToday
                ? 'border-blue-200 bg-blue-50 text-blue-600'
                : 'border-emerald-200 bg-emerald-50 text-emerald-600'
          }`}
          title={
            isMaintenance
              ? 'Status: Perbaikan'
              : hasQueueToday
                ? 'Ada antrian jadwal aktif'
                : 'Jadwal hari ini masih kosong'
          }
        >
          {isMaintenance ? (
            <Hammer className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
          ) : hasQueueToday ? (
            <Timer className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
          ) : (
            <Aperture className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
          )}
        </div>

        {/* Kode Inventaris */}
        <span className="absolute top-3.5 right-3.5 font-mono text-[9px] font-medium text-stone-400 sm:top-5 sm:right-5 sm:text-[10px]">
          {item.kode_inventaris}
        </span>

        {/* Foto Produk Melayang */}
        <div className="pointer-events-none absolute -top-11 left-1/2 h-28 w-28 -translate-x-1/2 sm:-top-16 sm:h-44 sm:w-44">
          <img
            src={item.image_url || '/kamera.webp'}
            alt={item.nama_barang}
            draggable={false}
            className="h-full w-full object-contain drop-shadow-xl transition-transform duration-500 sm:drop-shadow-2xl"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/kamera.webp';
            }}
          />
        </div>

        {/* Nama & Kategori Alat */}
        <div className="mt-2 flex w-full flex-col items-center text-center sm:mt-4">
          <span className="line-clamp-1 text-[9px] font-bold tracking-widest text-stone-400 uppercase sm:text-[10px]">
            {item.tipe || 'Peralatan Lab'}
          </span>
          <h3 className="mt-1 line-clamp-1 font-['Playfair_Display',serif] text-sm font-bold leading-tight text-[#1c1917] sm:mt-1.5 sm:text-lg">
            {item.nama_barang}
          </h3>
        </div>

        {/* Tombol Aksi */}
        <div className="mt-4 flex w-full justify-center sm:mt-6">
          {isMaintenance ? (
            <button
              disabled
              className="flex w-full cursor-not-allowed items-center justify-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-2 text-[10.5px] font-bold text-amber-600 opacity-80 sm:gap-2 sm:px-6 sm:py-3 sm:text-xs"
            >
              <AlertCircle className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Perbaikan
            </button>
          ) : hasQueueToday ? (
            <button
              onClick={() => handleOpenBooking(item)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-2 text-[10.5px] font-bold text-orange-600 transition hover:border-orange-300 hover:bg-orange-100 active:scale-95 sm:gap-2 sm:px-6 sm:py-3 sm:text-xs"
            >
              <Clock className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" /> Lihat Antrian
            </button>
          ) : (
            <button
              onClick={() => handleOpenBooking(item)}
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-600 px-3 py-2 text-[10.5px] font-bold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-95 sm:gap-2 sm:px-6 sm:py-3 sm:text-xs"
            >
              <Zap className="h-3.5 w-3.5 shrink-0 fill-white/20 sm:h-4 sm:w-4" /> Pinjam
            </button>
          )}
        </div>
      </div>
    );
  };

  // Gandakan list kamera untuk Infinite Seamless Loop saat item melebihi kapasitas layar
  const marqueeItems = isMarqueeActive
    ? [
        ...filteredCameras.map((item) => ({ item, keyId: `setA-${item.id}` })),
        ...filteredCameras.map((item) => ({ item, keyId: `setB-${item.id}` })),
      ]
    : [];

  return (
    <section id="katalog" className="bg-[#fafaf9] py-16 sm:py-24">
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={handleCloseBookingModal}
        camera={selectedCamera}
      />

      <div className="mx-auto max-w-7xl px-4 sm:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6 }}
            className="font-['Playfair_Display',serif] text-3xl font-bold text-[#1c1917] sm:text-4xl"
          >
            Katalog Inventaris
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-3 text-sm text-stone-500"
          >
            Pilih dan pinjam peralatan produksi yang kamu butuhkan untuk proyek multimedia-mu.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: false, amount: 0.15 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-10 flex flex-wrap justify-center gap-5 sm:gap-10"
        >
          {filters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              animate={{
                scale: activeFilter === filter ? 1.08 : 1,
                y: activeFilter === filter ? -3 : 0,
              }}
              whileHover={activeFilter === filter ? {} : { scale: 1.08, y: -3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 17 }}
              className={`relative pb-2 text-xs font-semibold outline-none transition-colors duration-200 sm:text-sm ${
                activeFilter === filter ? 'text-orange-600' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <span>{filter}</span>
              {activeFilter === filter && (
                <motion.div
                  layoutId="underline-filter"
                  className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-orange-600"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="text-xs font-medium text-stone-400">
              Memuat inventaris dari database...
            </span>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="mt-16 text-center text-sm text-stone-400">
            Tidak ada alat ditemukan untuk kategori ini.
          </div>
        ) : !isMarqueeActive ? (
          /* =====================================================================
             MODE STATIS RATA TENGAH (1 item tengah, 2 item 1 baris tengah,
             3 item atas 2 bawah 1 tengah, 6 item atas 4 bawah 2 tengah)
             ===================================================================== */
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.15 }}
            transition={{ duration: 0.55 }}
            className="mt-4 flex justify-center sm:mt-6"
          >
            <div
              className={`flex w-full flex-wrap justify-center gap-x-3.5 gap-y-14 pt-13 pb-4 sm:gap-x-5 sm:gap-y-20 sm:pt-18 lg:gap-x-6 ${
                filteredCameras.length === 3 ? 'max-w-[630px]' : ''
              }`}
            >
              {filteredCameras.map((item) =>
                renderCameraCard(
                  item,
                  item.id,
                  filteredCameras.length === 3
                    ? 'w-[calc(50%-7px)] sm:w-[calc(50%-10px)]'
                    : 'w-[calc(50%-7px)] sm:w-[calc(50%-10px)] md:w-[calc(25%-18px)]'
                )
              )}
            </div>
          </motion.div>
        ) : (
          /* =====================================================================
             MODE INFINITE MARQUEE 2 BARIS (Geser terus ke kiri tanpa putus,
             berhenti saat disentuh jari/mouse, jalan lagi setelah dilepas)
             ===================================================================== */
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.12 }}
            transition={{ duration: 0.6 }}
            className="mt-4 sm:mt-6"
          >
            <div
              ref={sliderRef}
              onScroll={handleManualScroll}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
              className="grid cursor-grab grid-flow-col grid-rows-2 auto-cols-[calc(50%-7px)] gap-x-3.5 gap-y-14 overflow-x-auto pt-13 pb-4 select-none active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] sm:gap-x-5 sm:gap-y-20 sm:pt-18 md:auto-cols-[calc(25%-18px)] lg:gap-x-6 [&::-webkit-scrollbar]:hidden"
            >
              {marqueeItems.map(({ item, keyId }) => renderCameraCard(item, keyId))}
            </div>

            <p className="mt-2 text-center text-[11px] font-medium text-stone-400">
              Sentuh & geser untuk menjelajahi inventaris secara manual ↔
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
}
