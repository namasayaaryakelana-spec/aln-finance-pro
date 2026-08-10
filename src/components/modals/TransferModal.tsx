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
            <ArrowRightLeft className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Transfer Antar Dompet
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Pindahkan dana antar rekening bank / e-wallet</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Dari Dompet (Pengirim)</label>
            <select
              value={fromWalletId}
              onChange={e => setFromWalletId(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Ke Dompet (Penerima)</label>
            <select
              value={toWalletId}
              onChange={e => setToWalletId(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Nominal Transfer (Rp)</label>
            <input
              type="number"
              placeholder="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-base focus:outline-none focus:border-[var(--gold-primary)] font-mono"
            />
          </div>

          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Catatan (Opsional)</label>
            <input
              type="text"
              placeholder="Mis: Topup Gopay dari BCA"
              value={note}
              onChange={e => setNote(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
            />
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              Proses Transfer
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
