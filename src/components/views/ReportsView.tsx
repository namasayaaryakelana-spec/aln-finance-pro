import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  PieChart as PieIcon,
  Scale,
  TrendingUp,
  Download,
  ArrowUpRight,
  ArrowDownRight
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
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-950 border border-slate-800 p-3 rounded-2xl shadow-2xl text-xs space-y-1">
        <p className="font-extrabold text-white flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="font-bold text-emerald-400">
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
  const [period] = useState('Bulan Ini (Juli 2026)');

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

  const categoryColors = ['#F59E0B', '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#6366F1', '#10B981', '#F43F5E'];
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Laporan Keuangan Eksekutif</h3>
            <p className="text-xs text-slate-400">Analisis Laba Rugi, Arus Kas & Neraca</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(filteredTransactions, 'Laporan_Keuangan_ALN.csv')}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            CSV
          </button>
        </div>
      </div>

      {/* Interactive Visual Donut Chart Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Income vs Expense Donut Chart Card */}
        <div className="lg:col-span-2 bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-emerald-400" />
                Breakdown Pemasukan vs Pengeluaran
              </h4>
              <p className="text-[11px] text-slate-400 mt-0.5">Visualisasi rasio arus kas masuk dan keluar</p>
            </div>
            <span className="text-[10px] bg-slate-800 text-emerald-400 font-bold px-2.5 py-1 rounded-full border border-slate-700">
              Recharts Interactive
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Net Flow</span>
                <span className={`text-xs font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  Rp {(Math.abs(netProfit) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-extrabold text-white">Total Pemasukan</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-emerald-400" /> Cash Inflow
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-emerald-400">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div>
                    <p className="font-extrabold text-white">Total Pengeluaran</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-red-400" /> Cash Outflow
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-red-400">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3 bg-emerald-950/30 rounded-2xl border border-emerald-500/30 flex items-center justify-between">
                <div>
                  <p className="font-bold text-emerald-300">Rasio Tabungan / Margin</p>
                  <p className="text-[10px] text-slate-400">Pemasukan tersimpan bersih</p>
                </div>
                <span className="font-extrabold text-emerald-400 text-sm">
                  {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-4">
          <div className="border-b border-slate-800 pb-3">
            <h4 className="text-sm font-extrabold text-white">Ringkasan Eksekutif Kas</h4>
            <p className="text-[11px] text-slate-400 mt-0.5">Metrik performa keuangan pribadi</p>
          </div>

          <div className="space-y-3 text-xs my-auto">
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Laba Bersih Saat Ini</span>
              <span className={`text-xl font-extrabold block mt-0.5 ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Saldo Likuid Kas</span>
              <span className="text-xl font-extrabold text-blue-400 block mt-0.5">
                Rp {totalBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-[11px] text-slate-400 text-center">
            💡 Grafik Donut Recharts diperbarui secara real-time berdasarkan filter & transaksi kas pribadi Anda.
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
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
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
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
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-extrabold text-white">Laporan Laba Rugi (Profit & Loss)</h4>
              <p className="text-xs text-slate-400">Scope: {currentScope.toUpperCase()} • Periode: {period}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-emerald-400 font-bold">
              Standar Akuntansi Keuangan
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Pendapatan */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between font-bold text-slate-300 mb-2">
                <span className="uppercase tracking-wider">1. Total Pendapatan / Pemasukan</span>
                <span className="text-emerald-400 text-sm">Rp {totalIncome.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>• Pendapatan Utama & Gaji</p>
                <p>• Penerimaan Jasa Freelance & Pemasukan Lain-Lain</p>
              </div>
            </div>

            {/* Beban / Pengeluaran */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <div className="flex justify-between font-bold text-slate-300 mb-2">
                <span className="uppercase tracking-wider">2. Total Beban Operasional & Pengeluaran</span>
                <span className="text-red-400 text-sm">- Rp {totalExpense.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-slate-400 space-y-1">
                <p>• Makanan & Kuliner, Transportasi, Belanja Harian</p>
                <p>• Tagihan, Utilitas & Biaya Operasional</p>
              </div>
            </div>

            {/* Laba Bersih */}
            <div className="bg-emerald-500/10 p-5 rounded-2xl border border-emerald-500/30 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  LABA / RUGI BERSIH (NET PROFIT)
                </span>
                <p className="text-[11px] text-slate-300">Setelah dikurangi seluruh beban pengeluaran</p>
              </div>
              <span className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'cashflow' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-lg font-extrabold text-white">Laporan Arus Kas (Cash Flow)</h4>
            <p className="text-xs text-slate-400">Ringkasan Masuk & Keluar Kas Real-time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Arus Kas Operasional</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-1">
                Rp {(totalIncome * 0.85).toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Penerimaan harian kas</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Arus Kas Pengeluaran</span>
              <div className="text-lg font-extrabold text-red-400 mt-1">
                - Rp {totalExpense.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Kas keluar untuk biaya & tagihan</p>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase font-bold">Saldo Akhir Kas</span>
              <div className="text-lg font-extrabold text-blue-400 mt-1">
                Rp {totalBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Tersedia pada seluruh akun dompet</p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'balance_sheet' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-emerald-400" />
                Neraca Keuangan (Balance Sheet)
              </h4>
              <p className="text-xs text-slate-400">Persamaan Akuntansi: Total Aset = Total Liabilitas + Ekuitas Bersih</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold self-start sm:self-auto">
              Real-time Asset Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Aset (Aktiva) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h5 className="font-extrabold text-emerald-400 text-sm uppercase tracking-wider">
                  1. Aset (Aktiva / Assets)
                </h5>
                <span className="text-xs font-bold text-emerald-300 bg-emerald-950 px-2.5 py-0.5 rounded-lg border border-emerald-800">
                  Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    Kas & Setara Kas (Saldo Dompet & Bank)
                  </span>
                  <span className="font-bold text-white">Rp {totalBalance.toLocaleString('id-ID')}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      Portofolio Investasi & Aset ({filteredInvestments.length} Aset)
                    </span>
                    <span className="font-bold text-amber-300">Rp {totalInvestment.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Investment Items Breakdown */}
                  {filteredInvestments.length > 0 ? (
                    <div className="ml-3 pl-3 border-l-2 border-amber-500/30 space-y-1.5 my-2">
                      {filteredInvestments.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400 flex items-center gap-1">
                            <span className="text-slate-200 font-medium">• {inv.name}</span>
                            <span className="text-[10px] text-slate-500">({inv.platform})</span>
                          </span>
                          <span className="font-semibold text-slate-200">
                            Rp {inv.currentAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-3 text-[11px] text-slate-500 italic">
                      Belum ada aset investasi terdaftar di menu Investasi.
                    </div>
                  )}
                </div>

                {totalReceivables > 0 && (
                  <div className="flex justify-between text-slate-300 font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-cyan-400" />
                      Piutang (Hutang Orang ke Kita)
                    </span>
                    <span className="font-bold text-cyan-300">Rp {totalReceivables.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between font-extrabold text-white text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span>TOTAL AKTIVA / ASET</span>
                <span className="text-emerald-400">Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Liabilitas & Ekuitas (Pasiva) */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                <h5 className="font-extrabold text-red-400 text-sm uppercase tracking-wider">
                  2. Liabilitas & Ekuitas (Pasiva)
                </h5>
                <span className="text-xs font-bold text-slate-300 bg-slate-900 px-2.5 py-0.5 rounded-lg border border-slate-800">
                  Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-slate-300 font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Liabilitas (Hutang & Tagihan Belum Lunas)
                  </span>
                  <span className="font-bold text-rose-400">Rp {totalLiabilities.toLocaleString('id-ID')}</span>
                </div>

                <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1">
                  <div className="flex justify-between text-slate-200 font-bold">
                    <span className="flex items-center gap-1.5 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      Ekuitas Bersih (Net Worth)
                    </span>
                    <span className="text-emerald-400 font-extrabold text-sm">
                      Rp {totalNetWorth.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Total Kekayaan Bersih = Total Aset - Total Hutang
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-800 pt-3 flex justify-between font-extrabold text-white text-sm bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <span>TOTAL PASIVA (Liabilitas + Ekuitas)</span>
                <span className="text-emerald-400">
                  Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'category' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <div className="border-b border-slate-800 pb-4">
            <h4 className="text-base font-extrabold text-white">Analisis Pengeluaran per Kategori</h4>
            <p className="text-xs text-slate-400">Grafik Recharts Donut & Rincian Persentase Pengeluaran</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Recharts Donut Chart per Category */}
            <div className="h-64 bg-slate-950 p-4 rounded-2xl border border-slate-800 relative flex items-center justify-center">
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
                        <Cell key={`cell-cat-${index}`} fill={entry.color} stroke="#0F172A" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[10px] text-slate-300">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500">Belum ada data pengeluaran kategori.</p>
              )}
            </div>

            {/* List Progress Bar */}
            <div className="space-y-3">
              {Object.keys(categoryMap).map((cat, idx) => {
                const amount = categoryMap[cat];
                const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
                const color = categoryColors[idx % categoryColors.length];
                return (
                  <div key={cat} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {cat}
                      </span>
                      <span className="text-emerald-400 font-extrabold">
                        Rp {amount.toLocaleString('id-ID')} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
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

