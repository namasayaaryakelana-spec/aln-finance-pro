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
      <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#F6D365] font-bold">
            <Target className="w-5 h-5 text-[#F6D365]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Perencanaan & Target Keuangan</h3>
            <p className="text-xs text-[#7C8799]">Budgeting, Financial Goals, Tagihan & Portofolio Investasi</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {activeSubtab === 'budgets' && (
            <button
              onClick={openAddBudgetModal}
              className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Anggaran
            </button>
          )}

          {activeSubtab === 'goals' && (
            <button
              onClick={openAddGoalModal}
              className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Target Goal
            </button>
          )}

          {activeSubtab === 'debts' && (
            <button
              onClick={openAddDebtModal}
              className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Catatan Tagihan
            </button>
          )}

          {activeSubtab === 'investments' && (
            <button
              onClick={() => setIsAddInvestmentOpen(true)}
              className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              Tambah Investasi
            </button>
          )}
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B1220] p-2 rounded-3xl border border-[rgba(255,255,255,0.08)]">
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
                  ? 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-md font-extrabold'
                  : 'text-[#7C8799] hover:text-[#BFC8D6]'
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
                className={`bg-[#121A2A] p-6 rounded-3xl border shadow-2xl flex flex-col justify-between ${
                  isOverbudget ? 'border-[rgba(239,68,68,0.4)] bg-[rgba(239,68,68,0.05)]' : 'border-[rgba(255,255,255,0.08)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-[#F6D365]" />
                      <h4 className="text-sm font-extrabold text-white">{b.categoryName}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-[#F6D365] px-2.5 py-0.5 rounded-full bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)]">
                        {b.scope}
                      </span>
                      <button
                        onClick={() => setEditingBudget(b)}
                        title="Edit Anggaran"
                        className="p-1.5 rounded-xl bg-[#0B1220] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] hover:text-[#F6D365] transition-colors border border-[rgba(255,255,255,0.08)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="flex justify-between text-xs mb-2 font-bold">
                    <span className="text-[#7C8799]">
                      Terpakai: <strong className="text-white">Rp {b.spent.toLocaleString('id-ID')}</strong>
                    </span>
                    <span className="text-[#7C8799]">
                      Batas: <strong className="text-[#F6D365]">Rp {b.monthlyLimit.toLocaleString('id-ID')}</strong>
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#0B1220] h-3 rounded-full overflow-hidden p-0.5 border border-[rgba(255,255,255,0.08)]">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOverbudget ? 'bg-[#EF4444]' : pct > 80 ? 'bg-[#F6D365]' : 'bg-[#22C55E]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 pt-3.5 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
                  <span className="text-[11px] font-bold text-[#7C8799]">{pct}% dari Batas</span>

                  {isOverbudget ? (
                    <span className="text-[#EF4444] font-bold flex items-center gap-1 text-[11px]">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Melebihi Anggaran!
                    </span>
                  ) : (
                    <span className="text-[#22C55E] font-bold text-[11px]">Sisa: Rp {(b.monthlyLimit - b.spent).toLocaleString('id-ID')}</span>
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
                className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between"
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
                      <span className="text-[10px] text-[#7C8799] font-mono">Tenggat: {g.deadline}</span>
                      <button
                        onClick={() => setEditingGoal(g)}
                        title="Edit Target"
                        className="p-1.5 rounded-xl bg-[#0B1220] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] hover:text-[#F6D365] transition-colors border border-[rgba(255,255,255,0.08)]"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm font-extrabold text-white mb-3">{g.title}</h4>

                  <div className="text-xs space-y-1.5 mb-3">
                    <div className="flex justify-between text-[#7C8799]">
                      <span>Terkumpul:</span>
                      <strong className="text-[#22C55E]">Rp {g.currentAmount.toLocaleString('id-ID')}</strong>
                    </div>
                    <div className="flex justify-between text-[#7C8799]">
                      <span>Target:</span>
                      <strong className="text-white">Rp {g.targetAmount.toLocaleString('id-ID')}</strong>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full bg-[#0B1220] h-3 rounded-full overflow-hidden p-0.5 border border-[rgba(255,255,255,0.08)]">
                    <div className="h-full bg-[#22C55E] rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[10px] text-[#7C8799] font-bold block mt-1 text-right">{pct}% Terpenuhi</span>
                </div>

                {selectedGoalId === g.id ? (
                  <div className="mt-4 pt-3.5 border-t border-[rgba(255,255,255,0.08)] space-y-3 bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                    <div>
                      <label className="text-[10px] font-bold text-[#BFC8D6] block mb-1">
                        Sumber Akun / Dompet:
                      </label>
                      <select
                        value={selectedTopupWalletId || (filteredWallets[0]?.id || '')}
                        onChange={e => setSelectedTopupWalletId(e.target.value)}
                        className="w-full bg-[#121A2A] text-xs p-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-white font-bold"
                      >
                        {filteredWallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-bold text-[#BFC8D6] block mb-1">
                        Nominal Topup (Rp):
                      </label>
                      <input
                        type="number"
                        placeholder="Masukkan nominal (cth: 500000)"
                        value={topupAmount}
                        onChange={e => setTopupAmount(e.target.value)}
                        className="w-full bg-[#121A2A] text-xs p-2.5 rounded-xl border border-[rgba(255,255,255,0.08)] text-white font-bold"
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
                        className="py-2 px-3.5 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-xl transition-colors"
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
                    className="w-full mt-4 py-2.5 bg-[rgba(212,175,55,0.1)] hover:bg-[rgba(212,175,55,0.2)] text-[#F6D365] border border-[rgba(212,175,55,0.25)] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5"
                  >
                    <WalletIcon className="w-3.5 h-3.5 text-[#F6D365]" />
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
        <div className="bg-[#121A2A] rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#0B1220] text-[11px] text-[#7C8799] font-extrabold uppercase">
                <th className="p-4">Deskripsi Tagihan / Hutang</th>
                <th className="p-4">Pihak Terkait</th>
                <th className="p-4">Tipe</th>
                <th className="p-4">Jatuh Tempo</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Status</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] font-medium">
              {debts.map(d => (
                <tr key={d.id} className="hover:bg-[rgba(255,255,255,0.03)]">
                  <td className="p-4 font-bold text-white">{d.title}</td>
                  <td className="p-4 text-[#BFC8D6]">{d.party || '-'}</td>
                  <td className="p-4 text-[#7C8799] uppercase font-mono text-[10px]">{d.type}</td>
                  <td className="p-4 text-[#BFC8D6]">{d.dueDate}</td>
                  <td className="p-4 text-right font-extrabold text-white font-mono">Rp {d.amount.toLocaleString('id-ID')}</td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() => markDebtStatus(d.id, d.status === 'paid' ? 'pending' : 'paid')}
                      className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                        d.status === 'paid'
                          ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.3)]'
                          : d.status === 'overdue'
                          ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]'
                          : 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]'
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
                        className="p-1.5 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] hover:text-[#F6D365] transition-colors"
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
            <div key={inv.id} className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[rgba(212,175,55,0.12)] text-[#F6D365] border border-[rgba(212,175,55,0.25)]">
                  {inv.category}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-bold text-[#22C55E]">+{inv.returnPercentage}% Return</span>
                  <button
                    onClick={() => setEditingInvestment(inv)}
                    title="Edit Investasi"
                    className="p-1.5 rounded-xl bg-[#0B1220] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] hover:text-[#F6D365]"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-extrabold text-white">{inv.name}</h4>

              <div>
                <span className="text-[10px] text-[#7C8799] block font-bold uppercase">Nilai Saat Ini:</span>
                <div className="text-lg font-extrabold text-[#F6D365] font-mono mt-0.5">
                  Rp {inv.currentAmount.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="text-[11px] text-[#7C8799] pt-2 border-t border-[rgba(255,255,255,0.08)]">
                Platform: <strong className="text-white">{inv.platform}</strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* EDIT BUDGET MODAL */}
      {editingBudget && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Anggaran ({editingBudget.categoryName})</h3>
              <button onClick={() => setEditingBudget(null)} className="text-[#7C8799] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Batas Anggaran Bulanan (Rp)</label>
                <input
                  type="number"
                  value={editingBudget.monthlyLimit}
                  onChange={e => setEditingBudget({ ...editingBudget, monthlyLimit: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Scope Tampilan</label>
                <select
                  value={editingBudget.scope}
                  onChange={e => setEditingBudget({ ...editingBudget, scope: e.target.value as any })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                >
                  <option value="personal">Pribadi (Personal)</option>
                  <option value="business">Bisnis (Business)</option>
                  <option value="all">Semua Mode</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => {
                  deleteBudget(editingBudget.id);
                  setEditingBudget(null);
                }}
                className="px-4 py-2 bg.rgba(239,68,68,0.15) text-[#EF4444] font-bold text-xs rounded-2xl border border-[rgba(239,68,68,0.3)] flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingBudget(null)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
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
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT GOAL MODAL */}
      {editingGoal && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Financial Goal</h3>
              <button onClick={() => setEditingGoal(null)} className="text-[#7C8799] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Judul Target</label>
                <input
                  type="text"
                  value={editingGoal.title}
                  onChange={e => setEditingGoal({ ...editingGoal, title: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Target Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.targetAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, targetAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Terkumpul Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editingGoal.currentAmount}
                  onChange={e => setEditingGoal({ ...editingGoal, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Tenggat Waktu / Deadline</label>
                <input
                  type="date"
                  value={editingGoal.deadline}
                  onChange={e => setEditingGoal({ ...editingGoal, deadline: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Kategori Target</label>
                <input
                  type="text"
                  value={editingGoal.category}
                  onChange={e => setEditingGoal({ ...editingGoal, category: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => {
                  deleteGoal(editingGoal.id);
                  setEditingGoal(null);
                }}
                className="px-4 py-2 bg-[rgba(239,68,68,0.15)] text-[#EF4444] font-bold text-xs rounded-2xl border border-[rgba(239,68,68,0.3)] flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingGoal(null)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
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
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DEBT MODAL */}
      {editingDebt && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Catatan Tagihan / Hutang</h3>
              <button onClick={() => setEditingDebt(null)} className="text-[#7C8799] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Deskripsi / Judul Tagihan</label>
                <input
                  type="text"
                  value={editingDebt.title}
                  onChange={e => setEditingDebt({ ...editingDebt, title: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Pihak Terkait (Atas Nama/Penagih)</label>
                <input
                  type="text"
                  value={editingDebt.party || ''}
                  onChange={e => setEditingDebt({ ...editingDebt, party: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Nominal (Rp)</label>
                <input
                  type="number"
                  value={editingDebt.amount}
                  onChange={e => setEditingDebt({ ...editingDebt, amount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Tanggal Jatuh Tempo</label>
                <input
                  type="date"
                  value={editingDebt.dueDate}
                  onChange={e => setEditingDebt({ ...editingDebt, dueDate: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Tipe Catatan</label>
                <select
                  value={editingDebt.type}
                  onChange={e => setEditingDebt({ ...editingDebt, type: e.target.value as any })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                >
                  <option value="bill">Tagihan Rutin (Bill)</option>
                  <option value="debt_payable">Hutang Saya (Payable)</option>
                  <option value="receivable">Piutang / Orang Berhutang (Receivable)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Status Pembayaran</label>
                <select
                  value={editingDebt.status}
                  onChange={e => setEditingDebt({ ...editingDebt, status: e.target.value as any })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                >
                  <option value="pending">Belum Dibayar (Pending)</option>
                  <option value="paid">Lunas (Paid)</option>
                  <option value="overdue">Terlambat (Overdue)</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => {
                  deleteDebt(editingDebt.id);
                  setEditingDebt(null);
                }}
                className="px-4 py-2 bg-[rgba(239,68,68,0.15)] text-[#EF4444] font-bold text-xs rounded-2xl border border-[rgba(239,68,68,0.3)] flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingDebt(null)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateDebt(editingDebt);
                    setEditingDebt(null);
                  }}
                  className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDIT INVESTMENT MODAL */}
      {editingInvestment && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
              <h3 className="font-extrabold text-white text-base">Edit Aset Investasi</h3>
              <button onClick={() => setEditingInvestment(null)} className="text-[#7C8799] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Nama Aset / Produk</label>
                <input
                  type="text"
                  value={editingInvestment.name}
                  onChange={e => setEditingInvestment({ ...editingInvestment, name: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Kategori Aset</label>
                <select
                  value={editingInvestment.category}
                  onChange={e => setEditingInvestment({ ...editingInvestment, category: e.target.value as any })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                >
                  <option value="saham">Saham (Stocks)</option>
                  <option value="reksadana">Reksadana (Mutual Funds)</option>
                  <option value="crypto">Kripto (Crypto)</option>
                  <option value="emas">Emas (Gold)</option>
                  <option value="properti">Properti (Real Estate)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Nilai Saat Ini (Rp)</label>
                <input
                  type="number"
                  value={editingInvestment.currentAmount}
                  onChange={e => setEditingInvestment({ ...editingInvestment, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Return / Imbal Hasil (%)</label>
                <input
                  type="number"
                  value={editingInvestment.returnPercentage}
                  onChange={e => setEditingInvestment({ ...editingInvestment, returnPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Platform / Sekuritas</label>
                <input
                  type="text"
                  value={editingInvestment.platform}
                  onChange={e => setEditingInvestment({ ...editingInvestment, platform: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => {
                  deleteInvestment(editingInvestment.id);
                  setEditingInvestment(null);
                }}
                className="px-4 py-2 bg-[rgba(239,68,68,0.15)] text-[#EF4444] font-bold text-xs rounded-2xl border border-[rgba(239,68,68,0.3)] flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Hapus
              </button>
              <div className="flex-1 flex gap-2 justify-end">
                <button
                  onClick={() => setEditingInvestment(null)}
                  className="px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
                >
                  Batal
                </button>
                <button
                  onClick={() => {
                    updateInvestment(editingInvestment);
                    setEditingInvestment(null);
                  }}
                  className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  Simpan Perubahan
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADD INVESTMENT MODAL */}
      {isAddInvestmentOpen && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvestment} className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in">
            <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-3">
              <h3 className="font-extrabold text-white text-base">Tambah Portofolio Investasi Baru</h3>
              <button type="button" onClick={() => setIsAddInvestmentOpen(false)} className="text-[#7C8799] hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Nama Instrumen / Aset</label>
                <input
                  type="text"
                  placeholder="Contoh: BBCA, Reksadana Sucor, Emas Antam"
                  value={newInv.name}
                  onChange={e => setNewInv({ ...newInv, name: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Kategori Investasi</label>
                <select
                  value={newInv.category}
                  onChange={e => setNewInv({ ...newInv, category: e.target.value as any })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                >
                  <option value="saham">Saham (Stocks)</option>
                  <option value="reksadana">Reksadana (Mutual Funds)</option>
                  <option value="crypto">Kripto (Crypto)</option>
                  <option value="emas">Emas (Gold)</option>
                  <option value="properti">Properti (Real Estate)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Nilai Investasi Saat Ini (Rp)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newInv.currentAmount || ''}
                  onChange={e => setNewInv({ ...newInv, currentAmount: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white font-bold"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Return / Keuntungan (%)</label>
                <input
                  type="number"
                  placeholder="0"
                  value={newInv.returnPercentage || ''}
                  onChange={e => setNewInv({ ...newInv, returnPercentage: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                />
              </div>

              <div>
                <label className="block font-bold text-[#BFC8D6] mb-1">Platform / Sekuritas / Exchange</label>
                <input
                  type="text"
                  placeholder="Contoh: Ajaib, Bibit, Tokocrypto, Pegadaian"
                  value={newInv.platform}
                  onChange={e => setNewInv({ ...newInv, platform: e.target.value })}
                  className="w-full bg-[#0B1220] border border-[rgba(255,255,255,0.08)] rounded-2xl p-3 text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setIsAddInvestmentOpen(false)}
                className="px-4 py-2 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl flex items-center gap-1"
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
