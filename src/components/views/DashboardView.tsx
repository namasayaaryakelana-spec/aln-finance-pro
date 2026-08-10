import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Wallet,
  Coins,
  TrendingUp,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Zap,
  DollarSign,
  AlertTriangle,
  Calendar,
  ShieldCheck,
  Plus,
  BarChart3,
  CreditCard,
  CheckCircle2,
  FileSpreadsheet
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { getSubcategoriesForCategory, masterCategories } from '../../data/subcategories';

interface DashboardViewProps {
  openAddTxModal: () => void;
  openFastAITxModal: () => void;
  setActiveTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  openAddTxModal,
  openFastAITxModal,
  setActiveTab
}) => {
  const { isDark } = useTheme();
  const {
    currentScope,
    filteredTransactions,
    filteredWallets,
    totalBalance,
    totalInvestment,
    totalAssets,
    totalIncome,
    totalExpense,
    netFlow,
    healthScore,
    budgets,
    addTransaction,
    addToast,
    currentUser,
    syncStatus
  } = useFinance();

  // Time-based Executive Greeting
  const hour = new Date().getHours();
  const timeGreeting =
    hour < 12 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam';
  const userName = currentUser?.email
    ? currentUser.email.split('@')[0].replace('.', ' ')
    : 'Executive Client';
  const formattedDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  // Quick Action Form State
  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickCategory, setQuickCategory] = useState('Makan');
  const [quickSubcategory, setQuickSubcategory] = useState('Belanja Dapur');

  // Update defaults on type change
  useEffect(() => {
    const typeKey = quickType === 'expense' ? 'EXPENSE' : 'INCOME';
    const cats = Object.keys(masterCategories[typeKey]);
    if (cats.length > 0) {
      const defaultCat = cats[0];
      setQuickCategory(defaultCat);
      const subs = masterCategories[typeKey][defaultCat as keyof typeof masterCategories[typeof typeKey]] || [];
      setQuickSubcategory(subs[0] || '');
    }
  }, [quickType]);

  // Update subcategory whenever category changes
  useEffect(() => {
    const typeKey = quickType === 'expense' ? 'EXPENSE' : 'INCOME';
    const catMap = masterCategories[typeKey] as Record<string, string[]>;
    const subs = catMap[quickCategory] || getSubcategoriesForCategory(quickCategory);
    if (subs.length > 0 && !subs.includes(quickSubcategory)) {
      setQuickSubcategory(subs[0]);
    }
  }, [quickCategory, quickType]);

  // Calculate monthly cash flow data for Recharts
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const monthsList: { monthKey: string; monthLabel: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    monthsList.push({
      monthKey: `${yr}-${mo}`,
      monthLabel: monthNames[d.getMonth()]
    });
  }

  const chartData = monthsList.map(({ monthKey, monthLabel }) => {
    let income = 0;
    let expense = 0;
    filteredTransactions.forEach(t => {
      if (t.date && t.date.startsWith(monthKey)) {
        if (t.type === 'income') income += t.amount;
        if (t.type === 'expense') expense += t.amount;
      }
    });
    return {
      month: monthLabel,
      income,
      expense,
      net: income - expense
    };
  });

  // Category Pie Chart Data
  const categoryExpenses: { [key: string]: number } = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  const COLORS = ['#D4AF37', '#F6D365', '#22C55E', '#3B82F6', '#EF4444', '#A78BFA', '#06B6D4'];

  const pieData = Object.keys(categoryExpenses).map((catName, i) => ({
    name: catName,
    value: categoryExpenses[catName],
    color: COLORS[i % COLORS.length]
  }));

  const handleQuickSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(quickAmount);
    if (!quickTitle || isNaN(num) || num <= 0) {
      addToast('warning', 'Input Tidak Valid', 'Isi judul dan nominal angka positif.');
      return;
    }

    const wallet = filteredWallets[0] || { id: 'w-1' };

    addTransaction({
      type: quickType,
      amount: num,
      currency: 'IDR',
      title: quickTitle,
      category: quickCategory,
      subcategory: quickSubcategory || undefined,
      walletId: wallet.id,
      scope: currentScope === 'all' ? 'personal' : currentScope,
      date: new Date().toISOString().split('T')[0],
      note: 'Catatan cepat via Dashboard Panel'
    });

    setQuickTitle('');
    setQuickAmount('');
    addToast('success', 'Transaksi Disimpan', `${quickTitle} senilai Rp ${num.toLocaleString('id-ID')} berhasil dicatat.`);
  };

  const overbudgetCount = budgets.filter(b => b.spent > b.monthlyLimit).length;

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* 1. EXECUTIVE GREETING HERO SECTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--card-bg)] p-5 sm:p-6 rounded-3xl border border-[var(--border)] shadow-xl transition-colors">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-[var(--gold-primary)] flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
            <ShieldCheck className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            Executive Wealth Management OS
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-[var(--text-primary)] tracking-tight capitalize mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
            {timeGreeting}, <span className="text-[var(--gold-primary)]">{userName}</span>
          </h1>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5 font-medium">
            Berikut ikhtisar ringkasan keuangan dan portofolio aset Anda hari ini.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] text-xs font-semibold text-[var(--text-secondary)]">
            <Calendar className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
            <span className="capitalize">{formattedDate}</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] text-xs font-bold text-[var(--gold-primary)]">
            <span className={`w-2 h-2 rounded-full ${syncStatus === 'syncing' ? 'bg-[var(--gold-primary)] animate-spin' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="uppercase text-[10px] tracking-wider font-extrabold">{currentScope} Scope</span>
          </div>
        </div>
      </div>

      {/* 2. NET WORTH & SUMMARY CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* TOTAL NET WORTH PRIMARY HERO CARD */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 sm:p-7 rounded-3xl border border-[var(--border)] shadow-2xl relative overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-[var(--gold-badge-border)]">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-[var(--gold-badge-bg)] to-transparent rounded-full filter blur-3xl opacity-30 pointer-events-none" />

          <div className="relative z-10 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-[var(--gold-primary)] px-3 py-1 rounded-full bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)]">
                Total Net Worth
              </span>
              <div className="flex items-center gap-2 bg-[var(--input-bg)] px-3 py-1 rounded-full border border-[var(--gold-badge-border)]">
                <Activity className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span className="text-[11px] font-bold text-[var(--text-secondary)]">Health Score:</span>
                <span className="text-xs font-black text-[var(--gold-primary)]">{healthScore}/100</span>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold text-[var(--text-secondary)]">Total Kekayaan Bersih (Kas + Investasi)</p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[var(--text-primary)] tracking-tight mt-1 font-['Plus_Jakarta_Sans',sans-serif]">
                Rp {totalAssets.toLocaleString('id-ID')}
              </h2>
            </div>

            {/* Sub Breakdown Pills */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
              <button
                onClick={() => setActiveTab('wallets')}
                className="bg-[var(--surface-secondary)] hover:bg-[var(--border)] px-3.5 py-2 rounded-2xl border border-[var(--border)] text-[var(--text-secondary)] flex items-center gap-2 transition-all"
              >
                <Wallet className="w-4 h-4 text-emerald-500" />
                <span>Kas & Dompet:</span>
                <strong className="text-[var(--text-primary)] font-extrabold">Rp {totalBalance.toLocaleString('id-ID')}</strong>
              </button>

              <button
                onClick={() => setActiveTab('investments')}
                className="bg-[var(--surface-secondary)] hover:bg-[var(--gold-badge-bg)] px-3.5 py-2 rounded-2xl border border-[var(--gold-badge-border)] text-[var(--text-secondary)] flex items-center gap-2 transition-all"
              >
                <Coins className="w-4 h-4 text-[var(--gold-primary)]" />
                <span>Portofolio Investasi:</span>
                <strong className="text-[var(--gold-primary)] font-extrabold">Rp {totalInvestment.toLocaleString('id-ID')}</strong>
              </button>
            </div>
          </div>

          {/* Metric Flow Counters */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-5 border-t border-[var(--border)] relative z-10">
            <div className="bg-[var(--surface-secondary)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-500" />
                Pemasukan
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-emerald-500 mt-1">
                +Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[var(--surface-secondary)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-500" />
                Pengeluaran
              </span>
              <p className="text-xs sm:text-sm font-extrabold text-red-500 mt-1">
                -Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[var(--surface-secondary)] p-3.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] font-semibold text-[var(--text-muted)] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                Net Arus Kas
              </span>
              <p className={`text-xs sm:text-sm font-extrabold mt-1 ${netFlow >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                Rp {netFlow.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* QUICK ACTIONS & AI INPUT PANEL */}
        <div className="bg-[var(--card-bg)] p-5.5 rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h3 className="text-xs font-extrabold text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[var(--gold-primary)]" />
                Quick Action Panel
              </h3>
              <button
                onClick={openFastAITxModal}
                className="text-[10px] text-[var(--gold-primary)] bg-[var(--gold-badge-bg)] px-2.5 py-1 rounded-xl border border-[var(--gold-badge-border)] font-bold flex items-center gap-1 hover:bg-[var(--gold-badge-border)] transition-all"
              >
                <Sparkles className="w-3 h-3 text-[var(--gold-primary)]" />
                AI Fast Input
              </button>
            </div>

            {/* Quick Action Navigation Shortcuts */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={openAddTxModal}
                className="py-2.5 px-3 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>+ Transaksi</span>
              </button>

              <button
                onClick={() => setActiveTab('wallets')}
                className="py-2.5 px-3 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold text-xs flex items-center justify-center gap-1.5 border border-[var(--border)] transition-all active:scale-95"
              >
                <Wallet className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                <span>+ Dompet</span>
              </button>
            </div>

            {/* Quick Fast Form Input */}
            <form onSubmit={handleQuickSubmit} className="space-y-2.5 pt-2 border-t border-[var(--border)]">
              <div className="flex gap-1 p-1 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setQuickType('expense')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-all ${
                    quickType === 'expense'
                      ? 'bg-red-500/15 text-red-500 border border-red-500/30'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('income')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-xl transition-all ${
                    quickType === 'income'
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <input
                type="text"
                placeholder="Judul transaksi..."
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="w-full bg-[var(--input-bg)] text-xs px-3.5 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
              />

              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs text-[var(--text-muted)] font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  className="w-full bg-[var(--input-bg)] text-xs pl-10 pr-3.5 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] hover:bg-[var(--gold-badge-border)] font-extrabold text-xs rounded-2xl transition-all active:scale-95"
              >
                + Simpan Kilat
              </button>
            </form>
          </div>

          {overbudgetCount > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-red-500/10 border border-red-500/25 flex items-center gap-2 text-[11px] text-red-500 font-medium">
              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
              <span>
                <strong>{overbudgetCount} Anggaran</strong> telah melebihi batas bulan ini!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 3. CASH FLOW CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Cashflow Trend Chart */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-2xl transition-colors">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[var(--gold-primary)]" />
                Tren Arus Kas Bulanan
              </h3>
              <p className="text-[11px] text-[var(--text-secondary)]">Grafik Pemasukan vs Pengeluaran (6 Bulan)</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-[var(--gold-primary)] hover:underline font-bold"
            >
              Laporan Lengkap ➔
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22C55E" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="var(--text-muted)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#121A2A' : '#FFFFFF',
                    borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: isDark ? '#F8FAFC' : '#0F172A',
                    boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 4px 20px -4px rgba(15,23,42,0.1)'
                  }}
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Breakdown */}
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col justify-between transition-colors">
          <div>
            <h3 className="text-sm font-extrabold text-[var(--text-primary)] mb-1">Breakdown Pengeluaran</h3>
            <p className="text-[11px] text-[var(--text-secondary)] mb-3">Distribusi Kategori Bulan Ini</p>

            <div className="h-44 w-full relative flex items-center justify-center">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#121A2A' : '#FFFFFF',
                        borderColor: isDark ? 'rgba(255,255,255,0.12)' : '#E2E8F0',
                        borderRadius: '16px',
                        fontSize: '11px',
                        color: isDark ? '#F8FAFC' : '#0F172A',
                        boxShadow: isDark ? '0 10px 30px -10px rgba(0,0,0,0.5)' : '0 4px 20px -4px rgba(15,23,42,0.1)'
                      }}
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[var(--text-muted)] font-semibold">Belum ada data pengeluaran</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-2 border-t border-[var(--border)] pt-3.5">
            {pieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[var(--text-secondary)] font-medium">{item.name}</span>
                </div>
                <span className="text-[var(--text-primary)] font-bold">Rp {item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. RECENT TRANSACTIONS & WALLET ACCOUNTS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-2xl transition-colors">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Transaksi Terbaru</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-[var(--gold-primary)] hover:underline font-bold"
            >
              Lihat Semua ({filteredTransactions.length})
            </button>
          </div>

          {filteredTransactions.length > 0 ? (
            <div className="space-y-2.5">
              {filteredTransactions.slice(0, 5).map(tx => (
                <div
                  key={tx.id}
                  className="p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] hover:border-[var(--gold-badge-border)] transition-all flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        tx.type === 'income'
                          ? 'bg-emerald-500/15 text-emerald-500'
                          : tx.type === 'expense'
                          ? 'bg-red-500/15 text-red-500'
                          : 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-[var(--text-primary)] line-clamp-1">{tx.title}</h4>
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[var(--text-muted)] mt-0.5">
                        <span className="font-semibold">{tx.category}</span>
                        {tx.subcategory && (
                          <span className="px-2 py-0.5 rounded-lg bg-[var(--input-bg)] text-[var(--text-secondary)] text-[9px] font-semibold border border-[var(--border)]">
                            {tx.subcategory}
                          </span>
                        )}
                        <span>•</span>
                        <span>{tx.date}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`text-xs font-black ${
                        tx.type === 'income'
                          ? 'text-emerald-500'
                          : tx.type === 'expense'
                          ? 'text-red-500'
                          : 'text-[var(--gold-primary)]'
                      }`}
                    >
                      {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp {tx.amount.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] space-y-3">
              <FileSpreadsheet className="w-8 h-8 text-[var(--gold-primary)] mx-auto opacity-70" />
              <div>
                <h4 className="text-xs font-bold text-[var(--text-primary)]">Belum Ada Transaksi</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Mulai mencatat transaksi untuk melihat analisa & arus kas Anda.
                </p>
              </div>
              <button
                onClick={openAddTxModal}
                className="py-2 px-4 btn-gold text-[#0B1220] font-extrabold text-xs rounded-xl shadow-md"
              >
                + Catat Transaksi Pertama
              </button>
            </div>
          )}
        </div>

        {/* Wallet Accounts Overview */}
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--border)] shadow-2xl flex flex-col justify-between transition-colors">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-[var(--text-primary)]">Akun Dompet Saya</h3>
              <button
                onClick={() => setActiveTab('wallets')}
                className="text-xs text-[var(--gold-primary)] font-bold hover:underline"
              >
                Kelola
              </button>
            </div>

            {filteredWallets.length > 0 ? (
              <div className="space-y-3">
                {filteredWallets.map(w => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-[var(--surface-secondary)] border border-[var(--border)] flex items-center justify-between transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs shadow-sm"
                        style={{ backgroundColor: w.color || '#D4AF37' }}
                      >
                        <CreditCard className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-[var(--text-primary)]">{w.name}</h4>
                        <span className="text-[10px] text-[var(--text-muted)] font-mono font-bold">
                          •••• {w.accountNumber ? w.accountNumber.slice(-4) : '8842'}
                        </span>
                      </div>
                    </div>

                    <span className={`text-xs font-black ${w.balance >= 0 ? 'text-[var(--text-primary)]' : 'text-red-500'}`}>
                      Rp {w.balance.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center bg-[var(--surface-secondary)] rounded-2xl border border-[var(--border)] space-y-2">
                <CreditCard className="w-6 h-6 text-[var(--gold-primary)] mx-auto opacity-70" />
                <p className="text-xs font-bold text-[var(--text-primary)]">Belum Ada Dompet</p>
                <p className="text-[10px] text-[var(--text-secondary)]">Tambahkan rekening bank / e-wallet pertama Anda.</p>
              </div>
            )}
          </div>

          <button
            onClick={() => setActiveTab('wallets')}
            className="w-full mt-4 py-2.5 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-bold text-xs rounded-2xl border border-[var(--border)] transition-all"
          >
            + Tambah Dompet Baru
          </button>
        </div>
      </div>
    </div>
  );
};
