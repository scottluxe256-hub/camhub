export interface StudioSettings {
  jam_buka: string;          // Format: '07:00:00' atau '07:00'
  jam_tutup: string;         // Format: '15:00:00' atau '15:00'
  istirahat_mulai: string;   // Format: '12:00:00' atau '12:00'
  istirahat_selesai: string; // Format: '13:00:00' atau '13:00'
}

export const DEFAULT_STUDIO_SETTINGS: StudioSettings = {
  jam_buka: '07:00:00',
  jam_tutup: '15:00:00',
  istirahat_mulai: '12:00:00',
  istirahat_selesai: '13:00:00',
};

export interface ParsedStudioBounds {
  labOpen: number;
  labClose: number;
  breakStart: number;
  breakEnd: number;
  hasBreak: boolean;
}

export interface TimeInterval {
  start: number; // dalam menit sejak 00:00
  end: number;
}

export interface TimelineSlot {
  type: 'free' | 'booked' | 'break';
  start: string;
  end: string;
}

export const MINUTES_LIST = Array.from({ length: 60 }, (_, i) =>
  i.toString().padStart(2, '0')
);

export const timeToMins = (timeStr: string): number => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const minsToTime = (mins: number): string => {
  const h = Math.floor(mins / 60).toString().padStart(2, '0');
  const m = (mins % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

export const parseStudioBounds = (
  settings: StudioSettings = DEFAULT_STUDIO_SETTINGS
): ParsedStudioBounds => {
  const labOpen = timeToMins(settings.jam_buka.slice(0, 5));
  const labClose = timeToMins(settings.jam_tutup.slice(0, 5));
  const breakStart = timeToMins(settings.istirahat_mulai.slice(0, 5));
  const breakEnd = timeToMins(settings.istirahat_selesai.slice(0, 5));
  const hasBreak = breakEnd > breakStart && breakStart >= labOpen && breakEnd <= labClose;

  return { labOpen, labClose, breakStart, breakEnd, hasBreak };
};

// Generate pilihan jam (HH) otomatis mengikuti jam_buka dan jam_tutup dari DB
export const getStartHoursList = (bounds: ParsedStudioBounds): string[] => {
  const firstH = Math.floor(bounds.labOpen / 60);
  const lastH = Math.floor(Math.max(bounds.labOpen, bounds.labClose - 1) / 60);
  const list: string[] = [];
  for (let h = firstH; h <= lastH; h++) {
    list.push(String(h).padStart(2, '0'));
  }
  return list;
};

export const getEndHoursList = (bounds: ParsedStudioBounds): string[] => {
  const firstH = Math.floor((bounds.labOpen + 1) / 60);
  const lastH = Math.floor(bounds.labClose / 60);
  const list: string[] = [];
  for (let h = firstH; h <= lastH; h++) {
    list.push(String(h).padStart(2, '0'));
  }
  return list;
};

// Format YYYY-MM-DD waktu lokal WIB (anti bug mundur 1 hari karena UTC)
export const formatLocalDateISO = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const formatDateLabel = (date: Date): string => {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

// 5 hari kerja aktif (Senin-Jumat), otomatis geser ke Senin depan jika hari ini sudah tutup
export const getAvailableWeekdays = (bounds: ParsedStudioBounds): Date[] => {
  const now = new Date();
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nowMins = now.getHours() * 60 + now.getMinutes();

  if (cursor.getDay() !== 0 && cursor.getDay() !== 6 && nowMins >= bounds.labClose - 5) {
    cursor.setDate(cursor.getDate() + 1);
  }

  const days: Date[] = [];
  while (days.length < 5) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) {
      days.push(new Date(cursor));
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

// Membentuk timeline visual: Tersedia, Dipinjam, dan Istirahat Lab
export const buildVisualTimeline = (
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): TimelineSlot[] => {
  const slots: TimelineSlot[] = [];
  let currentType: 'free' | 'booked' | 'break' | null = null;
  let segmentStart = bounds.labOpen;

  for (let m = bounds.labOpen; m < bounds.labClose; m++) {
    const isBooked = bookedIntervals.some((b) => m >= b.start && m < b.end);
    const isBreak = bounds.hasBreak && m >= bounds.breakStart && m < bounds.breakEnd;
    const type: 'free' | 'booked' | 'break' = isBooked ? 'booked' : isBreak ? 'break' : 'free';

    if (currentType === null) {
      currentType = type;
      segmentStart = m;
    } else if (type !== currentType) {
      slots.push({
        type: currentType,
        start: minsToTime(segmentStart),
        end: minsToTime(m),
      });
      currentType = type;
      segmentStart = m;
    }
  }

  if (currentType !== null) {
    slots.push({
      type: currentType,
      start: minsToTime(segmentStart),
      end: minsToTime(bounds.labClose),
    });
  }

  return slots;
};

const getMinStartMins = (selectedDateStr: string, bounds: ParsedStudioBounds): number => {
  const now = new Date();
  if (formatLocalDateISO(now) === selectedDateStr) {
    const nowMins = now.getHours() * 60 + now.getMinutes();
    return Math.max(bounds.labOpen, nowMins + 1);
  }
  return bounds.labOpen;
};

export const isStartMinuteDisabled = (
  hourStr: string,
  minStr: string,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): boolean => {
  const mins = Number(hourStr) * 60 + Number(minStr);
  const minAllowed = getMinStartMins(selectedDateStr, bounds);

  if (mins < minAllowed || mins >= bounds.labClose) return true;
  if (bounds.hasBreak && mins >= bounds.breakStart && mins < bounds.breakEnd) return true;
  if (bookedIntervals.some((b) => mins >= b.start && mins < b.end)) return true;

  return false;
};

export const isStartHourDisabled = (
  hourStr: string,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): boolean => {
  return MINUTES_LIST.every((m) =>
    isStartMinuteDisabled(hourStr, m, selectedDateStr, bookedIntervals, bounds)
  );
};

export const isEndMinuteDisabled = (
  hourStr: string,
  minStr: string,
  startMins: number | null,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): boolean => {
  const mins = Number(hourStr) * 60 + Number(minStr);

  if (mins <= bounds.labOpen || mins > bounds.labClose) return true;
  if (bounds.hasBreak && mins > bounds.breakStart && mins < bounds.breakEnd) return true;

  if (startMins !== null) {
    if (mins <= startMins) return true;
    if (bookedIntervals.some((b) => startMins < b.end && mins > b.start)) return true;
  } else {
    const minAllowed = getMinStartMins(selectedDateStr, bounds);
    if (mins <= minAllowed) return true;
    if (bookedIntervals.some((b) => mins > b.start && mins <= b.end)) return true;
  }

  return false;
};

export const isEndHourDisabled = (
  hourStr: string,
  startMins: number | null,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): boolean => {
  return MINUTES_LIST.every((m) =>
    isEndMinuteDisabled(hourStr, m, startMins, selectedDateStr, bookedIntervals, bounds)
  );
};

export const getFirstAvailableStartMinute = (
  hourStr: string,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): string => {
  return (
    MINUTES_LIST.find(
      (m) => !isStartMinuteDisabled(hourStr, m, selectedDateStr, bookedIntervals, bounds)
    ) || ''
  );
};

export const getFirstAvailableEndMinute = (
  hourStr: string,
  startMins: number | null,
  selectedDateStr: string,
  bookedIntervals: TimeInterval[],
  bounds: ParsedStudioBounds
): string => {
  return (
    MINUTES_LIST.find(
      (m) => !isEndMinuteDisabled(hourStr, m, startMins, selectedDateStr, bookedIntervals, bounds)
    ) || ''
  );
};
