import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, ArrowDownRight, ArrowUpRight, Sparkles, Edit3 } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-xl rounded-3xl p-5 md:p-6 relative text-slate-100 shadow-2xl space-y-4 my-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-base font-extrabold text-white">Catat Transaksi Keuangan</h3>
          <p className="text-xs text-slate-400">Pilih metode AI Otomatis atau Form Manual</p>
        </div>

        {/* Input Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
          <button
            type="button"
            onClick={() => setInputMethod('ai')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'ai'
                ? 'bg-purple-600/30 text-purple-200 border border-purple-500/50 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Fast Input (Chat/Struk/Suara)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMethod('manual')}
            className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'manual'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Edit3 className="w-4 h-4 text-emerald-400" />
            <span>Form Manual</span>
          </button>
        </div>

        {/* Content based on selected tab */}
        {inputMethod === 'ai' ? (
          <AITransactionRecorder onSuccess={onClose} isModal={true} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'expense' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Pemasukan
              </button>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Judul Transaksi</label>
              <input
                type="text"
                placeholder="Mis: Makan Siang Soto Kudus, Beli Bensin"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-bold text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Kategori Utama</label>
                <select
                  id="kategori-utama"
                  value={category}
                  onChange={e => {
                    const selectedCat = e.target.value;
                    setCategory(selectedCat);
                    const subs = getSubcategoriesForCategory(selectedCat, categories);
                    setSubcategory(subs[0] || '');
                  }}
                  className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-medium"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Sub-kategori</label>
                <select
                  id="sub-kategori"
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium"
                >
                  {availableSubcategories.map((sub, idx) => (
                    <option key={idx} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Dompet / Akun</label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                >
                  {filteredWallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-400 font-bold mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                placeholder="Catatan detail transaksi..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow-md transition-all"
              >
                Simpan Transaksi
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
        )}
      </div>
    </div>
  );
};

