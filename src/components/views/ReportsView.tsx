import React, { useState } from 'react';
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
  Wallet
} from 'lucide-react';
import { ExportService } from '../../services/export';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const CustomTooltip = ({ active, payload }: any) => {
  const { isDark } = useTheme();
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className={`p-3 rounded-2xl shadow-2xl text-xs space-y-1 border ${
        isDark ? 'bg-[#121A2A] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        <p className="font-extrabold flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="font-bold text-[var(--gold-primary)]">
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
    currentScope,
    totalBalance,
    totalInvestment,
    totalAssets,
    totalLiabilities,
    totalReceivables,
    totalNetWorth
  } = useFinance();

  const [reportType, setReportType] = useState<'pnl' | 'cashflow' | 'balance_sheet' | 'category'>('pnl');
  const [period] = useState('Bulan Ini (Agustus 2026)');

  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const netProfit = totalIncome - totalExpense;

  // Category breakdown
  const categoryMap: { [key: string]: number } = {};
  filteredTransactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryMap[t.category] = (categoryMap[t.category] || 0) + t.amount;
    });

  // Chart Data Preparation
  const overviewChartData = [
    { name: 'Pemasukan (Income)', value: totalIncome || 1, color: '#10B981', actualValue: totalIncome },
    { name: 'Pengeluaran (Expense)', value: totalExpense || 0, color: '#EF4444', actualValue: totalExpense }
  ];

  const categoryColors = ['#D4AF37', '#E4C45A', '#10B981', '#3B82F6', '#EF4444', '#A78BFA', '#06B6D4', '#EC4899'];
  const categoryChartData = Object.keys(categoryMap).map((cat, idx) => ({
    name: cat,
    value: categoryMap[cat],
    color: categoryColors[idx % categoryColors.length]
  }));

  const handlePrintPDF = () => {
    let title = 'Laporan Laba Rugi (Profit & Loss)';
    if (reportType === 'cashflow') title = 'Laporan Arus Kas (Cash Flow Statement)';
    if (reportType === 'balance_sheet') title = 'Neraca Keuangan (Balance Sheet)';
    if (reportType === 'category') title = 'Analisis Pengeluaran Kategori';

    ExportService.printFinancialReportHTML(
      title,
      period,
      { totalIncome, totalExpense, netFlow: netProfit },
      filteredTransactions
    );
  };

  return (
    <div className="space-y-6 pb-20">
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
            <p className="text-xs text-[var(--text-secondary)]">Analisis Laba Rugi, Arus Kas & Neraca (Executive Financial Intelligence)</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(filteredTransactions, 'Laporan_Keuangan_ALN.csv')}
            className="px-3.5 py-2.5 rounded-2xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold text-xs flex items-center gap-2 border border-[var(--border)] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
            CSV
          </button>
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
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Visualisasi rasio arus kas masuk dan keluar</p>
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
                  Rp {(Math.abs(netProfit) / 1000000).toFixed(1)}M
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
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Metrik performa keuangan pribadi</p>
          </div>

          <div className="space-y-3 text-xs my-auto">
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block">Laba Bersih Saat Ini</span>
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
            💡 Grafik Donut diperbarui secara real-time berdasarkan transaksi kas Anda.
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
              className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
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
              <p className="text-xs text-[var(--text-secondary)]">Scope: {currentScope.toUpperCase()} • Periode: {period}</p>
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
            <p className="text-xs text-[var(--text-secondary)]">Ringkasan Masuk & Keluar Kas Real-time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
              <span className="text-[10px] text-[var(--text-muted)] uppercase font-bold tracking-wider">Arus Kas Operasional</span>
              <div className="text-lg font-black text-emerald-500 font-mono mt-1">
                Rp {(totalIncome * 0.85).toLocaleString('id-ID')}
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

                  {/* Investment Items Breakdown */}
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
            <p className="text-xs text-[var(--text-secondary)]">Grafik Interactive Donut & Rincian Persentase Pengeluaran</p>
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
    </div>
  );
};
