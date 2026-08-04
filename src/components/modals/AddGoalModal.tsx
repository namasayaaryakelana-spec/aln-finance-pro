import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X } from 'lucide-react';
import { Scope } from '../../types';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({ isOpen, onClose }) => {
  const { addGoal, currentScope } = useFinance();

  const [title, setTitle] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [deadline, setDeadline] = useState('2026-12-31');
  const [category, setCategory] = useState('Dana Darurat');
  const [scope, setScopeState] = useState<Scope>(currentScope === 'all' ? 'personal' : currentScope);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const target = parseFloat(targetAmount);
    if (!title || isNaN(target) || target <= 0) return;

    addGoal({
      title,
      targetAmount: target,
      deadline,
      category,
      scope,
      color: '#10B981'
    });

    onClose();
    setTitle('');
    setTargetAmount('');
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

        <h3 className="text-base font-extrabold text-white">Tambah Target Tabungan (Financial Goal)</h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Nama Target Tabungan</label>
            <input
              type="text"
              placeholder="Mis: Dana Darurat 6 Bulan, Beli Mobil Operasional"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Target Nominal (Rp)</label>
            <input
              type="number"
              placeholder="Mis: 50000000"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Kategori Target</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Dana Darurat">Dana Darurat</option>
                <option value="Investasi Aset">Investasi Aset</option>
                <option value="Pengembangan Bisnis">Pengembangan Bisnis</option>
                <option value="Liburan & Travel">Liburan & Travel</option>
                <option value="Pendidikan">Pendidikan</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              + Simpan Target Goal
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
