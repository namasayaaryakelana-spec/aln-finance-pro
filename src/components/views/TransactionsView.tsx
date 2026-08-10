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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#F6D365] font-bold">
            <Receipt className="w-5 h-5 text-[#F6D365]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Buku Kas & Transaksi Pribadi</h3>
            <p className="text-xs text-[#7C8799]">Total {transactions.length} transaksi tercatat</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAIRecorder(!showAIRecorder)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              showAIRecorder
                ? 'bg-[rgba(212,175,55,0.2)] text-[#F6D365] border border-[rgba(212,175,55,0.4)] shadow-md'
                : 'bg-[rgba(255,255,255,0.04)] text-[#BFC8D6] border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.08)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[#F6D365]" />
            <span>Catat AI (Chat/Gambar/Suara)</span>
            {showAIRecorder ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={openCategoryModal}
            className="px-3.5 py-2 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] text-xs font-bold flex items-center gap-2 border border-[rgba(255,255,255,0.08)] transition-all"
          >
            <Tag className="w-3.5 h-3.5 text-[#F6D365]" />
            Master Kategori
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(transactions)}
            className="px-3.5 py-2 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] text-xs font-bold flex items-center gap-2 border border-[rgba(255,255,255,0.08)] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#BFC8D6]" />
            Ekspor CSV
          </button>

          <button
            onClick={openAddTxModal}
            className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-lg transition-all"
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[#7C8799] absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari transaksi atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[#121A2A] text-xs pl-10 pr-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="bg-[#121A2A] text-xs px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#BFC8D6] focus:outline-none focus:border-[#D4AF37]"
        >
          <option value="all">Semua Tipe (Pemasukan / Pengeluaran / Transfer)</option>
          <option value="income">Pemasukan (+)</option>
          <option value="expense">Pengeluaran (-)</option>
          <option value="transfer">Transfer Antar Dompet (⇄)</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-[#121A2A] text-xs px-4 py-3 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#BFC8D6] focus:outline-none focus:border-[#D4AF37]"
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
      <div className="bg-[#121A2A] rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.08)] bg-[#0B1220] text-[11px] text-[#7C8799] font-extrabold uppercase tracking-wider">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Deskripsi Transaksi</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(255,255,255,0.06)] text-xs font-medium">
              {transactions.length > 0 ? (
                transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                    <td className="p-4 text-[#BFC8D6] whitespace-nowrap flex items-center gap-2 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-[#7C8799]" />
                      {tx.date}
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-white">{tx.title}</div>
                      {tx.note && <div className="text-[10px] text-[#7C8799] mt-0.5">{tx.note}</div>}
                    </td>

                    <td className="p-4 whitespace-nowrap">
                      <div className="flex flex-col gap-1 items-start">
                        <span className="px-2.5 py-1 rounded-xl bg-[rgba(255,255,255,0.05)] text-[#BFC8D6] font-bold text-[10px] border border-[rgba(255,255,255,0.08)]">
                          {tx.category}
                        </span>
                        {tx.subcategory && (
                          <span className="px-2 py-0.5 rounded-lg bg-[rgba(212,175,55,0.12)] text-[#F6D365] border border-[rgba(212,175,55,0.25)] font-semibold text-[9px]">
                            {tx.subcategory}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-4 text-right font-extrabold whitespace-nowrap font-mono">
                      <span
                        className={
                          tx.type === 'income'
                            ? 'text-[#22C55E]'
                            : tx.type === 'expense'
                            ? 'text-[#EF4444]'
                            : 'text-[#F6D365]'
                        }
                      >
                        {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp{' '}
                        {tx.amount.toLocaleString('id-ID')}
                      </span>
                    </td>

                    <td className="p-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => deleteTransaction(tx.id)}
                        className="p-1.5 rounded-xl text-[#7C8799] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
                        title="Hapus Transaksi"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[#7C8799] text-xs">
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
