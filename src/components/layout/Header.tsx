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
  CloudUpload,
  Globe
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
  const {
    healthScore,
    debts,
    budgets,
    currentUser,
    openAuthModal,
    logout,
    pushCloudData,
    pullCloudData,
    isCloudSyncing,
    syncStatus
  } = useFinance();

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
    <header className="sticky top-0 z-20 bg-[#0B1220]/95 backdrop-blur-xl border-b border-[rgba(255,255,255,0.08)] px-4 lg:px-8 pt-8 pb-3.5 lg:py-4 flex items-center justify-between transition-all">
      {/* Left: Tab Title & Scope Badge */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Logo */}
        <div className="lg:hidden w-8 h-8 rounded-2xl bg-[#121A2A] border border-[rgba(212,175,55,0.3)] flex items-center justify-center p-1.5 flex-shrink-0 shadow-md">
          <img src="/logo.svg" alt="ALN Logo" className="w-5 h-5 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.4)]" />
        </div>

        <div className="min-w-0">
          <h2 className="text-sm sm:text-base lg:text-lg font-extrabold text-white tracking-tight flex items-center gap-2 truncate font-['Plus_Jakarta_Sans',sans-serif]">
            <span className="truncate">{getTabTitle(activeTab)}</span>
            <span className="hidden sm:inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[rgba(212,175,55,0.12)] text-[#F6D365] border border-[rgba(212,175,55,0.25)] flex-shrink-0">
              Pribadi
            </span>
          </h2>
          <p className="text-[11px] text-[#BFC8D6] hidden sm:block font-medium">
            Skor Kesehatan Keuangan: <strong className="text-[#F6D365] font-extrabold">{healthScore}/100</strong>
          </p>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 lg:gap-3">
        {/* Catat Transaksi / Fast AI Button */}
        <button
          onClick={openFastAITxModal}
          className="px-3.5 py-2 rounded-2xl bg-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.16)] text-[#F6D365] border border-[rgba(212,175,55,0.25)] text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          title="Catat Transaksi AI / Fast Input"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#F6D365]" />
          <span className="hidden md:inline">Catat Transaksi AI</span>
        </button>

        {/* PWA Install Button */}
        {pwaPromptEvent && (
          <button
            onClick={triggerPwaInstall}
            className="px-3.5 py-2 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#BFC8D6] border border-[rgba(255,255,255,0.1)] text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5 text-[#BFC8D6]" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* Add Transaction Button */}
        <button
          onClick={openAddTxModal}
          className="px-3.5 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Catat</span>
        </button>

        {/* Notification Bell */}
        <button
          onClick={openNotificationModal}
          className="p-2.5 rounded-2xl bg-[#121A2A] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.08)] text-[#BFC8D6] hover:text-white transition-colors relative"
          title="Pusat Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center shadow-md">
              {pendingAlerts}
            </span>
          )}
        </button>

        {/* Supabase Auth & Sync Status Button */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowSyncMenu(!showSyncMenu)}
              className="flex items-center gap-2 bg-[#121A2A] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(212,175,55,0.3)] rounded-2xl px-3 py-1.5 transition-all active:scale-95 shadow-sm"
              title="Menu Supabase PostgreSQL Realtime Sync"
            >
              <div className="w-5 h-5 rounded-full bg-[rgba(212,175,55,0.2)] text-[#F6D365] flex items-center justify-center font-bold text-[10px]">
                {currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left hidden xl:block">
                <span className="text-xs font-semibold text-white max-w-[100px] truncate block leading-tight">
                  {currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-bold text-[#F6D365] flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-[#F6D365] animate-spin' : 'bg-[#22C55E] animate-pulse'} inline-block`} />
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Supabase Realtime'}
                </span>
              </div>
              <RefreshCw className={`w-3.5 h-3.5 text-[#F6D365] ${isCloudSyncing ? 'animate-spin' : ''}`} />
            </button>

            {/* Sync Dropdown Popup */}
            {showSyncMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl shadow-2xl p-3 z-50 animate-fade-in">
                <div className="px-3 py-2 border-b border-[rgba(255,255,255,0.08)] mb-1.5">
                  <p className="text-xs font-extrabold text-white truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-[#22C55E] font-extrabold flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3 text-[#22C55E]" /> Supabase PostgreSQL Connected
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setShowSyncMenu(false);
                    await pullCloudData();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-2xl text-xs font-semibold text-[#BFC8D6] hover:bg-[rgba(212,175,55,0.1)] hover:text-[#F6D365] flex items-center gap-2.5 transition-colors mb-1"
                >
                  <CloudDownload className="w-4 h-4 text-[#F6D365]" />
                  <span>Tarik Data dari Supabase DB</span>
                </button>

                <button
                  onClick={async () => {
                    setShowSyncMenu(false);
                    await pushCloudData();
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-2xl text-xs font-semibold text-[#BFC8D6] hover:bg-[rgba(212,175,55,0.1)] hover:text-[#F6D365] flex items-center gap-2.5 transition-colors mb-1"
                >
                  <CloudUpload className="w-4 h-4 text-[#F6D365]" />
                  <span>Unggah Data ke Supabase DB</span>
                </button>

                <div className="border-t border-[rgba(255,255,255,0.08)] pt-1.5 mt-1">
                  <button
                    onClick={() => {
                      setShowSyncMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2.5 rounded-2xl text-xs font-semibold text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-[#EF4444]" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-3.5 py-2 rounded-2xl bg-[rgba(212,175,55,0.15)] hover:bg-[rgba(212,175,55,0.25)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Masuk Akun / Sync Multi-Device Supabase"
          >
            <UserIcon className="w-3.5 h-3.5 text-[#F6D365]" />
            <span>Login Supabase</span>
          </button>
        )}
      </div>
    </header>
  );
};
