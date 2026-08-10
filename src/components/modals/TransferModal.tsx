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
    <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] w-full max-w-md rounded-3xl p-6 relative text-white shadow-2xl space-y-4 animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[#0B1220] text-[#7C8799] hover:text-white border border-[rgba(255,255,255,0.08)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]">
            <ArrowRightLeft className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Transfer Antar Dompet</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#BFC8D6] font-bold mb-1">Dari Dompet (Pengirim)</label>
            <select
              value={fromWalletId}
              onChange={e => setFromWalletId(e.target.value)}
              className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#BFC8D6] font-bold mb-1">Ke Dompet (Penerima)</label>
            <select
              value={toWalletId}
              onChange={e => setToWalletId(e.target.value)}
              className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[#BFC8D6] font-bold mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white font-extrabold text-sm focus:outline-none focus:border-[#D4AF37] font-mono"
            />
          </div>

          <div>
            <label className="block text-[#BFC8D6] font-bold mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Mis: Topup Gopay dari BCA"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs"
            >
              Proses Transfer
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold rounded-2xl text-xs"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
