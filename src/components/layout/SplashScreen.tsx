import React, { useEffect, useState } from 'react';
import { ShieldCheck, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('Menginisialisasi Kernel ALN OS...');
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setProgress(35);
      setStatusText('Memuat Dompet & Transaksi Lokal...');
    }, 400);

    const timer2 = setTimeout(() => {
      setProgress(75);
      setStatusText('Menghubungkan AI Financial Engine...');
    }, 800);

    const timer3 = setTimeout(() => {
      setProgress(100);
      setStatusText('Sistem Siap Digunakan');
    }, 1200);

    const timer4 = setTimeout(() => {
      setIsFadingOut(true);
    }, 1400);

    const timer5 = setTimeout(() => {
      onComplete();
    }, 1700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#050505] text-slate-100 select-none p-6 transition-all duration-500 ${
        isFadingOut ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Glow ambient background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center max-w-sm w-full text-center">
        {/* Animated Logo Icon */}
        <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-slate-900 to-slate-950 p-4 border border-slate-800/80 shadow-2xl shadow-emerald-950/40 relative flex items-center justify-center group animate-scale-up">
          <div className="absolute inset-0 rounded-3xl bg-emerald-500/10 animate-pulse" />
          <img src="/logo.svg" alt="ALN Finance Pro Logo" className="w-16 h-16 relative z-10 drop-shadow-md object-contain" />
        </div>

        {/* Title & Slogan */}
        <h1 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2 animate-fade-in">
          ALN Finance <span className="text-emerald-400 font-bold text-xs uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">PRO</span>
        </h1>

        <p className="text-xs text-slate-400 mt-1.5 font-medium tracking-wide animate-fade-in">
          Smart Personal & Business Financial Management
        </p>

        {/* Progress Loading Bar */}
        <div className="w-full mt-8 bg-slate-900/90 h-2 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <p className="text-[11px] text-slate-500 mt-3 font-mono tracking-tight flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-emerald-400 animate-spin" />
          {statusText}
        </p>

        {/* Badge footer */}
        <div className="mt-12 flex items-center gap-2 text-[10px] text-slate-500 font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Production-Ready PWA • Secure Local Encryption</span>
        </div>
      </div>
    </div>
  );
};
