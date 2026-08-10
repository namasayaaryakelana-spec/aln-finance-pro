import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Target } from 'lucide-react';
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
      color: '#D4AF37'
    });

    onClose();
    setTitle('');
    setTargetAmount('');
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
            <Target className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Tambah Target Tabungan
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Financial goal & impian masa depan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Nama Target Tabungan</label>
            <input
              type="text"
              placeholder="Mis: Dana Darurat 6 Bulan, Beli Mobil Operasional"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-medium"
              required
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Target Nominal (Rp)</label>
            <input
              type="number"
              placeholder="Mis: 50000000"
              value={targetAmount}
              onChange={e => setTargetAmount(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Kategori Target</label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                <option value="Dana Darurat">Dana Darurat</option>
                <option value="Investasi Aset">Investasi Aset</option>
                <option value="Pengembangan Bisnis">Pengembangan Bisnis</option>
                <option value="Liburan & Travel">Liburan & Travel</option>
                <option value="Pendidikan">Pendidikan</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Tenggat Waktu</label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              + Simpan Target Goal
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
