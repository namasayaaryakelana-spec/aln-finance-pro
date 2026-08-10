import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, PieChart } from 'lucide-react';
import { Scope } from '../../types';

interface AddBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({ isOpen, onClose }) => {
  const { categories, addBudget, currentScope } = useFinance();

  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'c-1');
  const [monthlyLimit, setMonthlyLimit] = useState('');
  const [scope, setScopeState] = useState<Scope>(currentScope === 'all' ? 'personal' : currentScope);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const limit = parseFloat(monthlyLimit);
    if (isNaN(limit) || limit <= 0) return;

    const cat = categories.find(c => c.id === categoryId);

    addBudget({
      categoryId,
      categoryName: cat?.name || 'Kategori',
      monthlyLimit: limit,
      scope,
      period: '2026-08'
    });

    onClose();
    setMonthlyLimit('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-md rounded-3xl p-6 relative text-[var(--text-primary)] shadow-2xl space-y-4 animate-fade-in transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
            <PieChart className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Set Target Anggaran Bulanan
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Alokasi limit pengeluaran per kategori</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Pilih Kategori Pengeluaran</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Batas Maksimal Anggaran / Bulan (Rp)</label>
            <input
              type="number"
              placeholder="Mis: 3000000"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Scope</label>
            <select
              value={scope}
              onChange={e => setScopeState(e.target.value as Scope)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
            >
              <option value="personal">Pribadi (Personal)</option>
              <option value="business">Bisnis (Business)</option>
            </select>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              + Simpan Target Anggaran
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold rounded-2xl text-xs transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
