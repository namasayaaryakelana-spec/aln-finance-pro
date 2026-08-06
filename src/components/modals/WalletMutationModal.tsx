import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet } from '../../types';
import { calculateWalletMutations, WalletMutation } from '../../utils/mutationHelper';
import {
  X,
  Calendar,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  Wallet as WalletIcon,
  Download,
  FileSpreadsheet,
  Building2,
  Landmark,
  Smartphone,
  Banknote,
  CreditCard
} from 'lucide-react';

interface WalletMutationModalProps {
  initialWalletId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export const WalletMutationModal: React.FC<WalletMutationModalProps> = ({
  initialWalletId,
  isOpen,
  onClose
}) => {
  const { filteredWallets, transactions } = useFinance();
  const [selectedWalletId, setSelectedWalletId] = useState<string>(
    initialWalletId || filteredWallets[0]?.id || ''
  );

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'kredit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const activeWallet = useMemo(() => {
    return filteredWallets.find(w => w.id === selectedWalletId) || filteredWallets[0] || null;
  }, [filteredWallets, selectedWalletId]);

  // Compute mutations and totals for active wallet
  const mutationSummary = useMemo(() => {
    if (!activeWallet) return null;
    return calculateWalletMutations(activeWallet, transactions, filteredWallets);
  }, [activeWallet, transactions, filteredWallets]);

  // Filter mutations based on user controls
  const filteredMutations = useMemo(() => {
    if (!mutationSummary) return [];
    let list = [...mutationSummary.mutations];

    // Reverse for display if user wants newest first in list, but running balances remain chronologically accurate!
    // We display newest on top, or oldest on top depending on preference. Default newest on top for table view.
    list.sort((a, b) => b.date.localeCompare(a.date));

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        m =>
          m.description.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q) ||
          (m.subcategory && m.subcategory.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      list = list.filter(m => m.type === typeFilter);
    }

    if (categoryFilter !== 'all') {
      list = list.filter(m => m.category === categoryFilter);
    }

    if (startDate) {
      list = list.filter(m => m.date >= startDate);
    }

    if (endDate) {
      list = list.filter(m => m.date <= endDate);
    }

    return list;
  }, [mutationSummary, searchQuery, typeFilter, categoryFilter, startDate, endDate]);

  // Extract unique categories for filter dropdown
  const uniqueCategories = useMemo(() => {
    if (!mutationSummary) return [];
    const set = new Set<string>();
    mutationSummary.mutations.forEach(m => set.add(m.category));
    return Array.from(set);
  }, [mutationSummary]);

  if (!isOpen || !activeWallet || !mutationSummary) return null;

  const getWalletIcon = (type: string) => {
    switch (type) {
      case 'bank': return Landmark;
      case 'ewallet': return Smartphone;
      case 'cash': return Banknote;
      case 'credit': return CreditCard;
      default: return Building2;
    }
  };

  const IconComp = getWalletIcon(activeWallet.type);

  // Format short numbers e.g. 50.000 -> 50K, 10.000.000 -> 10.000K
  const formatK = (val: number) => {
    if (val === 0) return '-';
    if (val >= 1000) {
      return `${(val / 1000).toLocaleString('id-ID')}K`;
    }
    return val.toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: activeWallet.color }}
            >
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">Mutasi Dompet (Debit & Kredit)</h3>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {activeWallet.currency}
                </span>
              </div>
              <p className="text-xs text-slate-400">Histori mutasi rekening & pencatatan saldo berjalan real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Controls */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Wallet Selector & Financial Overview Card */}
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <span className="text-xs font-bold text-slate-400">Pilih Dompet:</span>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="bg-slate-900 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  {filteredWallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency} {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Saldo Saat Ini</span>
                <span className="text-2xl font-black text-white">
                  Rp {mutationSummary.currentBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Total Debit & Total Kredit Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-400 mb-1">
                  <ArrowUpRight className="w-4 h-4" />
                  Total Debit (Pengeluaran)
                </div>
                <div className="text-lg font-black text-white">
                  Rp {mutationSummary.totalDebit.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 mb-1">
                  <ArrowDownLeft className="w-4 h-4" />
                  Total Kredit (Pemasukan)
                </div>
                <div className="text-lg font-black text-white">
                  Rp {mutationSummary.totalKredit.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-emerald-400" />
                Filter & Pencarian Mutasi
              </span>
              <span className="text-[10px] text-slate-400">{filteredMutations.length} Mutasi Ditemukan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              {/* Search */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari keterangan..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Jenis Filter */}
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-700"
              >
                <option value="all">Semua Jenis (Debit & Kredit)</option>
                <option value="debit">Hanya Debit (Pengeluaran)</option>
                <option value="kredit">Hanya Kredit (Pemasukan)</option>
              </select>

              {/* Category Filter */}
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-700"
              >
                <option value="all">Semua Kategori</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>

              {/* Date Filter */}
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none focus:border-slate-700"
                  title="Dari Tanggal"
                />
                <span className="text-slate-500 text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 bg-slate-900 border border-slate-800 rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none focus:border-slate-700"
                  title="Sampai Tanggal"
                />
              </div>
            </div>
          </div>

          {/* Mutation Table Display */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/40">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 text-xs uppercase font-extrabold border-b border-slate-800">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Kredit</th>
                    <th className="py-3 px-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500 font-medium">
                        Tidak ada riwayat mutasi untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const dateObj = new Date(m.date);
                      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-slate-300 whitespace-nowrap font-bold">
                            {formattedDate}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-semibold text-white">{m.description}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <span className="bg-slate-800 px-1.5 py-0.5 rounded text-slate-300 font-medium">
                                {m.category}
                              </span>
                              {m.paidBy && (
                                <span className="text-emerald-400 font-medium">
                                  Oleh: {m.paidBy}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-rose-400 whitespace-nowrap">
                            {m.type === 'debit' ? formatK(m.debitAmount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                            {m.type === 'kredit' ? formatK(m.kreditAmount) : '-'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-white whitespace-nowrap bg-slate-900/40">
                            {formatK(m.runningBalance)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Total {filteredMutations.length} entri mutasi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
