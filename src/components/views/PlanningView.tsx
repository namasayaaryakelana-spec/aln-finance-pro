import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Budget,
  FinancialGoal,
  BillAndDebt,
  Investment
} from '../../types';
import {
  Target,
  PieChart as PieIcon,
  Calendar,
  Plus,
  AlertTriangle,
  TrendingUp,
  Pencil,
  Trash2,
  X,
  Check,
  Wallet as WalletIcon
} from 'lucide-react';

interface PlanningViewProps {
  openAddBudgetModal: () => void;
  openAddGoalModal: () => void;
  openAddDebtModal: () => void;
}

export const PlanningView: React.FC<PlanningViewProps> = ({
  openAddBudgetModal,
  openAddGoalModal,
  openAddDebtModal
}) => {
  const {
    filteredBudgets,
    filteredWallets,
    goals,
    debts,
    investments,
    topupGoal,
    markDebtStatus,
    updateBudget,
    deleteBudget,
    updateGoal,
    deleteGoal,
    updateDebt,
    deleteDebt,
    addInvestment,
    addToast
  } = useFinance();

  const [activeSubtab, setActiveSubtab] = useState<'budgets' | 'goals' | 'debts' | 'investments'>('budgets');
  const [topupAmount, setTopupAmount] = useState<string>('');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [selectedTopupWalletId, setSelectedTopupWalletId] = useState<string>('');

  // Edit states
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null);
  const [editingGoal, setEditingGoal] = useState<FinancialGoal | null>(null);
  const [editingDebt, setEditingDebt] = useState<BillAndDebt | null>(null);
  const [isAddInvestmentOpen, setIsAddInvestmentOpen] = useState(false);

  // New investment form state
  const [newInv, setNewInv] = useState({
    name: '',
    category: 'saham' as Investment['category'],
    initialAmount: 0,
    currentAmount: 0,
    returnPercentage: 0,
    platform: ''
  });

  const handleTopup = (goalId: string) => {
    const num = parseFloat(topupAmount);
    if (isNaN(num) || num <= 0) {
      addToast('warning', 'Nominal Tidak Valid', 'Masukkan angka positif.');
      return;
    }
    const walletToUse = selectedTopupWalletId || filteredWallets[0]?.id;
    if (!walletToUse) {
      addToast('warning', 'Pilih Dompet', 'Pilih akun/dompet yang digunakan untuk topup.');
      return;
    }
    topupGoal(goalId, num, walletToUse);
    setSelectedGoalId(null);
    setTopupAmount('');
  };

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.name || !newInv.platform || newInv.currentAmount <= 0) {
      addToast('warning', 'Data Belum Lengkap', 'Lengkapi nama, platform, dan nilai aset.');
      return;
    }
    addInvestment({
      name: newInv.name,
      category: newInv.category,
      initialAmount: newInv.initialAmount || newInv.currentAmount,
      currentAmount: newInv.currentAmount,
      returnPercentage: newInv.returnPercentage || 0,
      platform: newInv.platform
    });
    setIsAddInvestmentOpen(false);
    setNewInv({
      name: '',
      category: 'saham',
      initialAmount: 0,
      currentAmount: 0,
      returnPercentage: 0,
      platform: ''
    });
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header Banner */}
      <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] font-bold">
            <Target className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Perencanaan & Target Keuangan</h3>
            <p className="text-xs text-[var(--text-secondary)]">Budgeting, Financial Goals, Tagihan & Portofolio Investasi (Financial Planning)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSubtab === 'budgets' && (
            <button
              onClick={openAddBudgetModal}
              className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Anggaran
            </button>
          )}

          {activeSubtab === 'goals' && (
            <button
              onClick={openAddGoalModal}
              className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Target Goal
            </button>
          )}

          {activeSubtab === 'debts' && (
            <button
              onClick={openAddDebtModal}
              className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Catatan Tagihan
            </button>
          )}

          {activeSubtab === 'investments' && (
            <button
              onClick={() => setIsAddInvestmentOpen(true)}
              className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Investasi
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[var(--input-bg)] p-2 rounded-3xl border border-[var(--border)]">
        {[
          { id: 'budgets', label: 'Budgeting Anggaran', icon: PieIcon },
          { id: 'goals', label: 'Financial Goals', icon: Target },
          { id: 'debts', label: 'Tagihan & Hutang', icon: Calendar },
          { id: 'investments', label: 'Portofolio Investasi', icon: TrendingUp }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubtab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubtab(tab.id as any)}
              className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-md font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: BUDGETING */}
      {activeSubtab === 'budgets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredBudgets.map(b => {
            const pct = Math.min(100, Math.round((b.spent / b.monthlyLimit) * 100));
            const isOverbudget = b.spent > b.monthlyLimit;
            return (
              <div
                key={b.id}
                className={`bg-[var(--card-bg)] p-6 rounded-3xl border shadow-2xl flex flex-col justify-between transition-colors ${
                  isOverbudget ? 'border-red-500/40 bg-red-500/5' : 'border-[var(--card-border)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[var(--gold-primary)]" />
                      <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">{b.categoryName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--gold-primary)] px-2.5 py-0.5 rounded-full bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)]">
                        {b.scope}
                      </span>
                      <button
                        onClick={() => setEditingBudget(b)}
                        title="Edit Anggaran"
                        className="p-1.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors border border-[var(--border)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="text-[var(--text-secondary)]">
                      Terpakai: <strong className="text-[var(--text-primary)] font-mono">Rp {b.spent.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      Batas: <strong className="text-[var(--gold-primary)] font-mono">Rp {b.monthlyLimit.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[var(--input-bg)] h-3 rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverbudget ? 'bg-red-500' : pct > 80 ? 'bg-[var(--gold-primary)]' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[var(--text-secondary)] font-mono">{pct}% Teralokasi</span>

                  {isOverbudget ? (
                    <span className="text-red-500 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Melebihi Anggaran!
                    </span>
                  ) : (
                    <span className="text-emerald-500 font-bold text-[11px] font-mono">Sisa: Rp {(b.monthlyLimit - b.spent).toLocaleString('id-ID')}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 2: FINANCIAL GOALS */}
      {activeSubtab === 'goals' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {goals.map(g => {
            const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
            return (
              <div
                key={g.id}
                className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col justify-between transition-colors"
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <span
                      className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full text-[#0B1220]"
                      style={{ backgroundColor: g.color || '#D4AF37' }}
                    >
                      {g.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-[var(--text-secondary)] font-mono">Tenggat: {g.deadline}</span>
                      <button
                        onClick={() => setEditingGoal(g)}
                        title="Edit Target"
                        className="p-1.5 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-colors border border-[var(--border)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] mb-3 font-['Plus_Jakarta_Sans',sans-serif]">{g.title}</h4>

                  <div className="text-xs space-y-1.5 mb-3 font-mono">
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Terkumpul:</span>
                      <strong className="text-emerald-500 font-black">Rp {g.currentAmount.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="flex justify-between text-[var(--text-secondary)]">
                      <span>Target:</span>
                      <strong className="text-[var(--text-primary)] font-black">Rp {g.targetAmount.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[var(--input-bg)] h-3 rounded-full overflow-hidden p-0.5 border border-[var(--border)]">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-[var(--text-secondary)] font-bold block mt-1 text-right font-mono">{pct}% Terpenuhi</span>
                </div>

                {selectedGoalId === g.id ? (
                  <div className="mt-4 pt-3.5 border-t border-[var(--border)] space-y-3 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] block mb-1">
                        Sumber Akun / Dompet:
                      </label>
                      <select
                        value={selectedTopupWalletId || (filteredWallets[0]?.id || '')}
                        onChange={e => setSelectedTopupWalletId(e.target.value)}
                        className="w-full bg-[var(--card-bg)] text-xs p-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-bold"
                      >
                        {filteredWallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[var(--text-secondary)] block mb-1">
                        Nominal Topup (Rp):
                      </label>
                      <input
                        type="number"
                        placeholder="Masukkan nominal (cth: 500000)"
                        value={topupAmount}
                        onChange={e => setTopupAmount(e.target.value)}
                        className="w-full bg-[var(--card-bg)] text-xs p-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-bold font-mono"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleTopup(g.id)}
                        className="flex-1 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-xl transition-all"
                      >
                        Simpan Topup
                      </button>
                      <button
                        onClick={() => setSelectedGoalId(null)}
                        className="py-2 px-3.5 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold text-xs rounded-xl transition-colors"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedGoalId(g.id);
                      if (filteredWallets.length > 0) {
                        setSelectedTopupWalletId(filteredWallets[0].id);
                      }
                    }}
                    className="w-full mt-4 py-2.5 bg-[var(--gold-badge-bg)] hover:bg-[var(--gold-badge-border)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <WalletIcon className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                    + Topup Tabungan
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* SUBTAB 3: BILLS & DEBTS */}
      {activeSubtab === 'debts' && (
        <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl overflow-hidden transition-colors">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--input-bg)] text-[11px] text-[var(--text-secondary)] font-extrabold uppercase">
                <th className="p-4">Deskripsi Tagihan / Hutang</th>
                <th className="p-4">Pihak Terkait</th>
                <th className="p-4">Tipe</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] font-medium">
              {debts.map(d => (
                <tr key={d.id} className="hover:bg-[var(--input-bg)] transition-colors">
                  <td className="p-4 font-bold text-[var(--text-primary)]">{d.title}</td>
                  <td className="p-4 text-[var(--text-secondary)]">{d.party || '-'}</td>
                  <td className="p-4 text-[var(--text-muted)] uppercase font-mono text-[10px]">{d.type}</td>
                  <td className="p-4 text-[var(--text-secondary)] font-mono">{d.dueDate}</td>
                  <td className="p-4 text-right font-black text-[var(--text-primary)] font-mono">Rp {d.amount.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => markDebtStatus(d.id, d.status === 'paid' ? 'pending' : 'paid')}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase transition-all ${
                        d.status === 'paid'
                          ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                          : d.status === 'overdue'
                          ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                          : 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]'
                      }`}
                    >
                      {d.status}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setEditingDebt(d)}
                        title="Edit Tagihan"
                        className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-all border border-[var(--border)] cursor-pointer active:scale-95"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Apakah Anda yakin ingin menghapus tagihan "${d.title}"?`)) {
                            deleteDebt(d.id);
                          }
                        }}
                        title="Hapus Tagihan"
                        className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-red-500/15 text-[var(--text-secondary)] hover:text-red-500 transition-all border border-[var(--border)] cursor-pointer active:scale-95"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* SUBTAB 4: INVESTMENTS */}
      {activeSubtab === 'investments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {investments.map(inv => (
            <div key={inv.id} className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-3.5 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
                  {inv.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-500">+{inv.returnPercentage}% Return</span>
                </div>
              </div>

              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">{inv.name}</h4>

              <div>
                <span className="text-[10px] text-[var(--text-muted)] block font-bold uppercase tracking-wider">Nilai Saat Ini:</span>
                <div className="text-lg font-black text-[var(--gold-primary)] font-mono mt-0.5">
                  Rp {inv.currentAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="text-[11px] text-[var(--text-secondary)] pt-2 border-t border-[var(--border)]">
                Platform: <strong className="text-[var(--text-primary)]">{inv.platform}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT BUDGET MODAL */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="font-extrabold text-[var(--text-primary)] text-base">Edit Anggaran ({editingBudget.categoryName})</h3>
              <button onClick={() => setEditingBudget(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Batas Anggaran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={editingBudget.monthlyLimit}
                  onChange={e => setEditingBudget({ ...editingBudget, monthlyLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-black font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Scope Tampilan</label>
                <select
                  value={editingBudget.scope}
                  onChange={e => setEditingBudget({ ...editingBudget, scope: e.target.value as any })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold"
                >
                  <option value="personal">Pribadi (Personal)</option>
                  <option value="business">Bisnis (Business)</option>
                  <option value="all">Semua Mode</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  deleteBudget(editingBudget.id);
                  setEditingBudget(null);
                }}
                className="px-4 py-2 bg-red-500/15 text-red-500 font-bold text-xs rounded-2xl border border-red-500/30 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold text-xs rounded-2xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateBudget(editingBudget);
                    setEditingBudget(null);
                  }}
                  className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="font-extrabold text-[var(--text-primary)] text-base">Edit Financial Goal</h3>
              <button onClick={() => setEditingGoal(null)} className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Judul Target</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.targetAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Terkumpul Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.currentAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Tenggat Waktu / Deadline</label>
                <input
                  type="date"
                  value={editingGoal.deadline}
                  onChange={e => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)]"
                />
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Kategori Target</label>
                <input
                  type="text"
                  value={editingGoal.category}
                  onChange={e => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
              <button
                onClick={() => {
                  deleteGoal(editingGoal.id);
                  setEditingGoal(null);
                }}
                className="px-4 py-2 bg-red-500/15 text-red-500 font-bold text-xs rounded-2xl border border-red-500/30 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold text-xs rounded-2xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateGoal(editingGoal);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEBT / BILL MODAL */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-[var(--text-primary)]">
            <div className="flex justify-between items-center border-b border-[var(--border)] pb-3">
              <h3 className="font-extrabold text-[var(--text-primary)] text-base">Edit Tagihan / Hutang</h3>
              <button
                type="button"
                onClick={() => setEditingDebt(null)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateDebt(editingDebt);
                setEditingDebt(null);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Deskripsi / Judul Tagihan</label>
                <input
                  type="text"
                  value={editingDebt.title}
                  onChange={e => setEditingDebt({ ...editingDebt, title: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Pihak Terkait</label>
                  <input
                    type="text"
                    value={editingDebt.party || ''}
                    onChange={e => setEditingDebt({ ...editingDebt, party: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-medium"
                    placeholder="Nama vendor / penagih"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Tipe</label>
                  <select
                    value={editingDebt.type === 'debt' ? 'debt_payable' : editingDebt.type}
                    onChange={e => setEditingDebt({ ...editingDebt, type: e.target.value as any })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold"
                  >
                    <option value="bill">Tagihan Rutin (Bill)</option>
                    <option value="debt_payable">Hutang Saya (Debt)</option>
                    <option value="receivable">Piutang (Receivable)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Nominal (Rp)</label>
                  <input
                    type="number"
                    value={editingDebt.amount}
                    onChange={e => setEditingDebt({ ...editingDebt, amount: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-[var(--text-secondary)] mb-1">Jatuh Tempo</label>
                  <input
                    type="date"
                    value={editingDebt.dueDate}
                    onChange={e => setEditingDebt({ ...editingDebt, dueDate: e.target.value })}
                    className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Status</label>
                <select
                  value={editingDebt.status}
                  onChange={e => setEditingDebt({ ...editingDebt, status: e.target.value as any })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-bold"
                >
                  <option value="pending">PENDING (Belum Lunas)</option>
                  <option value="paid">PAID (Sudah Lunas)</option>
                  <option value="overdue">OVERDUE (Jatuh Tempo)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[var(--text-secondary)] mb-1">Catatan Tambahan</label>
                <input
                  type="text"
                  value={editingDebt.note || ''}
                  onChange={e => setEditingDebt({ ...editingDebt, note: e.target.value })}
                  className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-2xl p-3 text-[var(--text-primary)] font-medium"
                  placeholder="Catatan / Keterangan"
                />
              </div>

              <div className="flex items-center gap-2 pt-3 border-t border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => {
                    deleteDebt(editingDebt.id);
                    setEditingDebt(null);
                  }}
                  className="px-4 py-2 bg-red-500/15 text-red-500 font-bold text-xs rounded-2xl border border-red-500/30 flex items-center gap-1 cursor-pointer hover:bg-red-500/25 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Hapus
                </button>
                <div className="flex-1 flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setEditingDebt(null)}
                    className="px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold text-xs rounded-2xl cursor-pointer hover:bg-[var(--border)] transition-all"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    Simpan
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
