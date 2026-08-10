import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowDownRight, ArrowUpRight, Sparkles, Edit3, ShieldCheck } from 'lucide-react';
import { TransactionType, Scope } from '../../types';
import { AITransactionRecorder } from '../ai/AITransactionRecorder';
import { getSubcategoriesForCategory, masterCategories } from '../../data/subcategories';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddTransactionModal: React.FC<AddTransactionModalProps> = ({ isOpen, onClose }) => {
  const { filteredWallets, categories, addTransaction, addToast } = useFinance();

  const [inputMethod, setInputMethod] = useState<'ai' | 'manual'>('ai');
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState(categories[0]?.name || 'Makanan & Kuliner');
  const [subcategory, setSubcategory] = useState('');
  const [walletId, setWalletId] = useState(filteredWallets[0]?.id || 'w-1');
  const [scope] = useState<Scope>('personal');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [note, setNote] = useState('');

  // Filter categories matching active transaction type
  const availableCategories = React.useMemo(() => {
    const typeKey = type === 'expense' ? 'EXPENSE' : 'INCOME';
    const masterList = Object.keys(masterCategories[typeKey]);
    const storedList = categories.filter(c => c.type === type).map(c => c.name);
    return Array.from(new Set([...masterList, ...storedList]));
  }, [type, categories]);

  // Available subcategories for selected category
  const availableSubcategories = React.useMemo(() => {
    return getSubcategoriesForCategory(category, categories);
  }, [category, categories]);

  // Update selected category when transaction type changes or category list changes
  useEffect(() => {
    if (!availableCategories.includes(category)) {
      if (availableCategories[0]) {
        setCategory(availableCategories[0]);
      }
    }
  }, [availableCategories, type]);

  // Update selected subcategory when available subcategories change
  useEffect(() => {
    if (availableSubcategories.length > 0 && !availableSubcategories.includes(subcategory)) {
      setSubcategory(availableSubcategories[0]);
    }
  }, [availableSubcategories, category]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title || isNaN(numAmount) || numAmount <= 0) {
      addToast('warning', 'Input Tidak Lengkap', 'Mohon isi judul dan nominal nominal positif.');
      return;
    }

    addTransaction({
      type,
      amount: numAmount,
      currency: 'IDR',
      title,
      category,
      subcategory: subcategory || undefined,
      walletId,
      scope,
      date,
      note
    });

    onClose();
    setTitle('');
    setAmount('');
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-xl rounded-3xl p-6 relative text-[var(--text-primary)] shadow-2xl space-y-4 my-auto animate-fade-in transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
            Catat Transaksi Keuangan
          </h3>
          <p className="text-xs text-[var(--text-secondary)]">Pilih metode AI Otomatis atau Form Manual Ledger</p>
        </div>

        {/* Input Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] text-xs font-bold">
          <button
            type="button"
            onClick={() => setInputMethod('ai')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'ai'
                ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm font-extrabold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Asisten AI (Cepat)</span>
          </button>
          <button
            type="button"
            onClick={() => setInputMethod('manual')}
            className={`py-2 rounded-xl flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'manual'
                ? 'btn-gold text-[#0B1220] font-extrabold shadow-sm'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Edit3 className="w-4 h-4" />
            <span>Form Manual</span>
          </button>
        </div>

        {inputMethod === 'ai' ? (
          <AITransactionRecorder />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
            {/* Transaction Type Buttons */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'expense'
                    ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4 text-red-500" />
                <span>Pengeluaran (-)</span>
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'income'
                    ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4 text-emerald-500" />
                <span>Pemasukan (+)</span>
              </button>
            </div>

            {/* Nominal Amount Visual Lead */}
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Nominal Transaksi (Rp)</label>
              <div className="relative">
                <span className="absolute left-4 top-3.5 text-base text-[var(--gold-primary)] font-black">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-[var(--input-bg)] text-xl font-black font-mono pl-12 pr-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                  required
                />
              </div>
            </div>

            {/* Judul & Tanggal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Judul / Deskripsi</label>
                <input
                  type="text"
                  placeholder="Mis: Belanja Dapur, Gaji Bulanan"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                  required
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                  required
                />
              </div>
            </div>

            {/* Kategori & Sub-Kategori */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Kategori Utama</label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Sub-Kategori Spesifik</label>
                <select
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--gold-primary)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
                >
                  {availableSubcategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sumber Dompet */}
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Sumber Dompet / Rekening</label>
              <select
                value={walletId}
                onChange={e => setWalletId(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
              >
                {filteredWallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Catatan (Opsional)</label>
              <input
                type="text"
                placeholder="Mis: Pembayaran via Transfer QRIS"
                value={note}
                onChange={e => setNote(e.target.value)}
                className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3.5 btn-gold text-[#0B1220] font-black rounded-2xl shadow-md transition-all text-xs active:scale-95"
              >
                + Simpan Transaksi
              </button>
              <button
                type="button"
                onClick={onClose}
                className="py-3.5 px-4 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold rounded-2xl text-xs transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
