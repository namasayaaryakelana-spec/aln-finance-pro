import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Receipt,
  Search,
  Plus,
  Trash2,
  Sparkles,
  Tag,
  Download,
  Calendar,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ExportService } from '../../services/export';
import { AITransactionRecorder } from '../ai/AITransactionRecorder';

interface TransactionsViewProps {
  openAddTxModal: () => void;
  openFastAITxModal: () => void;
  openCategoryModal: () => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  openAddTxModal,
  openFastAITxModal,
  openCategoryModal
}) => {
  const { filteredTransactions, deleteTransaction, categories } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAIRecorder, setShowAIRecorder] = useState(true);

  const transactions = filteredTransactions.filter(tx => {
    const matchesSearch =
      tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  return (
    <div className="space-y-6 pb-20">
      {/* Top Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Buku Kas & Transaksi Pribadi</h3>
            <p className="text-xs text-slate-400">Total {transactions.length} transaksi tercatat</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowAIRecorder(!showAIRecorder)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              showAIRecorder
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-950/40'
                : 'bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30'
            }`}
          >
            <Sparkles className="w-4 h-4 text-purple-300" />
            <span>Catat AI (Chat/Gambar/Suara)</span>
            {showAIRecorder ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={openCategoryModal}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" />
            Master Kategori
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(transactions)}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            Ekspor CSV
          </button>

          <button
            onClick={openAddTxModal}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-extrabold flex items-center gap-1 shadow-md shadow-emerald-950/40"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Catat Manual
          </button>
        </div>
      </div>

      {/* Embedded Multimodal AI Transaction Recorder */}
      {showAIRecorder && (
        <AITransactionRecorder />
      )}

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 text-xs pl-10 pr-4 py-2.5 rounded-2xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="bg-slate-900 text-xs px-4 py-2.5 rounded-2xl border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Semua Tipe (Pemasukan / Pengeluaran / Transfer)</option>
          <option value="income">Pemasukan (+)</option>
          <option value="expense">Pengeluaran (-)</option>
          <option value="transfer">Transfer Antar Dompet (⇄)</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-slate-900 text-xs px-4 py-2.5 rounded-2xl border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
      </div>

      {/* Transactions Data Table */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800/80 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/80 text-[11px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Deskripsi Transaksi</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs font-medium">
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 text-slate-400 whitespace-nowrap flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      {tx.date}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white">{tx.title}</div>
                      {tx.note && <div className="text-[10px] text-slate-400 mt-0.5">{tx.note}</div>}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2.5 py-1 rounded-xl bg-slate-800 text-slate-300 font-bold text-[10px]">
                          {tx.category}
                        </span>
                        {tx.subcategory && (
                          <span className="px-2 py-0.5 rounded-lg bg-cyan-950/80 text-cyan-300 border border-cyan-800/50 font-semibold text-[9px]">
                            {tx.subcategory}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right font-extrabold whitespace-nowrap">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-emerald-400'
                            : tx.type === 'expense'
                            ? 'text-red-400'
                            : 'text-blue-400'
                        }
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp{' '}
                        {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-500 text-xs">
                    Tidak ditemukan data transaksi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
