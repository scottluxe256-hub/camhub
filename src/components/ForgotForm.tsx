import { ArrowLeft, Mail } from 'lucide-react';
import type { AuthView } from './AuthModal';

export default function ForgotForm({ onSwitchView }: { onSwitchView: (view: AuthView) => void }) {
    return (
        <>
            <button onClick={() => onSwitchView('login')} className="absolute top-8 left-8 flex items-center gap-1.5 text-[11px] font-bold uppercase text-stone-400 hover:text-stone-700">
                <ArrowLeft size={14} /> Kembali
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-500/10 p-2.5 border border-orange-500/20">
                <img src="/logo.webp" alt="Logo" className="h-full w-full object-contain" />
            </div>
            <h3 className="text-center font-['Playfair_Display',serif] text-2xl font-bold text-[#1c1917] sm:text-3xl">Pulihkan Sandi</h3>
            <p className="mt-1 text-center text-xs text-stone-500 mb-6">Kami akan mengirimkan link reset ke email Anda.</p>

            <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); onSwitchView('reset'); }}>
                <div>
                    <label className="text-[11px] font-bold uppercase tracking-wider text-stone-500">Email Terdaftar</label>
                    <div className="relative mt-1.5">
                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
                        <input type="email" placeholder="nama@sekolah.sch.id" className="w-full rounded-2xl border border-stone-200 bg-stone-50/60 py-3 pl-11 pr-4 text-xs text-stone-800 outline-none focus:border-orange-500" />
                    </div>
                </div>
                <button type="submit" className="flex w-full items-center justify-center gap-2 rounded-full bg-orange-600 py-3.5 text-xs font-bold text-white transition hover:bg-orange-500">
                    Kirim Tautan Reset
                </button>
            </form>
        </>
    );
}