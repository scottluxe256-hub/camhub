import { useCallback, useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { supabase } from './lib/supabase';
import { uploadToCloudinary } from './utils/cloudinary';
import type { Database } from './types/database';

type CameraRow = Database['public']['Tables']['cameras']['Row'];
type CameraUpdate = Database['public']['Tables']['cameras']['Update'];

export default function InputCamera() {
  const [cameras, setCameras] = useState<CameraRow[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  const [namaBarang, setNamaBarang] = useState('');
  const [tipe, setTipe] = useState('');
  const [kodeInventaris, setKodeInventaris] = useState('');
  const [kondisi, setKondisi] = useState('baik');
  const [status, setStatus] = useState<CameraRow['status']>('Tersedia');
  const [stok, setStok] = useState<number>(1);
  const [isiPaketText, setIsiPaketText] = useState('');

  const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
  const [existingPublicId, setExistingPublicId] = useState<string | null>(null);
  const [fileGambar, setFileGambar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const applyCameraToForm = useCallback((item: CameraRow) => {
    setSelectedId(item.id);
    setNamaBarang(item.nama_barang);
    setTipe(item.tipe ?? '');
    setKodeInventaris(item.kode_inventaris);
    setKondisi(item.kondisi ?? 'baik');
    setStatus(item.status);
    setStok(Math.max(1, item.stok ?? 1));
    setIsiPaketText(Array.isArray(item.isi_paket) ? item.isi_paket.join(', ') : '');
    setExistingImageUrl(item.image_url);
    setExistingPublicId(item.image_public_id);
    setFileGambar(null);
    setPreview(item.image_url);
  }, []);

  const fetchCameras = useCallback(
    async (keepSelectedId?: string) => {
      setLoadingList(true);
      try {
        const { data, error } = await supabase
          .from('cameras')
          .select('*')
          .order('created_at', { ascending: true });

        if (error) throw error;

        const list = data ?? [];
        setCameras(list);

        if (list.length > 0) {
          const target =
            list.find((c) => c.id === (keepSelectedId ?? selectedId)) ?? list[0];
          applyCameraToForm(target);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Gagal memuat daftar katalog.';
        setPesan({ type: 'err', text: msg });
      } finally {
        setLoadingList(false);
      }
    },
    [applyCameraToForm, selectedId]
  );

  useEffect(() => {
    fetchCameras();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectCamera = (item: CameraRow) => {
    setPesan(null);
    applyCameraToForm(item);
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileGambar(file);
    setPreview(URL.createObjectURL(file));
    setPesan(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedId) {
      setPesan({ type: 'err', text: 'Pilih salah satu alat dari daftar di atas dulu.' });
      return;
    }

    if (!fileGambar && !existingImageUrl) {
      setPesan({ type: 'err', text: 'Pilih foto kamera terlebih dahulu.' });
      return;
    }

    setLoading(true);
    setPesan(null);

    try {
      let finalImageUrl = existingImageUrl;
      let finalPublicId = existingPublicId;

      if (fileGambar) {
        const uploadRes = await uploadToCloudinary(fileGambar);
        if (!uploadRes) {
          throw new Error('Gagal mengunggah gambar ke Cloudinary.');
        }
        finalImageUrl = uploadRes.imageUrl;
        finalPublicId = uploadRes.publicId;
      }

      const parsedBundle = isiPaketText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload: CameraUpdate = {
        nama_barang: namaBarang.trim(),
        tipe: tipe.trim() || null,
        kode_inventaris: kodeInventaris.trim(),
        kondisi,
        status,
        stok: Math.max(1, Number(stok) || 1),
        isi_paket: parsedBundle.length > 0 ? parsedBundle : null,
        image_url: finalImageUrl,
        image_public_id: finalPublicId,
      };

      const { error } = await supabase
        .from('cameras')
        .update(payload)
        .eq('id', selectedId);

      if (error) throw error;

      setPesan({
        type: 'ok',
        text: `Berhasil memperbarui "${namaBarang}" (${payload.stok} unit)!`,
      });

      await fetchCameras(selectedId);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setPesan({ type: 'err', text: `Gagal: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-xl font-bold">Edit Katalog, Stok & Foto</h1>
          <span className="rounded-full bg-orange-500/15 border border-orange-500/30 px-3 py-0.5 text-xs font-semibold text-orange-400">
            {cameras.length} Item Terdaftar
          </span>
        </div>
        <p className="text-sm text-neutral-400 mb-5">
          Pilih salah satu katalog yang sudah ada di bawah, lalu atur stok, paket, atau fotonya.
        </p>

        {/* DAFTAR PILIHAN KATALOG */}
        <div className="mb-6">
          <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-2">
            1. Pilih Alat yang Mau Diedit
          </label>

          {loadingList ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-center text-xs text-neutral-400">
              Memuat daftar katalog dari Supabase...
            </div>
          ) : cameras.length === 0 ? (
            <div className="rounded-xl border border-neutral-800 bg-neutral-950/60 p-4 text-center text-xs text-neutral-400">
              Belum ada data di tabel cameras.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {cameras.map((item, index) => {
                const isSelected = item.id === selectedId;
                const hasPhoto = Boolean(item.image_url);
                const unitCount = Math.max(1, item.stok ?? 1);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectCamera(item)}
                    className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-neutral-800 bg-neutral-800/50 hover:border-neutral-700'
                    }`}
                  >
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center overflow-hidden">
                      {item.image_url ? (
                        <img
                          src={item.image_url}
                          alt={item.nama_barang}
                          className="h-full w-full object-contain p-1"
                        />
                      ) : (
                        <span className="text-[10px] font-mono text-neutral-500">
                          #{index + 1}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-bold text-white">
                        {item.nama_barang}
                      </p>
                      <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-[10px] text-neutral-400">
                          {item.kode_inventaris}
                        </span>
                        <span className="rounded bg-neutral-700/70 px-1.5 text-[9px] font-semibold text-neutral-300">
                          {unitCount} Unit
                        </span>
                        <span
                          className={`rounded px-1.5 text-[9px] font-semibold ${
                            hasPhoto
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : 'bg-amber-500/15 text-amber-400'
                          }`}
                        >
                          {hasPhoto ? 'Ada Foto' : 'Belum Ada Foto'}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {pesan && (
          <div
            className={`mb-4 p-3 rounded-xl text-xs font-medium border ${
              pesan.type === 'ok'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-red-500/10 border-red-500/30 text-red-300'
            }`}
          >
            {pesan.text}
          </div>
        )}

        {/* FORM EDIT DATA & UPLOAD FOTO */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
              Nama Alat / Paket Bundling
            </label>
            <input
              type="text"
              required
              disabled={!selectedId || loading}
              placeholder="Contoh: Sony A7 IV / Paket Bundling Pro"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Tipe / Kategori
              </label>
              <input
                type="text"
                disabled={!selectedId || loading}
                placeholder="Contoh: Kamera / Paket Bundling"
                value={tipe}
                onChange={(e) => setTipe(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Kode Inventaris
              </label>
              <input
                type="text"
                required
                disabled={!selectedId || loading}
                placeholder="Contoh: CAM-001"
                value={kodeInventaris}
                onChange={(e) => setKodeInventaris(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Stok Unit
              </label>
              <input
                type="number"
                min={1}
                max={50}
                required
                disabled={!selectedId || loading}
                value={stok}
                onChange={(e) => setStok(Math.max(1, Number(e.target.value) || 1))}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Kondisi
              </label>
              <select
                disabled={!selectedId || loading}
                value={kondisi}
                onChange={(e) => setKondisi(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
              >
                <option value="baik">Baik</option>
                <option value="rusak_ringan">Rusak Ringan</option>
                <option value="perbaikan">Dalam Perbaikan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
                Status Katalog
              </label>
              <select
                disabled={!selectedId || loading}
                value={status}
                onChange={(e) => setStatus(e.target.value as CameraRow['status'])}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
              >
                <option value="Tersedia">Tersedia</option>
                <option value="Dipinjam">Dipinjam</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
              Isi Paket Bundling (Opsional — pisahkan dengan koma)
            </label>
            <input
              type="text"
              disabled={!selectedId || loading}
              placeholder="Kosongkan jika satuan. Contoh: Body Sony A7, Lensa 50mm, Gimbal, Mic Wireless"
              value={isiPaketText}
              onChange={(e) => setIsiPaketText(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-500 disabled:opacity-50"
            />
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">
              {existingImageUrl ? 'Ganti / Perbarui Foto' : 'Upload Foto Alat'}
            </label>
            <input
              type="file"
              accept="image/*"
              disabled={!selectedId || loading}
              onChange={handleFileChange}
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-600 file:text-white hover:file:bg-orange-500 cursor-pointer disabled:opacity-50"
            />
            {preview && (
              <div className="mt-3 flex flex-col items-center justify-center bg-neutral-800/50 p-3 rounded-xl border border-neutral-700">
                <img src={preview} alt="Preview" className="h-36 object-contain" />
                <span className="mt-1.5 text-[11px] text-neutral-400">
                  {fileGambar ? `File baru: ${fileGambar.name}` : 'Foto tersimpan saat ini'}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={!selectedId || loading}
            className="w-full mt-4 bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition hover:bg-orange-500 disabled:opacity-50"
          >
            {loading ? 'Mengunggah & Menyimpan Perubahan...' : 'Simpan Perubahan ke Katalog'}
          </button>
        </form>
      </div>
    </div>
  );
}
