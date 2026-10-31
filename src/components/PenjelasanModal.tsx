import { motion, AnimatePresence } from 'framer-motion';

export interface PenjelasanData {
  title: string;
  fullDesc: string;
  image?: string;
}

interface PenjelasanModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PenjelasanData | null;
}

export default function PenjelasanModal({ isOpen, onClose, data }: PenjelasanModalProps) {
  if (!isOpen || !data) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 sm:p-5 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          /* PERBAIKAN: Set max-h-[95vh] dan flex-col agar otomatis menyesuaikan tinggi layar */
          className="relative flex w-full max-w-lg max-h-[95vh] flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl"
        >
          {/* Tombol Close */}
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/20 text-white backdrop-blur-md transition hover:bg-black/40"
          >
            ✕
          </button>

          {/* Gambar Header - Pakai shrink-0 biar tingginya nggak menyusut ditekan konten */}
          {data.image && (
            <div className="h-40 w-full shrink-0 sm:h-56">
              <img src={data.image} alt={data.title} className="h-full w-full object-cover" />
            </div>
          )}

          {/* Konten Text - Area ini yang otomatis munculin scrollbar kalau layar sempit */}
          <div className="flex flex-col flex-1 overflow-y-auto p-6 sm:p-8 custom-scrollbar">
            <h3 className="font-['Outfit',sans-serif] text-2xl font-black text-[#1c1917] leading-tight shrink-0">
              {data.title}
            </h3>
            
            <div className="mt-4 flex-1">
              <p className="text-sm font-medium leading-relaxed text-stone-600 whitespace-pre-line">
                {data.fullDesc}
              </p>
            </div>
            
            <button
              onClick={onClose}
              className="mt-8 w-full shrink-0 rounded-full bg-orange-600 py-3 text-sm font-extrabold text-white transition hover:bg-orange-500 active:scale-95"
            >
              Mengerti
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
