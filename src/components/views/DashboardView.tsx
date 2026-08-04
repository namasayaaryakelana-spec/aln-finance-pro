import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Wallet,
  Coins,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Sparkles,
  Zap,
  DollarSign,
  AlertTriangle
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
    categories,
    addTransaction,
    addToast
  } = useFinance();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickCategory, setQuickCategory] = useState('Makan');
  const [quickSubcategory, setQuickSubcategory] = useState('Belanja Dapur');

  // Update quick category & subcategory defaults when quickType changes ('expense' -> EXPENSE, 'income' -> INCOME)
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

  // Update subcategory whenever quickCategory changes
  useEffect(() => {
    const typeKey = quickType === 'expense' ? 'EXPENSE' : 'INCOME';
    const catMap = masterCategories[typeKey] as Record<string, string[]>;
    const subs = catMap[quickCategory] || getSubcategoriesForCategory(quickCategory);
    if (subs.length > 0 && !subs.includes(quickSubcategory)) {
      setQuickSubcategory(subs[0]);
    }
  }, [quickCategory, quickType]);

  // Dynamically calculate monthly trend data for Recharts from filteredTransactions
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  // Create last 7 months range up to current month
  const monthsList: { monthKey: string; monthLabel: string }[] = [];
  for (let i = 6; i >= 0; i--) {
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

  // Category Pie Chart data
  const categoryExpenses: { [key: string]: number } = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryExpenses[t.category] = (categoryExpenses[t.category] || 0) + t.amount;
    });

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4'];

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
      note: 'Catatan cepat via Quick Action Panel'
    });

    setQuickTitle('');
    setQuickAmount('');
  };

  const overbudgetCount = budgets.filter(b => b.spent > b.monthlyLimit).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Health Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Total Saldo & Health Card */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-[#0D1527] to-slate-950 p-6 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                Total Aset Kekayaan Bersih ({currentScope.toUpperCase()})
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight">
                Rp {totalAssets.toLocaleString('id-ID')}
              </h3>

              {/* Sub Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs">
                <button
                  onClick={() => setActiveTab('wallets')}
                  className="bg-slate-950/80 hover:bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-800 text-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Kas & Dompet:</span>
                  <strong className="text-emerald-400">Rp {totalBalance.toLocaleString('id-ID')}</strong>
                </button>

                <button
                  onClick={() => setActiveTab('investments')}
                  className="bg-slate-950/80 hover:bg-amber-950/50 px-2.5 py-1 rounded-xl border border-slate-800 hover:border-amber-500/40 text-slate-300 flex items-center gap-1.5 transition-all"
                >
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>Portofolio Investasi:</span>
                  <strong className="text-amber-300">Rp {totalInvestment.toLocaleString('id-ID')}</strong>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-2xl border border-slate-800">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-200">Health Score</span>
                <span className="text-sm font-extrabold text-emerald-400">{healthScore}/100</span>
              </div>
              <span className="text-[10px] text-slate-400 mt-1">
                {healthScore >= 80 ? 'Sangat Sehat' : healthScore >= 65 ? 'Sehat & Stabil' : 'Perlu Perhatian'}
              </span>
            </div>
          </div>

          {/* Metric Flow Counters */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-800/80 relative z-10">
            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                Pemasukan
              </span>
              <p className="text-sm sm:text-base font-extrabold text-emerald-400 mt-1">
                +Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-red-400" />
                Pengeluaran
              </span>
              <p className="text-sm sm:text-base font-extrabold text-red-400 mt-1">
                -Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
              <span className="text-[10px] font-semibold text-slate-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-blue-400" />
                Net Arus Kas
              </span>
              <p className={`text-sm sm:text-base font-extrabold mt-1 ${netFlow >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                Rp {netFlow.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick AI & Overbudget Widget Card */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 flex flex-col justify-between shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                Quick Action Panel
              </h4>
              <button
                onClick={openAddTxModal}
                className="text-[10px] text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-lg border border-purple-500/30 font-semibold flex items-center gap-1 hover:bg-purple-500/30"
              >
                <Sparkles className="w-3 h-3" />
                AI Auto-Parse
              </button>
            </div>

            {/* Quick Transaction Form */}
            <form onSubmit={handleQuickSubmit} className="space-y-2.5">
              <div className="flex gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setQuickType('expense')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    quickType === 'expense' ? 'bg-red-500/20 text-red-300 border border-red-500/30' : 'text-slate-400'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('income')}
                  className={`flex-1 py-1 text-[11px] font-bold rounded-lg transition-colors ${
                    quickType === 'income' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'text-slate-400'
                  }`}
                >
                  Pemasukan
                </button>
              </div>

              <input
                type="text"
                placeholder="Judul transaksi (mis: Kopi & Makan)"
                value={quickTitle}
                onChange={e => setQuickTitle(e.target.value)}
                className="w-full bg-slate-950 text-xs px-3 py-2 rounded-xl border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />

              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-slate-500 font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  className="w-full bg-slate-950 text-xs pl-9 pr-3 py-2 rounded-xl border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <select
                    id="kategori-utama"
                    value={quickCategory}
                    onChange={e => {
                      const selectedCat = e.target.value;
                      setQuickCategory(selectedCat);
                      const typeKey = quickType === 'expense' ? 'EXPENSE' : 'INCOME';
                      const subs = (masterCategories[typeKey] as Record<string, string[]>)[selectedCat] || getSubcategoriesForCategory(selectedCat);
                      setQuickSubcategory(subs[0] || '');
                    }}
                    className="w-full bg-slate-950 text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-800 text-slate-200 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    {Object.keys(masterCategories[quickType === 'expense' ? 'EXPENSE' : 'INCOME']).map(cat => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <select
                    id="sub-kategori"
                    value={quickSubcategory}
                    onChange={e => setQuickSubcategory(e.target.value)}
                    className="w-full bg-slate-950 text-[11px] px-2.5 py-1.5 rounded-xl border border-slate-800 text-cyan-300 focus:outline-none focus:border-cyan-500 font-medium"
                  >
                    {((masterCategories[quickType === 'expense' ? 'EXPENSE' : 'INCOME'] as Record<string, string[]>)[quickCategory] || getSubcategoriesForCategory(quickCategory)).map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-all"
              >
                + Simpan Kilat
              </button>
            </form>
          </div>

          {overbudgetCount > 0 && (
            <div className="mt-3 p-2.5 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center gap-2 text-[11px] text-red-300">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
              <span>
                <strong>{overbudgetCount} Anggaran</strong> telah melewati batas!
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Interactive Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recharts Cashflow Trend */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                Tren Arus Kas Bulanan
              </h3>
              <p className="text-[11px] text-slate-400">Pemasukan vs Pengeluaran (2026)</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              Lihat Laporan Lengkap ➔
            </button>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#64748B"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0A0F1D',
                    borderColor: '#1E293B',
                    borderRadius: '12px',
                    fontSize: '12px',
                    color: '#fff'
                  }}
                  formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                />
                <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#incomeGrad)" />
                <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" strokeWidth={2} fillOpacity={1} fill="url(#expenseGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expense Category Pie Breakdown */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white mb-1">Breakdown Pengeluaran</h3>
            <p className="text-[11px] text-slate-400 mb-3">Distribusi Kategori Bulan Ini</p>

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
                        backgroundColor: '#0A0F1D',
                        borderColor: '#1E293B',
                        borderRadius: '12px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500">Belum ada data pengeluaran</p>
              )}
            </div>
          </div>

          <div className="space-y-1.5 mt-2 border-t border-slate-800 pt-3">
            {pieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300 font-medium">{item.name}</span>
                </div>
                <span className="text-white font-bold">Rp {item.value.toLocaleString('id-ID')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity & Wallet Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions List */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white">Transaksi Terbaru</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-emerald-400 hover:underline font-bold"
            >
              Lihat Semua ({filteredTransactions.length})
            </button>
          </div>

          <div className="space-y-2.5">
            {filteredTransactions.slice(0, 5).map(tx => (
              <div
                key={tx.id}
                className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      tx.type === 'income'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : tx.type === 'expense'
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{tx.title}</h5>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                      <span>{tx.category}</span>
                      {tx.subcategory && (
                        <span className="px-1.5 py-0.2 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800/50 text-[9px] font-semibold">
                          {tx.subcategory}
                        </span>
                      )}
                      <span>•</span>
                      <span>{tx.date}</span>
                      <span className="px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 text-[9px] uppercase font-bold">
                        {tx.scope}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-extrabold ${
                      tx.type === 'income'
                        ? 'text-emerald-400'
                        : tx.type === 'expense'
                        ? 'text-red-400'
                        : 'text-blue-400'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : ''} Rp {tx.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Wallets Quick Card List */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-extrabold text-white">Akun Dompet Saya</h3>
              <button
                onClick={() => setActiveTab('wallets')}
                className="text-xs text-emerald-400 font-bold hover:underline"
              >
                Kelola
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredWallets.map(w => (
                <div key={w.id} className="p-3 rounded-2xl bg-slate-950 border border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: w.color }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{w.name}</h5>
                      <span className="text-[10px] text-slate-400">{w.accountNumber || w.type.toUpperCase()}</span>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold ${w.balance >= 0 ? 'text-emerald-300' : 'text-red-400'}`}>
                    Rp {w.balance.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('wallets')}
            className="w-full mt-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors"
          >
            + Tambah Dompet Baru
          </button>
        </div>
      </div>
    </div>
  );
};
