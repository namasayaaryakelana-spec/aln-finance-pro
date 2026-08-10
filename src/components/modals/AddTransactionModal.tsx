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
    <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] w-full max-w-xl rounded-3xl p-6 relative text-white shadow-2xl space-y-4 my-auto animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-2xl bg-[#0B1220] text-[#7C8799] hover:text-white border border-[rgba(255,255,255,0.08)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div>
          <h3 className="text-base font-extrabold text-white">Catat Transaksi Keuangan</h3>
          <p className="text-xs text-[#7C8799]">Pilih metode AI Otomatis atau Form Manual</p>
        </div>

        {/* Input Method Tabs */}
        <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <button
            type="button"
            onClick={() => setInputMethod('ai')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'ai'
                ? 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-sm font-extrabold'
                : 'text-[#7C8799] hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F6D365]" />
            <span>AI Fast Input (Chat/Struk/Suara)</span>
          </button>

          <button
            type="button"
            onClick={() => setInputMethod('manual')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
              inputMethod === 'manual'
                ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.3)] shadow-sm font-extrabold'
                : 'text-[#7C8799] hover:text-white'
            }`}
          >
            <Edit3 className="w-4 h-4 text-[#22C55E]" />
            <span>Form Manual</span>
          </button>
        </div>

        {/* Content based on selected tab */}
        {inputMethod === 'ai' ? (
          <AITransactionRecorder onSuccess={onClose} isModal={true} />
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
            {/* Type selector */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'expense'
                    ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] font-extrabold'
                    : 'text-[#7C8799]'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                Pengeluaran
              </button>

              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2.5 rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors ${
                  type === 'income'
                    ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.3)] font-extrabold'
                    : 'text-[#7C8799]'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" />
                Pemasukan
              </button>
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Judul Transaksi</label>
              <input
                type="text"
                placeholder="Mis: Makan Siang Soto Kudus, Beli Bensin"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Nominal (Rp)</label>
              <input
                type="number"
                placeholder="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37] font-extrabold text-sm font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#BFC8D6] font-bold mb-1">Kategori Utama</label>
                <select
                  id="kategori-utama"
                  value={category}
                  onChange={e => {
                    const selectedCat = e.target.value;
                    setCategory(selectedCat);
                    const subs = getSubcategoriesForCategory(selectedCat, categories);
                    setSubcategory(subs[0] || '');
                  }}
                  className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37] font-medium"
                >
                  {availableCategories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#BFC8D6] font-bold mb-1">Sub-kategori</label>
                <select
                  id="sub-kategori"
                  value={subcategory}
                  onChange={e => setSubcategory(e.target.value)}
                  className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#F6D365] focus:outline-none focus:border-[#D4AF37] font-medium"
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
                <label className="block text-[#BFC8D6] font-bold mb-1">Dompet / Akun</label>
                <select
                  value={walletId}
                  onChange={e => setWalletId(e.target.value)}
                  className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
                >
                  {filteredWallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} (Rp {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#BFC8D6] font-bold mb-1">Tanggal</label>
                <input
                  type="date"
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white focus:outline-none focus:border-[#D4AF37]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[#BFC8D6] font-bold mb-1">Catatan Tambahan (Opsional)</label>
              <textarea
                placeholder="Catatan detail transaksi..."
                value={note}
                onChange={e => setNote(e.target.value)}
                rows={2}
                className="w-full bg-[#0B1220] px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
              />
            </div>

            <div className="pt-3 flex gap-2">
              <button
                type="submit"
                className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs"
              >
                Simpan Transaksi
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
        )}
      </div>
    </div>
  );
};
