import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Wallet as WalletIcon } from 'lucide-react';
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
            <WalletIcon className="w-5 h-5" />
          </div>
          <h3 className="text-base font-extrabold text-white">Tambah Akun Dompet / Bank</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[#BFC8D6] font-bold mb-1">Nama Akun / Dompet</label>
            <input
              type="text"
              placeholder="Mis: Bank BCA Utama, Mandiri Bisnis, Gopay"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Tipe Akun</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as WalletType)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="bank">Bank Transfer</option>
                <option value="ewallet">E-Wallet (Gopay/Ovo/DANA)</option>
                <option value="cash">Kas Tunai (Cash)</option>
                <option value="credit">Kartu Kredit</option>
              </select>
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Mata Uang</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
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
              <label className="block text-[#BFC8D6] font-bold mb-1">Saldo Awal</label>
              <input
                type="number"
                placeholder="0"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white font-extrabold text-sm focus:outline-none focus:border-[#D4AF37] font-mono"
              />
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Nomor Rekening / HP</label>
              <input
                type="text"
                placeholder="Mis: 123456789"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Scope Tampilan</label>
              <select
                value={scope}
                onChange={e => setScopeState(e.target.value as Scope)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="personal">Pribadi (Personal)</option>
                <option value="business">Bisnis (Business)</option>
                <option value="all">Semua Scope</option>
              </select>
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Aksen Warna Card</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full h-11 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)] cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs"
            >
              + Simpan Dompet
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
