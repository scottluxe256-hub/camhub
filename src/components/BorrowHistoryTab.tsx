import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { CustomSwal, Toast } from '../lib/CustomSwal';
import { generateAndDownloadStruk } from '../lib/generateStruk';
import type { Database } from '../types/database';
import type { UserProfileData } from './ProfileView';
import {
  Loader2,
  History,
  Download,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
} from 'lucide-react';

type BorrowRequestRow = Database['public']['Tables']['borrow_requests']['Row'];
type CameraRow = Database['public']['Tables']['cameras']['Row'];
type CameraSummary = Pick<CameraRow, 'nama_barang' | 'kode_inventaris'>;

type BorrowHistoryQueryRow = Pick<
  BorrowRequestRow,
  | 'id'
  | 'camera_id'
  | 'tanggal_pinjam'
  | 'jam_mulai'
  | 'jam_selesai'
  | 'alasan_pinjam'
  | 'status_request'
  | 'catatan_admin'
> & {
  cameras: CameraSummary | CameraSummary[] | null;
};

interface BorrowHistoryItem
  extends Pick<
    BorrowRequestRow,
    | 'id'
    | 'camera_id'
    | 'tanggal_pinjam'
    | 'jam_mulai'
    | 'jam_selesai'
    | 'alasan_pinjam'
    | 'status_request'
    | 'catatan_admin'
  > {
  camera: CameraSummary | null;
}

interface BorrowHistoryTabProps {
  isOpen: boolean;
  isActive: boolean;
  userId: string | null;
  profileData: UserProfileData | null;
  onHistoryCountChange?: (count: number) => void;
  onDownloadingChange?: (isDownloading: boolean) => void;
}

export default function BorrowHistoryTab({
  isOpen,
  isActive,
  userId,
  profileData,
  onHistoryCountChange,
  onDownloadingChange,
}: BorrowHistoryTabProps) {
  const [borrowHistory, setBorrowHistory] = useState<BorrowHistoryItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isDownloading, setIsDownloading] = useState<string | null>(null);

  // Helper cek apakah waktu selesai jadwal sudah terlewati (waktu lokal WIB)
  const hasScheduleEnded = (tanggalPinjam: string, jamSelesai: string): boolean => {
    const endDateTime = new Date(`${tanggalPinjam}T${jamSelesai.slice(0, 5)}:00`);
    return Date.now() >= endDateTime.getTime();
  };

  // Filter daftar riwayat aktif sesuai aturan siklus waktu
  const filterActiveHistory = useCallback((items: BorrowHistoryItem[]): BorrowHistoryItem[] => {
    return items.filter((item) => {
      // Sudah dikembalikan -> langsung hilang
      if (item.status_request === 'Returned') return false;

      // Pending atau Ditolak -> hilang otomatis setelah jam_selesai lewat
      if (item.status_request === 'Pending' || item.status_request === 'Rejected') {
        return !hasScheduleEnded(item.tanggal_pinjam, item.jam_selesai);
      }

      // Approved -> tetap tampil sampai Admin mengonfirmasi pengembalian (Returned)
      return true;
    });
  }, []);

  const fetchHistory = useCallback(async () => {
    if (!userId) return;
    setIsLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select(`
          id,
          camera_id,
          tanggal_pinjam,
          jam_mulai,
          jam_selesai,
          alasan_pinjam,
          status_request,
          catatan_admin,
          cameras (
            nama_barang,
            kode_inventaris
          )
        `)
        .eq('user_id', userId)
        .neq('status_request', 'Returned')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const rows = (data ?? []) as unknown as BorrowHistoryQueryRow[];
      const formattedData: BorrowHistoryItem[] = rows.map((item) => ({
        id: item.id,
        camera_id: item.camera_id,
        tanggal_pinjam: item.tanggal_pinjam,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        alasan_pinjam: item.alasan_pinjam,
        status_request: item.status_request,
        catatan_admin: item.catatan_admin,
        camera: Array.isArray(item.cameras) ? (item.cameras[0] ?? null) : item.cameras,
      }));

      const activeItems = filterActiveHistory(formattedData);
      setBorrowHistory(activeItems);
      onHistoryCountChange?.(activeItems.length);
    } catch (err) {
      console.error('Gagal mengambil riwayat:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [userId, filterActiveHistory, onHistoryCountChange]);

  useEffect(() => {
    if (!isOpen || !userId) return;

    fetchHistory();

    // Sinkronisasi realtime jika Admin mengubah status (ACC / Tolak / Terima Kembali)
    const channel = supabase
      .channel(`profile_history_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, userId, fetchHistory]);

  // Cek ulang setiap 30 detik agar item otomatis hilang tepat saat jam_selesai lewat
  useEffect(() => {
    if (!isOpen || !isActive) return;
    const timer = setInterval(() => {
      setBorrowHistory((prev) => {
        const updated = filterActiveHistory(prev);
        onHistoryCountChange?.(updated.length);
        return updated;
      });
    }, 30_000);

    return () => clearInterval(timer);
  }, [isOpen, isActive, filterActiveHistory, onHistoryCountChange]);

  const handleDownloadStruk = async (item: BorrowHistoryItem) => {
    if (!profileData) return;
    setIsDownloading(item.id);
    onDownloadingChange?.(true);

    try {
      await generateAndDownloadStruk({
        id: item.id,
        nama_lengkap: profileData.nama_lengkap,
        nis: profileData.nis,
        kelas: profileData.kelas,
        foto_url: profileData.foto_url || null,
        nama_barang: item.camera?.nama_barang || 'Peralatan Lab',
        kode_inventaris: item.camera?.kode_inventaris || '-',
        tanggal_pinjam: item.tanggal_pinjam,
        jam_mulai: item.jam_mulai,
        jam_selesai: item.jam_selesai,
        alasan_pinjam: item.alasan_pinjam,
      });

      Toast.fire({
        icon: 'success',
        title: 'Struk berhasil diunduh!',
      });
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Terjadi kesalahan saat membuat ulang struk.';
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Unduh Struk',
        text: errorMessage,
      });
    } finally {
      setIsDownloading(null);
      onDownloadingChange?.(false);
    }
  };

  if (!isActive) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0 }}
      className="flex flex-col gap-3"
    >
      {isLoadingHistory ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-stone-400">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          <span className="text-xs font-medium">Memuat riwayat aktif...</span>
        </div>
      ) : borrowHistory.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center gap-2 text-stone-400">
          <History className="h-8 w-8 opacity-20" />
          <span className="text-xs font-medium">Tidak ada sesi peminjaman aktif</span>
        </div>
      ) : (
        borrowHistory.map((item) => {
          const isPending = item.status_request === 'Pending';
          const isApproved = item.status_request === 'Approved';
          const isRejected = item.status_request === 'Rejected';
          const isOverdue =
            isApproved && hasScheduleEnded(item.tanggal_pinjam, item.jam_selesai);

          return (
            <div
              key={item.id}
              className={`flex flex-col rounded-2xl border bg-white p-4 shadow-xs transition ${
                isRejected
                  ? 'border-red-200 bg-red-50/20'
                  : isOverdue
                    ? 'border-orange-300 bg-orange-50/25'
                    : 'border-stone-200 hover:border-orange-200 hover:shadow-md'
              }`}
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div>
                  <h4 className="line-clamp-1 font-['Outfit',sans-serif] text-sm font-bold text-stone-800">
                    {item.camera?.nama_barang || 'Item Tidak Diketahui'}
                  </h4>
                  <p className="mt-0.5 text-[10px] font-medium text-stone-400">
                    {new Date(`${item.tanggal_pinjam}T00:00:00`).toLocaleDateString('id-ID', {
                      weekday: 'short',
                      day: '2-digit',
                      month: 'short',
                      year: 'numeric',
                    })}{' '}
                    • {item.jam_mulai.slice(0, 5)} - {item.jam_selesai.slice(0, 5)} WIB
                  </p>
                </div>

                <div
                  className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold uppercase tracking-wider ${
                    isPending
                      ? 'bg-amber-100 text-amber-700'
                      : isOverdue
                        ? 'bg-red-100 text-red-700'
                        : isApproved
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                  }`}
                >
                  {isPending ? (
                    <Clock className="h-3 w-3" />
                  ) : isOverdue ? (
                    <AlertTriangle className="h-3 w-3" />
                  ) : isApproved ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <XCircle className="h-3 w-3" />
                  )}
                  {isOverdue ? 'Terlambat' : isRejected ? 'Ditolak' : item.status_request}
                </div>
              </div>

              {(item.catatan_admin || isRejected) && (
                <div className="mb-3 flex items-start gap-1.5 rounded-lg bg-red-50 p-2.5 text-[10px] font-medium text-red-600">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p>
                    {item.catatan_admin ||
                      'Pengajuan ditolak oleh Admin Lab. Silakan hubungi petugas studio.'}
                  </p>
                </div>
              )}

              {!isRejected && (
                <button
                  type="button"
                  onClick={() => handleDownloadStruk(item)}
                  disabled={isDownloading === item.id}
                  className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-stone-100 py-2 text-[11px] font-bold text-stone-600 transition hover:bg-orange-100 hover:text-orange-700 active:scale-95 disabled:opacity-50"
                >
                  {isDownloading === item.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5" />
                  )}
                  {isDownloading === item.id ? 'Mengunduh...' : 'Unduh Ulang Struk PNG'}
                </button>
              )}
            </div>
          );
        })
      )}
    </motion.div>
  );
}
