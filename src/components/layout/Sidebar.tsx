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
  Briefcase,
  User,
  Layers,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Scope } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAddTxModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, openAddTxModal }) => {
  const { currentScope, setScope, isOffline } = useFinance();

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
    <aside className="hidden lg:flex flex-col w-64 bg-[#0A0F1D] border-r border-slate-800/80 min-h-screen fixed left-0 top-0 bottom-0 z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 p-2 border border-slate-700/60 shadow-lg flex items-center justify-center">
            <img src="/logo.svg" alt="ALN Finance Logo" className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-tight flex items-center gap-1">
              ALN <span className="text-emerald-400">Finance</span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">Smart Financial OS</p>
          </div>
        </div>
      </div>

      {/* Mode Indicator */}
      <div className="p-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2 bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-500/30 text-xs font-semibold text-emerald-300">
          <User className="w-4 h-4 text-emerald-400" />
          <div>
            <p className="text-[11px] font-bold text-white leading-none">Keuangan Pribadi</p>
            <p className="text-[10px] text-emerald-400/80 font-normal mt-0.5">Personal Finance OS</p>
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-md shadow-emerald-950/20'
                  : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && (
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded-md font-bold uppercase ${
                      item.badge === 'AI'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : item.badge === 'PRO'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                <ChevronRight className={`w-3.5 h-3.5 transition-transform ${isActive ? 'rotate-90 text-emerald-400' : 'opacity-0'}`} />
              </div>
            </button>
          );
        })}
      </nav>

      {/* Quick Add Button */}
      <div className="p-4 border-t border-slate-800/80">
        <button
          onClick={openAddTxModal}
          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="text-base leading-none">+</span>
          <span>Catat Transaksi</span>
        </button>

        {isOffline && (
          <div className="mt-3 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2 text-[10px] text-amber-300">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>Mode Offline Aktif</span>
          </div>
        )}
      </div>
    </aside>
  );
};
