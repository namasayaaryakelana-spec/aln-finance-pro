import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  TrendingUp,
  Coins,
  DollarSign,
  PieChart as PieIcon,
  Plus,
  Pencil,
  Trash2,
  Search,
  Check,
  X,
  Building,
  ShieldCheck,
  Landmark,
  Wallet,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Layers,
  Info
} from 'lucide-react';
import { Investment, Scope } from '../../types';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CATEGORIES_CONFIG: {
  [key: string]: { label: string; icon: any; color: string; badgeBg: string; border: string }
} = {
  emas: { label: 'Emas & Logam Mulia', icon: Coins, color: '#F59E0B', badgeBg: 'bg-amber-500/10 text-amber-400', border: 'border-amber-500/30' },
  saham: { label: 'Saham & Ekuitas', icon: TrendingUp, color: '#10B981', badgeBg: 'bg-emerald-500/10 text-emerald-400', border: 'border-emerald-500/30' },
  reksadana: { label: 'Reksa Dana', icon: PieIcon, color: '#3B82F6', badgeBg: 'bg-blue-500/10 text-blue-400', border: 'border-blue-500/30' },
  crypto: { label: 'Crypto & Digital Asset', icon: DollarSign, color: '#8B5CF6', badgeBg: 'bg-purple-500/10 text-purple-400', border: 'border-purple-500/30' },
  obligasi: { label: 'Obligasi & SBN', icon: ShieldCheck, color: '#06B6D4', badgeBg: 'bg-cyan-500/10 text-cyan-400', border: 'border-cyan-500/30' },
  deposito: { label: 'Deposito Bank', icon: Landmark, color: '#64748B', badgeBg: 'bg-slate-500/10 text-slate-300', border: 'border-slate-500/30' },
  properti: { label: 'Properti & Real Estate', icon: Building, color: '#F97316', badgeBg: 'bg-orange-500/10 text-orange-400', border: 'border-orange-500/30' },
  lainnya: { label: 'Investasi Lainnya', icon: Layers, color: '#EC4899', badgeBg: 'bg-pink-500/10 text-pink-400', border: 'border-pink-500/30' }
};

export const InvestmentsView: React.FC = () => {
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
      // Edit existing
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
      // Handle Wallet Deduction if toggled
      if (deductFromWallet && selectedWalletId) {
        const wallet = wallets.find(w => w.id === selectedWalletId);
        if (wallet) {
          if (wallet.balance < initVal) {
            addToast('error', 'Saldo Tidak Cukup', `Saldo di ${wallet.name} (Rp ${wallet.balance.toLocaleString('id-ID')}) tidak cukup untuk alokasi modal investasi Rp ${initVal.toLocaleString('id-ID')}`);
            return;
          }

          // Add transaction record
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

      // Add new investment
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

  // Quick Update Market Value
  const handleQuickUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatingInv) return;

    const newAmt = parseFloat(quickNewAmount);
    if (isNaN(newAmt) || newAmt < 0) {
      addToast('error', 'Input Tidak Valid', 'Masukkan angka nilai saat ini yang valid.');
      return;
    }

    const initVal = updatingInv.initialAmount;
    const returnPct = initVal > 0 ? ((newAmt - initVal) / initVal) * 100 : 0;

    updateInvestment({
      ...updatingInv,
      currentAmount: newAmt,
      returnPercentage: returnPct
    });

    setUpdatingInv(null);
    setQuickNewAmount('');
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner / Asset Overview */}
      <div className="bg-gradient-to-br from-slate-900 via-[#0B132B] to-slate-950 p-6 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Coins className="w-3.5 h-3.5" />
                Aset & Portofolio Investasi
              </span>
              <span className="text-xs text-slate-400 font-semibold">
                Scope: <strong className="text-white">{currentScope.toUpperCase()}</strong>
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
              Rp {totalAssets.toLocaleString('id-ID')}
            </h2>
            <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
              <span>Total Kekayaan Aset Bersih Keseluruhan (Kas Dompet + Portofolio Investasi)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4 stroke-[3]" /> Tambah Investasi Baru
            </button>
          </div>
        </div>

        {/* Breakdown Sub-Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-800/80 relative z-10">
          {/* Card 1: Kas & Dompet Liquid */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              Kas / Saldo Dompet
            </span>
            <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
              Rp {totalBalance.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-slate-400">Siap Pakai & Liquid</span>
          </div>

          {/* Card 2: Total Nilai Portofolio */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              Nilai Pasar Investasi
            </span>
            <p className="text-sm sm:text-base font-extrabold text-amber-300 mt-1">
              Rp {totalInvestment.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-slate-400">{filteredInvestments.length} Instrumen Aset</span>
          </div>

          {/* Card 3: Total Modal Awal */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              <Building className="w-3.5 h-3.5 text-blue-400" />
              Total Modal Pembelian
            </span>
            <p className="text-sm sm:text-base font-extrabold text-slate-200 mt-1">
              Rp {totalInvestmentInitial.toLocaleString('id-ID')}
            </p>
            <span className="text-[9px] text-slate-400">Modal Awal Diinvestasikan</span>
          </div>

          {/* Card 4: Profit/Loss */}
          <div className="bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/70">
            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
              {totalInvestmentReturn >= 0 ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
              )}
              Profit / Loss (Gain)
            </span>
            <p
              className={`text-sm sm:text-base font-extrabold mt-1 ${
                totalInvestmentReturn >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {totalInvestmentReturn >= 0 ? '+' : ''}Rp {totalInvestmentReturn.toLocaleString('id-ID')}
            </p>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                totalInvestmentReturn >= 0
                  ? 'bg-emerald-500/20 text-emerald-300'
                  : 'bg-rose-500/20 text-rose-300'
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
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-cyan-400" />
              Alokasi Aset Investasi
            </h3>
            <span className="text-[10px] text-slate-400 font-semibold">Berdasarkan Nilai Pasar</span>
          </div>

          {categoryAllocation.length === 0 ? (
            <div className="text-center py-10 text-slate-500 text-xs">
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
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => `Rp ${Number(val).toLocaleString('id-ID')}`}
                    contentStyle={{
                      backgroundColor: '#0A0F1D',
                      borderColor: '#1E293B',
                      borderRadius: '12px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Portofolio</span>
                <span className="text-xs font-black text-white">
                  Rp {(totalInvestment / 1000000).toFixed(1)}Jt
                </span>
              </div>
            </div>
          )}

          {/* Legend Items List */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60 max-h-36 overflow-y-auto custom-scrollbar">
            {categoryAllocation.map((item, idx) => {
              const pct = totalInvestment > 0 ? (item.value / totalInvestment) * 100 : 0;
              return (
                <div key={idx} className="flex items-center justify-between text-xs font-medium">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-300 truncate">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-bold text-white">Rp {item.value.toLocaleString('id-ID')}</span>
                    <span className="text-[10px] text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded font-bold">
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Quick Insights & Guidance */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                Tips & Panduan Diversifikasi Portofolio
              </h3>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                AI Wealth Smart
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-amber-400">
                  <Coins className="w-4 h-4" />
                  Emas & Safe Haven Asset
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Melindungi kekayaan Anda dari inflasi jangka panjang. Disarankan porsi 10% - 20% dari total aset.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                  Saham & Reksa Dana
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Instrumen pertumbuhan modal (capital gain) dan dividen jangka menengah hingga panjang.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-cyan-400">
                  <ShieldCheck className="w-4 h-4" />
                  Obligasi & Deposito
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Memberikan arus kas bunga/kupon yang stabil dan risiko sangat terukur untuk dana siaga.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/80 space-y-1">
                <div className="flex items-center gap-2 font-extrabold text-purple-400">
                  <DollarSign className="w-4 h-4" />
                  Crypto & High Risk
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Volatilitas tinggi untuk alokasi spekulatif kecil (5% - 10%) bagi pemohon imbal hasil tinggi.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-emerald-950/30 border border-emerald-500/20 p-3.5 rounded-2xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-300 font-bold">
              <Info className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Semua nilai investasi langsung terakumulasi ke dalam Total Aset Kekayaan Bersih.</span>
            </div>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="text-[11px] font-extrabold text-emerald-400 hover:underline shrink-0"
            >
              + Input Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder="Cari aset (mis: Emas Antam, BBCA, Bitcoin, Bibit)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-xs text-white focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Category Chips Horizontal Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 sm:pb-0 text-xs font-bold">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              selectedCategory === 'all'
                ? 'bg-emerald-500 text-slate-950 shadow-md font-extrabold'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
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
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                  isSel
                    ? `${cfg.badgeBg} ${cfg.border} font-extrabold shadow`
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <span>{cfg.label}</span>
                {count > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-200">
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Investment List Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayInvestments.length === 0 ? (
          <div className="col-span-full text-center py-12 bg-slate-900/60 rounded-3xl border border-slate-800 space-y-3">
            <Coins className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="text-slate-400 font-bold text-sm">Tidak ada aset investasi ditemukan.</p>
            <p className="text-slate-500 text-xs">Tambahkan instrumen investasi baru untuk melihat imbal hasil Anda.</p>
            <button
              onClick={() => {
                resetForm();
                setIsModalOpen(true);
              }}
              className="mt-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs transition-all inline-flex items-center gap-1"
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
                className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700 p-5 rounded-3xl shadow-xl transition-all flex flex-col justify-between space-y-4 relative group"
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
                        <h4 className="font-extrabold text-sm text-white line-clamp-1">{inv.name}</h4>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase border ${cfg.badgeBg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                          <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-md font-semibold border border-slate-800">
                            {inv.platform || 'Mandiri'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Delete Confirmation or Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {deletingId === inv.id ? (
                        <div className="flex items-center gap-1 bg-rose-950/90 border border-rose-800 p-1 rounded-xl">
                          <span className="text-[10px] text-rose-300 font-bold px-1">Hapus?</span>
                          <button
                            onClick={() => {
                              deleteInvestment(inv.id);
                              setDeletingId(null);
                            }}
                            className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-[10px] rounded"
                          >
                            Ya
                          </button>
                          <button
                            onClick={() => setDeletingId(null)}
                            className="px-1.5 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded"
                          >
                            X
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleStartEdit(inv)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-emerald-950 hover:text-emerald-300 text-slate-400 transition-all border border-slate-800"
                            title="Edit Data Asset"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setDeletingId(inv.id)}
                            className="p-1.5 rounded-lg bg-slate-950 hover:bg-rose-950 hover:text-rose-300 text-slate-400 transition-all border border-slate-800"
                            title="Hapus Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Main Value Row */}
                  <div className="mt-4 bg-slate-950/70 p-3.5 rounded-2xl border border-slate-800/80 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">Nilai Saat Ini (Market Value):</span>
                      <span className="font-extrabold text-base text-white">
                        Rp {inv.currentAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
                      <span className="text-slate-400 font-medium">Modal Awal / Beli:</span>
                      <span className="font-semibold text-slate-300">
                        Rp {inv.initialAmount.toLocaleString('id-ID')}
                      </span>
                    </div>

                    {inv.units && (
                      <div className="flex items-center justify-between text-xs pt-0.5">
                        <span className="text-slate-400 font-medium">Jumlah Unit:</span>
                        <span className="font-semibold text-cyan-300">
                          {inv.units.toLocaleString('id-ID')} Unit / Gram
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Profit / Loss Indicator Badge */}
                  <div className="flex items-center justify-between mt-3 px-1">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Imbal Hasil (Gain/Loss):</span>
                    <div
                      className={`inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl border ${
                        isProfit
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                          : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
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
                    <p className="text-[11px] text-slate-400 italic mt-2 line-clamp-2 px-1">
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
                  className="w-full py-2 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 group-hover:text-emerald-300"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-emerald-400" /> Update Nilai Saat Ini
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* CREATE / EDIT INVESTMENT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-lg rounded-3xl p-6 relative text-slate-100 shadow-2xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    {editingInv ? 'Edit Asset Investasi' : 'Tambah Investasi Baru'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Nilai pasar akan otomatis diakumulasi ke Total Aset Bersih.
                  </p>
                </div>
              </div>
              <button
                onClick={resetForm}
                className="p-2 rounded-full bg-slate-900 text-slate-400 hover:text-white transition-all hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nama Asset / Instrumen *</label>
                <input
                  type="text"
                  placeholder="Mis: Emas Antam 10gr, Saham BBCA, Bitcoin, Reksa Dana Sukorinvest"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Kategori Investasi</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    {Object.keys(CATEGORIES_CONFIG).map(catKey => (
                      <option key={catKey} value={catKey}>
                        {CATEGORIES_CONFIG[catKey].label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Platform / Broker</label>
                  <input
                    type="text"
                    placeholder="Mis: Pegadaian, Bibit, Ajaib, Indodax, BCA"
                    value={platform}
                    onChange={e => setPlatform(e.target.value)}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Modal Awal / Nilai Beli (Rp) *</label>
                  <input
                    type="number"
                    placeholder="Mis: 10000000"
                    value={initialAmount}
                    onChange={e => {
                      setInitialAmount(e.target.value);
                      if (!currentAmount) setCurrentAmount(e.target.value);
                    }}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Nilai Pasar Saat Ini (Rp) *</label>
                  <input
                    type="number"
                    placeholder="Mis: 12500000"
                    value={currentAmount}
                    onChange={e => setCurrentAmount(e.target.value)}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 font-bold mb-1">Jumlah Unit / Lot / Gram (Opsional)</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="Mis: 10 (gram) atau 50 (lot)"
                    value={units}
                    onChange={e => setUnits(e.target.value)}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-slate-400 font-bold mb-1">Scope / Cakupan</label>
                  <select
                    value={scope}
                    onChange={e => setScope(e.target.value as Scope)}
                    className="w-full bg-slate-950 px-3.5 py-2.5 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-semibold"
                  >
                    <option value="personal">Keuangan Pribadi</option>
                    <option value="business">Keuangan Bisnis</option>
                    <option value="all">Semua Scope</option>
                  </select>
                </div>
              </div>

              {/* Deduct from Wallet checkbox (Only for new items) */}
              {!editingInv && (
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer font-extrabold text-slate-200">
                    <input
                      type="checkbox"
                      checked={deductFromWallet}
                      onChange={e => setDeductFromWallet(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span>Potong Modal Beli dari Saldo Dompet (Pengeluaran)?</span>
                  </label>

                  {deductFromWallet && (
                    <div>
                      <label className="block text-slate-400 font-bold mb-1">Pilih Dompet Sumber Funds:</label>
                      <select
                        value={selectedWalletId}
                        onChange={e => setSelectedWalletId(e.target.value)}
                        className="w-full bg-slate-900 px-3.5 py-2 rounded-xl border border-slate-800 text-emerald-300 font-semibold"
                      >
                        {wallets.map(w => (
                          <option key={w.id} value={w.id}>
                            {w.name} (Saldo: Rp {w.balance.toLocaleString('id-ID')})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-400 font-bold mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Mis: Pembelian via promo cashback Pegadaian / Target hold 3 tahun..."
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-950 px-3.5 py-2 rounded-xl border border-slate-800 text-white focus:outline-none focus:border-amber-500 font-medium"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-400 hover:to-emerald-400 text-slate-950 font-extrabold rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {editingInv ? 'Simpan Perubahan Asset' : 'Simpan Asset Investasi Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK UPDATE MARKET VALUE MODAL */}
      {updatingInv && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-slate-800 w-full max-w-sm rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h4 className="font-extrabold text-sm text-white flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-emerald-400" />
                Update Nilai Pasar
              </h4>
              <button
                onClick={() => setUpdatingInv(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 font-medium">
              Update harga/nilai saat ini untuk <strong className="text-white">{updatingInv.name}</strong>:
            </p>

            <form onSubmit={handleQuickUpdateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold mb-1">Nilai Pasar Baru (Rp)</label>
                <input
                  type="number"
                  value={quickNewAmount}
                  onChange={e => setQuickNewAmount(e.target.value)}
                  className="w-full bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-white font-extrabold text-sm focus:outline-none focus:border-emerald-500"
                  autoFocus
                  required
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setUpdatingInv(null)}
                  className="px-3 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl shadow"
                >
                  Simpan Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
