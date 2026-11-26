import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/database';
import {
  Bell,
  CheckCheck,
  Clock,
  AlertTriangle,
  ShieldAlert,
} from 'lucide-react';

type BorrowRequestRow = Database['public']['Tables']['borrow_requests']['Row'];
type CameraNameObj = Pick<Database['public']['Tables']['cameras']['Row'], 'nama_barang'>;

type ReminderQueryRow = Pick<
  BorrowRequestRow,
  | 'id'
  | 'tanggal_pinjam'
  | 'jam_mulai'
  | 'jam_selesai'
  | 'notif_10m_sent'
  | 'notif_expired_sent'
  | 'notif_final_warning_sent'
  | 'created_at'
> & {
  cameras: CameraNameObj | CameraNameObj[] | null;
};

interface TimeReminderItem {
  key: string;
  title: string;
  message: string;
  timeLabel: string;
  severity: 'soon' | 'expired' | 'overdue';
}

interface NotificationBellProps {
  userId: string | null;
  userEmail: string | null;
  onRequireAuth?: () => void;
  onBeforeOpen?: () => void;
  onNotificationClick?: () => void;
}

export default function NotificationBell({
  userId,
  userEmail,
  onRequireAuth,
  onBeforeOpen,
  onNotificationClick,
}: NotificationBellProps) {
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState<TimeReminderItem[]>([]);
  const [readKeys, setReadKeys] = useState<Set<string>>(new Set());
  const notifContainerRef = useRef<HTMLDivElement>(null);

  const fetchTimeReminders = async (uid: string) => {
    const { data, error } = await supabase
      .from('borrow_requests')
      .select(`
        id,
        tanggal_pinjam,
        jam_mulai,
        jam_selesai,
        notif_10m_sent,
        notif_expired_sent,
        notif_final_warning_sent,
        created_at,
        cameras (
          nama_barang
        )
      `)
      .eq('user_id', uid)
      .eq('status_request', 'Approved')
      .order('created_at', { ascending: false });

    if (error || !data) return;

    const mapped: TimeReminderItem[] = [];
    const rows = data as unknown as ReminderQueryRow[];

    rows.forEach((row) => {
      const camObj = Array.isArray(row.cameras) ? row.cameras[0] : row.cameras;
      const camName = camObj?.nama_barang || 'Unit Lab';
      const dateShort = new Date(`${row.tanggal_pinjam}T00:00:00`).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
      });
      const endFormatted = row.jam_selesai.slice(0, 5);
      const timeRange = `${row.jam_mulai.slice(0, 5)}–${endFormatted} WIB`;

      if (row.notif_final_warning_sent) {
        mapped.push({
          key: `${row.id}:final_warning`,
          title: 'Peringatan Keterlambatan (+10 Menit)',
          message: `Batas toleransi ${camName} telah lewat. Segera kembalikan ke lab untuk menghindari denda.`,
          timeLabel: `${dateShort} • ${timeRange}`,
          severity: 'overdue',
        });
      }

      if (row.notif_expired_sent) {
        mapped.push({
          key: `${row.id}:expired`,
          title: 'Waktu Peminjaman Habis',
          message: `Durasi pinjam ${camName} berakhir pukul ${endFormatted} WIB. Harap segera dikembalikan ke lab.`,
          timeLabel: `${dateShort} • ${timeRange}`,
          severity: 'expired',
        });
      }

      if (row.notif_10m_sent) {
        mapped.push({
          key: `${row.id}:10m`,
          title: 'Sisa Waktu 10 Menit',
          message: `Peminjaman ${camName} akan berakhir pada ${endFormatted} WIB. Bersiap kembali ke studio lab.`,
          timeLabel: `${dateShort} • ${timeRange}`,
          severity: 'soon',
        });
      }
    });

    setNotifications(mapped);
  };

  useEffect(() => {
    if (!userId) {
      setReadKeys(new Set());
      setNotifications([]);
      setIsNotifOpen(false);
      return;
    }

    try {
      const saved = localStorage.getItem(`camhub_read_notifs_${userId}`);
      setReadKeys(saved ? new Set(JSON.parse(saved)) : new Set());
    } catch {
      setReadKeys(new Set());
    }

    fetchTimeReminders(userId);

    const channel = supabase
      .channel(`notif_bell_${userId}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchTimeReminders(userId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  useEffect(() => {
    if (!isNotifOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (notifContainerRef.current && !notifContainerRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isNotifOpen]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !readKeys.has(n.key)).length,
    [notifications, readKeys]
  );

  const persistReadKeys = (updatedSet: Set<string>) => {
    setReadKeys(updatedSet);
    if (userId) {
      try {
        localStorage.setItem(
          `camhub_read_notifs_${userId}`,
          JSON.stringify(Array.from(updatedSet))
        );
      } catch {
        // Abaikan jika storage penuh
      }
    }
  };

  const handleMarkAllAsRead = () => {
    const nextSet = new Set(readKeys);
    notifications.forEach((n) => nextSet.add(n.key));
    persistReadKeys(nextSet);
  };

  const handleItemClick = (item: TimeReminderItem) => {
    if (!readKeys.has(item.key)) {
      const nextSet = new Set(readKeys);
      nextSet.add(item.key);
      persistReadKeys(nextSet);
    }
    setIsNotifOpen(false);
    if (onNotificationClick) onNotificationClick();
  };

  const handleBellClick = () => {
    if (!userEmail) {
      if (onRequireAuth) onRequireAuth();
      return;
    }
    if (onBeforeOpen) onBeforeOpen();
    setIsNotifOpen((prev) => {
      const next = !prev;
      if (next && userId) fetchTimeReminders(userId);
      return next;
    });
  };

  const renderSeverityIcon = (severity: TimeReminderItem['severity'], isUnread: boolean) => {
    if (!isUnread) {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-stone-100 text-stone-400">
          {severity === 'overdue' ? (
            <ShieldAlert className="h-4 w-4" />
          ) : severity === 'expired' ? (
            <AlertTriangle className="h-4 w-4" />
          ) : (
            <Clock className="h-4 w-4" />
          )}
        </div>
      );
    }

    if (severity === 'overdue') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600">
          <ShieldAlert className="h-4 w-4" />
        </div>
      );
    }

    if (severity === 'expired') {
      return (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
          <AlertTriangle className="h-4 w-4" />
        </div>
      );
    }

    return (
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
        <Clock className="h-4 w-4" />
      </div>
    );
  };

  return (
    <div ref={notifContainerRef} className="relative">
      <button
        type="button"
        onClick={handleBellClick}
        aria-label="Pengingat Waktu"
        className={`relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full border backdrop-blur-xs transition-all duration-200 active:scale-90 sm:h-8.5 sm:w-8.5 ${
        unreadCount > 0
          ? 'border-amber-400/80 bg-gradient-to-br from-amber-50/90 to-orange-100/80 text-orange-600 shadow-[0_0_12px_rgba(249,115,22,0.28)]'
          : 'border-amber-400/45 bg-white/55 text-stone-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] hover:border-orange-400/80 hover:bg-white/80 hover:text-orange-600'
        }`}
      >
        <Bell className="h-4.5 w-4.5" />

        {userEmail && unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-extrabold leading-none text-white ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isNotifOpen && userEmail && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="fixed left-4 right-4 top-[62px] z-50 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-2xl shadow-stone-900/15 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2.5 sm:w-[360px]"
          >
            <div className="flex items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="font-['Outfit',sans-serif] text-sm font-bold text-[#1c1917]">
                  Pengingat Waktu
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-extrabold text-red-600">
                    {unreadCount} baru
                  </span>
                )}
              </div>

              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold text-orange-600 transition hover:bg-orange-50 active:scale-95"
                >
                  <CheckCheck className="h-3.5 w-3.5" />
                  Tandai telah dibaca
                </button>
              )}
            </div>

            <div className="custom-scrollbar max-h-80 divide-y divide-stone-100 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-10 text-stone-400">
                  <Bell className="h-7 w-7 opacity-25" />
                  <span className="text-xs font-medium">
                    Tidak ada peringatan waktu aktif
                  </span>
                </div>
              ) : (
                notifications.map((item) => {
                  const isUnread = !readKeys.has(item.key);
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleItemClick(item)}
                      className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-stone-50 ${
                        isUnread ? 'bg-orange-50/45' : 'bg-white opacity-65'
                      }`}
                    >
                      {renderSeverityIcon(item.severity, isUnread)}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p
                            className={`truncate text-xs font-bold ${
                              isUnread ? 'text-[#1c1917]' : 'text-stone-600'
                            }`}
                          >
                            {item.title}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                          )}
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-[11px] leading-relaxed text-stone-500">
                          {item.message}
                        </p>
                        <span className="mt-1 block font-mono text-[10px] font-medium text-stone-400">
                          {item.timeLabel}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
