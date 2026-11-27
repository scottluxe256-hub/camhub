export type AuthView = 'login' | 'register' | 'otp' | 'reset';

export const AUTH_MODAL_CONTENT: Record<
  AuthView,
  { title: string; desc: string }
> = {
  login: {
    title: 'Akses Semua Alat Produksi.',
    desc: 'Masuk untuk mulai meminjam kamera, lensa, dan kelengkapan lab lainnya.',
  },
  register: {
    title: 'Bergabung dengan CamHub.',
    desc: 'Daftarkan data dirimu sebagai siswa untuk mulai menggunakan fasilitas lab.',
  },
  otp: {
    title: 'Verifikasi Kode OTP.',
    desc: 'Masukkan 6 digit kode rahasia yang baru saja kami kirim ke kotak masuk emailmu.',
  },
  reset: {
    title: 'Buat Sandi Baru.',
    desc: 'Verifikasi berhasil! Sekarang buat kata sandi baru yang kuat dan mudah diingat.',
  },
};

export const AUTH_SLIDE_TRANSITION = {
  type: 'spring' as const,
  stiffness: 100,
  damping: 20,
};

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getAuthErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof Error && err.message) return err.message;
  if (
    typeof err === 'object' &&
    err !== null &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return fallback;
}
