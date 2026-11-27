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
  Package,
} from 'lucide-react';
import type { Database } from '../../types/database';
import StrukModal from '../profile/StrukModal';
import TimeDropdown from './TimeDropdown';
import { formatLocalDateISO, formatDateLabel } from '../../utils/bookingSlots';
import {
  REASON_PRESETS,
  useBookingModal,
} from '../../logics/katalog/useBookingModal';

type CameraItem = Database['public']['Tables']['cameras']['Row'];

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  camera: CameraItem | null;
}

export default function BookingModal({ isOpen, onClose, camera }: BookingModalProps) {
  const {
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
  } = useBookingModal({ isOpen, onClose, camera });

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

  const bundleItems = Array.isArray(camera.isi_paket)
    ? camera.isi_paket.filter(Boolean)
    : [];

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
          <div className="flex shrink-0 items-start justify-between gap-4 border-b border-stone-100 bg-[#fafaf9] px-6 py-5 sm:px-8">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-orange-600 uppercase">
                  Reservasi Unit Lab
                </span>
                {totalStock > 1 && (
                  <span className="rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-extrabold text-orange-700">
                    {totalStock} Unit Tersedia
                  </span>
                )}
              </div>
              <h3 className="font-['Outfit',sans-serif] text-xl font-black leading-tight text-[#1c1917]">
                {camera.nama_barang}
              </h3>

              {/* Kelengkapan Paket Bundling (jika ada) */}
              {bundleItems.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-stone-400">
                    <Package className="h-3 w-3 text-orange-500" /> Isi:
                  </span>
                  {bundleItems.map((item, idx) => (
                    <span
                      key={idx}
                      className="rounded-md border border-stone-200/80 bg-white px-2 py-0.5 text-[10px] font-semibold text-stone-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-200/50 text-stone-500 transition hover:bg-stone-200"
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
                      onClick={() => handleSelectDate(iso)}
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
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-[#1c1917]">
                        <Clock className="h-5 w-5 text-orange-500" />
                        <h4 className="font-['Outfit',sans-serif] text-base font-bold">
                          2. Jadwal {formatDateLabel(new Date(`${selectedDateStr}T00:00:00`))}
                        </h4>
                      </div>
                      <div className="flex items-center gap-2">
                        {totalStock > 1 && activePartialCount > 0 && (
                          <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                            Kapasitas {totalStock} Unit
                          </span>
                        )}
                        {isLoadingSlots && (
                          <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
                        )}
                      </div>
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
                              <span className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
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
                              <span className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
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
                            <span className="flex items-center gap-1.5 text-[11px] tracking-wider uppercase">
                              <Lock className="h-3.5 w-3.5" /> Penuh
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
