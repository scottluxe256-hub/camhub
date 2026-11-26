import type { Database } from '../../types/database';

export type CameraItem = Database['public']['Tables']['cameras']['Row'];

export const KATALOG_FILTERS = [
  'Semua Alat',
  'Paket Bundling',
  'Kamera',
  'Lensa',
  'Aksesoris',
] as const;

export const MARQUEE_SPEED_PX_PER_SEC = 38;
export const RESUME_DELAY_MS = 900;

export function matchesCameraFilter(item: CameraItem, filter: string): boolean {
  if (filter === 'Semua Alat') return true;
  if (!item.tipe) return false;
  const t = item.tipe.toLowerCase();

  if (filter === 'Kamera') return t.includes('kamera');
  if (filter === 'Lensa') return t.includes('lensa');
  if (filter === 'Paket Bundling') return t.includes('paket') || t.includes('bundling');
  if (filter === 'Aksesoris') {
    return (
      t.includes('gimbal') ||
      t.includes('stabilizer') ||
      t.includes('mic') ||
      t.includes('audio') ||
      t.includes('tripod') ||
      t.includes('aksesoris') ||
      t.includes('lighting')
    );
  }
  return t.includes(filter.toLowerCase());
}
