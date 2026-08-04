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
      period: '2026-07'
    });

    onClose();
    setMonthlyLimit('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-md rounded-3xl p-6 relative text-slate-100 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-white">Set Target Anggaran Bulanan</h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Pilih Kategori Pengeluaran</label>
            <select
              value={categoryId}
              onChange={e => setCategoryId(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {categories.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Batas Maksimal Anggaran / Bulan (Rp)</label>
            <input
              type="number"
              placeholder="Mis: 3000000"
              value={monthlyLimit}
              onChange={e => setMonthlyLimit(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Scope</label>
            <select
              value={scope}
              onChange={e => setScopeState(e.target.value as Scope)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="personal">Pribadi (Personal)</option>
              <option value="business">Bisnis (Business)</option>
            </select>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              + Simpan Target Anggaran
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
