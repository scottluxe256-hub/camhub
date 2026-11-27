import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper from 'react-easy-crop';
import { supabase } from '../../lib/supabase';
import { CustomSwal, Toast } from '../../lib/CustomSwal';
import { uploadToCloudinary } from '../../utils/cloudinary';
import {
  DEFAULT_AVATAR_FRAME,
  getAvatarFrame,
  type AvatarFrameId,
} from '../../utils/avatarFrames';
import type { ProfileItem } from '../../types/database';
import { useAuth } from '../../context/AuthContext';
import BorrowHistoryTab from './BorrowHistoryTab';
import AvatarFrameModal from './AvatarFrameModal';
import ChangePasswordModal from './ChangePasswordModal';
import {
  LogOut,
  Camera,
  ShieldCheck,
  Mail,
  CreditCard,
  GraduationCap,
  Loader2,
  Pencil,
  Check,
  X,
  History,
  Palette,
  Sparkles,
  KeyRound,
  User as UserIcon,
} from 'lucide-react';

export type UserProfileData = Omit<ProfileItem, 'id'>;

interface CroppedArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ProfileViewProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
  userEmail?: string | null;
  profileData?: UserProfileData | null;
  onProfileUpdate?: (updated: UserProfileData) => void;
}

export default function ProfileView({
  isOpen,
  onClose,
  userId,
  userEmail,
  profileData,
  onProfileUpdate,
}: ProfileViewProps) {
  const { user: authUser, profile: authProfile, refreshProfile } = useAuth();

  // Prioritaskan state global RAM, fallback ke props lama agar LandingPage tetap aman
  const effectiveUserId = authUser?.id ?? userId ?? null;
  const effectiveUserEmail = authUser?.email ?? userEmail ?? null;
  const effectiveProfile = authProfile ?? profileData ?? null;

  const [activeTab, setActiveTab] = useState<'profile' | 'history'>('profile');

  const [editName, setEditName] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [imageError, setImageError] = useState(false);

  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedArea | null>(null);

  const [historyCount, setHistoryCount] = useState(0);
  const [isDownloadingStruk, setIsDownloadingStruk] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFrame, setSelectedFrame] = useState<AvatarFrameId>(DEFAULT_AVATAR_FRAME);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = useState(false);
  const [isFrameModalOpen, setIsFrameModalOpen] = useState(false);

  const [canResetPassword, setCanResetPassword] = useState(false);
  const [isSendingResetOtp, setIsSendingResetOtp] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Langsung baca metadata user dari RAM tanpa nembak supabase.auth.getUser()
  useEffect(() => {
    if (!isOpen) {
      setIsAvatarMenuOpen(false);
      setIsFrameModalOpen(false);
      setIsPasswordModalOpen(false);
      return;
    }
    if (!authUser) return;

    const saved = authUser.user_metadata?.avatar_frame as AvatarFrameId | undefined;
    if (saved) setSelectedFrame(saved);

    const isEmailLogin = Boolean(
      authUser.identities?.some((identity) => identity.provider === 'email') ||
        authUser.app_metadata?.provider === 'email'
    );
    setCanResetPassword(isEmailLogin);
  }, [isOpen, authUser]);

  useEffect(() => {
    setEditName(effectiveProfile?.nama_lengkap || '');
    setImageError(false);
  }, [effectiveProfile]);

  useEffect(() => {
    if (!isOpen) {
      if (cropImageSrc) {
        URL.revokeObjectURL(cropImageSrc);
        setCropImageSrc(null);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      }
      return;
    }

    setActiveTab('profile');
  }, [isOpen]);

  const onCropCompleteCallback = useCallback(
    (_croppedArea: CroppedArea, croppedPixels: CroppedArea) => {
      setCroppedAreaPixels(croppedPixels);
    },
    []
  );

  const getCroppedBlob = async (src: string, pixelCrop: CroppedArea): Promise<Blob> => {
    const image = new Image();
    image.src = src;
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = reject;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas tidak didukung browser.');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Gagal memproses potongan gambar.'));
        },
        'image/jpeg',
        0.92
      );
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isImageMime = file.type.startsWith('image/');
    const isImageExt = /\.(png|jpe?g|webp|avif|heic|heif|gif|bmp)$/i.test(file.name);

    if (!isImageMime && !isImageExt) {
      e.target.value = '';
      Toast.fire({
        icon: 'error',
        title: 'Hanya file gambar yang diperbolehkan!',
      });
      return;
    }

    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    const previewUrl = URL.createObjectURL(file);
    setCropImageSrc(previewUrl);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    e.target.value = '';
  };

  const handleCancelCrop = () => {
    if (cropImageSrc) URL.revokeObjectURL(cropImageSrc);
    setCropImageSrc(null);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const handleSaveCroppedPhoto = async () => {
    if (!cropImageSrc || !croppedAreaPixels || !effectiveUserId || !effectiveProfile) return;

    setIsUploadingPhoto(true);

    try {
      const croppedBlob = await getCroppedBlob(cropImageSrc, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], `avatar-${Date.now()}.jpg`, {
        type: 'image/jpeg',
      });

      const uploadResult = await uploadToCloudinary(croppedFile);
      if (!uploadResult) throw new Error('Gagal mengunggah foto ke Cloudinary.');

      const oldPublicId = effectiveProfile.foto_public_id;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          foto_url: uploadResult.imageUrl,
          foto_public_id: uploadResult.publicId,
        })
        .eq('id', effectiveUserId);

      if (updateError) throw updateError;

      if (oldPublicId) {
        try {
          const delRes = await fetch('/api/delete-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_id: oldPublicId }),
          });

          const contentType = delRes.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            console.warn(
              'Endpoint /api/delete-image tidak aktif (normal jika sedang jalan di localhost Vite).'
            );
          } else {
            const delData = await delRes.json();
            if (!delRes.ok || delData.result !== 'ok') {
              console.warn('Cloudinary gagal menghapus foto lama:', delData);
            }
          }
        } catch (delErr) {
          console.warn('Gagal menghubungi /api/delete-image:', delErr);
        }
      }

      const updatedProfile: UserProfileData = {
        ...effectiveProfile,
        foto_url: uploadResult.imageUrl,
        foto_public_id: uploadResult.publicId,
      };

      onProfileUpdate?.(updatedProfile);
      await refreshProfile();
      setImageError(false);
      handleCancelCrop();

      Toast.fire({
        icon: 'success',
        title: 'Foto profil diperbarui!',
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat memproses gambar.';
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Ganti Foto',
        text: message,
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleNameBlur = async () => {
    const trimmed = editName.trim();
    if (!trimmed || trimmed === effectiveProfile?.nama_lengkap) {
      setEditName(effectiveProfile?.nama_lengkap || '');
      return;
    }
    if (!effectiveUserId || !effectiveProfile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nama_lengkap: trimmed })
        .eq('id', effectiveUserId);

      if (error) throw error;

      onProfileUpdate?.({
        ...effectiveProfile,
        nama_lengkap: trimmed,
      });
      await refreshProfile();

      Toast.fire({
        icon: 'success',
        title: 'Nama berhasil diubah!',
      });
    } catch {
      setEditName(effectiveProfile?.nama_lengkap || '');
      Toast.fire({
        icon: 'error',
        title: 'Gagal mengubah nama',
      });
    }
  };

  const handleStartPasswordReset = async () => {
    if (!effectiveUserEmail || isSendingResetOtp) return;

    setIsSendingResetOtp(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(effectiveUserEmail);
      if (error) throw error;

      Toast.fire({
        icon: 'success',
        title: 'Kode OTP 6 digit terkirim ke email!',
      });
      setIsPasswordModalOpen(true);
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : '';
      const msg = errMessage.toLowerCase();
      CustomSwal.fire({
        icon: 'error',
        title: 'Gagal Mengirim OTP',
        text: msg.includes('rate limit')
          ? 'Terlalu banyak permintaan. Tunggu 60 detik lalu coba lagi.'
          : errMessage || 'Gagal mengirim kode OTP ke email.',
      });
    } finally {
      setIsSendingResetOtp(false);
    }
  };

  const handleLogout = () => {
    onClose();
    CustomSwal.fire({
      title: 'Keluar dari CamHub?',
      text: 'Anda harus masuk kembali untuk meminjam alat.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Ya, Keluar',
      cancelButtonText: 'Batal',
    }).then(async (result) => {
      if (result.isConfirmed) {
        await supabase.auth.signOut();
        Toast.fire({
          icon: 'success',
          title: 'Berhasil keluar',
        });
      }
    });
  };

  if (!isOpen) return null;

  const activeFrame = getAvatarFrame(selectedFrame);
  const avatarInitial = (effectiveProfile?.nama_lengkap || effectiveUserEmail || 'U').charAt(0);

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isUploadingPhoto && !isDownloadingStruk) {
            if (cropImageSrc) handleCancelCrop();
            else onClose();
          }
        }}
      >
        {cropImageSrc ? (
          <motion.div
            key="crop-view"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] border border-stone-800 bg-[#1c1917] shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-stone-800 px-6 py-4">
              <span className="font-['Outfit',sans-serif] text-base font-bold text-white">
                Sesuaikan <span className="text-orange-500">Foto</span>
              </span>
              <button
                type="button"
                onClick={handleCancelCrop}
                disabled={isUploadingPhoto}
                className="rounded-full p-1 text-stone-400 transition hover:bg-stone-800 hover:text-white disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative h-[300px] w-full bg-black">
              <Cropper
                image={cropImageSrc}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropCompleteCallback}
              />
            </div>

            <div className="p-6">
              <div className="mb-6 flex items-center gap-4">
                <span className="text-xs font-bold text-stone-400">Zoom</span>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.05}
                  aria-label="Zoom foto"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-stone-700 accent-orange-500 outline-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={isUploadingPhoto}
                  className="flex-1 rounded-full border border-stone-700 py-3 text-xs font-bold text-stone-300 transition hover:bg-stone-800 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveCroppedPhoto}
                  disabled={isUploadingPhoto}
                  className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-orange-600 py-3 text-xs font-extrabold text-white shadow-lg shadow-orange-600/30 transition hover:bg-orange-500 active:scale-95 disabled:opacity-50"
                >
                  {isUploadingPhoto ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Menyimpan...
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4" /> Terapkan Foto
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="profile-tabs-view"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative flex max-h-[85vh] w-full max-w-[400px] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
          >
            <input
              type="file"
              id="avatar-file-input"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept="image/*,.png,.jpg,.jpeg,.webp,.avif,.heic,.heif,.gif,.bmp"
              className="hidden"
            />

            <div className="flex shrink-0 items-center justify-between border-b border-stone-100 bg-[#fafaf9] px-6 py-4">
              <span className="font-['Outfit',sans-serif] text-base font-bold text-[#1c1917]">
                Profil <span className="text-orange-600">Saya</span>
              </span>
              <button
                type="button"
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200/50 text-stone-500 transition hover:bg-stone-200"
              >
                ✕
              </button>
            </div>

            <div className="flex shrink-0 grid-cols-2 gap-1 border-b border-stone-100 p-2">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'profile'
                    ? 'bg-stone-100 text-stone-800'
                    : 'text-stone-400 hover:bg-stone-50'
                }`}
              >
                <UserIcon className="h-4 w-4" /> Profil
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('history')}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all ${
                  activeTab === 'history'
                    ? 'bg-stone-100 text-stone-800'
                    : 'text-stone-400 hover:bg-stone-50'
                }`}
              >
                <History className="h-4 w-4" /> Riwayat
                {historyCount > 0 && (
                  <span className="rounded-full bg-orange-100 px-1.5 py-0.5 text-[10px] font-extrabold text-orange-600">
                    {historyCount}
                  </span>
                )}
              </button>
            </div>

            <div className="custom-scrollbar flex-1 overflow-y-auto p-6">
              {activeTab === 'profile' && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="mb-6 flex flex-col items-center">
                    <div className="relative mb-3">
                      <div
                        onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                        className="relative flex h-[104px] w-[104px] cursor-pointer items-center justify-center overflow-hidden rounded-full p-[4px] shadow-md"
                      >
                        <motion.div
                          animate={activeFrame.isAnimated ? { rotate: 360 } : { rotate: 0 }}
                          transition={
                            activeFrame.isAnimated
                              ? { duration: 5, repeat: Infinity, ease: 'linear' }
                              : { duration: 0.2 }
                          }
                          style={{ background: activeFrame.background }}
                          className="absolute inset-0 rounded-full"
                        />
                        <div className="relative z-10 flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-orange-100 text-3xl font-black uppercase text-orange-700 ring-2 ring-white">
                          {effectiveProfile?.foto_url && !imageError ? (
                            <img
                              src={effectiveProfile.foto_url}
                              alt="Avatar Siswa"
                              className="h-full w-full object-cover"
                              onError={() => setImageError(true)}
                            />
                          ) : (
                            avatarInitial
                          )}
                        </div>
                      </div>

                      <AnimatePresence>
                        {isAvatarMenuOpen && (
                          <>
                            <motion.button
                              type="button"
                              title="Ganti Foto Profil"
                              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              animate={{ x: 34, y: -38, scale: 1, opacity: 1 }}
                              exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 420,
                                damping: 24,
                              }}
                              onClick={() => {
                                setIsAvatarMenuOpen(false);
                                fileInputRef.current?.click();
                              }}
                              className="absolute bottom-0.5 right-0.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-orange-600 shadow-lg ring-1 ring-orange-200 transition-colors hover:bg-orange-50 active:scale-90"
                            >
                              <Camera className="h-4 w-4" />
                            </motion.button>

                            <motion.button
                              type="button"
                              title="Ganti Bingkai Profil"
                              initial={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              animate={{ x: -44, y: 20, scale: 1, opacity: 1 }}
                              exit={{ x: 0, y: 0, scale: 0, opacity: 0 }}
                              transition={{
                                type: 'spring',
                                stiffness: 420,
                                damping: 24,
                                delay: 0.04,
                              }}
                              onClick={() => {
                                setIsAvatarMenuOpen(false);
                                setIsFrameModalOpen(true);
                              }}
                              className="absolute bottom-0.5 right-0.5 z-20 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-white text-stone-800 shadow-lg ring-1 ring-stone-200 transition-colors hover:bg-stone-100 active:scale-90"
                            >
                              <Palette className="h-4 w-4" />
                            </motion.button>
                          </>
                        )}
                      </AnimatePresence>

                      <motion.button
                        type="button"
                        title={isAvatarMenuOpen ? 'Tutup Menu' : 'Sesuaikan Foto & Bingkai'}
                        animate={{ rotate: isAvatarMenuOpen ? 90 : 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setIsAvatarMenuOpen((prev) => !prev)}
                        className={`absolute bottom-0.5 right-0.5 z-30 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white shadow-md transition-colors active:scale-95 ${
                          isAvatarMenuOpen
                            ? 'bg-stone-900 text-white'
                            : 'bg-orange-600 text-white hover:bg-orange-500'
                        }`}
                      >
                        {isAvatarMenuOpen ? (
                          <X className="h-4 w-4" />
                        ) : (
                          <Sparkles className="h-4 w-4" />
                        )}
                      </motion.button>
                    </div>

                    <div className="group relative mt-1 w-full max-w-[260px]">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={handleNameBlur}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                        }}
                        placeholder="Masukkan nama..."
                        className="w-full rounded-xl border border-stone-200/70 bg-stone-50/60 px-7 py-1.5 text-center font-['Outfit',sans-serif] text-base font-bold text-[#1c1917] outline-none transition focus:border-orange-500 focus:bg-white focus:ring-1 focus:ring-orange-500/20"
                      />
                      <Pencil className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-stone-400 transition-colors group-focus-within:text-orange-500" />
                    </div>

                    <span className="mt-2 flex items-center gap-1 text-xs font-medium text-stone-500">
                      <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Siswa Aktif
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                        Email
                      </label>
                      <div className="mt-1 flex cursor-not-allowed items-center gap-3 rounded-xl border border-stone-200/80 bg-stone-50 px-4 py-2.5 opacity-90">
                        <Mail className="h-4 w-4 shrink-0 text-stone-400" />
                        <span className="truncate text-sm font-medium text-stone-600">
                          {effectiveUserEmail}
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          NIS
                        </label>
                        <div className="mt-1 flex cursor-not-allowed items-center gap-2 rounded-xl border border-stone-200/80 bg-stone-50 px-3 py-2.5 opacity-90">
                          <CreditCard className="h-4 w-4 shrink-0 text-stone-400" />
                          <span className="truncate text-sm font-medium text-stone-600">
                            {effectiveProfile?.nis || '-'}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="ml-1 text-[10px] font-bold uppercase tracking-wider text-stone-400">
                          Kelas
                        </label>
                        <div className="mt-1 flex cursor-not-allowed items-center gap-2 rounded-xl border border-stone-200/80 bg-stone-50 px-3 py-2.5 opacity-90">
                          <GraduationCap className="h-4 w-4 shrink-0 text-stone-400" />
                          <span className="truncate text-sm font-medium text-stone-600">
                            {effectiveProfile?.kelas || '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <BorrowHistoryTab
                isOpen={isOpen}
                isActive={activeTab === 'history'}
                userId={effectiveUserId}
                profileData={effectiveProfile}
                onHistoryCountChange={setHistoryCount}
                onDownloadingChange={setIsDownloadingStruk}
              />
            </div>

            {activeTab === 'profile' && (
              <div className="shrink-0 space-y-2.5 border-t border-stone-100 p-6">
                {canResetPassword && (
                  <button
                    type="button"
                    onClick={handleStartPasswordReset}
                    disabled={isSendingResetOtp}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-50 py-3 text-sm font-bold text-orange-600 transition hover:bg-orange-100 active:scale-95 disabled:opacity-60"
                  >
                    {isSendingResetOtp ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Mengirim Kode OTP...
                      </>
                    ) : (
                      <>
                        <KeyRound className="h-4 w-4" /> Reset Kata Sandi
                      </>
                    )}
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-red-50 py-3 text-sm font-bold text-red-600 transition hover:bg-red-100 active:scale-95"
                >
                  <LogOut className="h-4 w-4" /> Keluar Akun
                </button>
              </div>
            )}
          </motion.div>
        )}

        <AvatarFrameModal
          isOpen={isFrameModalOpen}
          onClose={() => setIsFrameModalOpen(false)}
          currentFrame={selectedFrame}
          onSaved={(newFrame) => setSelectedFrame(newFrame)}
          avatarUrl={effectiveProfile?.foto_url}
          avatarInitial={avatarInitial}
          imageError={imageError}
        />

        <ChangePasswordModal
          isOpen={isPasswordModalOpen}
          onClose={() => setIsPasswordModalOpen(false)}
          email={effectiveUserEmail || ''}
        />
      </div>
    </AnimatePresence>
  );
}
