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
  ChevronLeft,
  ChevronRight,
  ShieldAlert,
  Globe,
  RefreshCw,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openAddTxModal: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
}

interface NavGroup {
  groupLabel: string;
  items: {
    id: string;
    label: string;
    icon: React.ElementType;
    badge?: string | null;
  }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openAddTxModal,
  isCollapsed,
  setIsCollapsed
}) => {
  const { isOffline, currentUser, syncStatus, isCloudSyncing } = useFinance();

  const navGroups: NavGroup[] = [
    {
      groupLabel: 'OVERVIEW',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, badge: null }
      ]
    },
    {
      groupLabel: 'FINANCE',
      items: [
        { id: 'wallets', label: 'Dompet & Akun', icon: Wallet, badge: null },
        { id: 'transactions', label: 'Transaksi', icon: Receipt, badge: null },
        { id: 'reports', label: 'Laporan Keuangan', icon: BarChart3, badge: null }
      ]
    },
    {
      groupLabel: 'PLANNING & ASSETS',
      items: [
        { id: 'investments', label: 'Investasi & Aset', icon: Coins, badge: 'Aset' },
        { id: 'planning', label: 'Perencanaan', icon: Target, badge: null }
      ]
    },
    {
      groupLabel: 'BUSINESS & INSIGHTS',
      items: [
        { id: 'business_tools', label: 'Invoice Generator', icon: FileText, badge: 'Bisnis' },
        { id: 'ai_advisor', label: 'AI Advisor', icon: Sparkles, badge: 'AI' }
      ]
    },
    {
      groupLabel: 'SYSTEM',
      items: [
        { id: 'settings', label: 'Pengaturan & ERD', icon: Settings, badge: null }
      ]
    }
  ];

  return (
    <aside
      className={`hidden lg:flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-[var(--bg-main)] border-r border-[var(--border)] min-h-screen fixed left-0 top-0 bottom-0 z-30 select-none transition-all duration-200 ease-in-out`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-[var(--border)] flex items-center justify-between min-h-[73px]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[var(--surface-secondary)] p-2 border border-[var(--gold-badge-border)] shadow-md flex items-center justify-center shrink-0">
            <img src="/logo.svg" alt="ALN Finance Logo" className="w-5 h-5 filter drop-shadow-[0_2px_4px_rgba(212,175,55,0.4)]" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0 animate-fade-in">
              <h1 className="text-sm font-black text-[var(--text-primary)] tracking-tight flex items-center gap-1 font-['Plus_Jakarta_Sans',sans-serif] leading-tight">
                ALN <span className="text-[var(--gold-primary)]">FINANCE</span>
              </h1>
              <p className="text-[9px] text-[var(--text-muted)] font-semibold tracking-wider uppercase truncate">
                Smart Financial OS
              </p>
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all shrink-0"
          title={isCollapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          aria-label={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation Groups List */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
        {navGroups.map(group => (
          <div key={group.groupLabel} className="space-y-1">
            {!isCollapsed && (
              <h3 className="px-3 text-[9px] font-extrabold tracking-widest uppercase text-[var(--text-muted)] opacity-70 mb-1">
                {group.groupLabel}
              </h3>
            )}
            {group.items.map(item => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  title={isCollapsed ? item.label : undefined}
                  className={`w-full flex items-center ${
                    isCollapsed ? 'justify-center px-0 py-2.5' : 'justify-between px-3.5 py-2.5'
                  } rounded-2xl text-xs font-semibold transition-all duration-150 active:scale-[0.98] ${
                    isActive
                      ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm font-bold'
                      : 'text-[var(--text-secondary)] hover:bg-[var(--surface-secondary)] hover:text-[var(--text-primary)] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[var(--gold-primary)]' : 'text-[var(--text-muted)]'}`} />
                    {!isCollapsed && <span className="truncate">{item.label}</span>}
                  </div>
                  {!isCollapsed && (
                    <div className="flex items-center gap-1.5">
                      {item.badge && (
                        <span
                          className={`text-[9px] px-2 py-0.5 rounded-lg font-extrabold uppercase ${
                            item.badge === 'AI'
                              ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]'
                              : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Sidebar Footer */}
      <div className="p-3 border-t border-[var(--border)] space-y-2">
        {/* Quick Catat Transaksi Button */}
        <button
          onClick={openAddTxModal}
          className={`w-full py-2.5 ${
            isCollapsed ? 'px-0 justify-center' : 'px-3 justify-center'
          } rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-md transition-all active:scale-[0.98]`}
          title="Catat Transaksi Baru"
        >
          <span className="text-base leading-none font-black">+</span>
          {!isCollapsed && <span>Catat Transaksi</span>}
        </button>

        {/* Cloud Sync Status Indicator */}
        <div
          className={`flex items-center ${
            isCollapsed ? 'justify-center p-2' : 'justify-between px-3 py-2'
          } rounded-xl bg-[var(--surface-secondary)] border border-[var(--border)] text-[11px] font-semibold`}
        >
          {isOffline ? (
            <div className="flex items-center gap-1.5 text-red-500 font-bold" title="Mode Offline">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {!isCollapsed && <span>Offline</span>}
            </div>
          ) : isCloudSyncing || syncStatus === 'syncing' ? (
            <div className="flex items-center gap-1.5 text-[var(--gold-primary)] font-bold" title="Syncing Supabase DB">
              <RefreshCw className="w-3 h-3 animate-spin text-[var(--gold-primary)]" />
              {!isCollapsed && <span>Syncing...</span>}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-emerald-500 font-bold" title="Cloud Synced Supabase DB">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {!isCollapsed && <span>Cloud Synced</span>}
            </div>
          )}

          {!isCollapsed && currentUser && (
            <span className="text-[10px] text-[var(--text-muted)] font-mono truncate max-w-[80px]">
              {currentUser.email?.split('@')[0]}
            </span>
          )}
        </div>
      </div>
    </aside>
  );
};
