import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
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
    addTransaction,
    addToast
  } = useFinance();

  const [quickTitle, setQuickTitle] = useState('');
  const [quickAmount, setQuickAmount] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');
  const [quickCategory, setQuickCategory] = useState('Makan');
  const [quickSubcategory, setQuickSubcategory] = useState('Belanja Dapur');

  // Update quick category & subcategory defaults when quickType changes
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
      note: 'Catatan cepat via Quick Action Panel'
    });

    setQuickTitle('');
    setQuickAmount('');
  };

  const overbudgetCount = budgets.filter(b => b.spent > b.monthlyLimit).length;

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Health Score Metric */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Total Saldo & Health Card */}
        <div className="lg:col-span-2 bg-[#121A2A] p-6 sm:p-7 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[rgba(212,175,55,0.04)] rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-start justify-between relative z-10">
            <div>
              <span className="text-[11px] font-bold text-[#F6D365] uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
                <Coins className="w-3.5 h-3.5 text-[#D4AF37]" />
                Total Aset Kekayaan Bersih ({currentScope.toUpperCase()})
              </span>
              <h3 className="text-2xl sm:text-4xl font-extrabold text-white mt-2 tracking-tight text-gradient-gold">
                Rp {totalAssets.toLocaleString('id-ID')}
              </h3>

              {/* Sub Breakdown Pills */}
              <div className="flex flex-wrap items-center gap-2.5 mt-4 text-xs">
                <button
                  onClick={() => setActiveTab('wallets')}
                  className="bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] px-3 py-1.5 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#BFC8D6] flex items-center gap-2 transition-all"
                >
                  <Wallet className="w-3.5 h-3.5 text-[#22C55E]" />
                  <span>Kas & Dompet:</span>
                  <strong className="text-white font-extrabold">Rp {totalBalance.toLocaleString('id-ID')}</strong>
                </button>

                <button
                  onClick={() => setActiveTab('investments')}
                  className="bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(212,175,55,0.1)] px-3 py-1.5 rounded-2xl border border-[rgba(212,175,55,0.2)] text-[#BFC8D6] flex items-center gap-2 transition-all"
                >
                  <Coins className="w-3.5 h-3.5 text-[#F6D365]" />
                  <span>Portofolio Investasi:</span>
                  <strong className="text-[#F6D365] font-extrabold">Rp {totalInvestment.toLocaleString('id-ID')}</strong>
                </button>
              </div>
            </div>

            <div className="flex flex-col items-end">
              <div className="flex items-center gap-2 bg-[#0B1220] px-3.5 py-1.5 rounded-2xl border border-[rgba(212,175,55,0.25)]">
                <Activity className="w-4 h-4 text-[#F6D365]" />
                <span className="text-xs font-bold text-[#BFC8D6]">Health Score</span>
                <span className="text-sm font-extrabold text-[#F6D365]">{healthScore}/100</span>
              </div>
              <span className="text-[10px] text-[#7C8799] mt-1 font-semibold">
                {healthScore >= 80 ? 'Sangat Sehat' : healthScore >= 65 ? 'Sehat & Stabil' : 'Perlu Perhatian'}
              </span>
            </div>
          </div>

          {/* Metric Flow Counters */}
          <div className="grid grid-cols-3 gap-3.5 mt-6 pt-6 border-t border-[rgba(255,255,255,0.08)] relative z-10">
            <div className="bg-[rgba(255,255,255,0.025)] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-semibold text-[#7C8799] flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-[#22C55E]" />
                Pemasukan
              </span>
              <p className="text-sm sm:text-base font-extrabold text-[#22C55E] mt-1">
                +Rp {totalIncome.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[rgba(255,255,255,0.025)] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-semibold text-[#7C8799] flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-[#EF4444]" />
                Pengeluaran
              </span>
              <p className="text-sm sm:text-base font-extrabold text-[#EF4444] mt-1">
                -Rp {totalExpense.toLocaleString('id-ID')}
              </p>
            </div>

            <div className="bg-[rgba(255,255,255,0.025)] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.06)]">
              <span className="text-[10px] font-semibold text-[#7C8799] flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5 text-[#F6D365]" />
                Net Arus Kas
              </span>
              <p className={`text-sm sm:text-base font-extrabold mt-1 ${netFlow >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                Rp {netFlow.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>

        {/* Quick AI & Overbudget Widget Card */}
        <div className="bg-[#121A2A] p-5 rounded-3xl border border-[rgba(255,255,255,0.08)] flex flex-col justify-between shadow-2xl">
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#F6D365]" />
                Quick Action Panel
              </h4>
              <button
                onClick={openFastAITxModal}
                className="text-[10px] text-[#F6D365] bg-[rgba(212,175,55,0.12)] px-2.5 py-1 rounded-xl border border-[rgba(212,175,55,0.25)] font-bold flex items-center gap-1 hover:bg-[rgba(212,175,55,0.22)] transition-all"
              >
                <Sparkles className="w-3 h-3" />
                AI Auto-Parse
              </button>
            </div>

            {/* Quick Transaction Form */}
            <form onSubmit={handleQuickSubmit} className="space-y-3">
              <div className="flex gap-1.5 p-1 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)]">
                <button
                  type="button"
                  onClick={() => setQuickType('expense')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                    quickType === 'expense' ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border border-[rgba(239,68,68,0.3)]' : 'text-[#7C8799]'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setQuickType('income')}
                  className={`flex-1 py-1.5 text-[11px] font-bold rounded-xl transition-all ${
                    quickType === 'income' ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] border border-[rgba(34,197,94,0.3)]' : 'text-[#7C8799]'
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
                className="w-full bg-[#0B1220] text-xs px-3.5 py-2.5 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
              />

              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-[#7C8799] font-bold">Rp</span>
                <input
                  type="number"
                  placeholder="0"
                  value={quickAmount}
                  onChange={e => setQuickAmount(e.target.value)}
                  className="w-full bg-[#0B1220] text-xs pl-10 pr-3.5 py-2.5 rounded-2xl border border-[rgba(255,255,255,0.08)] text-white placeholder-[#7C8799] focus:outline-none focus:border-[#D4AF37]"
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
                    className="w-full bg-[#0B1220] text-[11px] px-3 py-2 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#BFC8D6] focus:outline-none focus:border-[#D4AF37] font-medium"
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
                    className="w-full bg-[#0B1220] text-[11px] px-3 py-2 rounded-2xl border border-[rgba(255,255,255,0.08)] text-[#F6D365] focus:outline-none focus:border-[#D4AF37] font-medium"
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
                className="w-full py-2.5 btn-gold rounded-2xl text-[#0B1220] font-extrabold text-xs shadow-lg transition-all"
              >
                + Simpan Kilat
              </button>
            </form>
          </div>

          {overbudgetCount > 0 && (
            <div className="mt-3 p-3 rounded-2xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.25)] flex items-center gap-2 text-[11px] text-[#EF4444] font-medium">
              <AlertTriangle className="w-4 h-4 text-[#EF4444] shrink-0" />
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
        <div className="lg:col-span-2 bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F6D365]" />
                Tren Arus Kas Bulanan
              </h3>
              <p className="text-[11px] text-[#7C8799]">Pemasukan vs Pengeluaran (2026)</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs text-[#F6D365] hover:underline font-bold"
            >
              Lihat Laporan Lengkap ➔
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
                <XAxis dataKey="month" stroke="#7C8799" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#7C8799"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={v => `${(v / 1000000).toFixed(0)}Jt`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121A2A',
                    borderColor: 'rgba(255,255,255,0.12)',
                    borderRadius: '16px',
                    fontSize: '12px',
                    color: '#fff'
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
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-white mb-1">Breakdown Pengeluaran</h3>
            <p className="text-[11px] text-[#7C8799] mb-3">Distribusi Kategori Bulan Ini</p>

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
                        backgroundColor: '#121A2A',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: '16px',
                        fontSize: '11px',
                        color: '#fff'
                      }}
                      formatter={(val: any) => [`Rp ${Number(val).toLocaleString('id-ID')}`]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[#7C8799]">Belum ada data pengeluaran</p>
              )}
            </div>
          </div>

          <div className="space-y-2 mt-2 border-t border-[rgba(255,255,255,0.08)] pt-3.5">
            {pieData.slice(0, 4).map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-[#BFC8D6] font-medium">{item.name}</span>
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
        <div className="lg:col-span-2 bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-extrabold text-white">Transaksi Terbaru</h3>
            <button
              onClick={() => setActiveTab('transactions')}
              className="text-xs text-[#F6D365] hover:underline font-bold"
            >
              Lihat Semua ({filteredTransactions.length})
            </button>
          </div>

          <div className="space-y-3">
            {filteredTransactions.slice(0, 5).map(tx => (
              <div
                key={tx.id}
                className="p-3.5 rounded-2xl bg-[#0B1220] border border-[rgba(255,255,255,0.06)] hover:border-[rgba(212,175,55,0.25)] transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                      tx.type === 'income'
                        ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E]'
                        : tx.type === 'expense'
                        ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444]'
                        : 'bg-[rgba(212,175,55,0.15)] text-[#F6D365]'
                    }`}
                  >
                    {tx.type === 'income' ? '+' : tx.type === 'expense' ? '-' : '⇄'}
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white line-clamp-1">{tx.title}</h5>
                    <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-[#7C8799] mt-0.5">
                      <span>{tx.category}</span>
                      {tx.subcategory && (
                        <span className="px-2 py-0.5 rounded-lg bg-[rgba(255,255,255,0.06)] text-[#BFC8D6] text-[9px] font-semibold">
                          {tx.subcategory}
                        </span>
                      )}
                      <span>•</span>
                      <span>{tx.date}</span>
                      <span className="px-2 py-0.5 rounded-lg bg-[rgba(212,175,55,0.1)] text-[#F6D365] text-[9px] uppercase font-bold border border-[rgba(212,175,55,0.2)]">
                        {tx.scope}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`text-xs font-extrabold ${
                      tx.type === 'income'
                        ? 'text-[#22C55E]'
                        : tx.type === 'expense'
                        ? 'text-[#EF4444]'
                        : 'text-[#F6D365]'
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
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-extrabold text-white">Akun Dompet Saya</h3>
              <button
                onClick={() => setActiveTab('wallets')}
                className="text-xs text-[#F6D365] font-bold hover:underline"
              >
                Kelola
              </button>
            </div>

            <div className="space-y-3">
              {filteredWallets.map(w => (
                <div key={w.id} className="p-3.5 rounded-2xl bg-[#0B1220] border border-[rgba(255,255,255,0.06)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-white text-xs"
                      style={{ backgroundColor: w.color }}
                    >
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white">{w.name}</h5>
                      <span className="text-[10px] text-[#7C8799]">{w.accountNumber || w.type.toUpperCase()}</span>
                    </div>
                  </div>

                  <span className={`text-xs font-extrabold ${w.balance >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                    Rp {w.balance.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={() => setActiveTab('wallets')}
            className="w-full mt-4 py-2.5 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.1)] text-white font-bold text-xs rounded-2xl border border-[rgba(255,255,255,0.08)] transition-all"
          >
            + Tambah Dompet Baru
          </button>
        </div>
      </div>
    </div>
  );
};
