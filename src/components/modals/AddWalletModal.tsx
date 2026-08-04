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
  const [color, setColor] = useState('#10B981');

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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-md rounded-3xl p-6 relative text-slate-100 shadow-2xl space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="text-base font-extrabold text-white">Tambah Akun Dompet / Bank</h3>

        <form onSubmit={handleSubmit} className="space-y-3 text-xs">
          <div>
            <label className="block text-slate-400 font-bold mb-1">Nama Akun / Dompet</label>
            <input
              type="text"
              placeholder="Mis: Bank BCA Utama, Mandiri Bisnis, Gopay"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Tipe Akun</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as WalletType)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="bank">Bank Transfer</option>
                <option value="ewallet">E-Wallet (Gopay/Ovo/DANA)</option>
                <option value="cash">Kas Tunai (Cash)</option>
                <option value="credit">Kartu Kredit</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Mata Uang</label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
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
              <label className="block text-slate-400 font-bold mb-1">Saldo Awal</label>
              <input
                type="number"
                placeholder="0"
                value={balance}
                onChange={e => setBalance(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Nomor Rekening / HP</label>
              <input
                type="text"
                placeholder="Mis: 123456789"
                value={accountNumber}
                onChange={e => setAccountNumber(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 font-bold mb-1">Scope Tampilan</label>
              <select
                value={scope}
                onChange={e => setScopeState(e.target.value as Scope)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="personal">Pribadi (Personal)</option>
                <option value="business">Bisnis (Business)</option>
                <option value="all">Semua Scope</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Aksen Warna Card</label>
              <input
                type="color"
                value={color}
                onChange={e => setColor(e.target.value)}
                className="w-full h-10 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer p-1"
              />
            </div>
          </div>

          <div className="pt-3 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
            >
              + Simpan Dompet
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
