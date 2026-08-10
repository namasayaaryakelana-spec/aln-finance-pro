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
  ArrowDownLeft,
  Cpu
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
      <div className="bg-[#121A2A] p-6 sm:p-7 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[rgba(212,175,55,0.04)] rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <span className="text-[11px] font-bold text-[#F6D365] uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
            <WalletIcon className="w-3.5 h-3.5 text-[#D4AF37]" />
            Kas Likuid Multi-Dompet
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 text-gradient-gold">
            Rp {totalBalance.toLocaleString('id-ID')}
          </h2>
          <div className="flex flex-wrap items-center gap-2.5 mt-3">
            <span className="text-xs text-[#BFC8D6] font-medium">
              {filteredWallets.length} Akun Terdaftar (Bank, E-Wallet, Kas Tunai & Kredit)
            </span>
            <span className="text-[#7C8799]">•</span>
            <span className="text-xs text-[#F6D365] font-semibold flex items-center gap-1 bg-[rgba(212,175,55,0.1)] px-2.5 py-0.5 rounded-xl border border-[rgba(212,175,55,0.25)]">
              <Coins className="w-3 h-3" /> Investasi: Rp {totalInvestment.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto">
          <button
            onClick={openTransferModal}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-2xl bg-[rgba(255,255,255,0.05)] hover:bg-[rgba(255,255,255,0.1)] text-[#BFC8D6] border border-[rgba(255,255,255,0.1)] text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-4 h-4 text-[#F6D365]" />
            Transfer Antar Akun
          </button>

          <button
            onClick={openAddWalletModal}
            className="flex-1 sm:flex-none px-4 py-2.5 btn-gold text-[#0B1220] text-xs font-extrabold flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            Tambah Akun
          </button>
        </div>
      </div>

      {/* Wallet Cards Grid (Premium Debit Metal Card Look) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredWallets.map(w => {
          const Icon = getWalletIcon(w.type);
          const isSelected = currentWallet?.id === w.id;
          const isGoldTheme = w.isDefault || w.type === 'credit';

          return (
            <div
              key={w.id}
              onClick={() => setActiveWalletId(w.id)}
              className={`p-6 rounded-3xl transition-all duration-300 relative overflow-hidden flex flex-col justify-between cursor-pointer group select-none ${
                isGoldTheme ? 'card-debit-gold' : 'card-debit-metallic'
              } ${
                isSelected ? 'ring-2 ring-[#D4AF37] scale-[1.01]' : 'hover:border-[rgba(212,175,55,0.4)]'
              }`}
            >
              {/* Card Ambient Glow Accent */}
              <div
                className="absolute top-0 right-0 w-44 h-44 rounded-full blur-3xl pointer-events-none opacity-20"
                style={{ backgroundColor: w.color || '#D4AF37' }}
              />

              <div>
                {/* Top Row: Bank Icon & Type Badge */}
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg border border-[rgba(255,255,255,0.2)]"
                      style={{ backgroundColor: w.color || '#121A2A' }}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-white tracking-wide">{w.name}</h4>
                      <span className="text-[10px] text-[#BFC8D6] font-medium uppercase tracking-widest block">
                        {w.type === 'bank' ? 'DEBIT CARD' : w.type === 'credit' ? 'CREDIT CARD' : 'DIGITAL WALLET'}
                      </span>
                    </div>
                  </div>

                  <span className="px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase bg-[rgba(255,255,255,0.08)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]">
                    {w.scope}
                  </span>
                </div>

                {/* EMV Gold Chip & Contactless Symbol */}
                <div className="flex items-center justify-between my-5">
                  <div className="w-10 h-7 rounded-lg chip-gold flex items-center justify-center">
                    <Cpu className="w-5 h-5 text-[#0B1220]/70" />
                  </div>
                  <div className="text-[11px] font-mono tracking-widest text-[#7C8799] font-bold">
                    •••• {w.accountNumber ? w.accountNumber.slice(-4) : '8842'}
                  </div>
                </div>

                {/* Balance Display */}
                <div className="mt-4">
                  <span className="text-[10px] font-bold text-[#7C8799] uppercase tracking-widest block">
                    Saldo Real-time
                  </span>
                  <div className="text-2xl font-black text-white mt-0.5 tracking-tight font-['Space_Grotesk',sans-serif]">
                    {w.currency} {w.balance.toLocaleString('id-ID')}
                  </div>
                </div>
              </div>

              {/* Bottom Actions Row */}
              <div className="mt-6 pt-4 border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedWalletIdModal(w.id);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[rgba(212,175,55,0.12)] hover:bg-[rgba(212,175,55,0.22)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] text-[11px] font-bold flex items-center gap-1.5 transition-all"
                  title="Lihat Mutasi Debit & Kredit"
                >
                  <FileText className="w-3.5 h-3.5 text-[#F6D365]" />
                  Mutasi Dompet
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteWallet(w.id);
                    }}
                    className="p-1.5 rounded-lg text-[#7C8799] hover:text-[#EF4444] hover:bg-[rgba(239,68,68,0.1)] transition-colors"
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
        <div className="bg-[#121A2A] p-6 sm:p-7 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          
          {/* Header & Wallet Selector */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[rgba(255,255,255,0.08)] pb-5">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#F6D365]" />
                <h3 className="text-lg font-extrabold text-white">Mutasi Dompet: {currentWallet.name}</h3>
              </div>
              <p className="text-xs text-[#7C8799] mt-0.5">Histori mutasi Debit & Kredit serta pencatatan saldo berjalan per rekening</p>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
              <span className="text-xs font-bold text-[#BFC8D6]">Pilih Dompet:</span>
              <select
                value={activeWalletId}
                onChange={(e) => setActiveWalletId(e.target.value)}
                className="bg-[#0B1220] border border-[rgba(255,255,255,0.1)] text-white font-bold text-xs rounded-2xl px-3.5 py-2.5 focus:ring-2 focus:ring-[#D4AF37] outline-none w-full md:w-auto"
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
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] font-bold text-[#7C8799] uppercase tracking-wider block">Saldo Saat Ini</span>
              <div className="text-2xl font-black text-white mt-1">
                Rp {mutationSummary.currentBalance.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] font-bold text-[#22C55E] uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-[#22C55E]" /> Total Kredit (Pemasukan)
              </span>
              <div className="text-2xl font-black text-[#22C55E] mt-1">
                Rp {mutationSummary.totalKredit.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] font-bold text-[#EF4444] uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444]" /> Total Debit (Pengeluaran)
              </span>
              <div className="text-2xl font-black text-[#EF4444] mt-1">
                Rp {mutationSummary.totalDebit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#BFC8D6]">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#F6D365]" />
                Filter Mutasi Dompet
              </span>
              <span className="text-[10px] text-[#7C8799]">{filteredMutations.length} Entri Ditemukan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7C8799] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari transaksi..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#121A2A] border border-[rgba(255,255,255,0.08)] rounded-xl pl-8 pr-3 py-2 text-xs text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="bg-[#121A2A] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
              >
                <option value="all">Semua Jenis (Debit & Kredit)</option>
                <option value="debit">Hanya Debit</option>
                <option value="kredit">Hanya Kredit</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-[#121A2A] border border-[rgba(255,255,255,0.08)] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#D4AF37]"
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
                  className="w-1/2 bg-[#121A2A] border border-[rgba(255,255,255,0.08)] rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]"
                  title="Dari Tanggal"
                />
                <span className="text-[#7C8799] text-xs">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-1/2 bg-[#121A2A] border border-[rgba(255,255,255,0.08)] rounded-xl px-2 py-2 text-[11px] text-white focus:outline-none focus:border-[#D4AF37]"
                  title="Sampai Tanggal"
                />
              </div>
            </div>
          </div>

          {/* Mutasi Table View (Matching Exact User Layout) */}
          <div className="border border-[rgba(255,255,255,0.08)] rounded-2xl overflow-hidden bg-[#0B1220]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#121A2A] text-[#7C8799] text-xs uppercase font-extrabold border-b border-[rgba(255,255,255,0.08)]">
                    <th className="py-3.5 px-4">Tanggal</th>
                    <th className="py-3.5 px-4">Keterangan</th>
                    <th className="py-3.5 px-4 text-right">Debit</th>
                    <th className="py-3.5 px-4 text-right">Kredit</th>
                    <th className="py-3.5 px-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.06)] text-xs">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[#7C8799] font-medium">
                        Tidak ada riwayat mutasi untuk filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const dateObj = new Date(m.date);
                      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

                      return (
                        <tr key={m.id} className="hover:bg-[rgba(255,255,255,0.03)] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[#BFC8D6] whitespace-nowrap font-bold">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-white">{m.description}</div>
                            <div className="text-[10px] text-[#7C8799] flex items-center gap-2 mt-0.5">
                              <span className="bg-[rgba(255,255,255,0.06)] px-2 py-0.5 rounded-lg text-[#BFC8D6] font-medium">
                                {m.category}
                              </span>
                              {m.paidBy && (
                                <span className="text-[#F6D365] font-medium">
                                  Oleh: {m.paidBy}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#EF4444] whitespace-nowrap">
                            {m.type === 'debit' ? formatK(m.debitAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-[#22C55E] whitespace-nowrap">
                            {m.type === 'kredit' ? formatK(m.kreditAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-white whitespace-nowrap bg-[#121A2A]/60">
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
