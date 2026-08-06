import React, { useState } from 'react';
import {
  Download,
  Bell,
  Sparkles,
  Plus,
  LogOut,
  User as UserIcon,
  RefreshCw,
  CloudDownload,
  CloudUpload
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
  const { currentScope, healthScore, debts, budgets, currentUser, loginWithGoogle, logout, pushCloudData, pullCloudData, isCloudSyncing } = useFinance();
  const [showSyncMenu, setShowSyncMenu] = useState(false);

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
    <header className="sticky top-0 z-20 bg-[#080E1A]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 lg:px-8 pt-8 pb-3 lg:py-3.5 flex items-center justify-between transition-all">
      {/* Left: Tab Title & Scope Badge */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Logo */}
        <div className="lg:hidden w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center p-1 flex-shrink-0">
          <img src="/logo.svg" alt="ALN Logo" className="w-4 h-4 sm:w-5 sm:h-5" />
        </div>

        <div className="min-w-0">
          <h2 className="text-xs sm:text-sm lg:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5 truncate">
            <span className="truncate">{getTabTitle(activeTab)}</span>
            <span className="hidden sm:inline-block text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700 flex-shrink-0">
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

        {/* Firebase Auth & Sync Status Button */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 rounded-xl px-2.5 py-1 transition-all active:scale-95 shadow-sm"
              title="Menu Sinkronisasi Cloud"
            >
              {currentUser.photoURL ? (
                <img src={currentUser.photoURL} alt="Avatar" className="w-5 h-5 rounded-full border border-emerald-500/50" />
              ) : (
                <UserIcon className="w-4 h-4 text-emerald-400" />
              )}
              <div className="flex flex-col text-left hidden xl:block">
                <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate block leading-tight">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-bold text-emerald-400 flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${isCloudSyncing ? 'bg-amber-400 animate-spin' : 'bg-emerald-400 animate-ping'} inline-block`} />
                  {isCloudSyncing ? 'Syncing...' : 'Cloud Synced'}
                </span>
              </div>
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isCloudSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sync Dropdown Popup */}
            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-xs font-bold text-white truncate">{currentUser.displayName || 'Akun Cloud'}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser.email}</p>
                </div>

                <button
                  onClick={async () => {
                    setShowSyncMenu(false);
                    await pullCloudData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-emerald-500/10 hover:text-emerald-300 flex items-center gap-2 transition-colors mb-1"
                >
                  <CloudDownload className="w-4 h-4 text-emerald-400" />
                  <span>Tarik Data dari Cloud</span>
                </button>

                <button
                  onClick={async () => {
                    setShowSyncMenu(false);
                    await pushCloudData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-slate-200 hover:bg-purple-500/10 hover:text-purple-300 flex items-center gap-2 transition-colors mb-1"
                >
                  <CloudUpload className="w-4 h-4 text-purple-400" />
                  <span>Unggah Data ke Cloud</span>
                </button>

                <div className="border-t border-slate-800 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setShowSyncMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-rose-400" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={loginWithGoogle}
            className="px-2.5 py-1.5 rounded-xl bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Masuk dengan Google (Firebase Auto Sync)"
          >
            <UserIcon className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Firebase Sync</span>
          </button>
        )}
      </div>
    </header>
  );
};
