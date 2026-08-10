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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-3 sm:p-4 lg:p-6 overflow-y-auto animate-fade-in">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] text-[var(--text-primary)] rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-[var(--border)] flex items-center justify-between bg-[var(--card-bg)]">
          <div className="flex items-center gap-3.5">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-md flex-shrink-0"
              style={{ backgroundColor: activeWallet.color }}
            >
              <IconComp className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Mutasi Dompet (Debit & Kredit)</h3>
                <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
                  {activeWallet.currency}
                </span>
              </div>
              <p className="text-xs text-[var(--text-secondary)]">Histori mutasi rekening & pencatatan saldo berjalan real-time</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Wallet Selector & Totals Header Bar */}
        <div className="p-5 sm:p-6 space-y-4 bg-[var(--input-bg)] border-b border-[var(--border)]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-bold text-[var(--text-secondary)]">Pilih Akun / Rekening:</label>
            <select
              value={selectedWalletId}
              onChange={(e) => setSelectedWalletId(e.target.value)}
              className="bg-[var(--card-bg)] border border-[var(--input-border)] text-[var(--text-primary)] text-xs font-bold rounded-2xl px-4 py-2.5 outline-none focus:border-[var(--gold-primary)]"
            >
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name} — Rp {w.balance.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </div>

          {/* Cards Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-[var(--card-bg)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider block">Saldo Terkini</span>
              <div className="text-xl font-black text-[var(--text-primary)] mt-0.5 font-mono">
                Rp {mutationSummary.currentBalance.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" /> Total Kredit
              </span>
              <div className="text-xl font-black text-emerald-500 mt-0.5 font-mono">
                Rp {mutationSummary.totalKredit.toLocaleString('id-ID')}
              </div>
            </div>

            <div className="bg-[var(--card-bg)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-bold text-red-500 uppercase tracking-wider flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" /> Total Debit
              </span>
              <div className="text-xl font-black text-red-500 mt-0.5 font-mono">
                Rp {mutationSummary.totalDebit.toLocaleString('id-ID')}
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 sm:p-5 border-b border-[var(--border)] bg-[var(--card-bg)] space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-[var(--text-primary)]">
            <span className="flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
              <Filter className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              Filter Mutasi Rekening
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-mono">{filteredMutations.length} Transaksi</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari transaksi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl pl-8 pr-3 py-2 text-xs text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
            >
              <option value="all">Semua Jenis (Debit & Kredit)</option>
              <option value="debit">Hanya Debit</option>
              <option value="kredit">Hanya Kredit</option>
            </select>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-3 py-2 text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
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
                className="w-1/2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-2 py-2 text-[11px] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                title="Dari Tanggal"
              />
              <span className="text-[var(--text-muted)] text-xs">-</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-1/2 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-xl px-2 py-2 text-[11px] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                title="Sampai Tanggal"
              />
            </div>
          </div>
        </div>

        {/* Mutasi Table */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          <div className="border border-[var(--border)] rounded-2xl overflow-hidden bg-[var(--card-bg)]">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[var(--input-bg)] text-[var(--text-muted)] text-[11px] uppercase font-extrabold border-b border-[var(--border)]">
                    <th className="py-3 px-4">Tanggal</th>
                    <th className="py-3 px-4">Keterangan</th>
                    <th className="py-3 px-4 text-right">Debit</th>
                    <th className="py-3 px-4 text-right">Kredit</th>
                    <th className="py-3 px-4 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-xs">
                  {filteredMutations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-[var(--text-muted)] font-medium">
                        Tidak ada catatan mutasi untuk kriteria ini.
                      </td>
                    </tr>
                  ) : (
                    filteredMutations.map((m) => {
                      const dateObj = new Date(m.date);
                      const formattedDate = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}`;

                      return (
                        <tr key={m.id} className="hover:bg-[var(--input-bg)] transition-colors">
                          <td className="py-3.5 px-4 font-mono text-[var(--text-secondary)] font-bold whitespace-nowrap">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[var(--text-primary)]">{m.description}</div>
                            <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-2 mt-0.5">
                              <span className="bg-[var(--input-bg)] px-2 py-0.5 rounded-lg text-[var(--text-secondary)] font-medium border border-[var(--border)]">
                                {m.category}
                              </span>
                              {m.paidBy && (
                                <span className="text-[var(--gold-primary)] font-medium">
                                  Oleh: {m.paidBy}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-red-500 whitespace-nowrap">
                            {m.type === 'debit' ? formatK(m.debitAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-extrabold text-emerald-500 whitespace-nowrap">
                            {m.type === 'kredit' ? formatK(m.kreditAmount) : '-'}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-[var(--text-primary)] whitespace-nowrap bg-[var(--input-bg)]">
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
        <div className="p-4 border-t border-[var(--border)] bg-[var(--input-bg)] flex justify-between items-center text-xs">
          <span className="text-[var(--text-muted)] text-[11px]">Real-time Mutation Engine</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
