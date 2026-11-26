import React from 'react';

export interface S1FeatureItem {
  title: string;
  desc: string;
  isBell: boolean;
  icon: React.ReactNode;
}

export const DESKTOP_ROWS = [
  { leftIdx: 0, rightIdx: 3 },
  { leftIdx: 1, rightIdx: 4 },
  { leftIdx: 2, rightIdx: 5 },
] as const;

export const S1_FEATURES: S1FeatureItem[] = [
  {
    title: 'Bebas Antre Fisik',
    desc: 'Booking alat langsung dari HP. Datang ke lab hanya untuk verifikasi dan ambil alat.',
    isBell: false,
    icon: (
      <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" strokeWidth={1.7} />
        <path strokeLinecap="round" strokeWidth={1.7} d="M11 18.5h2" />
        <line
          x1="8"
          y1="9"
          x2="16"
          y2="9"
          strokeWidth={1.8}
          strokeLinecap="round"
          className="animate-[phoneScanBeam_1.8s_ease-in-out_infinite] opacity-85"
        />
      </svg>
    ),
  },
  {
    title: 'Cek Live Ketersediaan',
    desc: 'Lihat status alat secara live, apakah sedang tersedia, dipinjam, atau dalam perawatan.',
    isBell: false,
    icon: (
      <div className="relative flex h-4.5 w-4.5 items-center justify-center md:h-5 md:w-5">
        <span className="absolute h-4 w-4 rounded-full border-[1.6px] border-current animate-[liveRadarWave_2s_ease-out_infinite]" />
        <svg className="relative z-10 h-full w-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <circle cx="12" cy="12" r="2.6" fill="currentColor" />
          <path
            strokeLinecap="round"
            strokeWidth={1.7}
            d="M7.5 16.5a6.4 6.4 0 010-9m9 0a6.4 6.4 0 010 9"
          />
        </svg>
      </div>
    ),
  },
  {
    title: 'Sistem Slot Jam',
    desc: 'Atur jadwal pinjam hingga 5 hari kerja ke depan dengan pilihan slot waktu yang presisi.',
    isBell: false,
    icon: (
      <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <rect x="3.5" y="4.5" width="17" height="16" rx="2.5" strokeWidth={1.7} />
        <path strokeLinecap="round" strokeWidth={1.7} d="M8 2.5v3.5M16 2.5v3.5M3.5 9.5h17" />
        <circle cx="8.5" cy="13.5" r="1" fill="currentColor" />
        <circle cx="12" cy="13.5" r="1" fill="currentColor" />
        <circle cx="15.5" cy="13.5" r="1" fill="currentColor" />
        <circle cx="8.5" cy="17" r="1" fill="currentColor" />
        <circle cx="12" cy="17" r="1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Denda Otomatis',
    desc: 'Sistem web otomatis mencatat waktu keterlambatan pengembalian untuk menjaga kedisiplinan.',
    isBell: false,
    icon: (
      <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <circle cx="12" cy="12" r="8.5" strokeWidth={1.7} />
        <circle cx="12" cy="5.5" r="0.7" fill="currentColor" />
        <g transform="translate(12 12)">
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-4.2"
            strokeWidth={1.9}
            strokeLinecap="round"
            className="animate-[clockHourToTwelve_4s_linear_infinite]"
          />
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="-6"
            strokeWidth={1.5}
            strokeLinecap="round"
            className="animate-[clockMinuteToTwelve_4s_linear_infinite]"
          />
        </g>
        <circle cx="12" cy="12" r="1.1" fill="currentColor" />
      </svg>
    ),
  },
  {
    title: 'Pengingat Jadwal Kembali',
    desc: 'Notifikasi otomatis menjelang batas waktu peminjaman berakhir agar alat kembali tepat waktu.',
    isBell: true,
    icon: (
      <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M15 17h5l-1.4-1.4A2 2 0 0118 14.2V11a6 6 0 10-12 0v3.2c0 .53-.21 1.04-.59 1.41L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        />
      </svg>
    ),
  },
  {
    title: 'Tiket & Riwayat Digital',
    desc: 'Bukti peminjaman dan riwayat transaksi tersimpan otomatis di akun tanpa formulir kertas.',
    isBell: false,
    icon: (
      <svg className="h-4.5 w-4.5 md:h-5 md:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.7}
          d="M4 7a2 2 0 012-2h12a2 2 0 012 2v2.5a2 2 0 100 5V17a2 2 0 01-2 2H6a2 2 0 01-2-2v-2.5a2 2 0 100-5V7z"
        />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M9.5 12l1.8 1.8 3.4-3.6" />
      </svg>
    ),
  },
];
