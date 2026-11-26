import JsBarcode from 'jsbarcode';

export interface DataStrukCamHub {
  id: string;
  nama_lengkap?: string | null;
  nis?: string | null;
  kelas?: string | null;
  foto_url?: string | null;
  nama_barang: string;
  kode_inventaris: string;
  tanggal_pinjam: string; // Format: YYYY-MM-DD
  jam_mulai: string;      // Format: HH:MM:SS
  jam_selesai: string;    // Format: HH:MM:SS
  alasan_pinjam?: string | null;
}

const loadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
};

export const generateAndDownloadStruk = async (
  data: DataStrukCamHub
): Promise<{ previewUrl: string; kodeBooking: string } | null> => {
  const kodeBooking = data.id.slice(0, 8).toUpperCase();
  const safeNama = data.nama_lengkap?.trim() || 'Siswa CamHub';
  const safeNis = data.nis?.trim() || '-';
  const safeKelas = data.kelas?.trim() || '-';
  const safeAlasan = data.alasan_pinjam?.trim() || '-';

  // 1. Muat template AVIF dari folder public (Rasio 1440x2880)
  const templateImg = await loadImage('/template-struk.avif');
  const W = templateImg.width;
  const H = templateImg.height;

  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  // Gambar template dasar
  ctx.drawImage(templateImg, 0, 0, W, H);

  // 2. Tempel Foto Profil Bulat
  const centerX = W * 0.5;
  const centerY = H * 0.274;
  const radius = W * 0.141;

  ctx.save();
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();

  let fotoBerhasilDimuat = false;
  if (data.foto_url) {
    try {
      const avatarImg = await loadImage(data.foto_url);
      const size = Math.min(avatarImg.width, avatarImg.height);
      const sx = (avatarImg.width - size) / 2;
      const sy = (avatarImg.height - size) / 2;
      ctx.drawImage(
        avatarImg,
        sx,
        sy,
        size,
        size,
        centerX - radius,
        centerY - radius,
        radius * 2,
        radius * 2
      );
      fotoBerhasilDimuat = true;
    } catch {
      fotoBerhasilDimuat = false;
    }
  }

  if (!fotoBerhasilDimuat) {
    ctx.fillStyle = '#f5f5f4';
    ctx.fillRect(centerX - radius, centerY - radius, radius * 2, radius * 2);
    ctx.fillStyle = '#ea580c';
    ctx.font = `700 ${Math.round(W * 0.095)}px 'Open Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(safeNama.charAt(0).toUpperCase(), centerX, centerY);
  }
  ctx.restore();

  // 3. Format Tanggal & Data
  const dateObj = new Date(`${data.tanggal_pinjam}T00:00:00`);
  const namaHari = dateObj.toLocaleDateString('id-ID', { weekday: 'long' });
  const tanggalFormatted = dateObj.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
  const durasiFormatted = `${data.jam_mulai.slice(0, 5)} - ${data.jam_selesai.slice(0, 5)} WIB`;
  const unitFormatted = `${data.nama_barang} (${data.kode_inventaris})`;

  // 4. Pastikan Font Siap
  const fontSize = Math.round(W * 0.037);
  const fontDeclaration = `400 ${fontSize}px 'Open Sans', 'Outfit', sans-serif`;

  try {
    await document.fonts.load(fontDeclaration);
  } catch {}

  // 5. KOORDINAT FINAL PRESISI TENGAH KOTAK
  const textX = W * 0.365;
  const maxTextWidth = W * 0.555;

  ctx.fillStyle = '#1c1917';
  ctx.font = fontDeclaration;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  const rows = [
    { label: 'Name', value: safeNama, y: H * 0.396 },
    { label: 'Nis', value: safeNis, y: H * 0.456 },
    { label: 'Class', value: safeKelas, y: H * 0.517 },
    { label: 'Unit', value: unitFormatted, y: H * 0.576 },
    { label: 'Day', value: namaHari, y: H * 0.632 },            
    { label: 'Date', value: tanggalFormatted, y: H * 0.693 },   
    { label: 'Duration', value: durasiFormatted, y: H * 0.752 },
    { label: 'Reason', value: safeAlasan, y: H * 0.811 },       
  ];

  rows.forEach((row) => {
    ctx.fillText(row.value, textX, row.y, maxTextWidth);
  });

  // 6. Barcode
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(W * 0.12, H * 0.862, W * 0.76, H * 0.128);

  const barcodeCanvas = document.createElement('canvas');
  JsBarcode(barcodeCanvas, kodeBooking, {
    format: 'CODE128',
    width: Math.max(2, Math.round(W / 180)),
    height: Math.round(H * 0.075),
    displayValue: true,
    text: `#${kodeBooking}`,
    fontSize: Math.round(W * 0.036),
    font: 'Open Sans, monospace',
    fontOptions: 'bold',
    background: '#ffffff',
    lineColor: '#1c1917',
    margin: 0,
  });

  const barcodeX = (W - barcodeCanvas.width) / 2;
  const barcodeY = H * 0.868;
  ctx.drawImage(barcodeCanvas, barcodeX, barcodeY);

  // 7. Export PNG
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = `Struk-CamHub-${kodeBooking}.png`;
        link.href = blobUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        resolve({ previewUrl: blobUrl, kodeBooking });
      },
      'image/png',
      1.0
    );
  });
};
