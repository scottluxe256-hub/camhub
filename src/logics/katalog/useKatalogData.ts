import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  type StudioSettings,
  DEFAULT_STUDIO_SETTINGS,
  parseStudioBounds,
  getAvailableWeekdays,
  formatLocalDateISO,
} from '../../utils/bookingSlots';
import type { CameraItem } from './katalog.config';

export function useKatalogData() {
  const [cameras, setCameras] = useState<CameraItem[]>([]);
  const [queuedCameraIds, setQueuedCameraIds] = useState<Set<string>>(new Set());
  const [targetDateStr, setTargetDateStr] = useState<string>('');
  const [loading, setLoading] = useState(true);

  const fetchCameras = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('cameras')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setCameras(data);
    } catch (err) {
      console.error('Gagal mengambil data kamera:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDailyQueue = useCallback(async (dateStr: string) => {
    try {
      const { data, error } = await supabase
        .from('borrow_requests')
        .select('camera_id')
        .eq('tanggal_pinjam', dateStr)
        .in('status_request', ['Pending', 'Approved']);

      if (error) throw error;

      const ids = new Set<string>(
        (data || [])
          .map((row) => row.camera_id)
          .filter((id): id is string => Boolean(id))
      );
      setQueuedCameraIds(ids);
    } catch (err) {
      console.error('Gagal mengecek antrian harian:', err);
    }
  }, []);

  useEffect(() => {
    const syncTargetDate = (settings: StudioSettings) => {
      const bounds = parseStudioBounds(settings);
      const activeWeekdays = getAvailableWeekdays(bounds);
      if (activeWeekdays.length > 0) {
        setTargetDateStr(formatLocalDateISO(activeWeekdays[0]));
      }
    };

    const initCatalog = async () => {
      await fetchCameras();

      const { data: settingsData } = await supabase
        .from('studio_settings')
        .select('jam_buka, jam_tutup, istirahat_mulai, istirahat_selesai')
        .eq('id', 1)
        .single();

      syncTargetDate(settingsData || DEFAULT_STUDIO_SETTINGS);
    };

    initCatalog();

    const cameraChannel = supabase
      .channel('realtime_cameras_catalog')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cameras' },
        () => {
          fetchCameras();
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
            syncTargetDate(payload.new as StudioSettings);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cameraChannel);
    };
  }, [fetchCameras]);

  useEffect(() => {
    if (!targetDateStr) return;

    fetchDailyQueue(targetDateStr);

    const queueChannel = supabase
      .channel(`realtime_queue_catalog_${targetDateStr}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'borrow_requests' },
        () => {
          fetchDailyQueue(targetDateStr);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(queueChannel);
    };
  }, [targetDateStr, fetchDailyQueue]);

  const refreshQueue = useCallback(() => {
    if (targetDateStr) {
      fetchDailyQueue(targetDateStr);
    }
  }, [targetDateStr, fetchDailyQueue]);

  return {
    cameras,
    queuedCameraIds,
    loading,
    refreshQueue,
  };
}
