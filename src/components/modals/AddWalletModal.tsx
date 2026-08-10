import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Wallet as WalletIcon, ShieldCheck } from 'lucide-react';
import { WalletType, Scope, Currency } from '../../types';

interface AddWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddWalletModal: React.FC<AddWalletModalProps> = ({ isOpen, onClose }) => {
  const { addWallet, currentScope } = useFinance();

  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [balance, setBalance] = useState('');
  const [currency, setCurrency] = useState<Currency>('IDR');
  const [accountNumber, setAccountNumber] = useState('');
  const [scope, setScopeState] = useState<Scope>(currentScope === 'all' ? 'personal' : currentScope);
  const [color, setColor] = useState('#D4AF37');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initialBal = parseFloat(balance) || 0;
    if (!name) return;

    addWallet({
      name,
      type,
      balance: initialBal,
      currency,
      accountNumber,
      scope,
      color,
      isDefault: false
    });

    onClose();
    setName('');
    setBalance('');
    setAccountNumber('');
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
            <WalletIcon className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Tambah Akun Dompet / Bank
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Kelola rekening bank, e-wallet, atau kas baru</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Nama Akun / Dompet</label>
            <input
              type="text"
              placeholder="Mis: Bank BCA Utama, Mandiri Bisnis, Gopay"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Tipe Akun</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as WalletType)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                <option value="bank">Bank Transfer</option>
                <option value="ewallet">E-Wallet (Gopay/Ovo/DANA)</option>
                <option value="cash">Kas Tunai (Cash)</option>
                <option value="credit">Kartu Kredit</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Mata Uang</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                <option value="IDR">IDR (Rupiah)</option>
                <option value="USD">USD (US Dollar)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="SGD">SGD (Singapore Dollar)</option>
                <option value="JPY">JPY (Japanese Yen)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Saldo Awal</label>
              <input
                type="number"
                placeholder="0"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-extrabold text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
              />
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Nomor Rekening / HP</label>
              <input
                type="text"
                placeholder="Mis: 123456789"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Scope Tampilan</label>
              <select
                value={scope}
                onChange={e => setScopeState(e.target.value as Scope)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                <option value="personal">Pribadi (Personal)</option>
                <option value="business">Bisnis (Business)</option>
                <option value="all">Semua Scope</option>
              </select>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Aksen Warna Card</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full h-11 bg-[var(--input-bg)] rounded-2xl border border-[var(--input-border)] cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              + Simpan Dompet
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
