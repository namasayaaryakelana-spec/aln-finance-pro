import { Wallet, Transaction, Budget, BillAndDebt, FinancialGoal, Investment } from '../types';

export interface FinancialDataInput {
  wallets: Wallet[];
  transactions: Transaction[];
  budgets?: Budget[];
  debts?: BillAndDebt[];
  goals?: FinancialGoal[];
  investments?: Investment[];
  totalBalance?: number;
  totalIncome?: number;
  totalExpense?: number;
}

export interface RecommendationItem {
  id: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  action: string;
  relatedMetric: string;
}

export interface FinancialHealthResult {
  healthScore: number;
  healthGrade: 'Excellent' | 'Very Healthy' | 'Healthy' | 'Fair' | 'Needs Attention' | 'Critical';
  summary: string;
  coverageMetrics: string;
  scores: {
    cashFlow: number;
    savings: number;
    expenseControl: number;
    emergencyFund: number;
    debt: number;
    budgetDiscipline: number;
  };
  risks: string[];
  recommendations: string[];
  structuredRecommendations: RecommendationItem[];
}

export const FINANCIAL_THRESHOLDS = {
  HIGH_CATEGORY_WARNING_PERCENT: 25,
  HIGH_CATEGORY_CRITICAL_PERCENT: 35,
  HIGH_TRANSACTION_AMOUNT: 200000,
  EXCELLENT_SAVINGS_RATE: 30,
  HEALTHY_SAVINGS_RATE: 20,
  NEEDS_IMPROVEMENT_SAVINGS_RATE: 10,
  EXCELLENT_EMERGENCY_MONTHS: 6,
  HEALTHY_EMERGENCY_MONTHS: 3,
  NEEDS_ATTENTION_EMERGENCY_MONTHS: 1,
};

export const FinancialAdvisorService = {
  /**
   * Calculate Cash Flow Analytics
   */
  analyzeCashFlow(data: FinancialDataInput) {
    const transactions = data.transactions || [];
    const totalIncome = data.totalIncome ?? transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const totalExpense = data.totalExpense ?? transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (t.amount || 0), 0);

    const netCashFlow = totalIncome - totalExpense;
    const cashFlowRatio = totalIncome > 0 ? (netCashFlow / totalIncome) * 100 : 0;

    let status: 'POSITIVE' | 'NEUTRAL' | 'NEGATIVE' = 'POSITIVE';
    let insight = '';

    if (totalIncome === 0 && totalExpense === 0) {
      status = 'NEUTRAL';
      insight = 'Belum ada data pemasukan atau pengeluaran tercatat bulan ini.';
    } else if (netCashFlow > 0) {
      status = 'POSITIVE';
      insight = `Arus kas positif! Anda menyisihkan surplus sebesar Rp ${netCashFlow.toLocaleString('id-ID')} (${cashFlowRatio.toFixed(1)}% dari pemasukan).`;
    } else if (netCashFlow === 0) {
      status = 'NEUTRAL';
      insight = 'Arus kas seimbang (Pemasukan sama persis dengan pengeluaran). Solusi: Alokasikan tabungan di awal bulan.';
    } else {
      status = 'NEGATIVE';
      insight = `Peringatan Defisit Arus Kas! Pengeluaran melebihi pemasukan sebesar Rp ${Math.abs(netCashFlow).toLocaleString('id-ID')}.`;
    }

    return {
      totalIncome,
      totalExpense,
      netCashFlow,
      cashFlowRatio,
      status,
      insight
    };
  },

  /**
   * Calculate Savings Rate Analytics
   */
  analyzeSavings(data: FinancialDataInput) {
    const cf = this.analyzeCashFlow(data);
    const { totalIncome, netCashFlow } = cf;

    if (totalIncome <= 0) {
      return {
        savingsRate: 0,
        grade: 'Needs Improvement',
        insight: 'Pemasukan belum tercatat. Rekomendasi tabungan membutuhkan data pemasukan bersih.'
      };
    }

    const savingsRate = Math.max(0, (netCashFlow / totalIncome) * 100);
    let grade: 'Excellent' | 'Healthy' | 'Needs Improvement' | 'Low' = 'Low';

    if (savingsRate >= FINANCIAL_THRESHOLDS.EXCELLENT_SAVINGS_RATE) {
      grade = 'Excellent';
    } else if (savingsRate >= FINANCIAL_THRESHOLDS.HEALTHY_SAVINGS_RATE) {
      grade = 'Healthy';
    } else if (savingsRate >= FINANCIAL_THRESHOLDS.NEEDS_IMPROVEMENT_SAVINGS_RATE) {
      grade = 'Needs Improvement';
    } else {
      grade = 'Low';
    }

    return {
      savingsRate,
      grade,
      insight: `Rasio tabungan Anda saat ini berada di **${savingsRate.toFixed(1)}%** (${grade}). ${
        savingsRate >= 20 
          ? 'Pertahankan konsistensi alokasi tabungan bulanan.' 
          : 'Disarankan menyisihkan minimal 20% pemasukan bersih sebelum belanja.'
      }`
    };
  },

  /**
   * Group and Analyze Expenses by Category
   */
  analyzeExpenses(data: FinancialDataInput) {
    const transactions = data.transactions || [];
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpense = data.totalExpense ?? expenseTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);

    const categoryMap: { [category: string]: number } = {};
    expenseTransactions.forEach(t => {
      const cat = t.category || 'Lain-lain';
      const amt = t.amount || 0;
      categoryMap[cat] = (categoryMap[cat] || 0) + amt;
    });

    const categoryBreakdown = Object.keys(categoryMap).map(category => {
      const total = categoryMap[category];
      const percentage = totalExpense > 0 ? (total / totalExpense) * 100 : 0;
      return {
        category,
        total,
        percentage
      };
    }).sort((a, b) => b.total - a.total);

    const topCategory = categoryBreakdown[0] || null;
    const warnings: string[] = [];

    categoryBreakdown.forEach(item => {
      if (item.percentage >= FINANCIAL_THRESHOLDS.HIGH_CATEGORY_CRITICAL_PERCENT) {
        warnings.push(`Kategori "${item.category}" mendominasi ${item.percentage.toFixed(1)}% total pengeluaran (Batas Kritis: ${FINANCIAL_THRESHOLDS.HIGH_CATEGORY_CRITICAL_PERCENT}%).`);
      } else if (item.percentage >= FINANCIAL_THRESHOLDS.HIGH_CATEGORY_WARNING_PERCENT) {
        warnings.push(`Kategori "${item.category}" mengambil ${item.percentage.toFixed(1)}% pengeluaran (Batas Waspada: ${FINANCIAL_THRESHOLDS.HIGH_CATEGORY_WARNING_PERCENT}%).`);
      }
    });

    const highImpactCount = expenseTransactions.filter(t => (t.amount || 0) >= FINANCIAL_THRESHOLDS.HIGH_TRANSACTION_AMOUNT).length;

    return {
      totalExpense,
      categoryBreakdown,
      topCategory,
      warnings,
      highImpactCount
    };
  },

  /**
   * Analyze Budget Compliance
   */
  analyzeBudget(data: FinancialDataInput) {
    const budgets = data.budgets || [];
    if (budgets.length === 0) {
      return {
        hasBudgets: false,
        totalBudgets: 0,
        overBudgetCount: 0,
        warningCount: 0,
        insight: 'Belum ada Anggaran (Budget) yang dibuat. Membuat batas budget membantu mencegah overspending.'
      };
    }

    let overBudgetCount = 0;
    let warningCount = 0;

    const items = budgets.map(b => {
      const limit = b.monthlyLimit || 0;
      const spent = b.spent || 0;
      const usagePercent = limit > 0 ? (spent / limit) * 100 : 0;

      let status: 'Healthy' | 'Watch' | 'Warning' | 'Over Budget' = 'Healthy';
      if (usagePercent > 100) {
        status = 'Over Budget';
        overBudgetCount++;
      } else if (usagePercent >= 90) {
        status = 'Warning';
        warningCount++;
      } else if (usagePercent >= 70) {
        status = 'Watch';
      }

      return {
        categoryName: b.categoryName || 'Kategori',
        limit,
        spent,
        remaining: Math.max(0, limit - spent),
        usagePercent,
        status
      };
    });

    return {
      hasBudgets: true,
      totalBudgets: budgets.length,
      overBudgetCount,
      warningCount,
      items,
      insight: overBudgetCount > 0 
        ? `Terdapat ${overBudgetCount} kategori yang melebihi batas anggaran (Over Budget).`
        : warningCount > 0
        ? `Terdapat ${warningCount} kategori mendekati limit anggaran (>90%).`
        : 'Seluruh anggaran belanja saat ini terkendali dengan baik.'
    };
  },

  /**
   * Analyze Debt Status
   */
  analyzeDebt(data: FinancialDataInput) {
    const debts = data.debts || [];
    const activeDebts = debts.filter(d => d.type === 'debt_payable' && (d.amount || 0) > 0 && d.status !== 'paid');

    if (activeDebts.length === 0) {
      return {
        hasDebt: false,
        totalDebt: 0,
        monthlyPayment: 0,
        message: 'No active debt detected'
      };
    }

    const totalDebt = activeDebts.reduce((sum, d) => sum + (d.amount || 0), 0);
    const cf = this.analyzeCashFlow(data);
    const debtToIncomeRatio = cf.totalIncome > 0 ? (totalDebt / cf.totalIncome) * 100 : 0;

    return {
      hasDebt: true,
      totalDebt,
      activeCount: activeDebts.length,
      debtToIncomeRatio,
      message: `Tercatat ${activeDebts.length} kewajiban/utang aktif dengan total nominal Rp ${totalDebt.toLocaleString('id-ID')}.`
    };
  },

  /**
   * Analyze Emergency Fund
   */
  analyzeEmergencyFund(data: FinancialDataInput) {
    const wallets = data.wallets || [];
    const liquidFunds = data.totalBalance ?? wallets.reduce((sum, w) => sum + (w.balance || 0), 0);
    const cf = this.analyzeCashFlow(data);
    const monthlyExpense = cf.totalExpense > 0 ? cf.totalExpense : 1;

    if (cf.totalExpense <= 0 && liquidFunds <= 0) {
      return {
        status: 'Data belum cukup',
        coverageMonths: 0,
        liquidFunds: 0,
        insight: 'Emergency fund belum dapat dihitung karena data saldo dan pengeluaran belum tersedia.'
      };
    }

    const coverageMonths = liquidFunds / monthlyExpense;
    let status: 'Excellent' | 'Healthy' | 'Needs Attention' | 'Critical' = 'Critical';

    if (coverageMonths >= FINANCIAL_THRESHOLDS.EXCELLENT_EMERGENCY_MONTHS) {
      status = 'Excellent';
    } else if (coverageMonths >= FINANCIAL_THRESHOLDS.HEALTHY_EMERGENCY_MONTHS) {
      status = 'Healthy';
    } else if (coverageMonths >= FINANCIAL_THRESHOLDS.NEEDS_ATTENTION_EMERGENCY_MONTHS) {
      status = 'Needs Attention';
    } else {
      status = 'Critical';
    }

    return {
      status,
      coverageMonths,
      liquidFunds,
      insight: `Dana darurat likuid saat ini mencukupi untuk **${coverageMonths.toFixed(1)} bulan** biaya hidup (${status}). Target aman: 3-6 bulan pengeluaran.`
    };
  },

  /**
   * Analyze Investments
   */
  analyzeInvestments(data: FinancialDataInput) {
    const investments = data.investments || [];
    if (investments.length === 0) {
      return {
        hasInvestments: false,
        totalValue: 0,
        insight: 'Belum ada aset investasi terdaftar dalam portofolio.'
      };
    }

    const totalValue = investments.reduce((sum, inv: any) => sum + (inv.amount || inv.currentValue || inv.value || 0), 0);
    return {
      hasInvestments: true,
      totalValue,
      count: investments.length,
      insight: `Portofolio memiliki ${investments.length} instrumen investasi dengan estimasi nilai Rp ${totalValue.toLocaleString('id-ID')}. Perlu diperhatikan diversifikasi profil risiko.`
    };
  },

  /**
   * Calculate Financial Health Score (0 - 100)
   */
  calculateFinancialHealth(data: FinancialDataInput): FinancialHealthResult {
    const cf = this.analyzeCashFlow(data);
    const savings = this.analyzeSavings(data);
    const exp = this.analyzeExpenses(data);
    const bgt = this.analyzeBudget(data);
    const debt = this.analyzeDebt(data);
    const ef = this.analyzeEmergencyFund(data);

    // 1. Cash Flow Score (25%)
    let cashFlowScore = 50;
    if (cf.totalIncome === 0 && cf.totalExpense === 0) {
      cashFlowScore = 50;
    } else if (cf.netCashFlow > 0) {
      cashFlowScore = Math.min(100, 60 + (savings.savingsRate / 30) * 40);
    } else if (cf.netCashFlow === 0) {
      cashFlowScore = 50;
    } else {
      const deficitRatio = Math.abs(cf.netCashFlow) / (cf.totalIncome || 1);
      cashFlowScore = Math.max(0, 50 - deficitRatio * 50);
    }

    // 2. Savings Score (20%)
    let savingsScore = 40;
    if (savings.savingsRate >= 30) savingsScore = 100;
    else if (savings.savingsRate >= 20) savingsScore = 80 + ((savings.savingsRate - 20) / 10) * 20;
    else if (savings.savingsRate >= 10) savingsScore = 60 + ((savings.savingsRate - 10) / 10) * 20;
    else if (savings.savingsRate >= 0) savingsScore = 40 + (savings.savingsRate / 10) * 20;
    else savingsScore = 20;

    // 3. Expense Control Score (20%)
    let expenseControlScore = 100;
    if (exp.topCategory && exp.topCategory.percentage > 35) {
      expenseControlScore -= 20;
    }
    if (exp.warnings.length > 0) {
      expenseControlScore -= exp.warnings.length * 10;
    }
    expenseControlScore = Math.max(20, expenseControlScore);

    // 4. Emergency Fund Score (15%)
    let emergencyFundScore = 20;
    if (ef.coverageMonths >= 6) emergencyFundScore = 100;
    else emergencyFundScore = Math.min(100, (ef.coverageMonths / 6) * 100);

    // 5. Debt Score (10%)
    let debtScore = 100;
    if (debt.hasDebt) {
      if (debt.debtToIncomeRatio > 50) debtScore = 30;
      else if (debt.debtToIncomeRatio > 30) debtScore = 60;
      else debtScore = 80;
    }

    // 6. Budget Discipline Score (10%)
    let budgetDisciplineScore = 75;
    if (bgt.hasBudgets) {
      if (bgt.overBudgetCount > 0) {
        budgetDisciplineScore = Math.max(20, 75 - bgt.overBudgetCount * 25);
      } else if (bgt.warningCount > 0) {
        budgetDisciplineScore = 85;
      } else {
        budgetDisciplineScore = 100;
      }
    }

    // Calculate Normalized Weighted Score
    const totalWeightedScore = Math.round(
      cashFlowScore * 0.25 +
      savingsScore * 0.20 +
      expenseControlScore * 0.20 +
      emergencyFundScore * 0.15 +
      debtScore * 0.10 +
      budgetDisciplineScore * 0.10
    );

    const healthScore = Math.min(100, Math.max(0, totalWeightedScore));

    let healthGrade: FinancialHealthResult['healthGrade'] = 'Fair';
    if (healthScore >= 90) healthGrade = 'Excellent';
    else if (healthScore >= 80) healthGrade = 'Very Healthy';
    else if (healthScore >= 70) healthGrade = 'Healthy';
    else if (healthScore >= 60) healthGrade = 'Fair';
    else if (healthScore >= 40) healthGrade = 'Needs Attention';
    else healthGrade = 'Critical';

    // Build Risks & Recommendations
    const risks: string[] = [];
    const recommendations: string[] = [];
    const structuredRecommendations: RecommendationItem[] = [];

    if (cf.netCashFlow < 0) {
      risks.push(`Defisit arus kas sebesar Rp ${Math.abs(cf.netCashFlow).toLocaleString('id-ID')} bulan ini.`);
      recommendations.push('Segera evaluasi pengeluaran non-primer dan tunda pembelian barang tersier.');
      structuredRecommendations.push({
        id: 'rec-cashflow-1',
        priority: 'critical',
        title: 'Hentikan Defisit Arus Kas',
        description: `Pengeluaran melebihi pemasukan sebesar Rp ${Math.abs(cf.netCashFlow).toLocaleString('id-ID')}.`,
        action: 'Tinjau ulang transaksi pengeluaran bulan ini.',
        relatedMetric: 'Cash Flow'
      });
    }

    if (savings.savingsRate < FINANCIAL_THRESHOLDS.HEALTHY_SAVINGS_RATE && cf.totalIncome > 0) {
      risks.push(`Rasio tabungan ${savings.savingsRate.toFixed(1)}% berada di bawah target ideal 20%.`);
      recommendations.push('Alokasikan minimal 20% dari setiap pemasukan bersih langsung ke dompet tabungan.');
      structuredRecommendations.push({
        id: 'rec-savings-1',
        priority: 'high',
        title: 'Tingkatkan Rasio Tabungan',
        description: `Rasio tabungan saat ini (${savings.savingsRate.toFixed(1)}%) perlu ditingkatkan ke 20%.`,
        action: 'Gunakan sistem Pay Yourself First di awal bulan.',
        relatedMetric: 'Savings'
      });
    }

    if (exp.topCategory && exp.topCategory.percentage > FINANCIAL_THRESHOLDS.HIGH_CATEGORY_WARNING_PERCENT) {
      risks.push(`Dominasi pengeluaran pada kategori "${exp.topCategory.category}" mencapai ${exp.topCategory.percentage.toFixed(1)}%.`);
      recommendations.push(`Lakukan efisiensi pada kategori "${exp.topCategory.category}".`);
      structuredRecommendations.push({
        id: 'rec-exp-1',
        priority: 'medium',
        title: `Efisiensi Pos ${exp.topCategory.category}`,
        description: `Kategori ini menyerap ${exp.topCategory.percentage.toFixed(1)}% dari total pengeluaran.`,
        action: `Tetapkan batas anggaran ketat untuk ${exp.topCategory.category}.`,
        relatedMetric: 'Expenses'
      });
    }

    if (bgt.overBudgetCount > 0) {
      risks.push(`Terdapat ${bgt.overBudgetCount} kategori anggaran yang melebihi batas (Over Budget).`);
      recommendations.push('Menyesuaikan belanja pada kategori yang melampaui batas anggaran.');
      structuredRecommendations.push({
        id: 'rec-bgt-1',
        priority: 'high',
        title: 'Koreksi Over Budget',
        description: `${bgt.overBudgetCount} kategori melampaui batas budget.`,
        action: 'Kunci dompet pengeluaran terkait.',
        relatedMetric: 'Budget'
      });
    }

    if (ef.coverageMonths < FINANCIAL_THRESHOLDS.HEALTHY_EMERGENCY_MONTHS) {
      risks.push(`Dana darurat (${ef.coverageMonths.toFixed(1)} bulan) di bawah rekomendasi minimal 3 bulan.`);
      recommendations.push('Prioritaskan pengisian Dana Darurat hingga mencapai minimal 3 bulan pengeluaran.');
      structuredRecommendations.push({
        id: 'rec-ef-1',
        priority: 'medium',
        title: 'Perkuat Dana Darurat',
        description: `Saldo likuid baru menutup ${ef.coverageMonths.toFixed(1)} bulan biaya hidup.`,
        action: 'Alokasikan surplus kas bulanan ke dompet dana darurat.',
        relatedMetric: 'Emergency Fund'
      });
    }

    if (risks.length === 0) {
      risks.push('Tidak ditemukan risiko kritis pada data keuangan Anda saat ini.');
    }
    if (recommendations.length === 0) {
      recommendations.push('Pertahankan pola konsistensi pengeluaran dan tingkatkan portofolio investasi.');
    }

    const summary = `Kesehatan keuangan Anda berada di tingkat **${healthGrade}** (Skor: ${healthScore}/100). ${
      cf.netCashFlow >= 0 
        ? `Arus kas bersih tercatat positif +Rp ${cf.netCashFlow.toLocaleString('id-ID')}.`
        : `Terdapat defisit arus kas sebesar -Rp ${Math.abs(cf.netCashFlow).toLocaleString('id-ID')}.`
    }`;

    return {
      healthScore,
      healthGrade,
      summary,
      coverageMetrics: '6/6 metrics evaluated',
      scores: {
        cashFlow: Math.round(cashFlowScore),
        savings: Math.round(savingsScore),
        expenseControl: Math.round(expenseControlScore),
        emergencyFund: Math.round(emergencyFundScore),
        debt: Math.round(debtScore),
        budgetDiscipline: Math.round(budgetDisciplineScore)
      },
      risks,
      recommendations,
      structuredRecommendations
    };
  },

  /**
   * Smart Local Intent Query Processor for AI Advisor Chat Interface
   */
  answerAdvisorQuery(queryText: string, data: FinancialDataInput): string {
    const q = queryText.toLowerCase();
    const cf = this.analyzeCashFlow(data);
    const savings = this.analyzeSavings(data);
    const exp = this.analyzeExpenses(data);
    const bgt = this.analyzeBudget(data);
    const debt = this.analyzeDebt(data);
    const ef = this.analyzeEmergencyFund(data);
    const health = this.calculateFinancialHealth(data);

    // Intent 1: Pemborosan / Pengeluaran / Expense
    if (q.includes('boros') || q.includes('makan') || q.includes('pengeluaran') || q.includes('kategori') || q.includes('belanja')) {
      let response = `### 📊 Analisis Pengeluaran & Potensi Pemborosan\n\n`;
      response += `• **Total Pengeluaran:** Rp ${exp.totalExpense.toLocaleString('id-ID')}\n`;
      if (exp.topCategory) {
        response += `• **Kategori Terbesar:** **${exp.topCategory.category}** (Rp ${exp.topCategory.total.toLocaleString('id-ID')} atau ${exp.topCategory.percentage.toFixed(1)}% dari total pengeluaran)\n`;
      }
      response += `• **Transaksi Nominal > Rp 200.000:** ${exp.highImpactCount} transaksi\n\n`;

      if (exp.categoryBreakdown.length > 0) {
        response += `**Rincian Kategori Pengeluaran Utama:**\n`;
        exp.categoryBreakdown.slice(0, 5).forEach(c => {
          response += `- **${c.category}:** Rp ${c.total.toLocaleString('id-ID')} (${c.percentage.toFixed(1)}%)\n`;
        });
      }

      if (exp.warnings.length > 0) {
        response += `\n⚠️ **Catatan Waspada Pemborosan:**\n`;
        exp.warnings.forEach(w => response += `- ${w}\n`);
      } else {
        response += `\n✅ **Status Pengeluaran:** Pembagian pengeluaran per kategori saat ini berada dalam batas normal.\n`;
      }

      return response;
    }

    // Intent 2: Strategi Hemat / Saving / Tabungan
    if (q.includes('hemat') || q.includes('tabung') || q.includes('strategi') || q.includes('simpan')) {
      let response = `### 💡 Strategi Penghematan & Optimalisasi Tabungan\n\n`;
      response += `• **Pemasukan Bersih:** Rp ${cf.totalIncome.toLocaleString('id-ID')}\n`;
      response += `• **Rasio Tabungan Saat Ini:** **${savings.savingsRate.toFixed(1)}%** (${savings.grade})\n`;
      response += `• **Surplus Kas Bulanan:** Rp ${cf.netCashFlow.toLocaleString('id-ID')}\n\n`;

      response += `**3 Langkah Taktis Penghematan ALN Finance:**\n`;
      response += `1. **Otomatisasi Tabungan 20%:** Pisahkan langsung minimal Rp ${(cf.totalIncome * 0.2).toLocaleString('id-ID')} ke dompet Tabungan saat pemasukan diterima.\n`;
      if (exp.topCategory) {
        response += `2. **Efisiensi Pos ${exp.topCategory.category}:** Pangkas 15-20% biaya pada pos ini untuk menambah potensi tabungan Rp ${(exp.topCategory.total * 0.15).toLocaleString('id-ID')} per bulan.\n`;
      } else {
        response += `2. **Efisiensi Pengeluaran Variabel:** Evaluasi pengeluaran jajan dan hiburan mingguan.\n`;
      }
      response += `3. **Gunakan Fitur Budgeting ALN:** Tetapkan batas maksimal untuk setiap kategori agar tidak kebablasan.\n`;

      return response;
    }

    // Intent 3: Kesehatan Keuangan / Health Score
    if (q.includes('kesehatan') || q.includes('kondisi') || q.includes('skor') || q.includes('score') || q.includes('health')) {
      let response = `### 🛡️ Audit Kesehatan Keuangan (Financial Health)\n\n`;
      response += `• **Skor Kesehatan:** **${health.healthScore}/100** (${health.healthGrade})\n`;
      response += `• **Total Likuiditas Kas:** Rp ${(data.totalBalance || 0).toLocaleString('id-ID')}\n`;
      response += `• **Net Arus Kas:** Rp ${cf.netCashFlow.toLocaleString('id-ID')}\n\n`;

      response += `**Breakdown Indikator Keuangan:**\n`;
      response += `- Arus Kas (25%): **${health.scores.cashFlow}/100**\n`;
      response += `- Rasio Tabungan (20%): **${health.scores.savings}/100**\n`;
      response += `- Kendali Pengeluaran (20%): **${health.scores.expenseControl}/100**\n`;
      response += `- Dana Darurat (15%): **${health.scores.emergencyFund}/100**\n`;
      response += `- Beban Utang (10%): **${health.scores.debt}/100**\n`;
      response += `- Kedisiplinan Anggaran (10%): **${health.scores.budgetDiscipline}/100**\n\n`;

      response += `**Rekomendasi Utama:**\n`;
      health.recommendations.forEach(r => response += `• ${r}\n`);

      return response;
    }

    // Intent 4: Cash Flow / Arus Kas
    if (q.includes('cash flow') || q.includes('arus kas') || q.includes('surplus') || q.includes('defisit')) {
      let response = `### 📈 Analisis Arus Kas (Cash Flow)\n\n`;
      response += `• **Total Pemasukan:** Rp ${cf.totalIncome.toLocaleString('id-ID')}\n`;
      response += `• **Total Pengeluaran:** Rp ${cf.totalExpense.toLocaleString('id-ID')}\n`;
      response += `• **Net Arus Kas:** **${cf.netCashFlow >= 0 ? '+' : ''}Rp ${cf.netCashFlow.toLocaleString('id-ID')}**\n\n`;
      response += `${cf.insight}\n`;

      return response;
    }

    // Intent 5: Investasi / Aset
    if (q.includes('investasi') || q.includes('aset') || q.includes('saham') || q.includes('alokasi')) {
      const inv = this.analyzeInvestments(data);
      let response = `### 💎 Analisis Portofolio Investasi\n\n`;
      response += `• **Total Saldo Likuid:** Rp ${(data.totalBalance || 0).toLocaleString('id-ID')}\n`;
      response += `• **Cakupan Dana Darurat:** ${ef.coverageMonths.toFixed(1)} bulan\n`;
      response += `• **Estimasi Nilai Investasi:** Rp ${inv.totalValue.toLocaleString('id-ID')}\n\n`;

      if (ef.coverageMonths < 3) {
        response += `⚠️ **Perlu Diperhatikan:** Sebelum menambah alokasi investasi berisiko tinggi, pastikan Dana Darurat likuid terisi minimal 3 bulan biaya hidup (Rp ${(cf.totalExpense * 3).toLocaleString('id-ID')}).\n`;
      } else {
        response += `✅ **Kondisi Aman:** Saldo likuid mencukupi untuk eksplorasi investasi berimbal hasil stabil seperti Reksa Dana Pasar Uang atau Obligasi Negara.\n`;
      }

      return response;
    }

    // Default General Intelligent Response
    let defaultResp = `Halo! Berdasarkan analisis data keuangan terkini Anda:\n\n`;
    defaultResp += `• **Likuiditas Kas:** Rp ${(data.totalBalance || 0).toLocaleString('id-ID')}\n`;
    defaultResp += `• **Net Arus Kas Bulanan:** Rp ${cf.netCashFlow.toLocaleString('id-ID')}\n`;
    defaultResp += `• **Skor Kesehatan Keuangan:** **${health.healthScore}/100** (${health.healthGrade})\n\n`;
    defaultResp += `Anda dapat memilih salah satu topik rekomendasi di bawah atau menanyakan pertanyaan spesifik seperti:\n`;
    defaultResp += `1. *"Analisis potensi pemborosan di kategori Makanan"*\n`;
    defaultResp += `2. *"Berikan strategi penghematan 20% bulan depan"*\n`;
    defaultResp += `3. *"Bagaimana kondisi kesehatan keuangan saya?"*\n`;

    return defaultResp;
  }
};
