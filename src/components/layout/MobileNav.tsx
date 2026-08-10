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
    <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-[#0B1220]/95 backdrop-blur-2xl border-t border-[rgba(255,255,255,0.08)] px-2 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))] shadow-2xl">
      <div className="grid grid-cols-5 items-center justify-items-center relative">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'dashboard' ? 'text-[#F6D365] font-bold' : 'text-[#7C8799] hover:text-[#BFC8D6]'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('wallets')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'wallets' ? 'text-[#F6D365] font-bold' : 'text-[#7C8799] hover:text-[#BFC8D6]'
          }`}
        >
          <Wallet className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Dompet</span>
        </button>

        {/* Central Floating Gold Plus Action */}
        <div className="flex justify-center items-center relative -top-5">
          <button
            onClick={openAddTxModal}
            className="w-12 h-12 rounded-2xl btn-gold text-[#0B1220] flex items-center justify-center shadow-xl shadow-[rgba(212,175,55,0.3)] border-2 border-[#0B1220] active:scale-90 transition-transform"
            title="Catat Transaksi"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'reports' ? 'text-[#F6D365] font-bold' : 'text-[#7C8799] hover:text-[#BFC8D6]'
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Laporan</span>
        </button>

        <button
          onClick={() => setActiveTab('ai_advisor')}
          className={`flex flex-col items-center justify-center p-1.5 rounded-2xl transition-all duration-200 ${
            activeTab === 'ai_advisor' ? 'text-[#F6D365] font-bold' : 'text-[#7C8799] hover:text-[#BFC8D6]'
          }`}
        >
          <Sparkles className="w-5 h-5 mb-0.5 text-[#F6D365]" />
          <span className="text-[10px]">ALN AI</span>
        </button>
      </div>
    </div>
  );
};
