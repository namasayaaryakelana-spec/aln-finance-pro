import React, { useState, useMemo } from 'react';
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
  ChevronUp,
  ArrowDownRight,
  ArrowUpRight,
  TrendingUp,
  Filter,
  FileSpreadsheet,
  ShieldCheck,
  CreditCard
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
  const { filteredTransactions, deleteTransaction, categories, wallets, totalIncome, totalExpense, netFlow } = useFinance();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [showAIRecorder, setShowAIRecorder] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 30;

  const transactions = useMemo(() => {
    return filteredTransactions.filter(tx => {
      const matchesSearch =
        tx.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesType = filterType === 'all' || tx.type === filterType;
      const matchesCategory = filterCategory === 'all' || tx.category === filterCategory;

      return matchesSearch && matchesType && matchesCategory;
    });
  }, [filteredTransactions, searchTerm, filterType, filterCategory]);

  const totalPages = Math.ceil(transactions.length / itemsPerPage) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);

  const paginatedTransactions = useMemo(() => {
    const start = (safeCurrentPage - 1) * itemsPerPage;
    return transactions.slice(start, start + itemsPerPage);
  }, [transactions, safeCurrentPage, itemsPerPage]);

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. TOP EXECUTIVE HEADER BANNER */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-2xl transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] font-bold shrink-0">
            <Receipt className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-[10px] text-[var(--gold-primary)] font-extrabold uppercase tracking-widest font-['Plus_Jakarta_Sans',sans-serif]">
              <ShieldCheck className="w-3 h-3 text-[var(--gold-primary)]" />
              FINANCIAL LEDGER
            </div>
            <h2 className="text-lg font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Buku Kas & Transaksi Keuangan
            </h2>
            <p className="text-xs text-[var(--text-secondary)] font-medium">
              Riwayat pemasukan, pengeluaran, dan transfer dana Anda ({transactions.length} Entri)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setShowAIRecorder(!showAIRecorder)}
            className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 transition-all ${
              showAIRecorder
                ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm'
                : 'bg-[var(--surface-secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:bg-[var(--border)]'
            }`}
          >
            <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
            <span>Catat AI</span>
            {showAIRecorder ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            onClick={openCategoryModal}
            className="px-3.5 py-2 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 border border-[var(--border)] transition-all"
          >
            <Tag className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            Master Kategori
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(transactions)}
            className="px-3.5 py-2 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] text-xs font-bold flex items-center gap-2 border border-[var(--border)] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            Ekspor CSV
          </button>

          <button
            onClick={openAddTxModal}
            className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Catat Manual
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--card-bg)] p-4.5 rounded-2xl border border-[var(--border)] shadow-sm">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
            Total Pemasukan
          </span>
          <p className="text-xl font-black text-emerald-500 mt-1 font-['Space_Grotesk',sans-serif]">
            +Rp {totalIncome.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-[var(--card-bg)] p-4.5 rounded-2xl border border-[var(--border)] shadow-sm">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
            Total Pengeluaran
          </span>
          <p className="text-xl font-black text-red-500 mt-1 font-['Space_Grotesk',sans-serif]">
            -Rp {totalExpense.toLocaleString('id-ID')}
          </p>
        </div>

        <div className="bg-[var(--card-bg)] p-4.5 rounded-2xl border border-[var(--border)] shadow-sm">
          <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            Net Arus Kas
          </span>
          <p className={`text-xl font-black mt-1 font-['Space_Grotesk',sans-serif] ${netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
            Rp {netFlow.toLocaleString('id-ID')}
          </p>
        </div>
      </div>

      {/* Embedded Multimodal AI Transaction Recorder */}
      {showAIRecorder && (
        <AITransactionRecorder />
      )}

      {/* 3. PREMIUM FILTER BAR */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Cari transaksi atau catatan..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--input-bg)] text-xs pl-10 pr-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
          />
        </div>

        <select
          value={filterType}
          onChange={e => setFilterType(e.target.value as any)}
          className="bg-[var(--input-bg)] text-xs px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
        >
          <option value="all">Semua Tipe (Pemasukan / Pengeluaran / Transfer)</option>
          <option value="income">Pemasukan (+)</option>
          <option value="expense">Pengeluaran (-)</option>
          <option value="transfer">Transfer Antar Dompet (⇄)</option>
        </select>

        <select
          value={filterCategory}
          onChange={e => setFilterCategory(e.target.value)}
          className="bg-[var(--input-bg)] text-xs px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
        >
          <option value="all">Semua Kategori</option>
          {categories.map(c => (
            <option key={c.id} value={c.name}>
              {c.name} ({c.type})
            </option>
          ))}
        </select>
      </div>

      {/* 4. DESKTOP LEDGER TABLE & MOBILE CARDS VIEW */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--border)] shadow-2xl overflow-hidden transition-colors">
        {/* DESKTOP TABLE VIEW */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-[11px] text-[var(--text-muted)] font-extrabold uppercase tracking-wider">
                <th className="p-4">Tanggal</th>
                <th className="p-4">Deskripsi Transaksi</th>
                <th className="p-4">Kategori</th>
                <th className="p-4 text-right">Nominal</th>
                <th className="p-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)] text-xs font-medium">
              {paginatedTransactions.length > 0 ? (
                paginatedTransactions.map(tx => {
                  const sourceWallet = wallets.find(w => w.id === tx.walletId || w.name.toLowerCase() === tx.walletId.toLowerCase());
                  const sourceWalletName = sourceWallet ? sourceWallet.name : (tx.walletId && tx.walletId !== 'w-1' ? tx.walletId : 'Kas Utama');
                  const targetWallet = tx.targetWalletId ? wallets.find(w => w.id === tx.targetWalletId || w.name.toLowerCase() === tx.targetWalletId.toLowerCase()) : null;
                  const targetWalletName = targetWallet ? targetWallet.name : (tx.targetWalletId || 'Kas Tujuan');

                  const displaySubcategory = tx.subcategory || (() => {
                    if (tx.note && /sub-kategori:/i.test(tx.note)) {
                      const match = tx.note.match(/sub-kategori:\s*([^|]+)/i);
                      return match ? match[1].trim() : undefined;
                    }
                    return undefined;
                  })();

                  return (
                    <tr key={tx.id} className="hover:bg-[var(--surface-secondary)]/50 transition-colors">
                      <td className="p-4 text-[var(--text-secondary)] whitespace-nowrap font-mono font-semibold">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                          {tx.date}
                        </div>
                      </td>

                      <td className="p-4">
                        {/* Baris 1: Title (Paling Menonjol) */}
                        <div className="font-extrabold text-sm text-[var(--text-primary)] tracking-tight">
                          {tx.title}
                        </div>

                        {/* Baris 2: Category • Subcategory */}
                        <div className="text-[11px] font-semibold text-[var(--text-secondary)] mt-0.5 flex items-center gap-1.5">
                          <span>{tx.category || 'Lainnya'}</span>
                          {displaySubcategory && (
                            <>
                              <span className="text-[var(--text-muted)]">•</span>
                              <span className="text-[var(--gold-primary)] font-bold">{displaySubcategory}</span>
                            </>
                          )}
                        </div>

                        {/* Baris 3: Wallet Flow */}
                        <div className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                          {tx.type === 'expense' && (
                            <span>Dari: <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong></span>
                          )}
                          {tx.type === 'income' && (
                            <span>Ke: <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong></span>
                          )}
                          {tx.type === 'transfer' && (
                            <span>
                              <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong>
                              {' → '}
                              <strong className="text-[var(--text-primary)] font-bold">{targetWalletName}</strong>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="px-2.5 py-1 rounded-xl bg-[var(--surface-secondary)] text-[var(--text-primary)] font-bold text-[10px] border border-[var(--border)]">
                            {tx.category}
                          </span>
                          {displaySubcategory && (
                            <span className="px-2 py-0.5 rounded-lg bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] font-semibold text-[9px]">
                              {displaySubcategory}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="p-4 text-right font-black whitespace-nowrap font-mono">
                        <span
                          className={
                            tx.type === 'income'
                              ? 'text-emerald-500'
                              : tx.type === 'expense'
                              ? 'text-red-500'
                              : 'text-[var(--gold-primary)]'
                          }
                        >
                          {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp{' '}
                          {tx.amount.toLocaleString('id-ID')}
                        </span>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          onClick={() => deleteTransaction(tx.id)}
                          className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 hover:bg-red-500/10 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center mx-auto"
                          title="Hapus Transaksi"
                          aria-label="Hapus Transaksi"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-[var(--text-muted)] text-xs font-semibold">
                    Tidak ditemukan data transaksi yang sesuai filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* MOBILE CARD VIEW (Touch Targets >= 44px) */}
        <div className="md:hidden p-4 space-y-3">
          {paginatedTransactions.length > 0 ? (
            paginatedTransactions.map(tx => {
              const sourceWallet = wallets.find(w => w.id === tx.walletId || w.name.toLowerCase() === tx.walletId.toLowerCase());
              const sourceWalletName = sourceWallet ? sourceWallet.name : (tx.walletId && tx.walletId !== 'w-1' ? tx.walletId : 'Kas Utama');
              const targetWallet = tx.targetWalletId ? wallets.find(w => w.id === tx.targetWalletId || w.name.toLowerCase() === tx.targetWalletId.toLowerCase()) : null;
              const targetWalletName = targetWallet ? targetWallet.name : (tx.targetWalletId || 'Kas Tujuan');

              const displaySubcategory = tx.subcategory || (() => {
                if (tx.note && /sub-kategori:/i.test(tx.note)) {
                  const match = tx.note.match(/sub-kategori:\s*([^|]+)/i);
                  return match ? match[1].trim() : undefined;
                }
                return undefined;
              })();

              return (
                <div
                  key={tx.id}
                  className="p-4 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : tx.type === 'expense'
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      {/* Baris 1: Title */}
                      <h4 className="text-xs font-extrabold text-[var(--text-primary)] truncate">{tx.title}</h4>

                      {/* Baris 2: Category • Subcategory */}
                      <div className="text-[10px] font-semibold text-[var(--text-secondary)] flex items-center gap-1 flex-wrap">
                        <span>{tx.category || 'Lainnya'}</span>
                        {displaySubcategory && (
                          <>
                            <span className="text-[var(--text-muted)]">•</span>
                            <span className="text-[var(--gold-primary)] font-bold">{displaySubcategory}</span>
                          </>
                        )}
                        <span className="text-[var(--text-muted)]">•</span>
                        <span className="text-[var(--text-muted)]">{tx.date}</span>
                      </div>

                      {/* Baris 3: Wallet Flow */}
                      <div className="text-[10px] font-medium text-[var(--text-muted)]">
                        {tx.type === 'expense' && (
                          <span>Dari: <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong></span>
                        )}
                        {tx.type === 'income' && (
                          <span>Ke: <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong></span>
                        )}
                        {tx.type === 'transfer' && (
                          <span>
                            <strong className="text-[var(--text-primary)] font-bold">{sourceWalletName}</strong>
                            {' → '}
                            <strong className="text-[var(--text-primary)] font-bold">{targetWalletName}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-black font-mono ${
                        tx.type === 'income'
                          ? 'text-emerald-500'
                          : tx.type === 'expense'
                          ? 'text-red-500'
                          : 'text-[var(--gold-primary)]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp {tx.amount.toLocaleString('id-ID')}
                    </span>

                    <button
                      onClick={() => deleteTransaction(tx.id)}
                      className="p-2 rounded-xl text-[var(--text-muted)] hover:text-red-500 min-h-[44px] min-w-[44px] flex items-center justify-center"
                      aria-label="Hapus Transaksi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-[var(--gold-primary)] mx-auto opacity-70" />
              <p className="text-xs font-bold text-[var(--text-primary)]">Belum Ada Transaksi</p>
              <p className="text-[11px] text-[var(--text-secondary)]">Catat pemasukan atau pengeluaran pertama Anda.</p>
              <button
                onClick={openAddTxModal}
                className="py-2.5 px-4 btn-gold text-[#0B1220] font-extrabold text-xs rounded-xl shadow-md"
              >
                + Catat Transaksi
              </button>
            </div>
          )}
        </div>

        {/* PAGINATION BAR */}
        {transactions.length > 0 && (
          <div className="p-4 border-t border-[var(--border)] bg-[var(--surface-secondary)]/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="text-[var(--text-secondary)] font-medium">
              Menampilkan <span className="font-bold text-[var(--text-primary)]">{(safeCurrentPage - 1) * itemsPerPage + 1}</span> - <span className="font-bold text-[var(--text-primary)]">{Math.min(safeCurrentPage * itemsPerPage, transactions.length)}</span> dari <span className="font-bold text-[var(--text-primary)]">{transactions.length}</span> transaksi
            </div>

            <div className="flex items-center gap-2">
              <button
                disabled={safeCurrentPage <= 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] font-bold disabled:opacity-40 transition-all hover:bg-[var(--border)]"
              >
                ← Sebelumnya
              </button>
              <span className="px-3 py-1.5 rounded-xl font-mono font-bold bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
                Halaman {safeCurrentPage} / {totalPages}
              </span>
              <button
                disabled={safeCurrentPage >= totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] font-bold disabled:opacity-40 transition-all hover:bg-[var(--border)]"
              >
                Berikutnya →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
