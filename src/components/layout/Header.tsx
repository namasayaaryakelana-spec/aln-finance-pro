import React from 'react';
import {
  Download,
  Bell,
  Sparkles,
  Plus,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface HeaderProps {
  activeTab: string;
  openAddTxModal: () => void;
  openFastAITxModal: () => void;
  openNotificationModal?: () => void;
  pwaPromptEvent: any;
  triggerPwaInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  openAddTxModal,
  openFastAITxModal,
  openNotificationModal,
  pwaPromptEvent,
  triggerPwaInstall
}) => {
  const { currentScope, healthScore, debts, budgets, currentUser, loginWithGoogle, logout } = useFinance();

  const pendingAlerts = debts.filter(d => d.status === 'pending' || d.status === 'overdue').length +
    budgets.filter(b => b.spent >= b.amount * 0.8).length;

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Financial OS Dashboard';
      case 'wallets':
        return 'Multi-Currency Wallets';
      case 'investments':
        return 'Portofolio Investasi & Aset';
      case 'transactions':
        return 'Manajemen Transaksi & Kategori';
      case 'reports':
        return 'Laporan Keuangan & Laba Rugi';
      case 'ai_advisor':
        return 'AI Financial Advisor (Gemini 3.6)';
      case 'planning':
        return 'Perencanaan Keuangan & Budgeting';
      case 'business_tools':
        return 'Business Tools & Invoice Generator';
      case 'settings':
        return 'Pengaturan & ERD Skema';
      default:
        return 'ALN Finance Pro';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[#080E1A]/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      {/* Left: Tab Title & Scope Badge */}
      <div className="flex items-center gap-3">
        {/* Mobile Logo */}
        <div className="lg:hidden w-8 h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1">
          <img src="/logo.svg" alt="ALN Logo" className="w-5 h-5" />
        </div>

        <div>
          <h2 className="text-sm lg:text-base font-extrabold text-white tracking-tight flex items-center gap-2">
            {getTabTitle(activeTab)}
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
              Pribadi
            </span>
          </h2>
          <p className="text-[10px] text-slate-400 hidden sm:block">
            Skor Kesehatan Keuangan: <strong className="text-emerald-400 font-extrabold">{healthScore}/100</strong>
          </p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Catat Transaksi / Fast AI Button */}
        <button
          onClick={openFastAITxModal}
          className="px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          title="Catat Transaksi AI / Fast Input"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span className="hidden md:inline">Catat Transaksi AI</span>
        </button>

        {/* PWA Install Button */}
        {pwaPromptEvent && (
          <button
            onClick={triggerPwaInstall}
            className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* Add Transaction Button */}
        <button
          onClick={openAddTxModal}
          className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md shadow-emerald-950/30 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Catat</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={openNotificationModal}
          className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors relative"
          title="Pusat Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-extrabold flex items-center justify-center animate-pulse">
              {pendingAlerts}
            </span>
          )}
        </button>

        {/* Firebase Auth Button */}
        {currentUser ? (
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-800 rounded-xl px-2.5 py-1">
            {currentUser.photoURL ? (
              <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-emerald-500/50" />
            ) : (
              <UserIcon className="w-4 h-4 text-emerald-400" />
            )}
            <span className="text-xs font-semibold text-slate-200 hidden xl:inline max-w-[100px] truncate">
              {currentUser.displayName || currentUser.email?.split('@')[0]}
            </span>
            <button
              onClick={logout}
              className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
              title="Logout Firebase"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Masuk dengan Google (Firebase)"
          >
            <UserIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Firebase Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
