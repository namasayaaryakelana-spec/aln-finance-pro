import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowRightLeft } from 'lucide-react';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { filteredWallets, transferFunds, addToast } = useFinance();

  const [fromWalletId, setFromWalletId] = useState(filteredWallets[0]?.id || '');
  const [toWalletId, setToWalletId] = useState(filteredWallets[1]?.id || filteredWallets[0]?.id || '');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      addToast('warning', 'Nominal Salah', 'Masukkan angka nominal transfer.');
      return;
    }

    if (fromWalletId === toWalletId) {
      addToast('warning', 'Akun Sama', 'Pilih dua dompet yang berbeda untuk transfer.');
      return;
    }

    transferFunds(fromWalletId, toWalletId, num, note);
    onClose();
    setAmount('');
    setNote('');
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

        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/30">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Transfer Antar Dompet</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Dari Dompet (Pengirim)</label>
            <select
              value={fromWalletId}
              onChange={e => setFromWalletId(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Ke Dompet (Penerima)</label>
            <select
              value={toWalletId}
              onChange={e => setToWalletId(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white font-bold text-sm focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-400 font-bold mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Mis: Topup Gopay dari BCA"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              Proses Transfer
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
