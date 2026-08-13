import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  PieChart as PieIcon,
  Scale,
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Wallet,
  Calendar,
  Filter,
  Layers,
  FileText
} from 'lucide-react';
import { ExportService } from '../../services/export';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

export const formatDonutCenterValue = (value: number): string => {
  if (value === 0) return 'Rp 0';
  const isNegative = value < 0;
  const absVal = Math.abs(value);
  const prefix = isNegative ? '-Rp ' : 'Rp ';

  if (absVal < 1000) {
    return `${prefix}${absVal.toLocaleString('id-ID')}`;
  } else if (absVal < 1000000) {
    const formatted = (absVal / 1000).toFixed(1).replace('.', ',');
    const trimmed = formatted.endsWith(',0') ? formatted.slice(0, -2) : formatted;
    return `${prefix}${trimmed} rb`;
  } else if (absVal < 1000000000) {
    const formatted = (absVal / 1000000).toFixed(1).replace('.', ',');
    const trimmed = formatted.endsWith(',0') ? formatted.slice(0, -2) : formatted;
    return `${prefix}${trimmed} jt`;
  } else {
    const formatted = (absVal / 1000000000).toFixed(1).replace('.', ',');
    const trimmed = formatted.endsWith(',0') ? formatted.slice(0, -2) : formatted;
    return `${prefix}${trimmed} M`;
  }
};

const CustomTooltip = ({ active, payload }: any) => {
  const { isDark } = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className={`p-3 rounded-2xl shadow-2xl text-xs space-y-1 border ${
        isDark ? 'bg-[#121A2A] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <p className="font-extrabold flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color || '#D4AF37' }} />
          {data.name}
        </p>
        <p className="font-bold text-[var(--gold-primary)] font-mono">
          Rp {(data.value || 0).toLocaleString('id-ID')}
        </p>
      </div>
    );
  }
  return null;
};

export const ReportsView: React.FC = () => {
  const {
    filteredTransactions,
    filteredInvestments,
    filteredWallets,
    categories,
    currentScope,
    totalBalance,
    totalInvestment,
    totalAssets,
    totalLiabilities,
    totalReceivables,
    totalNetWorth
  } = useFinance();

  const [reportType, setReportType] = useState<'pnl' | 'cashflow' | 'balance_sheet' | 'category'>('pnl');

  // Filter States
  const [periodType, setPeriodType] = useState<'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedMonth, setSelectedMonth] = useState<number>(7); // 0-indexed: 7 = August
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedWallet, setSelectedWallet] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Available Years from data
  const availableYears = useMemo(() => {
    const yearsSet = new Set<number>();
    yearsSet.add(2026);
    filteredTransactions.forEach(t => {
      if (t.date) {
        const y = new Date(t.date).getFullYear();
        if (!isNaN(y)) yearsSet.add(y);
      }
    });
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [filteredTransactions]);

  // Memoized Transaction Filter by Period, Wallet, and Category
  const periodFilteredTxs = useMemo(() => {
    return filteredTransactions.filter(t => {
      // 1. Wallet Filter
      if (selectedWallet !== 'all') {
        const matchesWallet = t.walletId === selectedWallet || t.targetWalletId === selectedWallet;
        if (!matchesWallet) return false;
      }

      // 2. Category Filter
      if (selectedCategory !== 'all') {
        if (t.category !== selectedCategory) return false;
      }

      // 3. Date / Period Filter
      if (!t.date) return true;
      const txDate = new Date(t.date);
      if (isNaN(txDate.getTime())) return true;

      if (periodType === 'yearly') {
        return txDate.getFullYear() === selectedYear;
      }

      if (periodType === 'monthly') {
        return txDate.getFullYear() === selectedYear && txDate.getMonth() === selectedMonth;
      }

      if (periodType === 'weekly') {
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - txDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 7;
      }

      if (periodType === 'custom') {
        if (startDate && t.date < startDate) return false;
        if (endDate && t.date > endDate) return false;
        return true;
      }

      return true;
    });
  }, [filteredTransactions, selectedWallet, selectedCategory, periodType, selectedYear, selectedMonth, startDate, endDate]);

  // Memoized Report Metrics (Income, Expense, Net Flow - Transfers Excluded)
  const { totalIncome, totalExpense, netProfit, overviewChartData, categoryChartData, categoryMap, categoryColors } = useMemo(() => {
    const inc = periodFilteredTxs
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const exp = periodFilteredTxs
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = inc - exp;

    const catMap: { [key: string]: number } = {};
    periodFilteredTxs
      .filter(t => t.type === 'expense')
      .forEach(t => {
        catMap[t.category] = (catMap[t.category] || 0) + t.amount;
      });

    const overview = [
      { name: 'Pemasukan (Income)', value: inc || 1, color: '#10B981', actualValue: inc },
      { name: 'Pengeluaran (Expense)', value: exp || 0, color: '#EF4444', actualValue: exp }
    ];

    const colors = ['#D4AF37', '#E4C45A', '#10B981', '#3B82F6', '#EF4444', '#A78BFA', '#06B6D4', '#EC4899'];
    const catChart = Object.keys(catMap).map((cat, idx) => ({
      name: cat,
      value: catMap[cat],
      color: colors[idx % colors.length]
    }));

    return {
      totalIncome: inc,
      totalExpense: exp,
      netProfit: profit,
      overviewChartData: overview,
      categoryChartData: catChart,
      categoryMap: catMap,
      categoryColors: colors
    };
  }, [periodFilteredTxs]);

  // Memoized Trend Analytics Data (Recharts AreaChart)
  const trendChartData = useMemo(() => {
    if (periodType === 'yearly') {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
      return monthNames.map((mName, mIdx) => {
        let income = 0;
        let expense = 0;
        periodFilteredTxs.forEach(t => {
          if (t.date) {
            const d = new Date(t.date);
            if (d.getFullYear() === selectedYear && d.getMonth() === mIdx) {
              if (t.type === 'income') income += t.amount;
              if (t.type === 'expense') expense += t.amount;
            }
          }
        });
        return { label: mName, income, expense, net: income - expense };
      });
    }

    if (periodType === 'monthly') {
      const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
      const dailyData: { label: string; income: number; expense: number; net: number }[] = [];

      for (let day = 1; day <= daysInMonth; day++) {
        const dayStr = String(day).padStart(2, '0');
        const moStr = String(selectedMonth + 1).padStart(2, '0');
        const datePrefix = `${selectedYear}-${moStr}-${dayStr}`;

        let income = 0;
        let expense = 0;
        periodFilteredTxs.forEach(t => {
          if (t.date === datePrefix) {
            if (t.type === 'income') income += t.amount;
            if (t.type === 'expense') expense += t.amount;
          }
        });

        if (income > 0 || expense > 0 || day % 5 === 1 || day === daysInMonth) {
          dailyData.push({ label: `${day}/${selectedMonth + 1}`, income, expense, net: income - expense });
        }
      }
      return dailyData;
    }

    if (periodType === 'weekly') {
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return days.map((dayName, idx) => {
        let income = 0;
        let expense = 0;
        periodFilteredTxs.forEach(t => {
          if (t.date) {
            const d = new Date(t.date);
            const dayOfWeek = (d.getDay() + 6) % 7; // Monday = 0
            if (dayOfWeek === idx) {
              if (t.type === 'income') income += t.amount;
              if (t.type === 'expense') expense += t.amount;
            }
          }
        });
        return { label: dayName, income, expense, net: income - expense };
      });
    }

    // Custom
    const dateMap: { [date: string]: { income: number; expense: number } } = {};
    periodFilteredTxs.forEach(t => {
      if (t.date) {
        if (!dateMap[t.date]) dateMap[t.date] = { income: 0, expense: 0 };
        if (t.type === 'income') dateMap[t.date].income += t.amount;
        if (t.type === 'expense') dateMap[t.date].expense += t.amount;
      }
    });

    return Object.keys(dateMap).sort().map(d => ({
      label: d.substring(5),
      income: dateMap[d].income,
      expense: dateMap[d].expense,
      net: dateMap[d].income - dateMap[d].expense
    }));
  }, [periodFilteredTxs, periodType, selectedYear, selectedMonth]);

  const periodLabel = useMemo(() => {
    const monthNames = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
    if (periodType === 'yearly') return `Tahun ${selectedYear}`;
    if (periodType === 'monthly') return `${monthNames[selectedMonth]} ${selectedYear}`;
    if (periodType === 'weekly') return `Minggu Ini (7 Hari Terakhir)`;
    if (periodType === 'custom') return `${startDate || 'Awal'} s/d ${endDate || 'Akhir'}`;
    return 'Semua Periode';
  }, [periodType, selectedYear, selectedMonth, startDate, endDate]);

  const handlePrintPDF = () => {
    let title = 'Laporan Laba Rugi (Profit & Loss)';
    if (reportType === 'cashflow') title = 'Laporan Arus Kas (Cash Flow Statement)';
    if (reportType === 'balance_sheet') title = 'Neraca Keuangan (Balance Sheet)';
    if (reportType === 'category') title = 'Analisis Pengeluaran Kategori';

    ExportService.printFinancialReportHTML(
      title,
      periodLabel,
      { totalIncome, totalExpense, netFlow: netProfit },
      periodFilteredTxs
    );
  };

  return (
    <div className="space-y-6 pb-20 select-none">
      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="p-2.5 rounded-2xl bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] font-bold">
            <BarChart3 className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              Laporan Keuangan Eksekutif
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">Analisis Laba Rugi, Arus Kas & Tren Keuangan ({periodLabel})</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(periodFilteredTxs, `Laporan_Keuangan_${periodType}.csv`)}
            className="px-3.5 py-2.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold text-xs flex items-center gap-2 border border-[var(--border)] transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            CSV
          </button>
        </div>
      </div>

      {/* FILTER BAR: PERIODE, WALLET, KATEGORI */}
      <div className="bg-[var(--card-bg)] p-5 rounded-3xl border border-[var(--border)] shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Period Type Selector Buttons */}
          <div className="flex items-center gap-1 bg-[var(--input-bg)] p-1.5 rounded-2xl border border-[var(--border)] overflow-x-auto">
            {[
              { id: 'weekly', label: 'Mingguan' },
              { id: 'monthly', label: 'Bulanan' },
              { id: 'yearly', label: 'Tahunan' },
              { id: 'custom', label: 'Custom' }
            ].map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriodType(p.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  periodType === p.id
                    ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Wallet & Category Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Year & Month selectors if monthly/yearly */}
            {periodType === 'monthly' && (
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(Number(e.target.value))}
                className="bg-[var(--input-bg)] text-xs px-3 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-bold focus:outline-none focus:border-[var(--gold-primary)] cursor-pointer"
              >
                {['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'].map((m, idx) => (
                  <option key={idx} value={idx}>{m}</option>
                ))}
              </select>
            )}

            {(periodType === 'monthly' || periodType === 'yearly') && (
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="bg-[var(--input-bg)] text-xs px-3 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-bold focus:outline-none focus:border-[var(--gold-primary)] cursor-pointer"
              >
                {availableYears.map(yr => (
                  <option key={yr} value={yr}>{yr}</option>
                ))}
              </select>
            )}

            <select
              value={selectedWallet}
              onChange={e => setSelectedWallet(e.target.value)}
              className="bg-[var(--input-bg)] text-xs px-3.5 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-bold focus:outline-none focus:border-[var(--gold-primary)] cursor-pointer"
            >
              <option value="all">Semua Wallet (8 Accounts)</option>
              {filteredWallets.map(w => (
                <option key={w.id} value={w.id}>
                  {w.name}
                </option>
              ))}
            </select>

            <select
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
              className="bg-[var(--input-bg)] text-xs px-3.5 py-2 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] font-bold focus:outline-none focus:border-[var(--gold-primary)] cursor-pointer"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Custom Date Range Selectors */}
        {periodType === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)] font-bold">Mulai Tanggal:</span>
              <input
                type="date"
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                className="bg-[var(--input-bg)] text-xs px-3 py-1.5 rounded-xl border border-[var(--input-border)] text-[var(--input-text)]"
              />
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[var(--text-muted)] font-bold">Sampai Tanggal:</span>
              <input
                type="date"
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                className="bg-[var(--input-bg)] text-xs px-3 py-1.5 rounded-xl border border-[var(--input-border)] text-[var(--input-text)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* EMPTY STATE WARNING CARD IF NO TRANSACTIONS MATCH FILTER */}
      {periodFilteredTxs.length === 0 ? (
        <div className="p-12 text-center bg-[var(--card-bg)] rounded-3xl border border-[var(--border)] shadow-2xl space-y-3">
          <FileText className="w-12 h-12 text-[var(--gold-primary)] mx-auto opacity-70" />
          <h4 className="text-base font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
            Belum ada transaksi pada periode ini.
          </h4>
          <p className="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
            Tidak ada transaksi kas yang tercatat untuk {periodLabel}. Silakan ubah opsi filter periode, wallet, atau kategori di atas.
          </p>
        </div>
      ) : (
        <>
          {/* TREND ANALYTICS CHART CARD (Recharts AreaChart) */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-4 transition-colors">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
              <div>
                <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                  <TrendingUp className="w-4 h-4 text-[var(--gold-primary)]" />
                  Grafik Tren Keuangan & Arus Kas ({periodType.toUpperCase()})
                </h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Visualisasi tren Pemasukan, Pengeluaran & Net Flow</p>
              </div>
              <span className="text-[10px] font-mono text-[var(--gold-primary)] font-extrabold bg-[var(--gold-badge-bg)] px-3 py-1 rounded-full border border-[var(--gold-badge-border)]">
                {periodLabel}
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorInc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'var(--text-muted)' }} tickFormatter={v => `Rp ${(v/1000).toFixed(0)}k`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="income" name="Pemasukan" stroke="#10B981" fillOpacity={1} fill="url(#colorInc)" strokeWidth={2} />
                  <Area type="monotone" dataKey="expense" name="Pengeluaran" stroke="#EF4444" fillOpacity={1} fill="url(#colorExp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Interactive Visual Donut Chart Section (Recharts) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Income vs Expense Donut Chart Card */}
            <div className="lg:col-span-2 bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col justify-between space-y-4 transition-colors">
              <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
                <div>
                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                    <PieIcon className="w-4 h-4 text-[var(--gold-primary)]" />
                    Breakdown Pemasukan vs Pengeluaran
                  </h4>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Visualisasi rasio arus kas masuk dan keluar ({periodLabel})</p>
                </div>
                <span className="text-[10px] bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] font-bold px-3 py-1 rounded-full border border-[var(--gold-badge-border)]">
                  Interactive Intelligence
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div className="h-56 relative w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={overviewChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={58}
                        outerRadius={82}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {overviewChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Donut Center Label */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                    <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Net Flow</span>
                    <span className={`text-xs font-extrabold ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {formatDonutCenterValue(netProfit)}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <p className="font-extrabold text-[var(--text-primary)]">Total Pemasukan</p>
                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <ArrowDownRight className="w-3 h-3 text-emerald-500" /> Cash Inflow
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-emerald-500 font-mono">
                      Rp {totalIncome.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500" />
                      <div>
                        <p className="font-extrabold text-[var(--text-primary)]">Total Pengeluaran</p>
                        <p className="text-[10px] text-[var(--text-muted)] flex items-center gap-1">
                          <ArrowUpRight className="w-3 h-3 text-red-500" /> Cash Outflow
                        </p>
                      </div>
                    </div>
                    <span className="font-black text-red-500 font-mono">
                      Rp {totalExpense.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="p-3.5 bg-[var(--gold-badge-bg)] rounded-2xl border border-[var(--gold-badge-border)] flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[var(--gold-primary)]">Rasio Tabungan / Margin</p>
                      <p className="text-[10px] text-[var(--text-secondary)]">Pemasukan tersimpan bersih</p>
                    </div>
                    <span className="font-black text-[var(--gold-primary)] text-sm font-mono">
                      {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'}%
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col justify-between space-y-4 transition-colors">
              <div className="border-b border-[var(--border)] pb-3.5">
                <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Ringkasan Eksekutif Kas</h4>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Metrik performa keuangan periode aktif</p>
              </div>

              <div className="space-y-3 text-xs my-auto">
                <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Net Flow / Laba Bersih</span>
                  <span className={`text-xl font-black block mt-0.5 font-mono ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    Rp {netProfit.toLocaleString('id-ID')}
                  </span>
                </div>

                <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Total Saldo Likuid Kas</span>
                  <span className="text-xl font-black text-[var(--gold-primary)] block mt-0.5 font-mono">
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] text-center font-medium">
                💡 Laporan diperbarui secara otomatis berdasarkan transaksi kas Anda.
              </div>
            </div>
          </div>

          {/* Tabs Selector */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[var(--input-bg)] p-2 rounded-3xl border border-[var(--border)]">
            {[
              { id: 'pnl', label: 'Laba Rugi (P&L)', icon: FileSpreadsheet },
              { id: 'cashflow', label: 'Arus Kas (Cash Flow)', icon: TrendingUp },
              { id: 'balance_sheet', label: 'Neraca Keuangan', icon: Scale },
              { id: 'category', label: 'Drilldown Kategori', icon: PieIcon }
            ].map(item => {
              const Icon = item.icon;
              const isActive = reportType === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setReportType(item.id as any)}
                  className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-md font-extrabold'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Report Content View */}
          {reportType === 'pnl' && (
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
              <div className="border-b border-[var(--border)] pb-4 flex justify-between items-center">
                <div>
                  <h4 className="text-lg font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Laporan Laba Rugi (Profit & Loss)</h4>
                  <p className="text-xs text-[var(--text-secondary)]">Scope: {currentScope.toUpperCase()} • Periode: {periodLabel}</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] font-bold">
                  Standar Akuntansi Keuangan
                </span>
              </div>

              <div className="space-y-4 text-xs">
                {/* Pendapatan */}
                <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
                  <div className="flex justify-between font-bold text-[var(--text-primary)] mb-2">
                    <span className="uppercase tracking-wider">1. Total Pendapatan / Pemasukan</span>
                    <span className="text-emerald-500 text-sm font-mono font-black">Rp {totalIncome.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] space-y-1">
                    <p>• Pendapatan Utama & Gaji</p>
                    <p>• Penerimaan Jasa Freelance & Pemasukan Lain-Lain</p>
                  </div>
                </div>

                {/* Beban / Pengeluaran */}
                <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
                  <div className="flex justify-between font-bold text-[var(--text-primary)] mb-2">
                    <span className="uppercase tracking-wider">2. Total Beban Operasional & Pengeluaran</span>
                    <span className="text-red-500 text-sm font-mono font-black">- Rp {totalExpense.toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-[11px] text-[var(--text-secondary)] space-y-1">
                    <p>• Makanan & Kuliner, Transportasi, Belanja Harian</p>
                    <p>• Tagihan, Utilitas & Biaya Operasional</p>
                  </div>
                </div>

                {/* Laba Bersih */}
                <div className="bg-[var(--gold-badge-bg)] p-5 rounded-2xl border border-[var(--gold-badge-border)] flex justify-between items-center">
                  <div>
                    <span className="text-xs font-bold text-[var(--gold-primary)] uppercase tracking-wider block">
                      LABA / RUGI BERSIH (NET PROFIT)
                    </span>
                    <p className="text-[11px] text-[var(--text-secondary)]">Setelah dikurangi seluruh beban pengeluaran</p>
                  </div>
                  <span className={`text-2xl font-black font-mono ${netProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                    Rp {netProfit.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>
          )}

          {reportType === 'cashflow' && (
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
              <div className="border-b border-[var(--border)] pb-4">
                <h4 className="text-lg font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Laporan Arus Kas (Cash Flow)</h4>
                <p className="text-xs text-[var(--text-secondary)]">Ringkasan Masuk & Keluar Kas Real-time ({periodLabel})</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Arus Kas Operasional</span>
                  <div className="text-lg font-black text-emerald-500 font-mono mt-1">
                    Rp {totalIncome.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">Penerimaan harian kas</p>
                </div>

                <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Arus Kas Pengeluaran</span>
                  <div className="text-lg font-black text-red-500 font-mono mt-1">
                    - Rp {totalExpense.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">Kas keluar untuk biaya & tagihan</p>
                </div>

                <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Saldo Akhir Kas</span>
                  <div className="text-lg font-black text-[var(--gold-primary)] font-mono mt-1">
                    Rp {totalBalance.toLocaleString('id-ID')}
                  </div>
                  <p className="text-[10px] text-[var(--text-secondary)] mt-1">Tersedia pada seluruh akun dompet</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'balance_sheet' && (
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
              <div className="border-b border-[var(--border)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
                    <Scale className="w-5 h-5 text-[var(--gold-primary)]" />
                    Neraca Keuangan (Balance Sheet)
                  </h4>
                  <p className="text-xs text-[var(--text-secondary)]">Persamaan Akuntansi: Total Aset = Total Liabilitas + Ekuitas Bersih</p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] text-[var(--gold-primary)] font-extrabold self-start sm:self-auto">
                  Real-time Asset Sync
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Aset (Aktiva) */}
                <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                    <h5 className="font-extrabold text-emerald-500 text-sm uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                      1. Aset (Aktiva / Assets)
                    </h5>
                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-0.5 rounded-lg border border-emerald-500/20 font-mono">
                      Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[var(--text-primary)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Kas & Setara Kas (Saldo Dompet & Bank)
                      </span>
                      <span className="font-bold text-[var(--text-primary)] font-mono">Rp {totalBalance.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[var(--text-primary)] font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                          Portofolio Investasi ({filteredInvestments.length} Aset)
                        </span>
                        <span className="font-bold text-[var(--gold-primary)] font-mono">Rp {totalInvestment.toLocaleString('id-ID')}</span>
                      </div>

                      {filteredInvestments.length > 0 ? (
                        <div className="ml-3 pl-3 border-l-2 border-[var(--gold-badge-border)] space-y-1.5 my-2">
                          {filteredInvestments.map(inv => (
                            <div key={inv.id} className="flex items-center justify-between text-[11px]">
                              <span className="text-[var(--text-secondary)] flex items-center gap-1">
                                <span className="text-[var(--text-primary)] font-medium">• {inv.name}</span>
                                <span className="text-[10px] text-[var(--text-muted)]">({inv.platform})</span>
                              </span>
                              <span className="font-semibold text-[var(--text-primary)] font-mono">
                                Rp {inv.currentAmount.toLocaleString('id-ID')}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="ml-3 text-[11px] text-[var(--text-muted)] italic">
                          Belum ada aset investasi terdaftar.
                        </div>
                      )}
                    </div>

                    {totalReceivables > 0 && (
                      <div className="flex justify-between text-[var(--text-primary)] font-medium">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          Piutang (Hutang Orang ke Kita)
                        </span>
                        <span className="font-bold text-blue-500 font-mono">Rp {totalReceivables.toLocaleString('id-ID')}</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-[var(--border)] pt-3 flex justify-between font-black text-[var(--text-primary)] text-sm bg-[var(--card-bg)] p-3 rounded-xl border">
                    <span>TOTAL AKTIVA / ASET</span>
                    <span className="text-emerald-500 font-mono">Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}</span>
                  </div>
                </div>

                {/* Liabilitas & Ekuitas (Pasiva) */}
                <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--border)] space-y-4">
                  <div className="flex justify-between items-center border-b border-[var(--border)] pb-2">
                    <h5 className="font-extrabold text-red-500 text-sm uppercase tracking-wider font-['Plus_Jakarta_Sans',sans-serif]">
                      2. Liabilitas & Ekuitas (Pasiva)
                    </h5>
                    <span className="text-xs font-bold text-[var(--text-primary)] bg-[var(--card-bg)] px-2.5 py-0.5 rounded-lg border border-[var(--border)] font-mono">
                      Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between text-[var(--text-primary)] font-medium">
                      <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-red-500" />
                        Liabilitas (Hutang & Tagihan)
                      </span>
                      <span className="font-bold text-red-500 font-mono">Rp {totalLiabilities.toLocaleString('id-ID')}</span>
                    </div>

                    <div className="p-3.5 bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] rounded-xl space-y-1">
                      <div className="flex justify-between text-[var(--text-primary)] font-bold">
                        <span className="flex items-center gap-1.5 text-[var(--gold-primary)]">
                          <span className="w-2 h-2 rounded-full bg-[var(--gold-primary)]" />
                          Ekuitas Bersih (Net Worth)
                        </span>
                        <span className="text-[var(--gold-primary)] font-black text-sm font-mono">
                          Rp {totalNetWorth.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)]">
                        Total Kekayaan Bersih = Total Aset - Total Hutang
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-[var(--border)] pt-3 flex justify-between font-black text-[var(--text-primary)] text-sm bg-[var(--card-bg)] p-3 rounded-xl border">
                    <span>TOTAL PASIVA (Liabilitas + Ekuitas)</span>
                    <span className="text-emerald-500 font-mono">
                      Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reportType === 'category' && (
            <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
              <div className="border-b border-[var(--border)] pb-4">
                <h4 className="text-base font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Analisis Pengeluaran per Kategori</h4>
                <p className="text-xs text-[var(--text-secondary)]">Grafik Interactive Donut & Rincian Persentase Pengeluaran ({periodLabel})</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
                {/* Recharts Donut Chart per Category */}
                <div className="h-64 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)] relative flex items-center justify-center">
                  {categoryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={3}
                          dataKey="value"
                        >
                          {categoryChartData.map((entry, index) => (
                            <Cell key={`cell-cat-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                          verticalAlign="bottom"
                          height={36}
                          formatter={(value) => <span className="text-[10px] text-[var(--text-secondary)]">{value}</span>}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)]">Belum ada data pengeluaran kategori.</p>
                  )}
                </div>

                {/* List Progress Bar */}
                <div className="space-y-3">
                  {Object.keys(categoryMap).map((cat, idx) => {
                    const amount = categoryMap[cat];
                    const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
                    const color = categoryColors[idx % categoryColors.length];
                    return (
                      <div key={cat} className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border)] text-xs space-y-1.5">
                        <div className="flex justify-between font-bold">
                          <span className="text-[var(--text-primary)] flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                            {cat}
                          </span>
                          <span className="text-[var(--gold-primary)] font-black font-mono">
                            Rp {amount.toLocaleString('id-ID')} ({pct}%)
                          </span>
                        </div>
                        <div className="w-full bg-[var(--card-bg)] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

