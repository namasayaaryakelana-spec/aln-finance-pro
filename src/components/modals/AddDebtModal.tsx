import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Calendar } from 'lucide-react';
import { Scope } from '../../types';

interface AddDebtModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddDebtModal: React.FC<AddDebtModalProps> = ({ isOpen, onClose }) => {
  const { addDebt, currentScope } = useFinance();

  const [title, setTitle] = useState('');
  const [party, setParty] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'bill' | 'debt' | 'receivable'>('bill');
  const [dueDate, setDueDate] = useState('2026-08-15');
  const [scope, setScopeState] = useState<Scope>(currentScope === 'all' ? 'personal' : currentScope);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (!title || isNaN(num) || num <= 0) return;

    addDebt({
      title,
      party,
      amount: num,
      type,
      dueDate,
      scope
    });

    onClose();
    setTitle('');
    setAmount('');
    setParty('');
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
            <Calendar className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Catat Tagihan / Hutang
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Kelola kewajiban tagihan rutin, hutang & piutang</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Judul Catatan</label>
            <input
              type="text"
              placeholder="Mis: Tagihan WiFi Indihome, Hutang Vendor Kertas"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Pihak Terkait</label>
              <input
                type="text"
                placeholder="Mis: PT Telkom, Budi Klien"
                value={party}
                onChange={e => setParty(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-medium"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Tipe</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                <option value="bill">Tagihan Rutin (Bill)</option>
                <option value="debt">Hutang Saya (Debt)</option>
                <option value="receivable">Piutang (Receivable)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-mono"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              + Simpan Catatan
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
