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
  const budgetAlerts = budgets.filter(b => b.spent >= b.amount * 0.8);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh] animate-scale-up">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                Pusat Notifikasi
                {totalAlertsCount > 0 && !isRead && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold">
                    {totalAlertsCount} Alerta Baru
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400">Update keuangan, pengingat tagihan & rekomendasi</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filter Subtabs */}
        <div className="px-5 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'all'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-950/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Semua
            </button>
            <button
              onClick={() => setFilter('alerts')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 ${
                filter === 'alerts'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-950/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Peringatan ({totalAlertsCount})
            </button>
            <button
              onClick={() => setFilter('activity')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                filter === 'activity'
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Aktivitas
            </button>
          </div>

          <button
            onClick={() => setIsRead(true)}
            className="text-[11px] text-emerald-400 hover:underline font-semibold"
          >
            Tandai Dibaca
          </button>
        </div>

        {/* Content Feed */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1 divide-y divide-slate-800/50">
          {/* AI Score Health Summary Badge */}
          {(filter === 'all' || filter === 'alerts') && (
            <div className="pt-2">
              <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-indigo-950/40 border border-emerald-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Status Kesehatan Keuangan: {healthScore}/100</h4>
                    <p className="text-[11px] text-slate-300">
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
                  className="px-2.5 py-1 text-[11px] font-extrabold rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-500/30 whitespace-nowrap"
                >
                  Tanya AI
                </button>
              </div>
            </div>
          )}

          {/* Pending Bills & Debts Alerts */}
          {(filter === 'all' || filter === 'alerts') && pendingDebts.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-extrabold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                Tagihan & Hutang Jatuh Tempo ({pendingDebts.length})
              </h4>
              <div className="space-y-2">
                {pendingDebts.map(debt => (
                  <div
                    key={debt.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-rose-500/30 flex items-center justify-between hover:border-rose-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-white flex items-center gap-2">
                          {debt.title}
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 font-medium">
                            {debt.type === 'debt_payable' ? 'Hutang' : debt.type === 'receivable' ? 'Piutang' : 'Tagihan'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          Jatuh tempo: <strong className="text-slate-200">{debt.dueDate || 'Segera'}</strong>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-rose-400">
                        Rp {debt.amount.toLocaleString('id-ID')}
                      </div>
                      <button
                        onClick={() => handleNavigate('planning')}
                        className="text-[10px] text-emerald-400 font-bold hover:underline flex items-center justify-end gap-1 mt-0.5"
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
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Peringatan Batas Anggaran ({budgetAlerts.length})
              </h4>
              <div className="space-y-2">
                {budgetAlerts.map(b => {
                  const pct = Math.min(100, Math.round((b.spent / b.amount) * 100));
                  const isOver = b.spent > b.amount;
                  return (
                    <div
                      key={b.id}
                      className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 space-y-1.5"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white flex items-center gap-1.5">
                          <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
                          {b.category}
                        </span>
                        <span className={`font-extrabold ${isOver ? 'text-rose-400' : 'text-amber-400'}`}>
                          {pct}% terpakai
                        </span>
                      </div>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full transition-all ${isOver ? 'bg-rose-500' : 'bg-amber-400'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>Terpakai: Rp {b.spent.toLocaleString('id-ID')}</span>
                        <span>Batas: Rp {b.amount.toLocaleString('id-ID')}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Low Balance Wallets */}
          {(filter === 'all' || filter === 'alerts') && lowWallets.length > 0 && (
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-extrabold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" />
                Saldo Dompet Menipis ({lowWallets.length})
              </h4>
              <div className="space-y-2">
                {lowWallets.map(w => (
                  <div
                    key={w.id}
                    className="p-3 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: w.color }} />
                      <span className="text-xs font-bold text-white">{w.name}</span>
                    </div>
                    <span className="text-xs font-extrabold text-amber-400">
                      Rp {w.balance.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity Log */}
          {(filter === 'all' || filter === 'activity') && (
            <div className="pt-4 space-y-2">
              <h4 className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-emerald-400" />
                Aktivitas Transaksi Terakhir
              </h4>
              {recentTxs.length > 0 ? (
                <div className="space-y-2">
                  {recentTxs.map(t => (
                    <div
                      key={t.id}
                      className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-200">{t.title}</div>
                        <div className="text-[10px] text-slate-400">
                          {t.category} • {t.date}
                        </div>
                      </div>
                      <div className={`font-extrabold ${t.type === 'income' ? 'text-emerald-400' : 'text-slate-300'}`}>
                        {t.type === 'income' ? '+' : '-'} Rp {t.amount.toLocaleString('id-ID')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3">Belum ada transaksi tercatat hari ini.</p>
              )}
            </div>
          )}

          {/* All Clear state */}
          {totalAlertsCount === 0 && filter === 'alerts' && (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
              <h4 className="text-sm font-bold text-white">Tidak Ada Peringatan Urgent</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Semua tagihan lunas dan anggaran belanja Anda dalam kondisi aman!
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center text-xs">
          <span className="text-slate-500 text-[11px]">ALN Financial OS Real-time Notifier</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
