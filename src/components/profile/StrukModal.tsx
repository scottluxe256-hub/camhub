import { Download, CheckCircle2, X } from 'lucide-react';

interface StrukModalProps {
  previewUrl: string;
  kodeBooking: string;
  onClose: () => void;
}

export default function StrukModal({
  previewUrl,
  kodeBooking,
  onClose,
}: StrukModalProps) {
  const handleManualDownload = () => {
    const link = document.createElement('a');
    link.download = `Struk-CamHub-${kodeBooking}.png`;
    link.href = previewUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClose = () => {
    URL.revokeObjectURL(previewUrl);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-3 rounded-3xl border border-stone-800 bg-[#1c1917] p-4 text-white shadow-2xl">
        {/* Header Modal */}
        <div className="flex w-full items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={16} />
            <span>Booking Berhasil!</span>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-1 text-stone-400 transition hover:bg-stone-800 hover:text-white"
          >
            <X size={18} />
          </button>
        </div>

        {/* Preview Hasil Struk PNG */}
        <div className="max-h-[65vh] w-full overflow-y-auto rounded-2xl border border-stone-700 bg-white">
          <img
            src={previewUrl}
            alt={`Struk CamHub ${kodeBooking}`}
            className="h-auto w-full object-contain"
          />
        </div>

        {/* Tombol Simpan Manual */}
        <button
          type="button"
          onClick={handleManualDownload}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3 text-xs font-extrabold text-white shadow-lg transition hover:bg-orange-500 active:scale-95"
        >
          <Download size={16} />
          Simpan Struk PNG (#{kodeBooking})
        </button>
      </div>
    </div>
  );
}
