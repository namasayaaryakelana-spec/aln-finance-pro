import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { calculateWalletMutations } from '../../utils/mutationHelper';
import {
  X,
  Filter,
  Search,
  ArrowUpRight,
  ArrowDownLeft,
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

  const formatK = (val: number) => {
    if (val === 0) return '-';
    if (val >= 1000) {
      return `${(val / 1000).toLocaleString('id-ID')}K`;
    }
    return val.toLocaleString('id-ID');
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto">
      <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between bg-[#0B1220]">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: activeWallet.color }}
            >
              <IconComp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-white">Mutasi Dompet (Debit & Kredit)</h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)]">
                  {activeWallet.currency}
                </span>
              </div>
              <p className="text-xs text-[#7C8799]">Histori mutasi rekening & pencatatan saldo berjalan real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body & Controls */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
          
          {/* Wallet Selector & Financial Overview Card */}
          <div className="bg-[#0B1220] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.08)] pb-4">
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <span className="text-xs font-bold text-[#BFC8D6]">Pilih Dompet:</span>
                <select
                  value={selectedWalletId}
                  onChange={(e) => setSelectedWalletId(e.target.value)}
                  className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] text-white font-bold text-xs rounded-2xl px-3.5 py-2 focus:ring-2 focus:ring-[#D4AF37] outline-none"
                >
                  {filteredWallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({w.currency} {w.balance.toLocaleString('id-ID')})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right w-full sm:w-auto">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#7C8799] block">Saldo Saat Ini</span>
                <span className="text-2xl font-black text-white">
                  Rp {mutationSummary.currentBalance.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Total Debit & Total Kredit Summary */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#121A2A] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#EF4444] mb-1">
                  <ArrowUpRight className="w-4 h-4 text-[#EF4444]" />
                  Total Debit (Pengeluaran)
                </div>
                <div className="text-lg font-black text-[#EF4444]">
                  Rp {mutationSummary.totalDebit.toLocaleString('id-ID')}
                </div>
              </div>

              <div className="bg-[#121A2A] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#22C55E] mb-1">
                  <ArrowDownLeft className="w-4 h-4 text-[#22C55E]" />
                  Total Kredit (Pemasukan)
                </div>
                <div className="text-lg font-black text-[#22C55E]">
                  Rp {mutationSummary.totalKredit.toLocaleString('id-ID')}
                </div>
              </div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-[#BFC8D6]">
              <span className="flex items-center gap-1.5">
                <Filter className="w-4 h-4 text-[#F6D365]" />
                Filter & Pencarian Mutasi
              </span>
              <span className="text-[10px] text-[#7C8799]">{filteredMutations.length} Mutasi Ditemukan</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#7C8799] absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Cari keterangan..."
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
                <option value="debit">Hanya Debit (Pengeluaran)</option>
                <option value="kredit">Hanya Kredit (Pemasukan)</option>
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

          {/* Mutation Table Display */}
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
                      <td colSpan={5} className="py-8 text-center text-[#7C8799] font-medium">
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
                            <div className="text-[10px] text-[#7C8799] flex items-center gap-1.5 mt-0.5">
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

        {/* Modal Footer */}
        <div className="p-4 border-t border-[rgba(255,255,255,0.08)] bg-[#0B1220] flex items-center justify-between">
          <span className="text-xs text-[#7C8799]">
            Total {filteredMutations.length} entri mutasi
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-white text-xs font-bold transition-colors"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
};
