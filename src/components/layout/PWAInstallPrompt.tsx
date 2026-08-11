import React, { useState, useEffect } from 'react';
import { Download, Share2, PlusSquare, X } from 'lucide-react';

interface PWAInstallPromptProps {
  deferredPrompt: any;
  onInstall: () => void;
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ deferredPrompt, onInstall }) => {
  const [showIOSModal, setShowIOSModal] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIOSDevice);

    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
    setIsStandalone(isInStandaloneMode);
  }, []);

  if (isStandalone) return null;

  return (
    <>
      {/* Banner Pop-up Android & Desktop */}
      {deferredPrompt && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 lg:left-auto lg:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border border-emerald-500/40 p-4 rounded-2xl shadow-2xl shadow-emerald-950/50 flex items-center justify-between gap-3 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center p-1.5 shrink-0">
              <img src="/logo.svg" alt="ALN Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Install ALN Finance Pro</h4>
              <p className="text-[10px] text-slate-300">Akses cepat offline tanpa browser bar</p>
            </div>
          </div>

          <button
            onClick={onInstall}
            className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shrink-0 shadow-md transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            Install
          </button>
        </div>
      )}

      {/* iOS Safari Guide Button / Banner */}
      {isIOS && !deferredPrompt && (
        <div className="fixed bottom-20 lg:bottom-6 right-4 left-4 lg:left-auto lg:w-96 z-40 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3.5 rounded-2xl shadow-2xl flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center p-1 shrink-0">
              <img src="/logo.svg" alt="ALN Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Pasang di iPhone Anda</h4>
              <p className="text-[10px] text-slate-400">Tambahkan ke Layar Utama Safari</p>
            </div>
          </div>

          <button
            onClick={() => setShowIOSModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold border border-slate-700"
          >
            Petunjuk
          </button>
        </div>
      )}

      {/* Modal Instruksi Safari iOS */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-sm rounded-3xl p-6 relative text-slate-100 shadow-2xl">
            <button
              onClick={() => setShowIOSModal(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 p-2">
              <img src="/logo.svg" alt="ALN Logo" className="w-full h-full object-contain" />
            </div>

            <h3 className="text-base font-extrabold text-center text-white mb-1">
              Tambah ke Layar Utama (iOS)
            </h3>
            <p className="text-xs text-slate-400 text-center mb-6">
              Ikuti 2 langkah mudah di Safari iPhone untuk pengalaman PWA Fullscreen:
            </p>

            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">1. Ketuk Tombol Bagikan</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Ketuk ikon <strong>Share / Bagikan</strong> di bagian bawah toolbar browser Safari.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
                  <PlusSquare className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-bold text-white">2. Tambah ke Layar Utama</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Gulir opsi lalu pilih <strong>"Tambah ke Layar Utama" (Add to Home Screen)</strong>.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full mt-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};
