import { useState } from 'react';
import { supabase } from './lib/supabase';
import { uploadToCloudinary } from './utils/cloudinary';

export default function InputCamera() {
  const [namaBarang, setNamaBarang] = useState('');
  const [tipe, setTipe] = useState('');
  const [kodeInventaris, setKodeInventaris] = useState('');
  const [kondisi, setKondisi] = useState('baik');
  const [fileGambar, setFileGambar] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pesan, setPesan] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileGambar(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileGambar) {
      setPesan('Pilih foto kamera terlebih dahulu.');
      return;
    }

    setLoading(true);
    setPesan(null);

    try {
      // 1. Upload ke Cloudinary
      const uploadRes = await uploadToCloudinary(fileGambar);
      if (!uploadRes) {
        throw new Error('Gagal mengunggah gambar ke Cloudinary');
      }

      // 2. Simpan ke Supabase
      const { error } = await supabase.from('cameras').insert([
        {
          nama_barang: namaBarang,
          tipe: tipe || null,
          kode_inventaris: kodeInventaris,
          kondisi: kondisi,
          status: 'Tersedia',
          image_url: uploadRes.imageUrl,
          image_public_id: uploadRes.publicId,
        },
      ]);

      if (error) throw error;

      setPesan('Data kamera berhasil ditambahkan!');
      setNamaBarang('');
      setTipe('');
      setKodeInventaris('');
      setKondisi('baik');
      setFileGambar(null);
      setPreview(null);
    } catch (err: any) {
      setPesan(`Gagal: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-xl font-bold mb-1">Stok Inventaris Kamera</h1>
        <p className="text-sm text-neutral-400 mb-6">Form sementara untuk memasukkan data awal kamera.</p>

        {pesan && (
          <div className="mb-4 p-3 rounded-lg text-sm bg-neutral-800 border border-neutral-700 text-neutral-200">
            {pesan}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Nama Kamera</label>
            <input
              type="text"
              required
              placeholder="Contoh: Sony A7 IV"
              value={namaBarang}
              onChange={(e) => setNamaBarang(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Tipe / Seri</label>
              <input
                type="text"
                placeholder="Contoh: Mirrorless"
                value={tipe}
                onChange={(e) => setTipe(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
              />
            </div>
            <div>
              <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Kode Inventaris</label>
              <input
                type="text"
                required
                placeholder="Contoh: CAM-001"
                value={kodeInventaris}
                onChange={(e) => setKodeInventaris(e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Kondisi</label>
            <select
              value={kondisi}
              onChange={(e) => setKondisi(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-white"
            >
              <option value="baik">Baik</option>
              <option value="rusak_ringan">Rusak Ringan</option>
              <option value="perbaikan">Dalam Perbaikan</option>
            </select>
          </div>

          <div>
            <label className="block text-xs uppercase tracking-wider text-neutral-400 mb-1">Foto Kamera</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full text-sm text-neutral-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-white file:text-black hover:file:bg-neutral-200 cursor-pointer"
            />
            {preview && (
              <div className="mt-3 flex justify-center bg-neutral-800/50 p-2 rounded-lg border border-neutral-700">
                <img src={preview} alt="Preview" className="h-32 object-contain" />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-4 bg-white text-black font-semibold py-2.5 rounded-lg text-sm transition hover:bg-neutral-200 disabled:opacity-50"
          >
            {loading ? 'Mengunggah & Menyimpan...' : 'Simpan Kamera'}
          </button>
        </form>
      </div>
    </div>
  );
}
