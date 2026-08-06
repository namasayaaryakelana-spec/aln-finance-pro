import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Wallet as WalletIcon,
  Coins,
  Building2,
  Landmark,
  Smartphone,
  Banknote,
  CreditCard,
  Plus,
  ArrowRightLeft,
  Trash2,
  FileText,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';
import { Wallet, WalletType } from '../../types';
import { WalletMutationModal } from '../modals/WalletMutationModal';
import { calculateWalletMutations } from '../../utils/mutationHelper';

interface WalletsViewProps {
  openTransferModal: () => void;
  openAddWalletModal: () => void;
}

export const WalletsView: React.FC<WalletsViewProps> = ({
  openTransferModal,
  openAddWalletModal
}) => {
  const { filteredWallets, deleteWallet, totalBalance, totalInvestment, transactions } = useFinance();
  const [selectedWalletIdModal, setSelectedWalletIdModal] = useState<string | null>(null);

  // Embedded Mutasi Section state
  const [activeWalletId, setActiveWalletId] = useState<string>(filteredWallets[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'debit' | 'kredit'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const currentWallet = useMemo(() => {
    return filteredWallets.find(w => w.id === activeWalletId) || filteredWallets[0] || null;
  }, [filteredWallets, activeWalletId]);

  const mutationSummary = useMemo(() => {
    if (!currentWallet) return null;
    return calculateWalletMutations(currentWallet, transactions, filteredWallets);
  }, [currentWallet, transactions, filteredWallets]);

  const filteredMutations = useMemo(() => {
    if (!mutationSummary) return [];
    let list = [...mutationSummary.mutations];

    // Newest first for view list
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

  const uniqueCategories = useMemo(() => {
    if (!mutationSummary) return [];
    const set = new Set<string>();
    mutationSummary.mutations.forEach(m => set.add(m.category));
    return Array.from(set);
  }, [mutationSummary]);

  const getWalletIcon = (type: WalletType) => {
    switch (type) {
      case 'bank': return Landmark;
      case 'ewallet': return Smartphone;
      case 'cash': return Banknote;
      case 'credit': return CreditCard;
      default: return Building2;
    }
  };

  const formatK = (val: number) => {
    if (val === 0) return '-';
    if (val >= 1000) {
      return `${(val / 1000).toLocaleString('id-ID')}K`;
    }
    return val.toLocaleString('id-ID');
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Top Banner Overview */}
      <div className="bg-gradient-to-r from-slate-900 via-[#0D1527] to-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
            <WalletIcon className="w-4 h-4" />
            Kas Likuid Multi-Dompet
          </span>
          <h2 className="text-3xl font-extrabold text-white mt-1">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-slate-400">
              {filteredWallets.length} Akun Terdaftar (Bank, E-Wallet, Kas Tunai & Kredit)
            </span>
            <span className="text-slate-600">•</span>
            <span className="text-xs text-amber-300 font-semibold flex items-center gap-1 bg-amber-500/10 px-2 py-0.5 rounded-lg border border-amber-500/20">
              <Coins className="w-3 h-3" /> Investasi: Rp {totalInvestment.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openTransferModal}
            className="px-4 py-2.5 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 text-xs font-bold flex items-center gap-2 shadow-md transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Transfer Antar Akun
          </button>

          <button
            onClick={openAddWalletModal}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-950/40 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Akun
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredWallets.map(w => {
          const Icon = getWalletIcon(w.type);
          const isSelected = currentWallet?.id === w.id;
          return (
            <div
              key={w.id}
              onClick={() => setActiveWalletId(w.id)}
              className={`bg-slate-900/90 p-5 rounded-3xl border transition-all shadow-xl relative overflow-hidden flex flex-col justify-between cursor-pointer group ${
                isSelected ? 'border-emerald-500/60 ring-2 ring-emerald-500/20' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              <div
                className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: w.color }}
              />

              <div>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md"
                      style={{ backgroundColor: w.color }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white">{w.name}</h4>
                      <span className="text-[10px] text-slate-400 font-mono uppercase">
                        {w.accountNumber || w.type}
                      </span>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                    {w.scope}
                  </span>
                </div>

                <div className="mt-4">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    Saldo Real-time
                  </span>
                  <div className="text-xl font-extrabold text-white mt-0.5">
                    {w.currency} {w.balance.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWalletIdModal(w.id);
                  }}
                  className="px-2.5 py-1.2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[11px] font-bold flex items-center gap-1.5 transition-all"
                  title="Lihat Mutasi Debit & Kredit"
                >
                  <FileText className="w-3.5 h-3.5" />
                  Mutasi Dompet
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWallet(w.id);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition-colors"
                    title="Hapus Dompet"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedded Mutasi Dompet (Debit & Kredit) Section */}
      {currentWallet && mutationSummary && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-6">
          
          {/* Header & Wallet Selector */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-extrabold text-white">Mutasi Dompet: {currentWallet.name}</h3>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Histori mutasi Debit & Kredit serta pencatatan saldo berjalan per rekening</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-400">Pilih Dompet:</span>
              <select
                value={activeWalletId}
                onChange={(e) => setActiveWalletId(e.target.value)}
                className="bg-slate-950 border border-slate-700 text-white font-bold text-xs rounded-xl px-3 py-2 focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-auto"
              >
                {filteredWallets.map(w => (
                  <option key={w.id} value={w.id}>
                    {w.name} ({w.currency} {w.balance.toLocaleString('id-ID')})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cards Overview: Saldo Saat Ini, Total Kredit, Total Debit */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Saldo Saat Ini</span>
              <div className="text-2xl font-black text-white mt-1">
                Rp {mutationSummary.currentBalance.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5" /> Total Kredit (Pemasukan)
              </span>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                Rp {mutationSummary.totalKredit.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5" /> Total Debit (Pengeluaran)
              </span>
              <div className="text-2xl font-black text-rose-400 mt-1">
                Rp {mutationSummary.totalDebit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-300">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-emerald-400" />
                Filter Mutasi Dompet
              </span>
              <span className="text-[10px] text-slate-400">{filteredMutations.length} Entri Ditemukan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-slate-700"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-700"
              >
                <option value="all">Semua Jenis (Debit & Kredit)</option>
                <option value="debit">Hanya Debit</option>
                <option value="kredit">Hanya Kredit</option>
              </select>

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

          {/* Mutasi Table View (Matching Exact User Layout) */}
          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900 text-slate-400 text-xs uppercase font-extrabold border-b border-slate-800">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Debit</th>
                    <th className="py-3.5 px-4 text-right">Kredit</th>
                    <th className="py-3.5 px-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 text-xs">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-slate-500 font-medium">
                        Tidak ada riwayat mutasi untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const dateObj = new Date(m.date);
                      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

                      return (
                        <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="py-3.5 px-4 font-mono text-slate-300 whitespace-nowrap font-bold">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{m.description}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
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
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rose-400 whitespace-nowrap">
                            {m.type === 'debit' ? formatK(m.debitAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-400 whitespace-nowrap">
                            {m.type === 'kredit' ? formatK(m.kreditAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap bg-slate-900/60">
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
      )}

      {/* Dedicated Mutation Modal */}
      {selectedWalletIdModal && (
        <WalletMutationModal
          isOpen={!!selectedWalletIdModal}
          initialWalletId={selectedWalletIdModal}
          onClose={() => setSelectedWalletIdModal(null)}
        />
      )}
    </div>
  );
};
