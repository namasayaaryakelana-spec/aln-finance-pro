import React, { useState } from 'react';
import {
  X,
  Bell,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Wallet,
  TrendingDown,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Info
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  setActiveTab?: (tab: string) => void;
}

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
  setActiveTab
}) => {
  const {
    debts,
    budgets,
    wallets,
    filteredTransactions,
    healthScore
  } = useFinance();

  const [filter, setFilter] = useState<'all' | 'alerts' | 'activity'>('all');
  const [isRead, setIsRead] = useState(false);

  if (!isOpen) return null;

  // 1. Pending/Overdue Debts & Bills
  const pendingDebts = debts.filter(d => d.status === 'pending' || d.status === 'overdue');

  // 2. Over budget / warning budgets
  const budgetAlerts = budgets.filter(b => b.spent >= b.monthlyLimit * 0.8);

  // 3. Low balance wallets
  const lowWallets = wallets.filter(w => w.balance < 50000);

  // 4. Recent 5 transactions
  const recentTxs = filteredTransactions.slice(0, 5);

  const totalAlertsCount = pendingDebts.length + budgetAlerts.length + lowWallets.length;

  const handleNavigate = (tab: string) => {
    if (setActiveTab) {
      setActiveTab(tab);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] text-[var(--text-primary)] transition-colors">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-bg)]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] text-[var(--gold-primary)]">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                Pusat Notifikasi
                {totalAlertsCount > 0 && !isRead && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500/15 text-red-500 border border-red-500/30 font-extrabold font-mono">
                    {totalAlertsCount} Alerta Baru
                  </span>
                )}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">Update keuangan, pengingat tagihan & rekomendasi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Subtabs */}
        <div className="px-5 py-3 border-b border-[var(--border)] bg-[var(--input-bg)] flex items-center justify-between text-xs font-semibold">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'all'
                  ? 'btn-gold text-[#0B1220] shadow-md font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('alerts')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 ${
                filter === 'alerts'
                  ? 'bg-red-500/15 text-red-500 border border-red-500/30 font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Peringatan ({totalAlertsCount})
            </button>
            <button
              onClick={() => setFilter('activity')}
              className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
                filter === 'activity'
                  ? 'bg-[var(--card-bg)] text-[var(--text-primary)] border border-[var(--border)]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              Aktivitas
            </button>
          </div>

          <button
            onClick={() => setIsRead(true)}
            className="text-[11px] text-[var(--gold-primary)] hover:underline font-semibold"
          >
            Tandai Dibaca
          </button>
        </div>

        {/* Content Feed */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-[var(--border)] custom-scrollbar">
          {/* AI Score Health Summary Badge */}
          {(filter === 'all' || filter === 'alerts') && (
            <div className="pt-1">
              <div className="p-4 rounded-2xl bg-[var(--input-bg)] border border-[var(--gold-badge-border)] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[var(--gold-badge-bg)] text-[var(--gold-primary)]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Status Kesehatan Keuangan: {healthScore}/100</h4>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {healthScore >= 80
                        ? 'Keuangan sangat baik! Jaga arus kas dan konsistensi investasi.'
                        : healthScore >= 60
                        ? 'Cukup stabil. Perhatikan batas budget & lunasi tagihan tepat waktu.'
                        : 'Memerlukan evaluasi budget & pengurangan pengeluaran tidak mendesak.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleNavigate('ai_advisor')}
                  className="px-3 py-1.5 text-[11px] font-extrabold rounded-xl btn-gold text-[#0B1220] shadow-sm whitespace-nowrap shrink-0 active:scale-95"
                >
                  Tanya AI
                </button>
              </div>
            </div>
          )}

          {/* Pending Bills & Debts Alerts */}
          {(filter === 'all' || filter === 'alerts') && pendingDebts.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-red-500 uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tagihan & Hutang Jatuh Tempo ({pendingDebts.length})
              </h4>
              <div className="space-y-2">
                {pendingDebts.map(debt => (
                  <div
                    key={debt.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-red-500/30 flex items-center justify-between hover:border-red-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-red-500/15 text-red-500">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                          {debt.title}
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-red-500/15 text-red-500 font-extrabold uppercase">
                            {debt.type === 'debt_payable' ? 'Hutang' : debt.type === 'receivable' ? 'Piutang' : 'Tagihan'}
                          </span>
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          Jatuh tempo: <strong className="text-[var(--text-primary)] font-mono">{debt.dueDate || 'Segera'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-red-500 font-mono">
                        Rp {debt.amount.toLocaleString('id-ID')}
                      </div>
                      <button
                        onClick={() => handleNavigate('planning')}
                        className="text-[10px] text-[var(--gold-primary)] font-extrabold hover:underline flex items-center justify-end gap-1 mt-0.5"
                      >
                        Bayar <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Budget Limit Warnings */}
          {(filter === 'all' || filter === 'alerts') && budgetAlerts.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-[var(--gold-primary)] uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <ShieldAlert className="w-3.5 h-3.5" />
                Peringatan Batas Anggaran ({budgetAlerts.length})
              </h4>
              <div className="space-y-2">
                {budgetAlerts.map(b => {
                  const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
                  const isOver = b.spent > b.monthlyLimit;
                  return (
                    <div
                      key={b.id}
                      className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--gold-badge-border)] space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                          {b.categoryName}
                        </span>
                        <span className={`font-extrabold font-mono ${isOver ? 'text-red-500' : 'text-[var(--gold-primary)]'}`}>
                          {pct}% terpakai
                        </span>
                      </div>
                      <div className="w-full bg-[var(--card-bg)] rounded-full h-1.5 overflow-hidden border border-[var(--border)]">
                        <div
                          className={`h-full transition-all ${isOver ? 'bg-red-500' : 'bg-[var(--gold-primary)]'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-[var(--text-secondary)] font-mono">
                        <span>Terpakai: Rp {b.spent.toLocaleString('id-ID')}</span>
                        <span>Batas: Rp {b.monthlyLimit.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Low Balance Wallets */}
          {(filter === 'all' || filter === 'alerts') && lowWallets.length > 0 && (
            <div className="pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-blue-500 uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <Wallet className="w-3.5 h-3.5" />
                Saldo Dompet Menipis ({lowWallets.length})
              </h4>
              <div className="space-y-2">
                {lowWallets.map(w => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                      <span className="text-xs font-bold text-[var(--text-primary)]">{w.name}</span>
                    </div>
                    <span className="text-xs font-black text-[var(--gold-primary)] font-mono">
                      Rp {w.balance.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Log */}
          {(filter === 'all' || filter === 'activity') && (
            <div className="pt-4 space-y-2.5">
              <h4 className="text-xs font-extrabold text-[var(--text-secondary)] uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <Info className="w-3.5 h-3.5 text-emerald-500" />
                Aktivitas Transaksi Terakhir
              </h4>
              {recentTxs.length > 0 ? (
                <div className="space-y-2">
                  {recentTxs.map(t => (
                    <div
                      key={t.id}
                      className="p-3.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-[var(--text-primary)]">{t.title}</div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          {t.category} • {t.date}
                        </div>
                      </div>
                      <div className={`font-black font-mono ${t.type === 'income' ? 'text-emerald-500' : 'text-[var(--text-primary)]'}`}>
                        {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-[var(--text-muted)] italic p-3">Belum ada transaksi tercatat hari ini.</p>
              )}
            </div>
          )}

          {/* All Clear state */}
          {totalAlertsCount === 0 && filter === 'alerts' && (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Tidak Ada Peringatan Urgent</h4>
              <p className="text-xs text-[var(--text-secondary)] max-w-xs mx-auto">
                Semua tagihan lunas dan anggaran belanja Anda dalam kondisi aman!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4.5 border-t border-[var(--border)] bg-[var(--input-bg)] flex justify-between items-center text-xs">
          <span className="text-[var(--text-muted)] text-[11px]">ALN Financial OS Real-time Notifier</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
