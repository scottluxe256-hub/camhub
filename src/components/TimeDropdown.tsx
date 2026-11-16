import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Lock } from 'lucide-react';

export interface TimeDropdownOption {
  value: string;
  label: string;
  disabled: boolean;
}

interface TimeDropdownProps {
  value: string;
  placeholder: string;
  options: TimeDropdownOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
}

export default function TimeDropdown({
  value,
  placeholder,
  options,
  disabled = false,
  onChange,
}: TimeDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Tutup dropdown otomatis saat klik/tap di luar area
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen]);

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* TOMBOL PEMICU DROPDOWN */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`flex w-full items-center justify-between rounded-xl border px-3.5 py-3 font-mono text-sm font-bold transition-all outline-none ${
          disabled
            ? 'cursor-not-allowed border-stone-200/70 bg-stone-100 text-stone-400'
            : isOpen
            ? 'border-orange-500 bg-white text-[#1c1917] ring-2 ring-orange-500/20'
            : 'border-stone-200 bg-stone-50 text-[#1c1917] hover:border-orange-300 hover:bg-white'
        }`}
      >
        <span className={value ? 'text-[#1c1917]' : 'text-stone-400'}>
          {value || placeholder}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-stone-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-orange-500' : ''
          }`}
        />
      </button>

      {/* DAFTAR PILIHAN MELAYANG (SESUAI DESAIN WEB) */}
      <AnimatePresence>
        {isOpen && !disabled && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="custom-scrollbar absolute left-0 right-0 top-full z-50 mt-1.5 max-h-48 overflow-y-auto rounded-2xl border border-stone-200 bg-white p-1.5 shadow-xl shadow-stone-900/10"
          >
            <div className="flex flex-col gap-1">
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    disabled={opt.disabled}
                    onClick={() => {
                      if (opt.disabled) return;
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 font-mono text-sm font-bold transition-colors ${
                      opt.disabled
                        ? 'cursor-not-allowed bg-stone-100/80 text-stone-300'
                        : isSelected
                        ? 'bg-orange-600 text-white shadow-xs'
                        : 'text-[#1c1917] hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <span>{opt.label}</span>
                    {opt.disabled && <Lock className="h-3 w-3 text-stone-300" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
