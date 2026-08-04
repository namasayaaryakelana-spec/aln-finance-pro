import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-md rounded-3xl p-6 relative text-slate-100 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-white">Catat Tagihan / Hutang / Piutang</h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Judul Catatan</label>
            <input
              type="text"
              placeholder="Mis: Tagihan WiFi Indihome, Hutang Vendor Kertas"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Pihak Terkait</label>
              <input
                type="text"
                placeholder="Mis: PT Telkom, Budi Klien"
                value={party}
                onChange={e => setParty(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipe</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as any)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="bill">Tagihan Rutin (Bill)</option>
                <option value="debt">Hutang Saya (Debt)</option>
                <option value="receivable">Piutang (Receivable)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Tanggal Jatuh Tempo</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              + Simpan
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
