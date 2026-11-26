import { useEffect, useMemo, useState } from 'react';
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
import { supabase } from '../../lib/supabase';
import BookingModal from './BookingModal';
import {
  type CameraItem,
  KATALOG_FILTERS,
  matchesCameraFilter,
} from '../../logics/katalog/katalog.config';
import { useKatalogData } from '../../logics/katalog/useKatalogData';
import { useKatalogMarquee } from '../../logics/katalog/useKatalogMarquee';

interface KatalogProps {
  onRequireAuth?: () => void;
}

export default function Katalog({ onRequireAuth }: KatalogProps) {
  const { cameras, queuedCameraIds, loading, refreshQueue } = useKatalogData();

  const [activeFilter, setActiveFilter] = useState<string>('Semua Alat');
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);
  const [isDesktopMd, setIsDesktopMd] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const onChange = (e: MediaQueryListEvent) => setIsDesktopMd(e.matches);
    setIsDesktopMd(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const filteredCameras = useMemo(
    () => cameras.filter((item) => matchesCameraFilter(item, activeFilter)),
    [cameras, activeFilter]
  );

  const maxStaticItems = isDesktopMd ? 8 : 4;
  const isMarqueeActive = filteredCameras.length > maxStaticItems;

  const {
    sectionRef,
    viewportRef,
    trackRef,
    consumeWasDragged,
    handlers,
  } = useKatalogMarquee({
    active: !loading && isMarqueeActive && !isBookingModalOpen,
    resetKey: `${activeFilter}-${filteredCameras.length}-${isDesktopMd}`,
  });

  const handleOpenBooking = async (item: CameraItem) => {
    if (consumeWasDragged()) return;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      onRequireAuth?.();
      return;
    }

    setSelectedCamera(item);
    setIsBookingModalOpen(true);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalOpen(false);
    refreshQueue();
  };

  const renderCameraCard = (item: CameraItem, keyId: string, extraClass = '') => {
    const isMaintenance = item.status === 'Maintenance';
    const hasQueueToday = queuedCameraIds.has(item.id);

    return (
      <div
        key={keyId}
        className={`relative flex flex-col justify-between rounded-3xl bg-white p-3.5 pt-16 shadow-md shadow-stone-200/70 transition-transform duration-300 hover:-translate-y-1 sm:rounded-[2rem] sm:p-6 sm:pt-24 ${extraClass}`}
      >
        {/* Badge Status */}
        <div
          className={`absolute top-3 left-3 z-10 flex h-7 w-7 items-center justify-center rounded-xl border sm:top-4 sm:left-4 sm:h-9 sm:w-9 sm:rounded-2xl ${
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

        {/* Foto Produk Melayang (tanpa filter drop-shadow berat agar 60fps saat berjalan) */}
        <div className="pointer-events-none absolute -top-11 left-1/2 h-28 w-28 -translate-x-1/2 sm:-top-16 sm:h-44 sm:w-44">
          <img
            src={item.image_url || '/kamera.webp'}
            alt={item.nama_barang}
            draggable={false}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-contain"
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
              className="flex w-full items-center justify-center gap-1.5 rounded-full bg-orange-600 px-3 py-2 text-[10.5px] font-bold text-white shadow-md shadow-orange-600/25 transition hover:bg-orange-500 active:scale-95 sm:gap-2 sm:px-6 sm:py-3 sm:text-xs"
            >
              <Zap className="h-3.5 w-3.5 shrink-0 fill-white/20 sm:h-4 sm:w-4" /> Pinjam
            </button>
          )}
        </div>
      </div>
    );
  };

  const marqueeItems = useMemo(
    () =>
      isMarqueeActive
        ? [
            ...filteredCameras.map((item) => ({ item, keyId: `setA-${item.id}` })),
            ...filteredCameras.map((item) => ({ item, keyId: `setB-${item.id}` })),
          ]
        : [],
    [filteredCameras, isMarqueeActive]
  );

  return (
    <section ref={sectionRef} id="katalog" className="bg-[#fafaf9] py-16 sm:py-24">
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
          {KATALOG_FILTERS.map((filter) => (
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
          <motion.div
            initial={{ opacity: 0, y: 25 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.12 }}
            transition={{ duration: 0.6 }}
            className="mt-4 sm:mt-6"
          >
            <div ref={viewportRef} className="relative -mx-4 overflow-hidden sm:-mx-8">
              {/* Feather Gradient Halus di Tepi Kiri (0% beban blur GPU) */}
              <div
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to right, #fafaf9 0%, rgba(250,250,249,0.92) 28%, rgba(255,255,255,0.45) 64%, rgba(250,250,249,0) 100%)',
                }}
                className="pointer-events-none absolute inset-y-0 left-0 z-20 w-8 sm:w-14"
              />

              {/* Feather Gradient Halus di Tepi Kanan (0% beban blur GPU) */}
              <div
                aria-hidden="true"
                style={{
                  background:
                    'linear-gradient(to left, #fafaf9 0%, rgba(250,250,249,0.92) 28%, rgba(255,255,255,0.45) 64%, rgba(250,250,249,0) 100%)',
                }}
                className="pointer-events-none absolute inset-y-0 right-0 z-20 w-8 sm:w-14"
              />

              <div
                ref={trackRef}
                {...handlers}
                style={{ willChange: 'transform' }}
                className="grid w-max cursor-grab grid-flow-col grid-rows-2 auto-cols-[164px] gap-x-3.5 gap-y-14 px-4 pt-13 pb-4 select-none active:cursor-grabbing sm:auto-cols-[220px] sm:gap-x-5 sm:gap-y-20 sm:px-8 sm:pt-18 md:auto-cols-[260px] lg:auto-cols-[288px] lg:gap-x-6"
              >
                {marqueeItems.map(({ item, keyId }) => renderCameraCard(item, keyId))}
              </div>
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
