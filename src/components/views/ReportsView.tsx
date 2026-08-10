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
      <div className="bg-[#121A2A] border border-[rgba(255,255,255,0.12)] p-3 rounded-2xl shadow-2xl text-xs space-y-1">
        <p className="font-extrabold text-white flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
          {data.name}
        </p>
        <p className="font-bold text-[#F6D365]">
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
    { name: 'Pemasukan (Income)', value: totalIncome || 1, color: '#22C55E', actualValue: totalIncome },
    { name: 'Pengeluaran (Expense)', value: totalExpense || 0, color: '#EF4444', actualValue: totalExpense }
  ];

  const categoryColors = ['#D4AF37', '#F6D365', '#22C55E', '#3B82F6', '#EF4444', '#A78BFA', '#06B6D4', '#E11D48'];
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
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#F6D365] font-bold">
            <BarChart3 className="w-5 h-5 text-[#F6D365]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Laporan Keuangan Eksekutif</h3>
            <p className="text-xs text-[#7C8799]">Analisis Laba Rugi, Arus Kas & Neraca</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrintPDF}
            className="px-4 py-2 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
          >
            <Printer className="w-4 h-4" />
            Cetak / PDF
          </button>

          <button
            onClick={() => ExportService.exportTransactionsCSV(filteredTransactions, 'Laporan_Keuangan_ALN.csv')}
            className="px-3.5 py-2 rounded-2xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] font-bold text-xs flex items-center gap-2 border border-[rgba(255,255,255,0.08)] transition-all"
          >
            <Download className="w-3.5 h-3.5 text-[#BFC8D6]" />
            CSV
          </button>
        </div>
      </div>

      {/* Interactive Visual Donut Chart Section (Recharts) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expense Donut Chart Card */}
        <div className="lg:col-span-2 bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3.5">
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <PieIcon className="w-4 h-4 text-[#F6D365]" />
                Breakdown Pemasukan vs Pengeluaran
              </h4>
              <p className="text-[11px] text-[#7C8799] mt-0.5">Visualisasi rasio arus kas masuk dan keluar</p>
            </div>
            <span className="text-[10px] bg-[rgba(212,175,55,0.12)] text-[#F6D365] font-bold px-3 py-1 rounded-full border border-[rgba(212,175,55,0.25)]">
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
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="#0B1220" strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[10px] font-bold text-[#7C8799] uppercase">Net Flow</span>
                <span className={`text-xs font-extrabold ${netProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                  Rp {(Math.abs(netProfit) / 1000000).toFixed(1)}M
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#22C55E]" />
                  <div>
                    <p className="font-extrabold text-white">Total Pemasukan</p>
                    <p className="text-[10px] text-[#7C8799] flex items-center gap-1">
                      <ArrowDownRight className="w-3 h-3 text-[#22C55E]" /> Cash Inflow
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-[#22C55E]">
                  Rp {totalIncome.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3.5 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#EF4444]" />
                  <div>
                    <p className="font-extrabold text-white">Total Pengeluaran</p>
                    <p className="text-[10px] text-[#7C8799] flex items-center gap-1">
                      <ArrowUpRight className="w-3 h-3 text-[#EF4444]" /> Cash Outflow
                    </p>
                  </div>
                </div>
                <span className="font-extrabold text-[#EF4444]">
                  Rp {totalExpense.toLocaleString('id-ID')}
                </span>
              </div>

              <div className="p-3.5 bg-[rgba(212,175,55,0.1)] rounded-2xl border border-[rgba(212,175,55,0.25)] flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#F6D365]">Rasio Tabungan / Margin</p>
                  <p className="text-[10px] text-[#BFC8D6]">Pemasukan tersimpan bersih</p>
                </div>
                <span className="font-extrabold text-[#F6D365] text-sm">
                  {totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0'}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Summary Card */}
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between space-y-4">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-3.5">
            <h4 className="text-sm font-extrabold text-white">Ringkasan Eksekutif Kas</h4>
            <p className="text-[11px] text-[#7C8799] mt-0.5">Metrik performa keuangan pribadi</p>
          </div>

          <div className="space-y-3 text-xs my-auto">
            <div className="bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] text-[#7C8799] font-bold uppercase block">Laba Bersih Saat Ini</span>
              <span className={`text-xl font-extrabold block mt-0.5 ${netProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>

            <div className="bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] text-[#7C8799] font-bold uppercase block">Total Saldo Likuid Kas</span>
              <span className="text-xl font-extrabold text-[#F6D365] block mt-0.5">
                Rp {totalBalance.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[#0B1220] border border-[rgba(255,255,255,0.08)] text-[11px] text-[#7C8799] text-center">
            💡 Grafik Donut Recharts diperbarui secara real-time berdasarkan filter & transaksi kas pribadi Anda.
          </div>
        </div>
      </div>

      {/* Tabs Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-[#0B1220] p-2 rounded-3xl border border-[rgba(255,255,255,0.08)]">
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
                  ? 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-md font-extrabold'
                  : 'text-[#7C8799] hover:text-[#BFC8D6]'
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
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex justify-between items-center">
            <div>
              <h4 className="text-lg font-extrabold text-white">Laporan Laba Rugi (Profit & Loss)</h4>
              <p className="text-xs text-[#7C8799]">Scope: {currentScope.toUpperCase()} • Periode: {period}</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(212,175,55,0.12)] text-[#F6D365] border border-[rgba(212,175,55,0.25)] font-bold">
              Standar Akuntansi Keuangan
            </span>
          </div>

          <div className="space-y-4 text-xs">
            {/* Pendapatan */}
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <div className="flex justify-between font-bold text-[#BFC8D6] mb-2">
                <span className="uppercase tracking-wider">1. Total Pendapatan / Pemasukan</span>
                <span className="text-[#22C55E] text-sm">Rp {totalIncome.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-[#7C8799] space-y-1">
                <p>• Pendapatan Utama & Gaji</p>
                <p>• Penerimaan Jasa Freelance & Pemasukan Lain-Lain</p>
              </div>
            </div>

            {/* Beban / Pengeluaran */}
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <div className="flex justify-between font-bold text-[#BFC8D6] mb-2">
                <span className="uppercase tracking-wider">2. Total Beban Operasional & Pengeluaran</span>
                <span className="text-[#EF4444] text-sm">- Rp {totalExpense.toLocaleString('id-ID')}</span>
              </div>
              <div className="text-[11px] text-[#7C8799] space-y-1">
                <p>• Makanan & Kuliner, Transportasi, Belanja Harian</p>
                <p>• Tagihan, Utilitas & Biaya Operasional</p>
              </div>
            </div>

            {/* Laba Bersih */}
            <div className="bg-[rgba(212,175,55,0.1)] p-5 rounded-2xl border border-[rgba(212,175,55,0.25)] flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-[#F6D365] uppercase tracking-wider block">
                  LABA / RUGI BERSIH (NET PROFIT)
                </span>
                <p className="text-[11px] text-[#BFC8D6]">Setelah dikurangi seluruh beban pengeluaran</p>
              </div>
              <span className={`text-2xl font-extrabold ${netProfit >= 0 ? 'text-[#22C55E]' : 'text-[#EF4444]'}`}>
                Rp {netProfit.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>
      )}

      {reportType === 'cashflow' && (
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h4 className="text-lg font-extrabold text-white">Laporan Arus Kas (Cash Flow)</h4>
            <p className="text-xs text-[#7C8799]">Ringkasan Masuk & Keluar Kas Real-time</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] text-[#7C8799] uppercase font-bold">Arus Kas Operasional</span>
              <div className="text-lg font-extrabold text-[#22C55E] mt-1">
                Rp {(totalIncome * 0.85).toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-[#7C8799] mt-1">Penerimaan harian kas</p>
            </div>

            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] text-[#7C8799] uppercase font-bold">Arus Kas Pengeluaran</span>
              <div className="text-lg font-extrabold text-[#EF4444] mt-1">
                - Rp {totalExpense.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-[#7C8799] mt-1">Kas keluar untuk biaya & tagihan</p>
            </div>

            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.08)]">
              <span className="text-[10px] text-[#7C8799] uppercase font-bold">Saldo Akhir Kas</span>
              <div className="text-lg font-extrabold text-[#F6D365] mt-1">
                Rp {totalBalance.toLocaleString('id-ID')}
              </div>
              <p className="text-[10px] text-[#7C8799] mt-1">Tersedia pada seluruh akun dompet</p>
            </div>
          </div>
        </div>
      )}

      {reportType === 'balance_sheet' && (
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h4 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Scale className="w-5 h-5 text-[#F6D365]" />
                Neraca Keuangan (Balance Sheet)
              </h4>
              <p className="text-xs text-[#7C8799]">Persamaan Akuntansi: Total Aset = Total Liabilitas + Ekuitas Bersih</p>
            </div>
            <span className="text-xs px-3 py-1 rounded-full bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] text-[#F6D365] font-extrabold self-start sm:self-auto">
              Real-time Asset Sync
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
            {/* Aset (Aktiva) */}
            <div className="bg-[#0B1220] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-4">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-2">
                <h5 className="font-extrabold text-[#22C55E] text-sm uppercase tracking-wider">
                  1. Aset (Aktiva / Assets)
                </h5>
                <span className="text-xs font-bold text-[#22C55E] bg-[rgba(34,197,94,0.1)] px-2.5 py-0.5 rounded-lg border border-[rgba(34,197,94,0.25)]">
                  Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[#BFC8D6] font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
                    Kas & Setara Kas (Saldo Dompet & Bank)
                  </span>
                  <span className="font-bold text-white">Rp {totalBalance.toLocaleString('id-ID')}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-[#BFC8D6] font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#F6D365]" />
                      Portofolio Investasi & Aset ({filteredInvestments.length} Aset)
                    </span>
                    <span className="font-bold text-[#F6D365]">Rp {totalInvestment.toLocaleString('id-ID')}</span>
                  </div>

                  {/* Investment Items Breakdown */}
                  {filteredInvestments.length > 0 ? (
                    <div className="ml-3 pl-3 border-l-2 border-[rgba(212,175,55,0.3)] space-y-1.5 my-2">
                      {filteredInvestments.map(inv => (
                        <div key={inv.id} className="flex items-center justify-between text-[11px]">
                          <span className="text-[#7C8799] flex items-center gap-1">
                            <span className="text-[#BFC8D6] font-medium">• {inv.name}</span>
                            <span className="text-[10px] text-[#7C8799]">({inv.platform})</span>
                          </span>
                          <span className="font-semibold text-[#BFC8D6]">
                            Rp {inv.currentAmount.toLocaleString('id-ID')}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="ml-3 text-[11px] text-[#7C8799] italic">
                      Belum ada aset investasi terdaftar di menu Investasi.
                    </div>
                  )}
                </div>

                {totalReceivables > 0 && (
                  <div className="flex justify-between text-[#BFC8D6] font-medium">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[#3B82F6]" />
                      Piutang (Hutang Orang ke Kita)
                    </span>
                    <span className="font-bold text-[#3B82F6]">Rp {totalReceivables.toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-[rgba(255,255,255,0.08)] pt-3 flex justify-between font-extrabold text-white text-sm bg-[#121A2A] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                <span>TOTAL AKTIVA / ASET</span>
                <span className="text-[#22C55E]">Rp {(totalAssets + totalReceivables).toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Liabilitas & Ekuitas (Pasiva) */}
            <div className="bg-[#0B1220] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-4">
              <div className="flex justify-between items-center border-b border-[rgba(255,255,255,0.08)] pb-2">
                <h5 className="font-extrabold text-[#EF4444] text-sm uppercase tracking-wider">
                  2. Liabilitas & Ekuitas (Pasiva)
                </h5>
                <span className="text-xs font-bold text-[#BFC8D6] bg-[#121A2A] px-2.5 py-0.5 rounded-lg border border-[rgba(255,255,255,0.08)]">
                  Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-[#BFC8D6] font-medium">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#EF4444]" />
                    Liabilitas (Hutang & Tagihan Belum Lunas)
                  </span>
                  <span className="font-bold text-[#EF4444]">Rp {totalLiabilities.toLocaleString('id-ID')}</span>
                </div>

                <div className="p-3.5 bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.25)] rounded-xl space-y-1">
                  <div className="flex justify-between text-[#BFC8D6] font-bold">
                    <span className="flex items-center gap-1.5 text-[#F6D365]">
                      <span className="w-2 h-2 rounded-full bg-[#F6D365]" />
                      Ekuitas Bersih (Net Worth)
                    </span>
                    <span className="text-[#F6D365] font-extrabold text-sm">
                      Rp {totalNetWorth.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <p className="text-[10px] text-[#7C8799]">
                    Total Kekayaan Bersih = Total Aset - Total Hutang
                  </p>
                </div>
              </div>

              <div className="border-t border-[rgba(255,255,255,0.08)] pt-3 flex justify-between font-extrabold text-white text-sm bg-[#121A2A] p-3 rounded-xl border border-[rgba(255,255,255,0.08)]">
                <span>TOTAL PASIVA (Liabilitas + Ekuitas)</span>
                <span className="text-[#22C55E]">
                  Rp {(totalLiabilities + totalNetWorth).toLocaleString('id-ID')}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'category' && (
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          <div className="border-b border-[rgba(255,255,255,0.08)] pb-4">
            <h4 className="text-base font-extrabold text-white">Analisis Pengeluaran per Kategori</h4>
            <p className="text-xs text-[#7C8799]">Grafik Recharts Donut & Rincian Persentase Pengeluaran</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            {/* Recharts Donut Chart per Category */}
            <div className="h-64 bg-[#0B1220] p-4 rounded-2xl border border-[rgba(255,255,255,0.08)] relative flex items-center justify-center">
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
                        <Cell key={`cell-cat-${index}`} fill={entry.color} stroke="#0B1220" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      formatter={(value) => <span className="text-[10px] text-[#BFC8D6]">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-[#7C8799]">Belum ada data pengeluaran kategori.</p>
              )}
            </div>

            {/* List Progress Bar */}
            <div className="space-y-3">
              {Object.keys(categoryMap).map((cat, idx) => {
                const amount = categoryMap[cat];
                const pct = totalExpense > 0 ? ((amount / totalExpense) * 100).toFixed(1) : '0';
                const color = categoryColors[idx % categoryColors.length];
                return (
                  <div key={cat} className="bg-[#0B1220] p-3.5 rounded-2xl border border-[rgba(255,255,255,0.08)] text-xs space-y-1.5">
                    <div className="flex justify-between font-bold">
                      <span className="text-white flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                        {cat}
                      </span>
                      <span className="text-[#F6D365] font-extrabold">
                        Rp {amount.toLocaleString('id-ID')} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#121A2A] h-2 rounded-full overflow-hidden">
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
