// @ts-nocheck
import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CalendarDays,
  Clock,
  Lock,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Coffee,
  FileText,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import type { Database } from '../../types/database';
import { generateAndDownloadStruk } from '../../lib/generateStruk';
import StrukModal from '../profile/StrukModal';
import TimeDropdown from './TimeDropdown';
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
  formatLocalDateISO,
  formatDateLabel,
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

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraItem | null;
}

const REASON_PRESETS = [
  'Proyek Praktik',
  'Tugas Ujikom',
  'Dokumentasi Sekolah',
  'Liputan Ekskul',
];

export default function BookingModal({ isOpen, onClose, camera }: BookingModalProps) {
  const [studioSettings, setStudioSettings] = useState<StudioSettings>(DEFAULT_STUDIO_SETTINGS);
  const [selectedDateStr, setSelectedDateStr] = useState('');

  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  const [reason, setReason] = useState('');

  const [bookedIntervals, setBookedIntervals] = useState<TimeInterval[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [userId, setUserId] = useState<string | null>(null);
  const [authAvatarFallback, setAuthAvatarFallback] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<CachedProfile | null>(null);

  const [strukResult, setStrukResult] = useState<{
    previewUrl: string;
    kodeBooking: string;
  } | null>(null);

  const bounds = useMemo(() => parseStudioBounds(studioSettings), [studioSettings]);
  const availableDays = useMemo(() => getAvailableWeekdays(bounds), [bounds]);
  const startHoursList = useMemo(() => getStartHoursList(bounds), [bounds]);
  const endHoursList = useMemo(() => getEndHoursList(bounds), [bounds]);

  const timeline: TimelineSlot[] = useMemo(
    () => buildVisualTimeline(bookedIntervals, bounds),
    [bookedIntervals, bounds]
  );

  const startTime = startHour && startMin ? `${startHour}:${startMin}` : '';
  const endTime = endHour && endMin ? `${endHour}:${endMin}` : '';
  const startMinsValue = useMemo(
    () => (startTime ? timeToMins(startTime) : null),
    [startTime]
  );

  // Ref agar callback .subscribe() selalu membaca state terbaru tanpa restart WebSocket
  const latestStateRef = useRef({
    selectedDateStr: '',
    startTime: '',
    endTime: '',
    userId: null as string | null,
    isSubmitting: false,
  });

  useEffect(() => {
    latestStateRef.current = {
      selectedDateStr,
      startTime,
      endTime,
      userId,
      isSubmitting,
    };
  }, [selectedDateStr, startTime, endTime, userId, isSubmitting]);

  const fetchBookedSlots = useCallback(
    async (dateStr: string) => {
      if (!camera || !dateStr) return;
      setIsLoadingSlots(true);

      try {
        const { data, error } = await supabase
          .from('borrow_requests')
          .select('jam_mulai, jam_selesai')
          .eq('camera_id', camera.id)
          .eq('tanggal_pinjam', dateStr)
          .in('status_request', ['Pending', 'Approved']);

        if (error) throw error;

        const intervals: TimeInterval[] = (data || [])
          .map((req) => ({
            start: timeToMins(req.jam_mulai.substring(0, 5)),
            end: timeToMins(req.jam_selesai.substring(0, 5)),
          }))
          .sort((a, b) => a.start - b.start);

        setBookedIntervals(intervals);
      } catch (err) {
        console.error('Gagal memuat slot jadwal:', err);
      } finally {
        setIsLoadingSlots(false);
      }
    },
    [camera]
  );

  // 1. Inisialisasi data awal (studio_settings + session + profiles) saat modal dibuka
  useEffect(() => {
    if (!isOpen) return;

    setSelectedDateStr('');
    setStartHour('');
    setStartMin('');
    setEndHour('');
    setEndMin('');
    setReason('');
    setBookedIntervals([]);
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

  // 2. Fetch slot jadwal setiap kali tanggal dipilih
  useEffect(() => {
    if (!isOpen || !selectedDateStr || !camera) return;
    fetchBookedSlots(selectedDateStr);
  }, [isOpen, selectedDateStr, camera, fetchBookedSlots]);

  // 3. SATU CHANNEL REALTIME UNTUK SEMUA TABEL (borrow_requests, studio_settings, cameras, profiles)
  useEffect(() => {
    if (!isOpen || !camera) return;

    const channel = supabase
      .channel(`booking_modal_live_${camera.id}_${Date.now()}`)
      // A. Pantau jadwal masuk/berubah pada borrow_requests
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `camera_id=eq.${camera.id}`,
        },
        (payload) => {
          const {
            selectedDateStr: activeDate,
            startTime: activeStart,
            endTime: activeEnd,
            userId: activeUserId,
            isSubmitting: currentlySubmitting,
          } = latestStateRef.current;

          if (!activeDate) return;

          // Selalu segarkan timeline & ketersediaan dropdown
          fetchBookedSlots(activeDate);

          // Cek apakah ada siswa lain yang baru saja mengambil jam yang sedang kita pilih
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
            const incomingStart = timeToMins(newRow.jam_mulai.slice(0, 5));
            const incomingEnd = timeToMins(newRow.jam_selesai.slice(0, 5));
            const myStart = timeToMins(activeStart);
            const myEnd = timeToMins(activeEnd);

            const isOverlapped = myStart < incomingEnd && myEnd > incomingStart;

            if (isOverlapped) {
              setStartHour('');
              setStartMin('');
              setEndHour('');
              setEndMin('');

              CustomSwal.fire({
                icon: 'warning',
                title: 'Yah, Keduluan!',
                text: `Jam ${newRow.jam_mulai.slice(0, 5)} - ${newRow.jam_selesai.slice(0, 5)} WIB baru saja dibooking siswa lain. Silakan pilih slot waktu lainnya.`,
              });
            }
          }
        }
      )
      // B. Pantau perubahan jam operasional studio_settings secara langsung
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
      // C. Pantau status unit kamera (jika mendadak masuk Maintenance)
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
      // D. Pantau perubahan data profil siswa (nama/kelas/avatar) untuk cetak struk
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
      return `Jam mulai berada di waktu yang sudah terisi, lewat, atau jam istirahat (${studioSettings.istirahat_mulai.slice(0, 5)} - ${studioSettings.istirahat_selesai.slice(0, 5)}).`;
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
      return 'Jam selesai bertabrakan dengan antrian lain atau berada di jam istirahat.';
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

      // Langsung INSERT; PostgreSQL Exclusion Constraint (23P01) jadi wasit atomik anti-bentrok
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

      // Gunakan profil yang sudah tersinkronisasi (fallback query sekali jika belum termuat)
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
      // Tangkap penolakan atomik dari PostgreSQL Exclusion Constraint (kode 23P01)
      const isDatabaseSlotConflict =
        errObj?.code === '23P01' ||
        String(errObj?.message || '').includes('no_overlapping_camera_bookings') ||
        String(errObj?.message || '').includes('exclusion');

      if (isDatabaseSlotConflict) {
        await fetchBookedSlots(selectedDateStr);
        setStartHour('');
        setStartMin('');
        setEndHour('');
        setEndMin('');

        CustomSwal.fire({
          icon: 'warning',
          title: 'Slot Sudah Dibooking!',
          text: `Jam ${startTime} - ${endTime} WIB baru saja diambil siswa lain. Silakan pilih waktu lain yang masih tersedia.`,
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

  if (!isOpen || !camera) return null;

  if (strukResult) {
    return (
      <StrukModal
        previewUrl={strukResult.previewUrl}
        kodeBooking={strukResult.kodeBooking}
        onClose={() => {
          setStrukResult(null);
          onClose();
        }}
      />
    );
  }

  const isFormValid =
    Boolean(selectedDateStr && startTime && endTime && reason.trim()) && !validationError;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-5"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        >
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-6 py-5 sm:px-8">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Reservasi Unit Lab
              </span>
              <h3 className="font-['Outfit',sans-serif] text-xl font-black leading-tight text-[#1c1917]">
                {camera.nama_barang}
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/50 text-stone-500 transition hover:bg-stone-200"
            >
              ✕
            </button>
          </div>

          {/* KONTEN */}
          <div className="custom-scrollbar flex-1 overflow-y-auto px-6 py-6 sm:px-8">
            {/* 1. GRID 5 KOTAK TANGGAL */}
            <div className="mb-7">
              <div className="mb-3 flex items-center gap-2 text-[#1c1917]">
                <CalendarDays className="h-5 w-5 text-orange-500" />
                <h4 className="font-['Outfit',sans-serif] text-base font-bold">
                  1. Pilih Tanggal
                </h4>
              </div>

              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {availableDays.map((date) => {
                  const iso = formatLocalDateISO(date);
                  const isSelected = selectedDateStr === iso;
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => {
                        setSelectedDateStr(iso);
                        setStartHour('');
                        setStartMin('');
                        setEndHour('');
                        setEndMin('');
                      }}
                      className={`flex flex-col items-center justify-center rounded-2xl border py-3 transition-all active:scale-95 ${
                        isSelected
                          ? 'border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-600/30'
                          : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          isSelected ? 'text-orange-200' : 'text-stone-400'
                        }`}
                      >
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                      <span className="mt-1 font-['Outfit',sans-serif] text-xl font-black">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[11px] font-medium text-stone-400">
                *Operasional Lab: {studioSettings.jam_buka.slice(0, 5)} –{' '}
                {studioSettings.jam_tutup.slice(0, 5)} WIB (Istirahat Admin:{' '}
                {studioSettings.istirahat_mulai.slice(0, 5)} –{' '}
                {studioSettings.istirahat_selesai.slice(0, 5)} WIB)
              </p>
            </div>

            {/* 2, 3, 4: TIMELINE, DROPDOWN CUSTOM JAM & ALASAN */}
            <AnimatePresence>
              {selectedDateStr && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                >
                  {/* 2. TIMELINE ANTRIAN */}
                  <div className="mb-7">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[#1c1917]">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <h4 className="font-['Outfit',sans-serif] text-base font-bold">
                          2. Jadwal {formatDateLabel(new Date(`${selectedDateStr}T00:00:00`))}
                        </h4>
                      </div>
                      {isLoadingSlots && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                    </div>

                    <div className="flex flex-col gap-2 rounded-2xl border border-stone-100 bg-stone-50 p-3.5">
                      {timeline.map((slot, idx) => {
                        if (slot.type === 'free') {
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-100/50 px-3.5 py-2 text-xs font-bold text-emerald-700 sm:text-sm"
                            >
                              <span className="font-mono">
                                {slot.start} - {slot.end}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                <CheckCircle2 className="h-3.5 w-3.5" /> Tersedia
                              </span>
                            </div>
                          );
                        }
                        if (slot.type === 'break') {
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-xl border border-amber-200/80 bg-amber-50 px-3.5 py-2 text-xs font-bold text-amber-700 sm:text-sm"
                            >
                              <span className="font-mono">
                                {slot.start} - {slot.end}
                              </span>
                              <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                                <Coffee className="h-3.5 w-3.5" /> Istirahat Lab
                              </span>
                            </div>
                          );
                        }
                        return (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-xl border border-stone-200 bg-stone-200/60 px-3.5 py-2 text-xs font-bold text-stone-500 opacity-85 sm:text-sm"
                          >
                            <span className="font-mono">
                              {slot.start} - {slot.end}
                            </span>
                            <span className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                              <Lock className="h-3.5 w-3.5" /> Dipinjam
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. CUSTOM DROPDOWN JAM & MENIT */}
                  <div className="mb-7">
                    <h4 className="mb-3 font-['Outfit',sans-serif] text-base font-bold text-[#1c1917]">
                      3. Tentukan Jam Peminjaman
                    </h4>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {/* JAM MULAI */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-stone-500">Jam Mulai</label>
                        <div className="flex items-center gap-2">
                          <TimeDropdown
                            value={startHour}
                            placeholder="HH"
                            options={startHourOptions}
                            onChange={handleStartHourChange}
                          />
                          <span className="font-bold text-stone-400">:</span>
                          <TimeDropdown
                            value={startMin}
                            placeholder="MM"
                            options={startMinOptions}
                            disabled={!startHour}
                            onChange={setStartMin}
                          />
                        </div>
                      </div>

                      {/* JAM SELESAI */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-stone-500">Jam Selesai</label>
                        <div className="flex items-center gap-2">
                          <TimeDropdown
                            value={endHour}
                            placeholder="HH"
                            options={endHourOptions}
                            onChange={handleEndHourChange}
                          />
                          <span className="font-bold text-stone-400">:</span>
                          <TimeDropdown
                            value={endMin}
                            placeholder="MM"
                            options={endMinOptions}
                            disabled={!endHour}
                            onChange={setEndMin}
                          />
                        </div>
                      </div>
                    </div>

                    {validationError && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3.5 text-red-600"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs font-bold leading-relaxed">{validationError}</p>
                      </motion.div>
                    )}
                  </div>

                  {/* 4. ALASAN PEMINJAMAN (REASON) */}
                  <div className="mb-2">
                    <div className="mb-3 flex items-center gap-2 text-[#1c1917]">
                      <FileText className="h-5 w-5 text-orange-500" />
                      <h4 className="font-['Outfit',sans-serif] text-base font-bold">
                        4. Keperluan Peminjaman
                      </h4>
                    </div>

                    <div className="mb-2.5 flex flex-wrap gap-2">
                      {REASON_PRESETS.map((preset) => {
                        const active = reason === preset;
                        return (
                          <button
                            key={preset}
                            type="button"
                            onClick={() => setReason(preset)}
                            className={`rounded-full border px-3.5 py-1.5 text-xs font-bold transition ${
                              active
                                ? 'border-orange-600 bg-orange-600 text-white shadow-xs'
                                : 'border-stone-200 bg-stone-50 text-stone-600 hover:border-orange-300 hover:bg-orange-50'
                            }`}
                          >
                            {preset}
                          </button>
                        );
                      })}
                    </div>

                    <input
                      type="text"
                      maxLength={45}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder="Pilih tombol di atas atau tulis keperluan..."
                      className="w-full rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm font-semibold text-[#1c1917] outline-none transition focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-stone-100 bg-white p-6 sm:px-8">
            <button
              type="button"
              onClick={handleBooking}
              disabled={!isFormValid || isSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold transition-all ${
                !isFormValid
                  ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                  : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memvalidasi Jadwal...
                </>
              ) : isFormValid ? (
                `Booking Jadwal (${startTime} - ${endTime})`
              ) : (
                'Lengkapi Tanggal, Jam & Keperluan'
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
