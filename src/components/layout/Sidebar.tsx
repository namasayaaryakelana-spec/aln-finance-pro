import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Coins,
  Receipt,
  BarChart3,
  Sparkles,
  Target,
  FileText,
  Settings,
  User,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAddTxModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openAddTxModal }) => {
  const { isOffline } = useFinance();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null },
    { id: 'wallets', label: 'Dompet & Akun', icon: Wallet, badge: null },
    { id: 'investments', label: 'Investasi & Aset', icon: Coins, badge: 'Aset' },
    { id: 'transactions', label: 'Transaksi', icon: Receipt, badge: null },
    { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3, badge: null },
    { id: 'ai_advisor', label: 'AI Financial Advisor', icon: Sparkles, badge: 'AI' },
    { id: 'planning', label: 'Perencanaan', icon: Target, badge: null },
    { id: 'business_tools', label: 'Invoice Generator', icon: FileText, badge: 'Bisnis' },
    { id: 'settings', label: 'Pengaturan & ERD', icon: Settings, badge: null },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-[#0B1220] border-r border-[rgba(255,255,255,0.08)] min-h-screen fixed left-0 top-0 bottom-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#121A2A] p-2 border border-[rgba(212,175,55,0.3)] shadow-lg shadow-[rgba(0,0,0,0.5)] flex items-center justify-center">
            <img src="/logo.svg" alt="ALN Finance Logo" className="w-5 h-5 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.4)]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1 font-['Plus_Jakarta_Sans',sans-serif]">
              ALN <span className="text-[#F6D365]">Finance</span>
            </h1>
            <p className="text-[10px] text-[#7C8799] font-medium tracking-wider uppercase">Private Wealth OS</p>
          </div>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="p-4 border-b border-[rgba(255,255,255,0.08)]">
        <div className="flex items-center gap-2.5 bg-[#121A2A] p-3 rounded-2xl border border-[rgba(212,175,55,0.2)] text-xs font-semibold">
          <div className="w-7 h-7 rounded-xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center">
            <User className="w-3.5 h-3.5 text-[#F6D365]" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Keuangan Pribadi</p>
            <p className="text-[10px] text-[#BFC8D6] font-medium mt-0.5">Private Wealth Management</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1.5 overflow-y-auto custom-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-semibold transition-all duration-200 ${
                isActive
                  ? 'bg-[rgba(212,175,55,0.12)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-md shadow-[rgba(0,0,0,0.3)] font-bold'
                  : 'text-[#BFC8D6] hover:bg-[rgba(255,255,255,0.04)] hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#F6D365]' : 'text-[#7C8799]'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] px-2 py-0.5 rounded-lg font-bold uppercase ${
                      item.badge === 'AI'
                        ? 'bg-[rgba(212,175,55,0.18)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]'
                        : 'bg-[rgba(255,255,255,0.06)] text-[#BFC8D6] border border-[rgba(255,255,255,0.1)]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-[#F6D365]' : 'opacity-0'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Add Button */}
      <div className="p-4 border-t border-[rgba(255,255,255,0.08)]">
        <button
          onClick={openAddTxModal}
          className="w-full py-3 px-4 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="text-base leading-none font-black">+</span>
          <span>Catat Transaksi</span>
        </button>

        {isOffline && (
          <div className="mt-3 p-2.5 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] flex items-center gap-2 text-[10px] text-[#EF4444] font-medium">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Mode Offline Aktif</span>
          </div>
        )}
      </div>
    </aside>
  );
};
