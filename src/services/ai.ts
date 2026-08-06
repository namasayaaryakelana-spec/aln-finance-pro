export const AIService = {
  async chatWithAdvisor(message: string, history: any[] = [], contextData?: any) {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, contextData })
      });
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      return await res.json();
    } catch (error: any) {
      console.warn('AI API Call failed, using offline fallback response:', error);
      return {
        reply: `**[Mode Offline Advisor]**

Maaf, koneksi ke AI Gemini server sedang tidak tersedia atau dalam mode offline.

**Saran Keuangan Umum ALN Finance:**
1. Pastikan total rasio pengeluaran Anda tidak melebihi **50%** dari total pemasukan bersih.
2. Sisihkan minimal **20%** pemasukan untuk Dana Darurat atau Investasi berimbal hasil stabil.
3. Periksa modul *Budgeting* Anda untuk memantau kategori yang berpotensi overbudget.`,
        isOfflineFallback: true
      };
    }
  },

  async parseFastTransaction(promptText: string, imageData?: { data: string; mimeType?: string }) {
    try {
      const res = await fetch('/api/ai/fast-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText, image: imageData })
      });
      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }
      const data = await res.json();
      if (data.transactions && Array.isArray(data.transactions) && data.transactions.length > 0) {
        return data.transactions;
      }
      if (data.transaction) {
        return [data.transaction];
      }
      return [];
    } catch (error) {
      console.warn('Fast transaction parsing failed, falling back to basic extraction:', error);
      
      // Fallback regex parsing supporting multi-transaction splitting & context inheritance
      const conjunctionRegex = /\b(?:terus|lalu|kemudian|habis\s+itu|setelah\s+itu|selanjutnya|dan|&|plus|sama|lanjut|berikutnya)\b|[,;]/gi;
      const rawClauses = promptText.split(conjunctionRegex).map(c => c.trim()).filter(Boolean);
      const clauses = rawClauses.length > 0 ? rawClauses : [promptText];

      let runningPaidBy: string | null = null;
      let runningAccount: string | null = null;
      const parsedTxList: any[] = [];

      for (const clause of clauses) {
        // Extract amount supporting "k", "rb", "ribu", "jt", "juta", dots and commas
        const matchesAmount = clause.match(/(\d+(?:[\.,]\d+)?)\s*(rb|ribu|jt|juta|k|m)?/i);
        let amount = 0;
        if (matchesAmount) {
          let rawNum = parseFloat(matchesAmount[1].replace(',', '.'));
          const unit = (matchesAmount[2] || '').toLowerCase();
          if (unit === 'rb' || unit === 'ribu' || unit === 'k') rawNum *= 1000;
          else if (unit === 'jt' || unit === 'juta' || unit === 'm') rawNum *= 1000000;
          amount = rawNum;
        }

        const isIncome = /gaji|pemasukan|omzet|dapat|terima|dijual|transfer masuk|bonus|refund|honor/i.test(clause);

        // Extract paid_by (or inherit)
        if (/lana/i.test(clause)) runningPaidBy = 'Lana';
        else if (/lina/i.test(clause)) runningPaidBy = 'Lina';
        else if (/ayah|suami/i.test(clause)) runningPaidBy = 'Ayah';
        else if (/ibu|istri/i.test(clause)) runningPaidBy = 'Ibu';

        // Extract account (or inherit)
        if (/bca/i.test(clause)) runningAccount = 'BCA';
        else if (/mandiri/i.test(clause)) runningAccount = 'Mandiri';
        else if (/gopay/i.test(clause)) runningAccount = 'GoPay';
        else if (/ovo/i.test(clause)) runningAccount = 'OVO';
        else if (/cash|tunai/i.test(clause)) runningAccount = 'Cash';

        // Category & Subcategory Taxonomy
        let category = isIncome ? 'Penghasilan Utama' : 'Transportasi';
        let subcategory = isIncome ? 'Gaji Suami' : 'Bensin';

        if (isIncome) {
          if (/gaji suami/i.test(clause)) { category = 'Penghasilan Utama'; subcategory = 'Gaji Suami'; }
          else if (/gaji istri/i.test(clause)) { category = 'Penghasilan Utama'; subcategory = 'Gaji Istri'; }
          else if (/honor|kegiatan/i.test(clause)) { category = 'Penghasilan Sampingan'; subcategory = 'Honorarium Kegiatan'; }
          else if (/bonus|rapat/i.test(clause)) { category = 'Penghasilan Sampingan'; subcategory = 'Transport Rapat / Bonus'; }
          else if (/usaha|sampingan/i.test(clause)) { category = 'Penghasilan Sampingan'; subcategory = 'Usaha Sampingan'; }
          else if (/refund|hadiah|investasi|pemberian/i.test(clause)) { category = 'Pemasukan Lainnya'; subcategory = 'Refunds / Reimbursements'; }
        } else {
          if (/bensin|pertamax|pertalite/i.test(clause)) { category = 'Transportasi'; subcategory = 'Bensin'; }
          else if (/parkir/i.test(clause)) { category = 'Transportasi'; subcategory = 'Parkir'; }
          else if (/servis|bengkel/i.test(clause)) { category = 'Transportasi'; subcategory = 'Servis & Perawatan'; }
          else if (/belanja dapur|sayur|beras|pasar/i.test(clause)) { category = 'Makan'; subcategory = 'Belanja Dapur'; }
          else if (/makan diluar|resto|kafe|makan malam|makan siang/i.test(clause)) { category = 'Makan'; subcategory = 'Makan Diluar'; }
          else if (/jajan|snack|kopi/i.test(clause)) { category = 'Makan'; subcategory = 'Jajan'; }
          else if (/listrik|pln/i.test(clause)) { category = 'Bill & Utilitas'; subcategory = 'Listrik'; }
          else if (/gas|lpg/i.test(clause)) { category = 'Bill & Utilitas'; subcategory = 'Gas LPG'; }
          else if (/wifi|internet/i.test(clause)) { category = 'Bill & Utilitas'; subcategory = 'Wifi'; }
          else if (/pampers|popok/i.test(clause)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Pampers / Popok'; }
          else if (/susu/i.test(clause)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Susu & Perlengkapan'; }
          else if (/sekolah|daycare|spp/i.test(clause)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Sekolah / Daycare'; }
          else if (/obat|vitamin|dokter/i.test(clause)) { category = 'Kesehatan'; subcategory = 'Obat & Vitamin'; }
        }

        const isShared = /listrik|gas|lpg|dapur|sekolah|susu|popok|pampers|wifi|anak|rumah/i.test(clause);
        const scope = isShared ? 'SHARED' : 'PERSONAL';
        const finalAmount = amount || 50000;
        const is_high_impact = !isIncome && finalAmount >= 100000;

        parsedTxList.push({
          title: clause || 'Catatan Transaksi',
          amount: finalAmount,
          type: isIncome ? 'INCOME' : 'EXPENSE',
          paid_by: runningPaidBy,
          scope,
          account: runningAccount,
          category,
          subcategory,
          transaction_date: null,
          is_high_impact,
          walletName: runningAccount,
          date: new Date().toISOString().split('T')[0]
        });
      }

      return parsedTxList.length > 0 ? parsedTxList : [{
        title: promptText || 'Transaksi AI',
        amount: 50000,
        type: 'EXPENSE',
        paid_by: null,
        scope: 'PERSONAL',
        account: null,
        category: 'Transportasi',
        subcategory: 'Bensin',
        transaction_date: null,
        is_high_impact: false,
        walletName: null,
        date: new Date().toISOString().split('T')[0]
      }];
    }
  },

  async analyzeCashflow(data: { transactions: any[]; wallets: any[]; budgets: any[] }) {
    try {
      const res = await fetch('/api/ai/analyze-cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error(`Server status ${res.status}`);
      const json = await res.json();
      return json.analysis;
    } catch (error) {
      console.warn('AI Cashflow Analysis failed, using rule-based calculations:', error);
      const totalIncome = data.transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = data.transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

      const netFlow = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((netFlow) / totalIncome) * 100 : 0;
      let score = 75;
      if (savingsRate > 30) score = 90;
      else if (savingsRate > 10) score = 78;
      else if (savingsRate >= 0) score = 65;
      else score = 45;

      return {
        healthScore: score,
        healthGrade: score >= 80 ? 'Sangat Sehat' : score >= 65 ? 'Sehat' : 'Waspada',
        summary: `Arus kas Anda mencatatkan net flow ${netFlow >= 0 ? 'positif' : 'negatif'}. Tingkat tabungan bersih saat ini berada pada kisaran ${Math.round(savingsRate)}%.`,
        risks: [
          savingsRate < 20 ? 'Tingkat tabungan bulanan di bawah target ideal 20%' : 'Lakukan diversifikasi aset pada dompet utama',
          'Beberapa kategori anggaran mendekati batas maksimum bulanan'
        ],
        recommendations: [
          'Kurangi pengeluaran tidak mendesak pada kategori Makanan & Lifestyle',
          'Alokasikan kelebihan arus kas bersih ke Dana Darurat atau Reksa Dana Pasar Uang'
        ],
        savingsPotential: totalExpense * 0.12,
        cashflowForecast: 'Proyeksi arus kas stabil untuk 30 hari kedepan.'
      };
    }
  }
};
