import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Receipt,
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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#080E1A]/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
      <div className="grid grid-cols-5 items-center justify-items-center relative">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'dashboard' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'wallets' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dompet</span>
        </button>

        {/* Central Floating Plus Action (Column 3 - Exact Middle Center) */}
        <div className="flex justify-center items-center relative -top-5">
          <button
            onClick={openAddTxModal}
            className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-950/50 border-2 border-[#080E1A] active:scale-90 transition-transform"
            title="Catat Transaksi"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'reports' ? 'text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_advisor')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-xl transition-colors ${
            activeTab === 'ai_advisor' ? 'text-purple-400 font-bold' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-purple-400" />
          <span className="text-[10px]">ALN AI</span>
        </button>
      </div>
    </div>
  );
};
