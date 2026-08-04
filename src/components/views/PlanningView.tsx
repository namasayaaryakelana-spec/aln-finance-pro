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
  Building2,
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
    updateInvestment,
    deleteInvestment,
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
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
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
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400 font-bold">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Perencanaan & Target Keuangan</h3>
            <p className="text-xs text-slate-400">Budgeting, Financial Goals, Tagihan & Portofolio Investasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {activeSubtab === 'budgets' && (
            <button
              onClick={openAddBudgetModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Anggaran
            </button>
          )}

          {activeSubtab === 'goals' && (
            <button
              onClick={openAddGoalModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Target Goal
            </button>
          )}

          {activeSubtab === 'debts' && (
            <button
              onClick={openAddDebtModal}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Catatan Tagihan
            </button>
          )}

          {activeSubtab === 'investments' && (
            <button
              onClick={() => setIsAddInvestmentOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-1 shadow-md transition-colors"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Investasi
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
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
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
                className={`bg-slate-900/90 p-5 rounded-3xl border shadow-xl flex flex-col justify-between ${
                  isOverbudget ? 'border-red-500/50 bg-red-950/20' : 'border-slate-800/80'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-emerald-400" />
                      <h4 className="text-sm font-extrabold text-white">{b.categoryName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800">
                        {b.scope}
                      </span>
                      <button
                        onClick={() => setEditingBudget(b)}
                        title="Edit Anggaran"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-1.5 font-bold">
                    <span className="text-slate-400">
                      Terpakai: <strong className="text-white">Rp {b.spent.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-slate-400">
                      Batas: <strong className="text-emerald-400">Rp {b.monthlyLimit.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverbudget ? 'bg-red-500' : pct > 80 ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-slate-400">{pct}% dari Batas</span>

                  {isOverbudget ? (
                    <span className="text-red-400 font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Melebihi Anggaran!
                    </span>
                  ) : (
                    <span className="text-emerald-400 font-bold text-[11px]">Sisa: Rp {(b.monthlyLimit - b.spent).toLocaleString('id-ID')}</span>
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
                className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span
                      className="text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: g.color || '#10B981' }}
                    >
                      {g.category}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-400 font-mono">Tenggat: {g.deadline}</span>
                      <button
                        onClick={() => setEditingGoal(g)}
                        title="Edit Target"
                        className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-extrabold text-white mb-3">{g.title}</h4>

                  <div className="text-xs space-y-1 mb-3">
                    <div className="flex justify-between text-slate-400">
                      <span>Terkumpul:</span>
                      <strong className="text-emerald-400">Rp {g.currentAmount.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Target:</span>
                      <strong className="text-white">Rp {g.targetAmount.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-slate-950 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1 text-right">{pct}% Terpenuhi</span>
                </div>

                {selectedGoalId === g.id ? (
                  <div className="mt-4 pt-3 border-t border-slate-800 space-y-2.5 bg-slate-950/70 p-3 rounded-2xl border border-slate-800/80">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Sumber Akun / Dompet:
                      </label>
                      <select
                        value={selectedTopupWalletId || (filteredWallets[0]?.id || '')}
                        onChange={e => setSelectedTopupWalletId(e.target.value)}
                        className="w-full bg-slate-900 text-xs p-2 rounded-xl border border-slate-800 text-white font-bold"
                      >
                        {filteredWallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">
                        Nominal Topup (Rp):
                      </label>
                      <input
                        type="number"
                        placeholder="Masukkan nominal (cth: 500000)"
                        value={topupAmount}
                        onChange={e => setTopupAmount(e.target.value)}
                        className="w-full bg-slate-900 text-xs p-2 rounded-xl border border-slate-800 text-white font-bold"
                      />
                    </div>

                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleTopup(g.id)}
                        className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors"
                      >
                        Simpan Topup
                      </button>
                      <button
                        onClick={() => setSelectedGoalId(null)}
                        className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-colors"
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
                    className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    <WalletIcon className="w-3.5 h-3.5" />
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
        <div className="bg-slate-900/90 rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950 text-[11px] text-slate-400 font-bold uppercase">
                <th className="p-4">Deskripsi Tagihan / Hutang</th>
                <th className="p-4">Pihak Terkait</th>
                <th className="p-4">Tipe</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {debts.map(d => (
                <tr key={d.id} className="hover:bg-slate-800/50">
                  <td className="p-4 font-bold text-white">{d.title}</td>
                  <td className="p-4 text-slate-300">{d.party || '-'}</td>
                  <td className="p-4 text-slate-400 uppercase font-mono text-[10px]">{d.type}</td>
                  <td className="p-4 text-slate-300">{d.dueDate}</td>
                  <td className="p-4 text-right font-extrabold text-white">Rp {d.amount.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => markDebtStatus(d.id, d.status === 'paid' ? 'pending' : 'paid')}
                      className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                        d.status === 'paid'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : d.status === 'overdue'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {d.status}
                    </button>
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditingDebt(d)}
                        title="Edit Tagihan"
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400 transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
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
            <div key={inv.id} className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {inv.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-emerald-400">+{inv.returnPercentage}% Return</span>
                  <button
                    onClick={() => setEditingInvestment(inv)}
                    title="Edit Investasi"
                    className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-400"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-extrabold text-white">{inv.name}</h4>

              <div>
                <span className="text-[10px] text-slate-400 block">Nilai Saat Ini:</span>
                <div className="text-lg font-extrabold text-emerald-400">
                  Rp {inv.currentAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                Platform: <strong className="text-white">{inv.platform}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- EDIT BUDGET MODAL --- */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Anggaran ({editingBudget.categoryName})</h3>
              <button onClick={() => setEditingBudget(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Batas Anggaran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={editingBudget.monthlyLimit}
                  onChange={e => setEditingBudget({ ...editingBudget, monthlyLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Scope Tampilan</label>
                <select
                  value={editingBudget.scope}
                  onChange={e => setEditingBudget({ ...editingBudget, scope: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                >
                  <option value="personal">Pribadi (Personal)</option>
                  <option value="business">Bisnis (Business)</option>
                  <option value="all">Semua Mode</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  deleteBudget(editingBudget.id);
                  setEditingBudget(null);
                }}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-800/50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateBudget(editingBudget);
                    setEditingBudget(null);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT GOAL MODAL --- */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Financial Goal</h3>
              <button onClick={() => setEditingGoal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Judul Target</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.targetAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Terkumpul Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.currentAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tenggat Waktu / Deadline</label>
                <input
                  type="date"
                  value={editingGoal.deadline}
                  onChange={e => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Kategori Target</label>
                <input
                  type="text"
                  value={editingGoal.category}
                  onChange={e => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  deleteGoal(editingGoal.id);
                  setEditingGoal(null);
                }}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-800/50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateGoal(editingGoal);
                    setEditingGoal(null);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT DEBT MODAL --- */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Catatan Tagihan / Hutang</h3>
              <button onClick={() => setEditingDebt(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Deskripsi / Judul Tagihan</label>
                <input
                  type="text"
                  value={editingDebt.title}
                  onChange={e => setEditingDebt({ ...editingDebt, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Pihak Terkait (Atas Nama/Penagih)</label>
                <input
                  type="text"
                  value={editingDebt.party || ''}
                  onChange={e => setEditingDebt({ ...editingDebt, party: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingDebt.amount}
                  onChange={e => setEditingDebt({ ...editingDebt, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={editingDebt.dueDate}
                  onChange={e => setEditingDebt({ ...editingDebt, dueDate: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tipe Catatan</label>
                <select
                  value={editingDebt.type}
                  onChange={e => setEditingDebt({ ...editingDebt, type: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="bill">Tagihan Rutin (Bill)</option>
                  <option value="debt_payable">Hutang Saya (Payable)</option>
                  <option value="receivable">Piutang / Orang Berhutang (Receivable)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Status Pembayaran</label>
                <select
                  value={editingDebt.status}
                  onChange={e => setEditingDebt({ ...editingDebt, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="pending">Belum Dibayar (Pending)</option>
                  <option value="paid">Lunas (Paid)</option>
                  <option value="overdue">Terlambat (Overdue)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  deleteDebt(editingDebt.id);
                  setEditingDebt(null);
                }}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-800/50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingDebt(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateDebt(editingDebt);
                    setEditingDebt(null);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT INVESTMENT MODAL --- */}
      {editingInvestment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Aset Investasi</h3>
              <button onClick={() => setEditingInvestment(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Aset / Produk</label>
                <input
                  type="text"
                  value={editingInvestment.name}
                  onChange={e => setEditingInvestment({ ...editingInvestment, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Kategori Aset</label>
                <select
                  value={editingInvestment.category}
                  onChange={e => setEditingInvestment({ ...editingInvestment, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="saham">Saham (Stocks)</option>
                  <option value="reksadana">Reksadana (Mutual Funds)</option>
                  <option value="crypto">Kripto (Crypto)</option>
                  <option value="emas">Emas (Gold)</option>
                  <option value="properti">Properti (Real Estate)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nilai Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editingInvestment.currentAmount}
                  onChange={e => setEditingInvestment({ ...editingInvestment, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Return / Imbal Hasil (%)</label>
                <input
                  type="number"
                  value={editingInvestment.returnPercentage}
                  onChange={e => setEditingInvestment({ ...editingInvestment, returnPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Platform / Sekuritas</label>
                <input
                  type="text"
                  value={editingInvestment.platform}
                  onChange={e => setEditingInvestment({ ...editingInvestment, platform: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => {
                  deleteInvestment(editingInvestment.id);
                  setEditingInvestment(null);
                }}
                className="px-4 py-2 bg-red-950 hover:bg-red-900 text-red-300 font-bold text-xs rounded-xl border border-red-800/50 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingInvestment(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateInvestment(editingInvestment);
                    setEditingInvestment(null);
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD INVESTMENT MODAL --- */}
      {isAddInvestmentOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvestment} className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-extrabold text-white text-base">Tambah Portofolio Investasi Baru</h3>
              <button type="button" onClick={() => setIsAddInvestmentOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Nama Instrumen / Aset</label>
                <input
                  type="text"
                  placeholder="Contoh: BBCA, Reksadana Sucor, Emas Antam"
                  value={newInv.name}
                  onChange={e => setNewInv({ ...newInv, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Kategori Investasi</label>
                <select
                  value={newInv.category}
                  onChange={e => setNewInv({ ...newInv, category: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                >
                  <option value="saham">Saham (Stocks)</option>
                  <option value="reksadana">Reksadana (Mutual Funds)</option>
                  <option value="crypto">Kripto (Crypto)</option>
                  <option value="emas">Emas (Gold)</option>
                  <option value="properti">Properti (Real Estate)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Nilai Investasi Saat Ini (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newInv.currentAmount || ''}
                  onChange={e => setNewInv({ ...newInv, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Return / Keuntungan (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newInv.returnPercentage || ''}
                  onChange={e => setNewInv({ ...newInv, returnPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Platform / Sekuritas / Exchange</label>
                <input
                  type="text"
                  placeholder="Contoh: Ajaib, Bibit, Tokocrypto, Pegadaian"
                  value={newInv.platform}
                  onChange={e => setNewInv({ ...newInv, platform: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsAddInvestmentOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Simpan Investasi
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

