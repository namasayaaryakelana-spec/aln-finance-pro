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
  Globe,
  Settings,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { ThemeToggle } from './ThemeToggle';

interface HeaderProps {
  activeTab: string;
  setActiveTab?: (tab: string) => void;
  openAddTxModal: () => void;
  openFastAITxModal: () => void;
  openNotificationModal?: () => void;
  pwaPromptEvent: any;
  triggerPwaInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
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

  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const pendingAlerts =
    debts.filter(d => d.status === 'pending' || d.status === 'overdue').length +
    budgets.filter(b => b.spent >= b.monthlyLimit * 0.8).length;

  const getTabTitle = (tab: string) => {
    switch (tab) {
      case 'dashboard':
        return 'Financial OS Dashboard';
      case 'wallets':
        return 'Multi-Currency Wallets';
      case 'investments':
        return 'Portofolio Investasi & Aset';
      case 'transactions':
        return 'Manajemen Transaksi';
      case 'reports':
        return 'Laporan Keuangan & P&L';
      case 'ai_advisor':
        return 'AI Financial Advisor';
      case 'planning':
        return 'Perencanaan & Budgeting';
      case 'business_tools':
        return 'Business Tools & Invoicing';
      case 'settings':
        return 'Pengaturan Kernel & ERD';
      default:
        return 'ALN Finance Pro';
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-[var(--bg-main)]/95 backdrop-blur-xl border-b border-[var(--border)] px-4 lg:px-8 py-3.5 flex items-center justify-between transition-colors duration-250 min-h-[73px]">
      {/* Left: Breadcrumb & Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile Brand Emblem */}
        <div className="lg:hidden w-9 h-9 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--gold-badge-border)] flex items-center justify-center p-1.5 shrink-0 shadow-md">
          <img src="/logo.svg" alt="ALN Logo" className="w-7 h-7 object-contain" />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1.5 text-[10px] text-[var(--text-muted)] font-semibold uppercase tracking-wider">
            <span>ALN OS</span>
            <span>/</span>
            <span className="text-[var(--gold-primary)] font-bold">{activeTab}</span>
          </div>
          <h2 className="text-sm sm:text-base lg:text-lg font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2 truncate font-['Plus_Jakarta_Sans',sans-serif]">
            <span className="truncate">{getTabTitle(activeTab)}</span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shrink-0">
              <ShieldCheck className="w-3 h-3 text-[var(--gold-primary)]" /> Private
            </span>
          </h2>
        </div>
      </div>

      {/* Right Action Controls */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {/* Fast AI Transaction Button */}
        <button
          onClick={openFastAITxModal}
          className="px-3.5 py-2 rounded-2xl bg-[var(--gold-badge-bg)] hover:bg-[var(--gold-badge-border)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] text-xs font-bold flex items-center gap-2 transition-all shadow-sm active:scale-95"
          title="Catat Transaksi AI / Fast Input"
        >
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
          <span className="hidden md:inline">Catat AI</span>
        </button>

        {/* PWA Install Button */}
        {pwaPromptEvent && (
          <button
            onClick={triggerPwaInstall}
            className="px-3 py-2 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] border border-[var(--border)] text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95"
            title="Install PWA App"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            <span className="hidden lg:inline">Install PWA</span>
          </button>
        )}

        {/* Quick Add Transaction */}
        <button
          onClick={openAddTxModal}
          className="px-3.5 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          title="Catat Transaksi Manual"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span className="hidden sm:inline">Catat</span>
        </button>

        {/* Theme Switcher Toggle */}
        <ThemeToggle variant="compact" />

        {/* Notification Bell Button */}
        <button
          onClick={openNotificationModal}
          className="p-2.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors relative"
          title="Pusat Notifikasi"
          aria-label="Pusat Notifikasi"
        >
          <Bell className="w-4 h-4" />
          {pendingAlerts > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#EF4444] text-white text-[9px] font-extrabold flex items-center justify-center shadow-md">
              {pendingAlerts}
            </span>
          )}
        </button>

        {/* Profile & Sync Menu */}
        {currentUser ? (
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 bg-[var(--card-bg)] hover:bg-[var(--surface-secondary)] border border-[var(--gold-badge-border)] rounded-2xl px-2.5 py-1.5 transition-all active:scale-95 shadow-sm"
              title="Menu Profil & Supabase Sync"
            >
              <div className="w-6 h-6 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] flex items-center justify-center font-extrabold text-xs">
                {currentUser.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col text-left hidden xl:block">
                <span className="text-xs font-bold text-[var(--text-primary)] max-w-[90px] truncate block leading-tight">
                  {currentUser.email?.split('@')[0]}
                </span>
                <span className="text-[9px] font-bold text-[var(--gold-primary)] flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${syncStatus === 'syncing' ? 'bg-[var(--gold-primary)] animate-spin' : 'bg-emerald-500 animate-pulse'} inline-block`} />
                  {syncStatus === 'syncing' ? 'Syncing...' : 'Synced'}
                </span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--text-muted)] hidden sm:block" />
            </button>

            {/* Profile & Sync Dropdown Popup */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl shadow-2xl p-3 z-50 animate-fade-in transition-colors">
                <div className="px-3 py-2.5 border-b border-[var(--border)] mb-1.5">
                  <p className="text-xs font-extrabold text-[var(--text-primary)] truncate">{currentUser.email}</p>
                  <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 mt-0.5">
                    <Globe className="w-3 h-3 text-emerald-500" /> Supabase Realtime Connected
                  </p>
                </div>

                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await pullCloudData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--gold-badge-bg)] hover:text-[var(--gold-primary)] flex items-center gap-2.5 transition-colors mb-1"
                >
                  <CloudDownload className="w-4 h-4 text-[var(--gold-primary)]" />
                  <span>Tarik Data Cloud DB</span>
                </button>

                <button
                  onClick={async () => {
                    setShowProfileMenu(false);
                    await pushCloudData();
                  }}
                  className="w-full text-left px-3 py-2 rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--gold-badge-bg)] hover:text-[var(--gold-primary)] flex items-center gap-2.5 transition-colors mb-1"
                >
                  <CloudUpload className="w-4 h-4 text-[var(--gold-primary)]" />
                  <span>Unggah Data Cloud DB</span>
                </button>

                {setActiveTab && (
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setActiveTab('settings');
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl text-xs font-bold text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] flex items-center gap-2.5 transition-colors mb-1"
                  >
                    <Settings className="w-4 h-4 text-[var(--text-muted)]" />
                    <span>Pengaturan OS</span>
                  </button>
                )}

                <div className="border-t border-[var(--border)] pt-1.5 mt-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-3 py-2 rounded-2xl text-xs font-bold text-red-500 hover:bg-red-500/10 flex items-center gap-2.5 transition-colors"
                  >
                    <LogOut className="w-4 h-4 text-red-500" />
                    <span>Keluar Akun (Logout)</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <button
            onClick={openAuthModal}
            className="px-3.5 py-2 rounded-2xl bg-[var(--gold-badge-bg)] hover:bg-[var(--gold-badge-border)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] text-xs font-extrabold flex items-center gap-1.5 transition-all active:scale-95 shadow-sm"
            title="Masuk Akun / Sync Supabase"
          >
            <UserIcon className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
};
