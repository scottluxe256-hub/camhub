import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import { generateAndDownloadStruk } from '../../lib/generateStruk';
import type { Database } from '../../types/database';
import {
  type StudioSettings,
  type TimeInterval,
  type TimelineSlot,
  DEFAULT_STUDIO_SETTINGS,
  MINUTES_LIST,
  parseStudioBounds,
  getStartHoursList,
  getEndHoursList,
  timeToMins,
  getAvailableWeekdays,
  buildVisualTimeline,
  isStartHourDisabled,
  isStartMinuteDisabled,
  isEndHourDisabled,
  isEndMinuteDisabled,
  getFirstAvailableStartMinute,
  getFirstAvailableEndMinute,
} from '../../utils/bookingSlots';

type CameraItem = Database['public']['Tables']['cameras']['Row'];
type BorrowRequestRow = Database['public']['Tables']['borrow_requests']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type CachedProfile = Pick<ProfileRow, 'nama_lengkap' | 'nis' | 'kelas' | 'foto_url'>;

interface ActiveBookingSlot extends TimeInterval {
  userId: string;
}

export const REASON_PRESETS = [
  'Proyek Praktik',
  'Tugas Ujikom',
  'Dokumentasi Sekolah',
  'Liputan Ekskul',
];

/**
 * Menghitung interval waktu yang benar-benar penuh (jumlah peminjam >= stok unit).
 * Jika stok = 2 dan baru 1 unit dipinjam, jam tersebut tetap terbuka untuk peminjam kedua.
 */
function computeStockBlockedIntervals(
  bookings: ActiveBookingSlot[],
  stock: number
): TimeInterval[] {
  const capacity = Math.max(1, stock);
  if (bookings.length < capacity) return [];

  const events: Array<{ time: number; delta: number }> = [];
  for (const b of bookings) {
    if (b.end <= b.start) continue;
    events.push({ time: b.start, delta: 1 });
    events.push({ time: b.end, delta: -1 });
  }

  // Urutkan waktu naik; jika waktu sama, proses yang selesai (-1) sebelum yang mulai (+1)
  events.sort((a, b) => (a.time !== b.time ? a.time - b.time : a.delta - b.delta));

  const blocked: TimeInterval[] = [];
  let activeCount = 0;
  let blockStart: number | null = null;

  for (const ev of events) {
    const prevCount = activeCount;
    activeCount += ev.delta;

    if (prevCount < capacity && activeCount >= capacity) {
      blockStart = ev.time;
    } else if (prevCount >= capacity && activeCount < capacity && blockStart !== null) {
      if (ev.time > blockStart) {
        const last = blocked[blocked.length - 1];
        if (last && last.end === blockStart) {
          last.end = ev.time;
        } else {
          blocked.push({ start: blockStart, end: ev.time });
        }
      }
      blockStart = null;
    }
  }

  return blocked;
}

interface UseBookingModalParams {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraItem | null;
}

export function useBookingModal({ isOpen, onClose, camera }: UseBookingModalParams) {
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [reason, setReason] = useState('');

  const [rawBookings, setRawBookings] = useState<ActiveBookingSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [authAvatarFallback, setAuthAvatarFallback] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<CachedProfile | null>(null);

  const [strukResult, setStrukResult] = useState<{
    previewUrl: string;
    kodeBooking: string;
  } | null>(null);

  const totalStock = Math.max(1, camera?.stok ?? 1);

  const bounds = useMemo(() => parseStudioBounds(studioSettings), [studioSettings]);
  const availableDays = useMemo(() => getAvailableWeekdays(bounds), [bounds]);
  const startHoursList = useMemo(() => getStartHoursList(bounds), [bounds]);
  const endHoursList = useMemo(() => getEndHoursList(bounds), [bounds]);

  // Interval yang penuh berdasarkan kuota stok + jadwal milik user sendiri agar tidak double-booking
  const bookedIntervals: TimeInterval[] = useMemo(() => {
    const stockFull = computeStockBlockedIntervals(rawBookings, totalStock);
    if (!userId) return stockFull;

    const myBookings: TimeInterval[] = rawBookings
      .filter((b) => b.userId === userId)
      .map(({ start, end }) => ({ start, end }));

    return [...stockFull, ...myBookings].sort((a, b) => a.start - b.start);
  }, [rawBookings, totalStock, userId]);

  const timeline: TimelineSlot[] = useMemo(
    () => buildVisualTimeline(bookedIntervals, bounds),
    [bookedIntervals, bounds]
  );

  // Hitung apakah ada unit yang sedang terpakai sebagian (khusus stok > 1)
  const activePartialCount = useMemo(() => {
    if (totalStock <= 1) return 0;
    return rawBookings.length;
  }, [rawBookings.length, totalStock]);

  const startTime = startHour && startMin ? `${startHour}:${startMin}` : '';
  const endTime = endHour && endMin ? `${endHour}:${endMin}` : '';
  const startMinsValue = useMemo(
    () => (startTime ? timeToMins(startTime) : null),
    [startTime]
  );

  const latestStateRef = useRef({
    selectedDateStr: '',
    startTime: '',
    endTime: '',
    userId: null as string | null,
    isSubmitting: false,
    totalStock: 1,
  });

  useEffect(() => {
    latestStateRef.current = {
      selectedDateStr,
      startTime,
      endTime,
      userId,
      isSubmitting,
      totalStock,
    };
  }, [selectedDateStr, startTime, endTime, userId, isSubmitting, totalStock]);

  const fetchBookedSlots = useCallback(
    async (dateStr: string): Promise<ActiveBookingSlot[]> => {
      if (!camera || !dateStr) return [];
      setIsLoadingSlots(true);

      try {
        const { data, error } = await supabase
          .from('borrow_requests')
          .select('user_id, jam_mulai, jam_selesai')
          .eq('camera_id', camera.id)
          .eq('tanggal_pinjam', dateStr)
          .in('status_request', ['Pending', 'Approved']);

        if (error) throw error;

        const slots: ActiveBookingSlot[] = (data || [])
          .map((req) => ({
            userId: req.user_id,
            start: timeToMins(req.jam_mulai.substring(0, 5)),
            end: timeToMins(req.jam_selesai.substring(0, 5)),
          }))
          .sort((a, b) => a.start - b.start);

        setRawBookings(slots);
        return slots;
      } catch (err) {
        console.error('Gagal memuat slot jadwal:', err);
        return [];
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [camera]
  );

  useEffect(() => {
    if (!isOpen) return;

    setSelectedDateStr('');
    setStartHour('');
    setStartMin('');
    setEndHour('');
    setEndMin('');
    setReason('');
    setRawBookings([]);
    setStrukResult(null);

    const loadInitialData = async () => {
      const [settingsRes, sessionRes] = await Promise.all([
        supabase
          .from('studio_settings')
          .select('jam_buka, jam_tutup, istirahat_mulai, istirahat_selesai')
          .eq('id', 1)
          .single(),
        supabase.auth.getSession(),
      ]);

      if (!settingsRes.error && settingsRes.data) {
        setStudioSettings(settingsRes.data);
      }

      const sessionUser = sessionRes.data.session?.user;
      if (sessionUser) {
        setUserId(sessionUser.id);
        setAuthAvatarFallback(
          sessionUser.user_metadata?.avatar_url ||
            sessionUser.user_metadata?.picture ||
            null
        );

        const { data: prof } = await supabase
          .from('profiles')
          .select('nama_lengkap, nis, kelas, foto_url')
          .eq('id', sessionUser.id)
          .single();

        if (prof) {
          setUserProfile(prof);
        }
      }
    };

    loadInitialData();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !selectedDateStr || !camera) return;
    fetchBookedSlots(selectedDateStr);
  }, [isOpen, selectedDateStr, camera, fetchBookedSlots]);

  useEffect(() => {
    if (!isOpen || !camera) return;

    const channel = supabase
      .channel(`booking_modal_live_${camera.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `camera_id=eq.${camera.id}`,
        },
        async (payload) => {
          const {
            selectedDateStr: activeDate,
            startTime: activeStart,
            endTime: activeEnd,
            userId: activeUserId,
            isSubmitting: currentlySubmitting,
            totalStock: currentCapacity,
          } = latestStateRef.current;

          if (!activeDate) return;

          const updatedSlots = await fetchBookedSlots(activeDate);
          const newRow = payload.new as Partial<BorrowRequestRow> | undefined;

          if (
            newRow &&
            !currentlySubmitting &&
            newRow.user_id !== activeUserId &&
            newRow.tanggal_pinjam === activeDate &&
            (newRow.status_request === 'Pending' || newRow.status_request === 'Approved') &&
            activeStart &&
            activeEnd &&
            newRow.jam_mulai &&
            newRow.jam_selesai
          ) {
            const myStart = timeToMins(activeStart);
            const myEnd = timeToMins(activeEnd);
            const blockedNow = computeStockBlockedIntervals(updatedSlots, currentCapacity);
            const isNowBlocked = blockedNow.some(
              (b) => myStart < b.end && myEnd > b.start
            );

            if (isNowBlocked) {
              setStartHour('');
              setStartMin('');
              setEndHour('');
              setEndMin('');

              CustomSwal.fire({
                icon: 'warning',
                title: 'Yah, Keduluan!',
                text: `Kuota unit pada jam ${newRow.jam_mulai.slice(0, 5)} - ${newRow.jam_selesai.slice(0, 5)} WIB baru saja penuh diambil siswa lain. Silakan pilih slot waktu lainnya.`,
              });
            }
          }
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
            setStudioSettings(payload.new as StudioSettings);
            Toast.fire({
              icon: 'info',
              title: 'Jam operasional studio diperbarui Admin',
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'cameras',
          filter: `id=eq.${camera.id}`,
        },
        (payload) => {
          const updatedCam = payload.new as Partial<CameraItem> | undefined;
          if (updatedCam?.status === 'Maintenance') {
            CustomSwal.fire({
              icon: 'error',
              title: 'Unit Masuk Perbaikan',
              text: `${updatedCam.nama_barang} baru saja ditandai Maintenance oleh Admin Lab.`,
            }).then(() => {
              onClose();
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
        },
        (payload) => {
          const updatedProf = payload.new as Partial<ProfileRow> | undefined;
          if (updatedProf && updatedProf.id === latestStateRef.current.userId) {
            setUserProfile({
              nama_lengkap: updatedProf.nama_lengkap ?? null,
              nis: updatedProf.nis ?? null,
              kelas: updatedProf.kelas ?? null,
              foto_url: updatedProf.foto_url ?? null,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isOpen, camera, fetchBookedSlots, onClose]);

  const handleSelectDate = (iso: string) => {
    setSelectedDateStr(iso);
    setStartHour('');
    setStartMin('');
    setEndHour('');
    setEndMin('');
  };

  const handleStartHourChange = (newHour: string) => {
    setStartHour(newHour);
    const autoMin = getFirstAvailableStartMinute(
      newHour,
      selectedDateStr,
      bookedIntervals,
      bounds
    );
    setStartMin(autoMin);

    if (endHour && endMin && autoMin) {
      const newStartMins = Number(newHour) * 60 + Number(autoMin);
      if (
        isEndMinuteDisabled(
          endHour,
          endMin,
          newStartMins,
          selectedDateStr,
          bookedIntervals,
          bounds
        )
      ) {
        setEndHour('');
        setEndMin('');
      }
    }
  };

  const handleEndHourChange = (newHour: string) => {
    setEndHour(newHour);
    const autoMin = getFirstAvailableEndMinute(
      newHour,
      startMinsValue,
      selectedDateStr,
      bookedIntervals,
      bounds
    );
    setEndMin(autoMin);
  };

  const startHourOptions = useMemo(
    () =>
      startHoursList.map((h) => ({
        value: h,
        label: h,
        disabled: isStartHourDisabled(h, selectedDateStr, bookedIntervals, bounds),
      })),
    [startHoursList, selectedDateStr, bookedIntervals, bounds]
  );

  const startMinOptions = useMemo(
    () =>
      MINUTES_LIST.map((m) => ({
        value: m,
        label: m,
        disabled:
          !startHour ||
          isStartMinuteDisabled(startHour, m, selectedDateStr, bookedIntervals, bounds),
      })),
    [startHour, selectedDateStr, bookedIntervals, bounds]
  );

  const endHourOptions = useMemo(
    () =>
      endHoursList.map((h) => ({
        value: h,
        label: h,
        disabled: isEndHourDisabled(h, startMinsValue, selectedDateStr, bookedIntervals, bounds),
      })),
    [endHoursList, startMinsValue, selectedDateStr, bookedIntervals, bounds]
  );

  const endMinOptions = useMemo(
    () =>
      MINUTES_LIST.map((m) => ({
        value: m,
        label: m,
        disabled:
          !endHour ||
          isEndMinuteDisabled(endHour, m, startMinsValue, selectedDateStr, bookedIntervals, bounds),
      })),
    [endHour, startMinsValue, selectedDateStr, bookedIntervals, bounds]
  );

  const validationError = useMemo(() => {
    if (!selectedDateStr || !startTime || !endTime) return null;

    if (isStartMinuteDisabled(startHour, startMin, selectedDateStr, bookedIntervals, bounds)) {
      return `Jam mulai berada di waktu yang sudah penuh, lewat, atau jam istirahat (${studioSettings.istirahat_mulai.slice(0, 5)} - ${studioSettings.istirahat_selesai.slice(0, 5)}).`;
    }
    if (
      isEndMinuteDisabled(
        endHour,
        endMin,
        startMinsValue,
        selectedDateStr,
        bookedIntervals,
        bounds
      )
    ) {
      return 'Jam selesai bertabrakan dengan kuota jadwal yang penuh atau berada di jam istirahat.';
    }
    return null;
  }, [
    selectedDateStr,
    startTime,
    endTime,
    startHour,
    startMin,
    endHour,
    endMin,
    startMinsValue,
    bookedIntervals,
    bounds,
    studioSettings,
  ]);

  const handleBooking = async () => {
    if (
      !camera ||
      !selectedDateStr ||
      !startTime ||
      !endTime ||
      !reason.trim() ||
      validationError ||
      isSubmitting
    ) {
      return;
    }

    setIsSubmitting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('Sesi berakhir, silakan login ulang.');

      const { data: insertedBorrow, error: insertError } = await supabase
        .from('borrow_requests')
        .insert({
          user_id: session.user.id,
          camera_id: camera.id,
          tanggal_pinjam: selectedDateStr,
          rencana_kembali: selectedDateStr,
          jam_mulai: startTime,
          jam_selesai: endTime,
          alasan_pinjam: reason.trim(),
          status_request: 'Pending',
        })
        .select()
        .single();

      if (insertError || !insertedBorrow) {
        throw insertError || new Error('Gagal menyimpan pengajuan peminjaman.');
      }

      let activeProfile = userProfile;
      if (!activeProfile) {
        const { data: freshProfile } = await supabase
          .from('profiles')
          .select('nama_lengkap, nis, kelas, foto_url')
          .eq('id', session.user.id)
          .single();
        activeProfile = freshProfile;
      }

      const avatarUrl = activeProfile?.foto_url || authAvatarFallback;

      const generatedStruk = await generateAndDownloadStruk({
        id: insertedBorrow.id,
        nama_lengkap: activeProfile?.nama_lengkap,
        nis: activeProfile?.nis,
        kelas: activeProfile?.kelas,
        foto_url: avatarUrl,
        nama_barang: camera.nama_barang,
        kode_inventaris: camera.kode_inventaris,
        tanggal_pinjam: insertedBorrow.tanggal_pinjam,
        jam_mulai: insertedBorrow.jam_mulai,
        jam_selesai: insertedBorrow.jam_selesai,
        alasan_pinjam: insertedBorrow.alasan_pinjam,
      });

      if (generatedStruk) {
        setStrukResult(generatedStruk);
      } else {
        Toast.fire({
          icon: 'success',
          title: 'Booking berhasil! Menunggu ACC Admin.',
        });
        onClose();
      }
    } catch (err: unknown) {
      const errObj = err as { code?: string; message?: string };
      const isDatabaseSlotConflict =
        errObj?.code === '23P01' ||
        String(errObj?.message || '').includes('Kuota unit') ||
        String(errObj?.message || '').includes('exclusion');

      if (isDatabaseSlotConflict) {
        await fetchBookedSlots(selectedDateStr);
        setStartHour('');
        setStartMin('');
        setEndHour('');
        setEndMin('');

        CustomSwal.fire({
          icon: 'warning',
          title: 'Kuota Jam Penuh!',
          text: `Seluruh unit pada jam ${startTime} - ${endTime} WIB baru saja dibooking siswa lain. Silakan pilih waktu lain yang masih tersedia.`,
        });
      } else {
        CustomSwal.fire({
          icon: 'error',
          title: 'Gagal Booking',
          text: errObj?.message || 'Terjadi kesalahan saat memproses jadwal.',
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid =
    Boolean(selectedDateStr && startTime && endTime && reason.trim()) && !validationError;

  return {
    studioSettings,
    selectedDateStr,
    startHour,
    startMin,
    setStartMin,
    endHour,
    endMin,
    setEndMin,
    reason,
    setReason,
    isLoadingSlots,
    isSubmitting,
    strukResult,
    setStrukResult,
    totalStock,
    activePartialCount,
    availableDays,
    timeline,
    startTime,
    endTime,
    startHourOptions,
    startMinOptions,
    endHourOptions,
    endMinOptions,
    validationError,
    isFormValid,
    handleSelectDate,
    handleStartHourChange,
    handleEndHourChange,
    handleBooking,
  };
}
