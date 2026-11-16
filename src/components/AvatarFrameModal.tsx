import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Plus, RotateCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Toast } from '../lib/CustomSwal';
import {
  AVATAR_FRAMES,
  getAvatarFrame,
  serializeCustomFrame,
  type AvatarFrameId,
} from '../utils/avatarFrames';

interface AvatarFrameModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFrame: AvatarFrameId;
  onSaved: (newFrame: AvatarFrameId) => void;
  avatarUrl?: string | null;
  avatarInitial: string;
  imageError?: boolean;
}

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function hsvToHex(h: number, s: number, v: number): string {
  const sNorm = s / 100;
  const vNorm = v / 100;
  const c = vNorm * sNorm;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = vNorm - c;

  let r = 0;
  let g = 0;
  let b = 0;

  if (h >= 0 && h < 60) {
    r = c;
    g = x;
  } else if (h >= 60 && h < 120) {
    r = x;
    g = c;
  } else if (h >= 120 && h < 180) {
    g = c;
    b = x;
  } else if (h >= 180 && h < 240) {
    g = x;
    b = c;
  } else if (h >= 240 && h < 300) {
    r = x;
    b = c;
  } else {
    r = c;
    b = x;
  }

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  if (clean.length !== 6) return { h: 24, s: 94, v: 92 };

  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) h = ((b - r) / d + 2) * 60;
    else h = ((r - g) / d + 4) * 60;
  }

  const s = max === 0 ? 0 : (d / max) * 100;
  const v = max * 100;

  return { h: Math.round(h), s: Math.round(s), v: Math.round(v) };
}

export default function AvatarFrameModal({
  isOpen,
  onClose,
  currentFrame,
  onSaved,
  avatarUrl,
  avatarInitial,
  imageError,
}: AvatarFrameModalProps) {
  const [draftId, setDraftId] = useState<AvatarFrameId>(currentFrame);
  const [slots, setSlots] = useState<string[]>(['#ea580c', '#f59e0b', '#fde047']);
  const [activeSlot, setActiveSlot] = useState<number>(0);
  const [isAnimated, setIsAnimated] = useState<boolean>(false);
  const [hsv, setHsv] = useState<{ h: number; s: number; v: number }>({ h: 24, s: 94, v: 92 });
  const [isSaving, setIsSaving] = useState(false);

  const satBoxRef = useRef<HTMLDivElement>(null);
  const hueBarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const parsed = getAvatarFrame(currentFrame);
    setDraftId(currentFrame);
    setSlots(parsed.colors);
    setActiveSlot(0);
    setIsAnimated(Boolean(parsed.isAnimated));
    setHsv(hexToHsv(parsed.colors[0] || '#ea580c'));
  }, [isOpen, currentFrame]);

  const selectSlot = (idx: number) => {
    setActiveSlot(idx);
    const color = slots[idx] || '#ea580c';
    setHsv(hexToHsv(color));
  };

  const applyHsvChange = (nextH: number, nextS: number, nextV: number) => {
    setHsv({ h: nextH, s: nextS, v: nextV });
    const hex = hsvToHex(nextH, nextS, nextV);
    const updatedSlots = [...slots];
    updatedSlots[activeSlot] = hex;
    setSlots(updatedSlots);
    setDraftId(serializeCustomFrame(updatedSlots, isAnimated));
  };

  const handleAddSlot = () => {
    if (slots.length >= 3) return;
    const defaults = ['#ea580c', '#ffffff', '#38bdf8'];
    const nextColor = defaults[slots.length] || '#fbbf24';
    const updated = [...slots, nextColor];
    const nextIdx = updated.length - 1;
    setSlots(updated);
    setActiveSlot(nextIdx);
    setHsv(hexToHsv(nextColor));
    setDraftId(serializeCustomFrame(updated, isAnimated));
  };

  const handleRemoveSlot = (idx: number) => {
    if (slots.length <= 1) return;
    const updated = slots.filter((_, i) => i !== idx);
    const nextActive = Math.min(activeSlot, updated.length - 1);
    const nextAnim = updated.length > 1 ? isAnimated : false;
    setSlots(updated);
    setActiveSlot(nextActive);
    setIsAnimated(nextAnim);
    setHsv(hexToHsv(updated[nextActive]));
    setDraftId(serializeCustomFrame(updated, nextAnim));
  };

  const handleToggleAnimated = (spin: boolean) => {
    const nextAnim = slots.length > 1 ? spin : false;
    setIsAnimated(nextAnim);
    setDraftId(serializeCustomFrame(slots, nextAnim));
  };

  const handlePickPreset = (presetId: AvatarFrameId) => {
    const parsed = getAvatarFrame(presetId);
    setDraftId(presetId);
    setSlots(parsed.colors);
    setActiveSlot(0);
    setIsAnimated(Boolean(parsed.isAnimated));
    setHsv(hexToHsv(parsed.colors[0]));
  };

  const updateSatFromPointer = (clientX: number, clientY: number) => {
    const box = satBoxRef.current;
    if (!box) return;
    const rect = box.getBoundingClientRect();
    const s = Math.round(clamp(((clientX - rect.left) / rect.width) * 100, 0, 100));
    const v = Math.round(clamp((1 - (clientY - rect.top) / rect.height) * 100, 0, 100));
    applyHsvChange(hsv.h, s, v);
  };

  const updateHueFromPointer = (clientX: number) => {
    const bar = hueBarRef.current;
    if (!bar) return;
    const rect = bar.getBoundingClientRect();
    const h = Math.round(clamp(((clientX - rect.left) / rect.width) * 360, 0, 360));
    applyHsvChange(h, hsv.s, hsv.v);
  };

  const handleSave = async () => {
    if (isSaving) return;
    if (draftId === currentFrame) {
      onClose();
      return;
    }

    setIsSaving(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { avatar_frame: draftId },
      });
      if (error) throw error;

      onSaved(draftId);
      window.dispatchEvent(new CustomEvent('camhub-avatar-frame-changed', { detail: draftId }));
      Toast.fire({ icon: 'success', title: 'Bingkai profil disimpan!' });
      onClose();
    } catch {
      Toast.fire({ icon: 'error', title: 'Gagal menyimpan bingkai' });
    } finally {
      setIsSaving(false);
    }
  };

  const previewFrame = getAvatarFrame(draftId);

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
          onClick={(e) => {
            if (e.target === e.currentTarget && !isSaving) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.93, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: 12 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[330px] overflow-hidden rounded-[1.85rem] border border-stone-100 bg-white shadow-2xl"
          >
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-5 py-3.5">
              <span className="font-['Outfit',sans-serif] text-sm font-bold text-[#1c1917]">
                Bingkai <span className="text-orange-600">Profil</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-stone-200/60 text-stone-500 transition hover:bg-stone-200"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-5">
              {/* LIVE PREVIEW AVATAR */}
              <div className="mb-4 flex flex-col items-center">
                <div className="relative flex h-[82px] w-[82px] items-center justify-center overflow-hidden rounded-full p-[3.5px] shadow-md">
                  <motion.div
                    animate={previewFrame.isAnimated ? { rotate: 360 } : { rotate: 0 }}
                    transition={
                      previewFrame.isAnimated
                        ? { duration: 5, repeat: Infinity, ease: 'linear' }
                        : { duration: 0.2 }
                    }
                    style={{ background: previewFrame.background }}
                    className="absolute inset-0 rounded-full"
                  />
                  <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-orange-100 text-2xl font-black uppercase text-orange-700 ring-2 ring-white">
                    {avatarUrl && !imageError ? (
                      <img
                        src={avatarUrl}
                        alt="Preview Bingkai"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      avatarInitial
                    )}
                  </div>
                </div>
                <span className="mt-2 rounded-full bg-orange-50 px-2.5 py-0.5 text-[10px] font-bold text-orange-600">
                  {previewFrame.label}
                </span>
              </div>

              {/* 5 PRESET CEPAT */}
              <div className="mb-4">
                <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-stone-400">
                  Preset Cepat
                </span>
                <div className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/80 px-3 py-2">
                  {AVATAR_FRAMES.map((preset) => {
                    const isPicked = draftId === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        title={preset.label}
                        onClick={() => handlePickPreset(preset.id as AvatarFrameId)}
                        style={{ background: preset.background }}
                        className={`h-7 w-7 rounded-full transition-transform active:scale-90 ${
                          isPicked
                            ? 'scale-110 ring-2 ring-stone-900 ring-offset-2'
                            : 'opacity-85 hover:opacity-100'
                        }`}
                      />
                    );
                  })}
                </div>
              </div>

              {/* SLOT 1 - 3 WARNA + MODE STATIS / GERAK */}
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {slots.map((hex, idx) => {
                    const isSelected = activeSlot === idx;
                    return (
                      <div key={idx} className="relative">
                        <button
                          type="button"
                          onClick={() => selectSlot(idx)}
                          style={{ backgroundColor: hex }}
                          className={`h-8 w-8 rounded-full border-2 border-white shadow-sm transition-transform active:scale-90 ${
                            isSelected ? 'scale-110 ring-2 ring-orange-600' : 'opacity-80'
                          }`}
                        />
                        {idx > 0 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveSlot(idx)}
                            title="Hapus warna"
                            className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-stone-800 text-[9px] font-bold text-white shadow-xs"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}

                  {slots.length < 3 && (
                    <button
                      type="button"
                      onClick={handleAddSlot}
                      title="Tambah warna gradasi"
                      className="flex h-8 w-8 items-center justify-center rounded-full border border-dashed border-stone-300 bg-stone-50 text-stone-500 transition hover:border-orange-500 hover:text-orange-600 active:scale-90"
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>

                {/* TOGGLE STATIS / GERAK (AKTIF JIKA >= 2 WARNA) */}
                {slots.length > 1 ? (
                  <div className="flex rounded-full bg-stone-100 p-0.5 text-[10px] font-bold">
                    <button
                      type="button"
                      onClick={() => handleToggleAnimated(false)}
                      className={`rounded-full px-2.5 py-1 transition ${
                        !isAnimated ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      Statis
                    </button>
                    <button
                      type="button"
                      onClick={() => handleToggleAnimated(true)}
                      className={`flex items-center gap-1 rounded-full px-2.5 py-1 transition ${
                        isAnimated ? 'bg-orange-600 text-white shadow-2xs' : 'text-stone-500'
                      }`}
                    >
                      <RotateCw className="h-2.5 w-2.5" /> Gerak
                    </button>
                  </div>
                ) : (
                  <span className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-bold text-stone-400">
                    1 Warna Statis
                  </span>
                )}
              </div>

              {/* CUSTOM 2D COLOR PICKER GAYA CAMHUB */}
              <div className="mb-4 rounded-2xl border border-stone-200/80 bg-stone-50/70 p-3">
                {/* KOTAK SATURATION & BRIGHTNESS */}
                <div
                  ref={satBoxRef}
                  onPointerDown={(e) => {
                    e.currentTarget.setPointerCapture(e.pointerId);
                    updateSatFromPointer(e.clientX, e.clientY);
                  }}
                  onPointerMove={(e) => {
                    if (e.buttons === 1 || e.pointerType === 'touch') {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        updateSatFromPointer(e.clientX, e.clientY);
                      }
                    }
                  }}
                  style={{ backgroundColor: `hsl(${hsv.h}, 100%, 50%)` }}
                  className="relative mb-3 h-28 w-full cursor-crosshair touch-none overflow-hidden rounded-xl shadow-inner"
                >
                  <div
                    style={{
                      background: 'linear-gradient(to right, #ffffff, rgba(255,255,255,0))',
                    }}
                    className="absolute inset-0"
                  />
                  <div
                    style={{
                      background: 'linear-gradient(to top, #000000, rgba(0,0,0,0))',
                    }}
                    className="absolute inset-0"
                  />
                  {/* KURSOR TITIK WARNA */}
                  <div
                    style={{
                      left: `${hsv.s}%`,
                      top: `${100 - hsv.v}%`,
                      backgroundColor: slots[activeSlot] || '#ea580c',
                    }}
                    className="pointer-events-none absolute h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.35)]"
                  />
                </div>

                {/* SLIDER PELANGI (HUE) + BADGE HEX */}
                <div className="flex items-center gap-2.5">
                  <div
                    ref={hueBarRef}
                    onPointerDown={(e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      updateHueFromPointer(e.clientX);
                    }}
                    onPointerMove={(e) => {
                      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                        updateHueFromPointer(e.clientX);
                      }
                    }}
                    style={{
                      background:
                        'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                    }}
                    className="relative h-3.5 flex-1 cursor-pointer touch-none rounded-full shadow-inner"
                  >
                    <div
                      style={{ left: `${(hsv.h / 360) * 100}%` }}
                      className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-stone-900 shadow-md"
                    />
                  </div>

                  <span className="w-[62px] rounded-lg border border-stone-200 bg-white py-1 text-center font-mono text-[10px] font-bold uppercase text-stone-700">
                    {slots[activeSlot] || '#ea580c'}
                  </span>
                </div>
              </div>

              {/* TOMBOL BATAL & SIMPAN */}
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSaving}
                  className="flex-1 rounded-full border border-stone-200 py-2.5 text-xs font-bold text-stone-600 transition hover:bg-stone-100 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex flex-[1.5] items-center justify-center gap-1.5 rounded-full bg-orange-600 py-2.5 text-xs font-extrabold text-white shadow-md shadow-orange-600/25 transition hover:bg-orange-500 active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" /> Simpan Bingkai
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
