import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Clock, Lock, Loader2, CheckCircle2, AlertCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { Database } from '../database';

type CameraItem = Database['public']['Tables']['cameras']['Row'];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraItem | null;
}

const timeToMins = (timeStr: string) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const minsToTime = (mins: number) => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export default function BookingModal({ isOpen, onClose, camera }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const [startHour, setStartHour] = useState('');
  const [startMin, setStartMin] = useState('');
  const [endHour, setEndHour] = useState('');
  const [endMin, setEndMin] = useState('');
  
  const startTime = startHour && startMin ? `${startHour}:${startMin}` : '';
  const endTime = endHour && endMin ? `${endHour}:${endMin}` : '';
  
  const [availableDays, setAvailableDays] = useState<Date[]>([]);
  const [bookedIntervals, setBookedIntervals] = useState<{start: number, end: number}[]>([]);
  const [timeline, setTimeline] = useState<{type: 'free'|'booked', start: string, end: string}[]>([]);
  
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const LAB_OPEN = timeToMins('07:00');
  const LAB_CLOSE = timeToMins('15:00');

  const hoursList = Array.from({ length: 9 }, (_, i) => (i + 7).toString().padStart(2, '0'));
  const minutesList = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  useEffect(() => {
    if (isOpen) {
      const days = [];
      let currentDate = new Date();
      
      while (days.length < 5) {
        if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
          days.push(new Date(currentDate));
        }
        currentDate.setDate(currentDate.getDate() + 1);
      }
      setAvailableDays(days);
      setSelectedDate(null);
      setStartHour(''); setStartMin('');
      setEndHour(''); setEndMin('');
      setBookedIntervals([]);
      setTimeline([]);
      setErrorMessage(null);
    }
  }, [isOpen]);

  // SINKRONISASI REALTIME ANTRIAN SESUAI TANGGAL & KAMERA AKTIF
  useEffect(() => {
    if (!selectedDate || !camera) return;

    fetchBookedSlots(selectedDate);

    const dateString = selectedDate.toISOString().split('T')[0];

    // Buat listener realtime khusus kamera dan tanggal yang dipilih
    const channel = supabase
      .channel(`realtime_booking_${camera.id}_${dateString}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'borrow_requests',
          filter: `camera_id=eq.${camera.id}`
        },
        () => {
          // Ada booking baru atau perubahan status, refresh antrian langsung
          fetchBookedSlots(selectedDate);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedDate, camera]);

  const fetchBookedSlots = async (date: Date) => {
    setIsLoadingSlots(true);
    setErrorMessage(null);
    
    try {
      const dateString = date.toISOString().split('T')[0];
      
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('jam_mulai, jam_selesai')
        .eq('camera_id', camera?.id)
        .eq('tanggal_pinjam', dateString)
        .in('status_request', ['Pending', 'Disetujui', 'Dipinjam']);

      if (error) throw error;

      const intervals: {start: number, end: number}[] = [];
      
      if (data) {
        data.forEach(req => {
          const sMins = timeToMins(req.jam_mulai.substring(0, 5));
          const eMins = timeToMins(req.jam_selesai.substring(0, 5));
          intervals.push({ start: sMins, end: eMins });
        });
      }

      intervals.sort((a, b) => a.start - b.start);
      setBookedIntervals(intervals);

      // KALKULASI TIMELINE
      const visualTimeline: {type: 'free'|'booked', start: string, end: string}[] = [];
      let currentMarker = LAB_OPEN;

      intervals.forEach(b => {
        if (b.start > currentMarker) {
          visualTimeline.push({ type: 'free', start: minsToTime(currentMarker), end: minsToTime(b.start) });
        }
        visualTimeline.push({ type: 'booked', start: minsToTime(b.start), end: minsToTime(b.end) });
        currentMarker = Math.max(currentMarker, b.end);
      });

      if (currentMarker < LAB_CLOSE) {
        visualTimeline.push({ type: 'free', start: minsToTime(currentMarker), end: minsToTime(LAB_CLOSE) });
      }

      setTimeline(visualTimeline);

    } catch (err) {
      console.error('Gagal memuat slot jadwal:', err);
    } finally {
      setIsLoadingSlots(false);
    }
  };

  // Validasi lokal saat user mengubah form
  useEffect(() => {
    if (!startTime || !endTime) {
      setErrorMessage(null);
      return;
    }

    const s = timeToMins(startTime);
    const e = timeToMins(endTime);

    if (s < LAB_OPEN || e > LAB_CLOSE) {
      setErrorMessage("Di luar jam operasional (07:00 - 15:00).");
      return;
    }
    if (s >= e) {
      setErrorMessage("Jam Selesai harus lebih besar dari Jam Mulai.");
      return;
    }

    const isOverlap = bookedIntervals.some(b => s < b.end && e > b.start);

    if (isOverlap) {
      setErrorMessage("Jadwal bertabrakan! Silakan cari rentang yang 'Tersedia' di atas.");
    } else {
      setErrorMessage(null);
    }

  }, [startTime, endTime, bookedIntervals]);

  // PROSES BOOKING DENGAN VALIDASI ATOMIK (RACE CONDITION PREVENTION)
  const handleBooking = async () => {
    if (!selectedDate || !startTime || !endTime || errorMessage || isSubmitting) return;
    
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Sesi tidak ditemukan, harap login ulang.");

      const dateString = selectedDate.toISOString().split('T')[0];

      // 1. Double-check instan ke server sebelum insert (menghindari collision tepat waktu)
      const { data: latestBookings, error: checkError } = await supabase
        .from('borrow_requests')
        .select('jam_mulai, jam_selesai')
        .eq('camera_id', camera?.id)
        .eq('tanggal_pinjam', dateString)
        .in('status_request', ['Pending', 'Disetujui', 'Dipinjam']);

      if (checkError) throw checkError;

      const userStart = timeToMins(startTime);
      const userEnd = timeToMins(endTime);

      const isCollided = latestBookings?.some(b => {
        const bStart = timeToMins(b.jam_mulai.substring(0, 5));
        const bEnd = timeToMins(b.jam_selesai.substring(0, 5));
        return userStart < bEnd && userEnd > bStart;
      });

      // 2. Jika ada siswa lain yang booking milidetik lebih cepat:
      if (isCollided) {
        setErrorMessage("Slot ini baru saja dipesan oleh siswa lain. Jadwal antrian telah diperbarui otomatis.");
        await fetchBookedSlots(selectedDate);
        return;
      }

      // 3. Jika aman, lakukan insert
      const { error: insertError } = await supabase.from('borrow_requests').insert({
        user_id: session.user.id,
        camera_id: camera?.id,
        tanggal_pinjam: dateString,
        rencana_kembali: dateString,
        jam_mulai: startTime,
        jam_selesai: endTime,
        alasan_pinjam: 'Proyek Praktik/Ujikom', 
        status_request: 'Pending'
      });

      if (insertError) throw insertError;

      alert('Berhasil! Menunggu persetujuan Admin Studio.');
      onClose(); 
    } catch (err: any) {
      alert('Gagal Booking: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = selectedDate && startTime && endTime && !errorMessage;

  if (!isOpen || !camera) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="relative flex w-full max-w-2xl max-h-[95vh] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        >
          {/* HEADER */}
          <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-6 py-5 sm:px-8">
            <div>
              <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">Reservasi Fleksibel</span>
              <h3 className="font-['Outfit',sans-serif] text-xl font-black text-[#1c1917] leading-tight">
                {camera.nama_barang}
              </h3>
            </div>
            <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/50 text-stone-500 transition hover:bg-stone-200">
              ✕
            </button>
          </div>

          {/* KONTEN */}
          <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8 custom-scrollbar">
            
            {/* 1. TANGGAL */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4 text-[#1c1917]">
                <CalendarDays className="h-5 w-5 text-orange-500" />
                <h4 className="font-['Outfit',sans-serif] text-base font-bold">1. Pilih Tanggal</h4>
              </div>
              <div className="grid grid-cols-5 gap-2 sm:gap-3">
                {availableDays.map((date, idx) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(date)}
                      className={`flex flex-col items-center justify-center rounded-2xl border py-3 transition-all ${
                        isSelected 
                          ? 'border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-600/30' 
                          : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50'
                      }`}
                    >
                      <span className={`text-[10px] font-bold uppercase ${isSelected ? 'text-orange-200' : 'text-stone-400'}`}>
                        {date.toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                      <span className="font-['Outfit',sans-serif] text-xl font-black mt-1">
                        {date.getDate()}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2 & 3: TIMELINE & INPUT JAM */}
            <AnimatePresence>
              {selectedDate && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 10 }}
                  animate={{ opacity: 1, height: 'auto', y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                >
                  <div className="mb-8">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2 text-[#1c1917]">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <h4 className="font-['Outfit',sans-serif] text-base font-bold">2. Status Antrian Hari Ini</h4>
                      </div>
                      {isLoadingSlots && <Loader2 className="h-4 w-4 animate-spin text-orange-500" />}
                    </div>
                    
                    <div className="flex flex-col gap-2 rounded-2xl bg-stone-50 p-4 border border-stone-100">
                      {timeline.length === 0 && !isLoadingSlots && (
                        <p className="text-xs text-stone-400 text-center py-2">Belum ada antrian. Kosong seharian!</p>
                      )}
                      {timeline.map((slot, idx) => (
                        <div key={idx} className={`flex items-center justify-between rounded-xl px-4 py-2.5 text-sm font-bold ${
                          slot.type === 'free' 
                            ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200' 
                            : 'bg-stone-200/50 text-stone-500 border border-stone-200 opacity-80'
                        }`}>
                          <span className="font-mono">{slot.start} - {slot.end}</span>
                          <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider">
                            {slot.type === 'free' ? (
                              <><CheckCircle2 className="h-4 w-4" /> Tersedia</>
                            ) : (
                              <><Lock className="h-4 w-4" /> Dipinjam</>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mb-4">
                    <h4 className="font-['Outfit',sans-serif] text-base font-bold text-[#1c1917] mb-4">
                      3. Tentukan Jam Peminjaman
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-stone-500">Jam Mulai</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select 
                              value={startHour} 
                              onChange={(e) => {
                                setStartHour(e.target.value);
                                if (e.target.value === '15') setStartMin('00');
                              }}
                              className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm font-bold text-[#1c1917] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="" disabled>HH</option>
                              {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                          </div>
                          <span className="font-bold text-stone-400">:</span>
                          <div className="relative flex-1">
                            <select 
                              value={startMin} 
                              onChange={(e) => setStartMin(e.target.value)}
                              className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm font-bold text-[#1c1917] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="" disabled>MM</option>
                              {startHour === '15' 
                                ? <option value="00">00</option> 
                                : minutesList.map(m => <option key={m} value={m}>{m}</option>)
                              }
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-stone-500">Jam Selesai</label>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <select 
                              value={endHour} 
                              onChange={(e) => {
                                setEndHour(e.target.value);
                                if (e.target.value === '15') setEndMin('00');
                              }}
                              className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm font-bold text-[#1c1917] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="" disabled>HH</option>
                              {hoursList.map(h => <option key={h} value={h}>{h}</option>)}
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                          </div>
                          <span className="font-bold text-stone-400">:</span>
                          <div className="relative flex-1">
                            <select 
                              value={endMin} 
                              onChange={(e) => setEndMin(e.target.value)}
                              className="w-full appearance-none rounded-xl border border-stone-200 bg-stone-50 px-4 py-3 font-mono text-sm font-bold text-[#1c1917] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500"
                            >
                              <option value="" disabled>MM</option>
                              {endHour === '15' 
                                ? <option value="00">00</option> 
                                : minutesList.map(m => <option key={m} value={m}>{m}</option>)
                              }
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400 pointer-events-none" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {errorMessage && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-red-600 border border-red-200"
                      >
                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                        <p className="text-xs font-bold leading-relaxed">{errorMessage}</p>
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

          </div>

          {/* FOOTER */}
          <div className="shrink-0 border-t border-stone-100 bg-white p-6 sm:px-8">
            <button
              onClick={handleBooking}
              disabled={!isFormValid || isSubmitting}
              className={`flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-sm font-extrabold transition-all ${
                !isFormValid
                  ? 'cursor-not-allowed bg-stone-100 text-stone-400'
                  : 'bg-orange-600 text-white shadow-lg shadow-orange-600/30 hover:bg-orange-500 hover:shadow-orange-600/40 active:scale-95'
              }`}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Memvalidasi Slot...</>
              ) : (
                isFormValid 
                  ? `Booking Jadwal (${startTime} - ${endTime})` 
                  : 'Tentukan Waktu Valid'
              )}
            </button>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
