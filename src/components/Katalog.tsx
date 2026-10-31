import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Aperture,
  Timer,
  Hammer,
  AlertCircle,
  Zap,
  Clock,
  Loader2
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../database';
import BookingModal from './BookingModal';

type CameraItem = Database['public']['Tables']['cameras']['Row'];

interface KatalogProps {
  onRequireAuth?: () => void;
}

export default function Katalog({ onRequireAuth }: KatalogProps) {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('Semua Alat');
  const filters = ['Semua Alat', 'Paket Bundling', 'Kamera', 'Lensa', 'Aksesoris'];

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraItem | null>(null);

  useEffect(() => {
    fetchCameras();

    // SINKRONISASI REALTIME TABEL CAMERAS
    const channel = supabase
      .channel('realtime_cameras_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cameras' },
        () => {
          fetchCameras(); // Update katalog seketika jika ada perubahan status/unit
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const filterMatch = (item: CameraItem, filter: string) => {
    if (filter === 'Semua Alat') return true;
    if (!item.tipe) return false;
    const t = item.tipe.toLowerCase();

    if (filter === 'Kamera') return t.includes('kamera');
    if (filter === 'Lensa') return t.includes('lensa');
    if (filter === 'Paket Bundling') return t.includes('paket') || t.includes('bundling');
    if (filter === 'Aksesoris') {
      return (
        t.includes('gimbal') || t.includes('stabilizer') || t.includes('mic') ||
        t.includes('audio') || t.includes('tripod') || t.includes('aksesoris') || t.includes('lighting')
      );
    }
    return t.includes(filter.toLowerCase());
  };

  const filteredCameras = cameras.filter((item) => filterMatch(item, activeFilter));

  const handleOpenBooking = async (item: CameraItem) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    
    setSelectedCamera(item);
    setIsBookingModalOpen(true);
  };

  return (
    <section id="katalog" className="bg-[#fafaf9] py-16 sm:py-24">
      <BookingModal 
        isOpen={isBookingModalOpen} 
        onClose={() => setIsBookingModalOpen(false)} 
        camera={selectedCamera} 
      />

      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <div className="text-center">
          <motion.h2
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6 }}
            className="font-['Playfair_Display',serif] text-3xl font-bold text-[#1c1917] sm:text-4xl"
          >
            Katalog Inventaris
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-3 text-sm text-stone-500"
          >
            Pilih dan pinjam peralatan produksi yang kamu butuhkan untuk proyek multimedia-mu.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: false, margin: "-50px" }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-10 flex flex-wrap justify-center gap-6 sm:gap-10"
        >
          {filters.map((filter) => (
            <motion.button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              animate={{ scale: activeFilter === filter ? 1.1 : 1, y: activeFilter === filter ? -3 : 0 }}
              whileHover={activeFilter === filter ? {} : { scale: 1.1, y: -3 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
              className={`relative pb-2 text-xs sm:text-sm font-semibold outline-none transition-colors duration-200 ${
                activeFilter === filter ? 'text-orange-600' : 'text-stone-400 hover:text-stone-700'
              }`}
            >
              <span>{filter}</span>
              {activeFilter === filter && (
                <motion.div
                  layoutId="underline-filter"
                  className="absolute bottom-0 left-0 h-0.5 w-full rounded-full bg-orange-600"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex h-64 flex-col items-center justify-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <span className="text-xs text-stone-400 font-medium">Memuat inventaris dari database...</span>
          </div>
        ) : filteredCameras.length === 0 ? (
          <div className="mt-16 text-center text-sm text-stone-400">
            Tidak ada alat ditemukan untuk kategori ini.
          </div>
        ) : (
          <div className="mt-20 grid grid-cols-1 gap-x-6 gap-y-20 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-24">
            {filteredCameras.map((item, idx) => {
              const isAvailable = item.status === 'Tersedia';
              const isMaintenance = item.status === 'Maintenance';

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative flex flex-col items-center rounded-[2rem] bg-white p-6 pt-24 shadow-lg shadow-stone-200/60 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-stone-300/60"
                >
                  <div
                    className={`absolute top-4 left-4 z-10 flex h-9 w-9 items-center justify-center rounded-2xl border transition-transform hover:scale-110 shadow-xs ${
                      isAvailable
                        ? 'border-emerald-200 bg-emerald-50 text-emerald-600'
                        : isMaintenance
                          ? 'border-amber-200 bg-amber-50 text-amber-600'
                          : 'border-blue-200 bg-blue-50 text-blue-600'
                    }`}
                    title={`Status: ${item.status}`}
                  >
                    {isAvailable ? (
                      <Aperture className="h-4.5 w-4.5" />
                    ) : isMaintenance ? (
                      <Hammer className="h-4.5 w-4.5" />
                    ) : (
                      <Timer className="h-4.5 w-4.5" />
                    )}
                  </div>

                  <span className="absolute top-5 right-5 text-[10px] font-mono font-medium text-stone-400">
                    {item.kode_inventaris}
                  </span>

                  <div className="absolute -top-16 left-1/2 -translate-x-1/2 w-44 h-44">
                    <img
                      src={item.image_url || '/kamera.webp'}
                      alt={item.nama_barang}
                      className="h-full w-full object-contain drop-shadow-2xl transition-transform duration-500 hover:scale-110"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/kamera.webp';
                      }}
                    />
                  </div>

                  <div className="mt-4 flex w-full flex-col items-center text-center">
                    <span className="text-[10px] font-bold tracking-widest text-stone-400 uppercase">
                      {item.tipe || 'Peralatan Lab'}
                    </span>
                    <h3 className="mt-1.5 font-['Playfair_Display',serif] text-lg font-bold text-[#1c1917] leading-tight line-clamp-1">
                      {item.nama_barang}
                    </h3>
                  </div>

                  <div className="mt-6 w-full flex justify-center">
                    {isAvailable ? (
                      <button
                        onClick={() => handleOpenBooking(item)}
                        className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 px-6 py-3 text-xs font-bold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-95"
                      >
                        <Zap className="h-4 w-4 fill-white/20" /> Pinjam Sekarang
                      </button>
                    ) : isMaintenance ? (
                      <button
                        disabled
                        className="flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-6 py-3 text-xs font-bold text-amber-600 opacity-80"
                      >
                        <AlertCircle className="h-4 w-4" /> Perbaikan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleOpenBooking(item)}
                        className="flex w-full items-center justify-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-6 py-3 text-xs font-bold text-orange-600 transition hover:bg-orange-100 hover:border-orange-300 active:scale-95"
                      >
                        <Clock className="h-4 w-4" /> Lihat Antrian
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
