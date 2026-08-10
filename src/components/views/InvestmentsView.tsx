import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import {
  TrendingUp,
  Coins,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  Building,
  ShieldCheck,
  Landmark,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Info,
  X
} from 'lucide-react';
import { Investment, Scope } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from 'recharts';

const CATEGORIES_CONFIG: {
  [key: string]: { label: string; icon: any; color: string; badgeBg: string; border: string }
} = {
  emas: { label: 'Emas & Logam Mulia', icon: Coins, color: '#D4AF37', badgeBg: 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)]', border: 'border-[var(--gold-badge-border)]' },
  saham: { label: 'Saham & Ekuitas', icon: TrendingUp, color: '#10B981', badgeBg: 'bg-emerald-500/15 text-emerald-500', border: 'border-emerald-500/30' },
  reksadana: { label: 'Reksa Dana', icon: PieIcon, color: '#3B82F6', badgeBg: 'bg-blue-500/15 text-blue-500', border: 'border-blue-500/30' },
  crypto: { label: 'Crypto & Digital Asset', icon: DollarSign, color: '#A78BFA', badgeBg: 'bg-purple-500/15 text-purple-500', border: 'border-purple-500/30' },
  obligasi: { label: 'Obligasi & SBN', icon: ShieldCheck, color: '#06B6D4', badgeBg: 'bg-cyan-500/15 text-cyan-500', border: 'border-cyan-500/30' },
  deposito: { label: 'Deposito Bank', icon: Landmark, color: '#94A3B8', badgeBg: 'bg-slate-500/15 text-slate-400', border: 'border-slate-500/30' },
  properti: { label: 'Properti & Real Estate', icon: Building, color: '#F97316', badgeBg: 'bg-orange-500/15 text-orange-500', border: 'border-orange-500/30' },
  lainnya: { label: 'Investasi Lainnya', icon: Layers, color: '#EC4899', badgeBg: 'bg-pink-500/15 text-pink-500', border: 'border-pink-500/30' }
};

export const InvestmentsView: React.FC = () => {
  const { isDark } = useTheme();
  const {
    filteredInvestments,
    totalBalance,
    totalInvestment,
    totalInvestmentInitial,
    totalInvestmentReturn,
    totalAssets,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    wallets,
    addTransaction,
    currentScope,
    addToast
  } = useFinance();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Modal Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);

  // Form Fields
  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('saham');
  const [initialAmount, setInitialAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [units, setUnits] = useState('');
  const [platform, setPlatform] = useState('');
  const [notes, setNotes] = useState('');
  const [scope, setScope] = useState<Scope>('personal');

  // Wallet deduction toggle for new investment purchase
  const [deductFromWallet, setDeductFromWallet] = useState(false);
  const [selectedWalletId, setSelectedWalletId] = useState<string>(wallets[0]?.id || '');

  // Quick Update Market Value Modal State
  const [updatingInv, setUpdatingInv] = useState<Investment | null>(null);
  const [quickNewAmount, setQuickNewAmount] = useState('');

  // Delete Confirmation ID
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered List
  const displayInvestments = filteredInvestments.filter(inv => {
    const matchesSearch =
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.platform.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || inv.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  // Calculate overall Return percentage
  const totalReturnPercent =
    totalInvestmentInitial > 0
      ? (totalInvestmentReturn / totalInvestmentInitial) * 100
      : 0;

  // Chart data allocation by category
  const categoryAllocation = Object.keys(CATEGORIES_CONFIG).map(catKey => {
    const sum = filteredInvestments
      .filter(inv => inv.category === catKey)
      .reduce((acc, inv) => acc + inv.currentAmount, 0);
    return {
      name: CATEGORIES_CONFIG[catKey].label,
      value: sum,
      color: CATEGORIES_CONFIG[catKey].color
    };
  }).filter(item => item.value > 0);

  // Reset form
  const resetForm = () => {
    setEditingInv(null);
    setName('');
    setCategory('saham');
    setInitialAmount('');
    setCurrentAmount('');
    setUnits('');
    setPlatform('');
    setNotes('');
    setScope('personal');
    setDeductFromWallet(false);
    setSelectedWalletId(wallets[0]?.id || '');
    setIsModalOpen(false);
  };

  // Open Edit Modal
  const handleStartEdit = (inv: Investment) => {
    setEditingInv(inv);
    setName(inv.name);
    setCategory(inv.category);
    setInitialAmount(inv.initialAmount.toString());
    setCurrentAmount(inv.currentAmount.toString());
    setUnits(inv.units ? inv.units.toString() : '');
    setPlatform(inv.platform);
    setNotes(inv.notes || '');
    setScope(inv.scope || 'personal');
    setDeductFromWallet(false);
    setIsModalOpen(true);
  };

  // Save Modal Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      addToast('error', 'Validasi Gagal', 'Nama aset investasi wajib diisi.');
      return;
    }

    const initVal = parseFloat(initialAmount) || 0;
    const currVal = parseFloat(currentAmount) || initVal;
    const unitsVal = parseFloat(units) || undefined;

    if (initVal <= 0 && currVal <= 0) {
      addToast('error', 'Validasi Gagal', 'Masukkan nominal nilai awal / nilai saat ini.');
      return;
    }

    const returnPct = initVal > 0 ? ((currVal - initVal) / initVal) * 100 : 0;

    if (editingInv) {
      updateInvestment({
        ...editingInv,
        name: name.trim(),
        category: category as any,
        initialAmount: initVal,
        currentAmount: currVal,
        returnPercentage: returnPct,
        units: unitsVal,
        platform: platform.trim() || 'Mandiri / Pribadi',
        scope,
        notes: notes.trim()
      });
    } else {
      if (deductFromWallet && selectedWalletId) {
        const wallet = wallets.find(w => w.id === selectedWalletId);
        if (wallet) {
          if (wallet.balance < initVal) {
            addToast('error', 'Saldo Tidak Cukup', `Saldo di ${wallet.name} (Rp ${wallet.balance.toLocaleString('id-ID')}) tidak cukup untuk alokasi modal investasi Rp ${initVal.toLocaleString('id-ID')}`);
            return;
          }

          addTransaction({
            type: 'expense',
            amount: initVal,
            currency: wallet.currency,
            title: `Pembelian Aset: ${name.trim()}`,
            category: 'Tabungan & Investasi',
            subcategory: CATEGORIES_CONFIG[category]?.label || 'Investasi',
            walletId: selectedWalletId,
            scope,
            date: new Date().toISOString().split('T')[0],
            note: `Pembelian alokasi investasi ${name.trim()} via ${platform || 'Broker'}`
          });
        }
      }

      addInvestment({
        name: name.trim(),
        category: category as any,
        initialAmount: initVal,
        currentAmount: currVal,
        returnPercentage: returnPct,
        units: unitsVal,
        platform: platform.trim() || 'Mandiri / Pribadi',
        scope,
        notes: notes.trim()
      });
    }

    resetForm();
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Asset Overview */}
      <div className="bg-[var(--card-bg)] p-6 sm:p-7 rounded-3xl border border-[var(--card-border)] shadow-2xl relative overflow-hidden transition-colors">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold text-[var(--gold-primary)] uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)]">
                <Coins className="w-3.5 h-3.5" />
                Investments & Assets
              </span>
              <span className="text-xs text-[var(--text-secondary)] font-semibold">
                Scope: <strong className="text-[var(--text-primary)]">{currentScope.toUpperCase()}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black text-[var(--text-primary)] font-mono tracking-tight">
              Rp {totalAssets.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1 font-medium">
              Total Kekayaan Aset Bersih Keseluruhan (Kas Dompet + Portofolio Investasi)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Tambah Investasi Baru
            </button>
          </div>
        </div>

        {/* Breakdown Sub-Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mt-6 pt-6 border-t border-[var(--border)] relative z-10">
          <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
              <Wallet className="w-3.5 h-3.5 text-emerald-500" />
              Kas / Saldo Dompet
            </span>
            <p className="text-sm sm:text-base font-black text-emerald-500 font-mono mt-1">
              Rp {totalBalance.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-[var(--text-secondary)]">Siap Pakai & Liquid</span>
          </div>

          <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
              Nilai Pasar Investasi
            </span>
            <p className="text-sm sm:text-base font-black text-[var(--gold-primary)] font-mono mt-1">
              Rp {totalInvestment.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-[var(--text-secondary)]">{filteredInvestments.length} Instrumen Aset</span>
          </div>

          <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
              <Building className="w-3.5 h-3.5 text-blue-500" />
              Total Modal Pembelian
            </span>
            <p className="text-sm sm:text-base font-black text-[var(--text-primary)] mt-1 font-mono">
              Rp {totalInvestmentInitial.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-[var(--text-secondary)]">Modal Awal Diinvestasikan</span>
          </div>

          <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <span className="text-[10px] font-bold text-[var(--text-muted)] flex items-center gap-1 uppercase tracking-wider">
              {totalInvestmentReturn >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-red-500" />
              )}
              Profit / Loss (Gain)
            </span>
            <p
              className={`text-sm sm:text-base font-black mt-1 font-mono ${
                totalInvestmentReturn >= 0 ? 'text-emerald-500' : 'text-red-500'
              }`}
            >
              {totalInvestmentReturn >= 0 ? '+' : ''}Rp {totalInvestmentReturn.toLocaleString('id-ID')}
            </p>
            <span
              className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                totalInvestmentReturn >= 0
                  ? 'bg-emerald-500/15 text-emerald-500'
                  : 'bg-red-500/15 text-red-500'
              }`}
            >
              {totalReturnPercent >= 0 ? '+' : ''}
              {totalReturnPercent.toFixed(1)}% Return Overall
            </span>
          </div>
        </div>
      </div>

      {/* Allocation Chart & Quick Info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Category Allocation Donut Chart */}
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-4 transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              <PieIcon className="w-4 h-4 text-[var(--gold-primary)]" />
              Alokasi Aset Investasi
            </h3>
            <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Nilai Pasar</span>
          </div>

          {categoryAllocation.length === 0 ? (
            <div className="text-center py-10 text-[var(--text-muted)] text-xs">
              Belum ada aset investasi tercatat.
            </div>
          ) : (
            <div className="h-56 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryAllocation}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryAllocation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `Rp ${Number(val).toLocaleString('id-ID')}`}
                    contentStyle={{
                      backgroundColor: isDark ? '#121A2A' : '#FFFFFF',
                      borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                      borderRadius: '16px',
                      color: isDark ? '#FFF' : '#0F172A',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase">Total Portofolio</span>
                <span className="text-xs font-black text-[var(--text-primary)] font-mono">
                  Rp {(totalInvestment / 1000000).toFixed(1)}Jt
                </span>
              </div>
            </div>
          )}

          {/* Legend Items List */}
          <div className="space-y-2 pt-2 border-t border-[var(--border)] max-h-36 overflow-y-auto custom-scrollbar">
            {categoryAllocation.map((item, idx) => {
              const pct = totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[var(--text-secondary)] truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="font-bold text-[var(--text-primary)]">Rp {item.value.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-[var(--gold-primary)] bg-[var(--gold-badge-bg)] px-2 py-0.5 rounded-lg font-extrabold border border-[var(--gold-badge-border)]">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Insights & Guidance */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col justify-between space-y-4 transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                <Sparkles className="w-4 h-4 text-[var(--gold-primary)]" />
                Tips & Panduan Diversifikasi Portofolio
              </h3>
              <span className="text-[10px] text-[var(--gold-primary)] font-bold bg-[var(--gold-badge-bg)] px-3 py-1 rounded-full border border-[var(--gold-badge-border)]">
                Wealth Intelligence
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
              <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-[var(--gold-primary)]">
                  <Coins className="w-4 h-4" />
                  Emas & Safe Haven Asset
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Melindungi kekayaan Anda dari inflasi jangka panjang. Disarankan porsi 10% - 20% dari total aset.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-emerald-500">
                  <TrendingUp className="w-4 h-4" />
                  Saham & Reksa Dana
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Instrumen pertumbuhan modal (capital gain) dan dividen jangka menengah hingga panjang.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-blue-500">
                  <ShieldCheck className="w-4 h-4" />
                  Obligasi & Deposito
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Memberikan arus kas bunga/kupon yang stabil dan risiko sangat terukur untuk dana siaga.
                </p>
              </div>

              <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-purple-500">
                  <DollarSign className="w-4 h-4" />
                  Crypto & High Risk
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Volatilitas tinggi untuk alokasi spekulatif kecil (5% - 10%) bagi pemohon imbal hasil tinggi.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] p-4 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-[var(--gold-primary)] font-bold">
              <Info className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
              <span>Semua nilai investasi langsung terakumulasi ke dalam Total Aset Kekayaan Bersih.</span>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="text-[11px] font-extrabold text-[var(--gold-primary)] hover:underline shrink-0"
            >
              + Input Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3.5 bg-[var(--card-bg)] p-4.5 rounded-3xl border border-[var(--card-border)] transition-colors">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Cari aset (mis: Emas Antam, BBCA, Bitcoin)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--input-bg)] pl-10 pr-3.5 py-2.5 rounded-2xl border border-[var(--input-border)] text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--gold-primary)]"
          />
        </div>

        {/* Category Chips Horizontal Filter */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 text-xs font-bold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'btn-gold text-[#0B1220] shadow-md font-extrabold'
                : 'bg-[var(--input-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]'
            }`}
          >
            Semua Aset ({filteredInvestments.length})
          </button>

          {Object.keys(CATEGORIES_CONFIG).map(catKey => {
            const cfg = CATEGORIES_CONFIG[catKey];
            const count = filteredInvestments.filter(i => i.category === catKey).length;
            const isSel = selectedCategory === catKey;
            return (
              <button
                key={catKey}
                onClick={() => setSelectedCategory(catKey)}
                className={`px-3.5 py-2 rounded-2xl transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSel
                    ? `${cfg.badgeBg} ${cfg.border} font-extrabold shadow-md`
                    : 'bg-[var(--input-bg)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--card-bg)] text-[var(--text-primary)] font-mono">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Investment List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {displayInvestments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] space-y-3">
            <Coins className="w-10 h-10 text-[var(--text-muted)] mx-auto" />
            <p className="text-[var(--text-primary)] font-bold text-sm">Tidak ada aset investasi ditemukan.</p>
            <p className="text-[var(--text-secondary)] text-xs">Tambahkan instrumen investasi baru untuk melihat imbal hasil Anda.</p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-2 px-4 py-2.5 btn-gold text-[#0B1220] font-extrabold rounded-2xl text-xs transition-all inline-flex items-center gap-1"
            >
              <Plus className="w-4 h-4" /> Tambah Investasi Pertama
            </button>
          </div>
        ) : (
          displayInvestments.map(inv => {
            const cfg = CATEGORIES_CONFIG[inv.category] || CATEGORIES_CONFIG['lainnya'];
            const Icon = cfg.icon;
            const profit = inv.currentAmount - inv.initialAmount;
            const returnPct = inv.initialAmount > 0 ? (profit / inv.initialAmount) * 100 : 0;
            const isProfit = profit >= 0;

            return (
              <div
                key={inv.id}
                className="bg-[var(--card-bg)] border border-[var(--card-border)] hover:border-[var(--gold-primary)] p-6 rounded-3xl shadow-2xl transition-all flex flex-col justify-between space-y-4 relative group"
              >
                <div>
                  {/* Top Header Row */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center p-2.5 shadow-md shrink-0 border"
                        style={{
                          backgroundColor: `${cfg.color}15`,
                          borderColor: `${cfg.color}40`,
                          color: cfg.color
                        }}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-[var(--text-primary)] line-clamp-1 font-['Plus_Jakarta_Sans',sans-serif]">{inv.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase border ${cfg.badgeBg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-[var(--text-secondary)] bg-[var(--input-bg)] px-2.5 py-0.5 rounded-full font-semibold border border-[var(--border)]">
                            {inv.platform || 'Mandiri'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirmation or Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {deletingId === inv.id ? (
                        <div className="flex items-center gap-1 bg-red-500/15 border border-red-500/30 p-1 rounded-xl">
                          <span className="text-[10px] text-red-500 font-bold px-1">Hapus?</span>
                          <button
                            onClick={() => {
                              deleteInvestment(inv.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-0.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-[10px] rounded-lg"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-1.5 py-0.5 bg-[var(--surface-secondary)] text-[var(--text-secondary)] text-[10px] rounded-lg"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(inv)}
                            className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--gold-primary)] transition-all border border-[var(--border)]"
                            title="Edit Data Asset"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(inv.id)}
                            className="p-2 rounded-xl bg-[var(--input-bg)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 transition-all border border-[var(--border)]"
                            title="Hapus Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Value Row */}
                  <div className="mt-4 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-[var(--text-secondary)]">Nilai Saat Ini (Market):</span>
                      <span className="font-black text-base text-[var(--text-primary)] font-mono">
                        Rp {inv.currentAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[var(--border)] font-mono">
                      <span className="text-[var(--text-secondary)] font-medium">Modal Awal / Beli:</span>
                      <span className="font-semibold text-[var(--text-secondary)]">
                        Rp {inv.initialAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {inv.units && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-[var(--text-secondary)] font-medium">Jumlah Unit:</span>
                        <span className="font-semibold text-[var(--gold-primary)] font-mono">
                          {inv.units.toLocaleString('id-ID')} Unit / Gram
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profit / Loss Indicator Badge */}
                  <div className="flex items-center justify-between mt-3 px-1">
                    <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider">Imbal Hasil (Gain/Loss):</span>
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-extrabold px-3 py-1 rounded-2xl border font-mono ${
                        isProfit
                          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500'
                          : 'bg-red-500/15 border-red-500/30 text-red-500'
                      }`}
                    >
                      {isProfit ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                      <span>
                        {isProfit ? '+' : ''}Rp {profit.toLocaleString('id-ID')} ({returnPct >= 0 ? '+' : ''}
                        {returnPct.toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {inv.notes && (
                    <p className="text-[11px] text-[var(--text-secondary)] italic mt-2 line-clamp-2 px-1">
                      "{inv.notes}"
                    </p>
                  )}
                </div>

                {/* Quick Update Price Action Button */}
                <button
                  onClick={() => {
                    setUpdatingInv(inv);
                    setQuickNewAmount(inv.currentAmount.toString());
                  }}
                  className="w-full py-2.5 bg-[var(--input-bg)] hover:bg-[var(--border)] border border-[var(--border)] hover:border-[var(--gold-primary)] text-[var(--text-secondary)] font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 group-hover:text-[var(--gold-primary)]"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-[var(--gold-primary)]" /> Update Nilai Saat Ini
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT INVESTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-lg rounded-3xl p-6 relative text-[var(--text-primary)] shadow-2xl space-y-5 my-8 animate-fade-in transition-colors">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)]">
                  <Coins className="w-5 h-5 text-[var(--gold-primary)]" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
                    {editingInv ? 'Edit Asset Investasi' : 'Tambah Investasi Baru'}
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)]">
                    Nilai pasar akan otomatis diakumulasi ke Total Aset Bersih.
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Nama Asset / Instrumen *</label>
                <input
                  type="text"
                  placeholder="Mis: Emas Antam 10gr, Saham BBCA, Bitcoin"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Kategori Investasi</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-bold"
                  >
                    {Object.keys(CATEGORIES_CONFIG).map(catKey => (
                      <option key={catKey} value={catKey}>
                        {CATEGORIES_CONFIG[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Platform / Broker</label>
                  <input
                    type="text"
                    placeholder="Mis: Pegadaian, Bibit, Ajaib, Indodax"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Modal Awal / Nilai Beli (Rp) *</label>
                  <input
                    type="number"
                    placeholder="Mis: 10000000"
                    value={initialAmount}
                    onChange={e => {
                      setInitialAmount(e.target.value);
                      if (!currentAmount) setCurrentAmount(e.target.value);
                    }}
                    className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[var(--text-secondary)] font-bold mb-1">Nilai Pasar Saat Ini (Rp)</label>
                  <input
                    type="number"
                    placeholder="Mis: 11500000"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-black text-sm focus:outline-none focus:border-[var(--gold-primary)] font-mono"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
                >
                  {editingInv ? 'Simpan Perubahan Asset' : '+ Simpan Asset Investasi'}
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="py-3 px-4 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold rounded-2xl text-xs transition-colors"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
