import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  BarChart3,
  Sparkles,
  Plus
} from 'lucide-react';

interface MobileNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAddTxModal: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, setActiveTab, openAddTxModal }) => {
  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[var(--bg-main)]/95 backdrop-blur-2xl border-t border-[var(--border)] px-2 py-2.5 pb-[calc(0.6rem+env(safe-area-inset-bottom))] shadow-2xl transition-colors duration-250">
      <div className="grid grid-cols-5 items-center justify-items-center relative max-w-md mx-auto">
        <button
          onClick={() => setActiveTab('dashboard')}
          aria-label="Dashboard"
          className={`w-full flex flex-col items-center justify-center min-h-[44px] rounded-2xl transition-all duration-150 active:scale-95 ${
            activeTab === 'dashboard'
              ? 'text-[var(--gold-primary)] font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          aria-label="Dompet & Akun"
          className={`w-full flex flex-col items-center justify-center min-h-[44px] rounded-2xl transition-all duration-150 active:scale-95 ${
            activeTab === 'wallets'
              ? 'text-[var(--gold-primary)] font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Dompet</span>
        </button>

        {/* Floating Gold Center Action Plus Button */}
        <div className="flex justify-center items-center relative -top-5">
          <button
            onClick={openAddTxModal}
            aria-label="Catat Transaksi Baru"
            className="w-12 h-12 rounded-2xl btn-gold text-[#0B1220] flex items-center justify-center shadow-xl border-2 border-[var(--bg-main)] active:scale-90 transition-transform"
            title="Catat Transaksi"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('reports')}
          aria-label="Laporan Keuangan"
          className={`w-full flex flex-col items-center justify-center min-h-[44px] rounded-2xl transition-all duration-150 active:scale-95 ${
            activeTab === 'reports'
              ? 'text-[var(--gold-primary)] font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] tracking-tight">Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_advisor')}
          aria-label="ALN AI Advisor"
          className={`w-full flex flex-col items-center justify-center min-h-[44px] rounded-2xl transition-all duration-150 active:scale-95 ${
            activeTab === 'ai_advisor'
              ? 'text-[var(--gold-primary)] font-extrabold'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-[var(--gold-primary)]" />
          <span className="text-[10px] tracking-tight">ALN AI</span>
        </button>
      </div>
    </div>
  );
};
