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
      
      // Fallback regex parsing supporting "k", "rb", "jt"
      const matchesAmount = promptText.match(/(\d+(?:[\.,]\d+)?)\s*(rb|ribu|jt|juta|k|m)?/i);
      let amount = 50000;
      if (matchesAmount) {
        let rawNum = parseFloat(matchesAmount[1].replace(',', '.'));
        const unit = (matchesAmount[2] || '').toLowerCase();
        if (unit === 'rb' || unit === 'ribu' || unit === 'k') rawNum *= 1000;
        if (unit === 'jt' || unit === 'juta' || unit === 'm') rawNum *= 1000000;
        amount = rawNum;
      }
      const isIncome = /gaji|pemasukan|omzet|dapat|terima|dijual|transfer masuk/i.test(promptText);

      // Extract paid_by
      let paid_by: string | null = null;
      if (/lana/i.test(promptText)) paid_by = 'Lana';
      else if (/lina/i.test(promptText)) paid_by = 'Lina';
      else if (/ayah|suami/i.test(promptText)) paid_by = 'Ayah';
      else if (/ibu|istri/i.test(promptText)) paid_by = 'Ibu';

      // Extract account
      let account: string | null = null;
      if (/bca/i.test(promptText)) account = 'BCA';
      else if (/mandiri/i.test(promptText)) account = 'Mandiri';
      else if (/gopay/i.test(promptText)) account = 'GoPay';
      else if (/ovo/i.test(promptText)) account = 'OVO';
      else if (/cash|tunai/i.test(promptText)) account = 'Cash';

      // Category & Subcategory Taxonomy
      let category = isIncome ? 'Penghasilan Utama' : 'Transportasi';
      let subcategory = isIncome ? 'Gaji Suami' : 'Bensin';

      if (isIncome) {
        if (/gaji suami/i.test(promptText)) { category = 'Penghasilan Utama'; subcategory = 'Gaji Suami'; }
        else if (/gaji istri/i.test(promptText)) { category = 'Penghasilan Utama'; subcategory = 'Gaji Istri'; }
        else if (/honor|kegiatan/i.test(promptText)) { category = 'Penghasilan Sampingan'; subcategory = 'Honorarium Kegiatan'; }
        else if (/bonus|rapat/i.test(promptText)) { category = 'Penghasilan Sampingan'; subcategory = 'Transport Rapat / Bonus'; }
        else if (/usaha|sampingan/i.test(promptText)) { category = 'Penghasilan Sampingan'; subcategory = 'Usaha Sampingan'; }
        else if (/refund|hadiah|investasi|pemberian/i.test(promptText)) { category = 'Pemasukan Lainnya'; subcategory = 'Refunds / Reimbursements'; }
        else { category = 'Penghasilan Utama'; subcategory = 'Gaji Suami'; }
      } else {
        if (/bensin|pertamax|pertalite/i.test(promptText)) { category = 'Transportasi'; subcategory = 'Bensin'; }
        else if (/parkir/i.test(promptText)) { category = 'Transportasi'; subcategory = 'Parkir'; }
        else if (/servis|bengkel/i.test(promptText)) { category = 'Transportasi'; subcategory = 'Servis & Perawatan'; }
        else if (/belanja dapur|sayur|beras|pasar/i.test(promptText)) { category = 'Makan'; subcategory = 'Belanja Dapur'; }
        else if (/makan diluar|resto|kafe|makan malam|makan siang/i.test(promptText)) { category = 'Makan'; subcategory = 'Makan Diluar'; }
        else if (/jajan|snack|kopi/i.test(promptText)) { category = 'Makan'; subcategory = 'Jajan'; }
        else if (/listrik|pln/i.test(promptText)) { category = 'Bill & Utilitas'; subcategory = 'Listrik'; }
        else if (/gas|lpg/i.test(promptText)) { category = 'Bill & Utilitas'; subcategory = 'Gas LPG'; }
        else if (/wifi|internet/i.test(promptText)) { category = 'Bill & Utilitas'; subcategory = 'Wifi'; }
        else if (/pampers|popok/i.test(promptText)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Pampers / Popok'; }
        else if (/susu/i.test(promptText)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Susu & Perlengkapan'; }
        else if (/sekolah|daycare|spp/i.test(promptText)) { category = 'Kebutuhan Keluarga & Anak'; subcategory = 'Sekolah / Daycare'; }
        else if (/obat|vitamin|dokter/i.test(promptText)) { category = 'Kesehatan'; subcategory = 'Obat & Vitamin'; }
      }

      // Extract scope
      const isShared = /listrik|gas|lpg|dapur|sekolah|susu|popok|pampers|wifi|anak|rumah/i.test(promptText);
      const scope = isShared ? 'SHARED' : 'PERSONAL';
      const is_high_impact = !isIncome && amount >= 100000;

      return [{
        title: promptText || 'Transaksi AI',
        amount,
        type: isIncome ? 'INCOME' : 'EXPENSE',
        paid_by,
        scope,
        account,
        category,
        subcategory,
        transaction_date: null,
        is_high_impact,
        walletName: account,
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
