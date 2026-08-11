export const AIService = {
  async chatWithAdvisor(message: string, history: any[] = [], contextData?: any) {
    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history, contextData })
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          return {
            reply: `⚠️ **AI Financial Advisor Belum Terkonfigurasi**\n\nAPI Key Gemini (\`GEMINI_API_KEY\`) belum dimasukkan atau tidak memiliki akses pada Environment Variables Vercel.\n\n**Langkah Aktivasi:**\n1. Buka Dashboard Vercel > Project Settings > **Environment Variables**.\n2. Tambahkan variable: \`GEMINI_API_KEY\` = *[API Key Gemini Anda]*\n3. Lakukan **Redeploy** pada Vercel.`,
            isConfigError: true
          };
        }
        if (res.status === 404) {
          return {
            reply: `⚠️ **Model AI Tidak Ditemukan (404)**\n\nModel AI (\`gemini-2.5-flash\`) tidak ditemukan pada endpoint Gemini API saat ini.`,
            isModelError: true
          };
        }
        if (res.status === 429) {
          return {
            reply: `⏳ **Kuota AI Gemini Terlampaui (Rate Limit / Quota)**\n\nBatas permintaan ke API Gemini telah tercapai untuk saat ini. Silakan tunggu 1-2 menit dan coba kembali.`,
            isQuotaError: true
          };
        }
        if (res.status >= 500) {
          return {
            reply: `🚨 **Layanan AI Sedang Mengalami Kendala (${res.status})**\n\n${data.error || 'Server AI tidak dapat memproses permintaan saat ini. Silakan coba lagi nanti.'}`,
            isServerError: true
          };
        }
        throw new Error(data.error || `Server status ${res.status}`);
      }

      return data;
    } catch (error: any) {
      console.warn('AI API Call failed, using offline fallback response:', error);
      return {
        reply: `**[Mode Offline Advisor]**\n\nKoneksi ke server AI Gemini sedang tidak dapat dijangkau.\n\n**Saran Keuangan Umum ALN Finance:**\n1. Pastikan rasio pengeluaran bulanan Anda tidak melebihi **50%** dari total pemasukan bersih.\n2. Sisihkan minimal **20%** pemasukan untuk Dana Darurat atau Investasi berimbal hasil stabil.\n3. Periksa modul *Budgeting* Anda untuk memantau kategori yang berpotensi overbudget.`,
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
      
      const conjunctionRegex = /\b(?:terus|lalu|kemudian|habis\s+itu|setelah\s+itu|selanjutnya|dan|&|plus|sama|lanjut|berikutnya)\b|[,;]/gi;
      const rawClauses = promptText.split(conjunctionRegex).map(c => c.trim()).filter(Boolean);
      const clauses = rawClauses.length > 0 ? rawClauses : [promptText];

      let runningPaidBy: string | null = null;
      let runningAccount: string | null = null;
      const parsedTxList: any[] = [];

      const classifyCategoryAndSubcategory = (clauseText: string, incomeFlag: boolean) => {
        const lower = clauseText.toLowerCase();

        if (incomeFlag) {
          if (/gaji|suami|istri|bulanan/i.test(lower)) {
            return { category: 'Penghasilan Utama', subcategory: 'Gaji' };
          }
          if (/bonus|omzet|dijual|refund|honor|sampingan/i.test(lower)) {
            return { category: 'Penghasilan Sampingan', subcategory: 'Honorarium' };
          }
          return { category: 'Penghasilan Utama', subcategory: null };
        }

        // OBJECT-BASED EXPENSE CLASSIFICATION (NOT VERB-BASED)

        // Fashion
        if (/sepatu/i.test(lower)) {
          return { category: 'Fashion', subcategory: 'Sepatu' };
        }
        if (/baju|celana|pakaian|kemeja|kaos|jaket|gaun|rok/i.test(lower)) {
          return { category: 'Fashion', subcategory: 'Pakaian' };
        }
        if (/tas|dompet|ransel|koper/i.test(lower)) {
          return { category: 'Fashion', subcategory: 'Tas' };
        }

        // Hiburan & Media
        if (/netflix|spotify|youtube|disney|game|steam|bioskop|nonton|konser|rekreasi/i.test(lower)) {
          return { category: 'Hiburan', subcategory: /netflix|spotify|youtube|disney/i.test(lower) ? 'Langganan' : 'Rekreasi' };
        }

        // Pendidikan
        if (/sekolah|spp|kuliah|kursus|les|buku|kampus|seragam/i.test(lower)) {
          return { category: 'Pendidikan', subcategory: /sekolah|spp|kuliah/i.test(lower) ? 'Sekolah' : 'Pendidikan' };
        }

        // Elektronik & Gadget
        if (/laptop|komputer|pc|hp|phone|handphone|ipad|tablet|headphone|charger|monitor/i.test(lower)) {
          return { category: 'Elektronik & Gadget', subcategory: /laptop|komputer|pc/i.test(lower) ? 'Laptop' : 'Gadget' };
        }

        // Transportasi
        if (/bensin|pertamax|pertalite|solar|bbm/i.test(lower)) {
          return { category: 'Transportasi', subcategory: 'Bensin' };
        }
        if (/servis|bengkel|oli|ban|motor|mobil/i.test(lower)) {
          return { category: 'Transportasi', subcategory: 'Servis Kendaraan' };
        }
        if (/tiket|pesawat|kereta|bus|travel/i.test(lower)) {
          return { category: 'Transportasi', subcategory: 'Tiket' };
        }
        if (/parkir|tol|ojek|grab|gojek|gocar|grabcar/i.test(lower)) {
          return { category: 'Transportasi', subcategory: 'Transportasi Umum / Ojek' };
        }

        // Kebutuhan Rumah
        if (/gas|lpg|elpiji/i.test(lower)) {
          return { category: 'Kebutuhan Rumah', subcategory: 'Gas LPG' };
        }
        if (/perabot|kasur|meja|kursi|lemari|lampu|sapu|pel/i.test(lower)) {
          return { category: 'Kebutuhan Rumah', subcategory: 'Peralatan Rumah' };
        }

        // Kebutuhan Keluarga & Anak
        if (/pampers|popok|diapers/i.test(lower)) {
          return { category: 'Kebutuhan Keluarga & Anak', subcategory: 'Pampers' };
        }
        if (/susu/i.test(lower)) {
          return { category: 'Kebutuhan Keluarga & Anak', subcategory: 'Susu' };
        }

        // Tagihan & Utilitas
        if (/listrik|pln/i.test(lower)) {
          return { category: 'Tagihan & Utilitas', subcategory: 'Listrik' };
        }
        if (/internet|wifi|indihome|biznet|fastnet/i.test(lower)) {
          return { category: 'Tagihan & Utilitas', subcategory: 'Internet' };
        }
        if (/pulsa|kuota|paket data/i.test(lower)) {
          return { category: 'Tagihan & Utilitas', subcategory: 'Pulsa' };
        }

        // Kesehatan
        if (/obat|apotek|resep|vitamin/i.test(lower)) {
          return { category: 'Kesehatan', subcategory: 'Obat' };
        }
        if (/dokter|klinik|rumah sakit|rs/i.test(lower)) {
          return { category: 'Kesehatan', subcategory: 'Dokter' };
        }

        // Makanan & Kuliner
        if (/makan|nasi|soto|bakso|ayam|mie|gulai|rendang|resto|restoran|kfc|mcd|burger|pizza/i.test(lower)) {
          return { category: 'Makanan & Kuliner', subcategory: 'Makanan' };
        }
        if (/kopi|minum|boba|tea|teh|cafe|jus/i.test(lower)) {
          return { category: 'Makanan & Kuliner', subcategory: 'Minuman' };
        }

        // Dynamic fallback for any unlisted new transaction (NEVER default to Makanan!)
        return { category: 'Lainnya', subcategory: null };
      };

      for (const clause of clauses) {
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

        if (/lana/i.test(clause)) runningPaidBy = 'Lana';
        else if (/lina/i.test(clause)) runningPaidBy = 'Lina';
        else if (/ayah|suami/i.test(clause)) runningPaidBy = 'Ayah';
        else if (/ibu|istri/i.test(clause)) runningPaidBy = 'Ibu';

        if (/bca/i.test(clause)) runningAccount = 'BCA';
        else if (/mandiri/i.test(clause)) runningAccount = 'Mandiri';
        else if (/gopay/i.test(clause)) runningAccount = 'GoPay';
        else if (/ovo/i.test(clause)) runningAccount = 'OVO';
        else if (/cash|tunai/i.test(clause)) runningAccount = 'Cash';

        let title = clause
          .replace(/(\d+(?:[\.,]\d+)?)\s*(rb|ribu|jt|juta|k|m)?/gi, '')
          .replace(/\b(?:bca|mandiri|gopay|ovo|cash|tunai|lana|lina|ayah|ibu|suami|istri|pribadi|bersama|rumah|keluarga)\b/gi, '')
          .trim();

        if (!title) {
          title = isIncome ? 'Pemasukan' : 'Pengeluaran';
        } else {
          title = title.charAt(0).toUpperCase() + title.slice(1);
        }

        const { category, subcategory } = classifyCategoryAndSubcategory(clause, isIncome);

        parsedTxList.push({
          title,
          type: isIncome ? 'INCOME' : 'EXPENSE',
          debit: isIncome ? amount : 0,
          credit: isIncome ? 0 : amount,
          amount,
          paid_by: runningPaidBy,
          scope: /bersama|rumah|keluarga|dapur|anak|pampers|listrik|wifi/i.test(clause) ? 'SHARED' : 'PERSONAL',
          account: runningAccount,
          walletName: runningAccount,
          category,
          subcategory,
          transaction_date: new Date().toISOString().split('T')[0],
          is_high_impact: amount > 200000,
          date: new Date().toISOString().split('T')[0]
        });
      }

      return parsedTxList;
    }
  },

  async analyzeCashflowHealth(transactions: any[], wallets: any[], budgets: any[]) {
    try {
      const res = await fetch('/api/ai/analyze-cashflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions, wallets, budgets })
      });
      if (!res.ok) {
        throw new Error(`Server status ${res.status}`);
      }
      const data = await res.json();
      if (data.success && data.analysis) {
        return data.analysis;
      }
      throw new Error('Analisis tidak mengembalikan data valid.');
    } catch (error) {
      console.warn('Cashflow health analysis failed, using calculation fallback:', error);
      
      const totalBalance = (wallets || []).reduce((acc: number, w: any) => acc + (w.balance || 0), 0);
      const totalIncome = (transactions || [])
        .filter((t: any) => t.type === 'INCOME')
        .reduce((acc: number, t: any) => acc + (t.amount || t.debit || 0), 0);
      const totalExpense = (transactions || [])
        .filter((t: any) => t.type === 'EXPENSE')
        .reduce((acc: number, t: any) => acc + (t.amount || t.credit || 0), 0);

      const netCashflow = totalIncome - totalExpense;
      const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0;
      
      let healthScore = 70;
      let healthGrade = 'Sehat';
      if (netCashflow < 0) {
        healthScore = 45;
        healthGrade = 'Waspada';
      } else if (savingsRate >= 20) {
        healthScore = 88;
        healthGrade = 'Sangat Sehat';
      }

      return {
        healthScore,
        healthGrade,
        summary: `Arus kas bersih Anda saat ini berada di nominal ${netCashflow >= 0 ? '+' : ''}Rp ${netCashflow.toLocaleString('id-ID')} dengan total saldo kas gabungan Rp ${totalBalance.toLocaleString('id-ID')}.`,
        risks: netCashflow < 0 
          ? ['Total pengeluaran melebihi pemasukan bulan ini.', 'Potensi defisit kas dalam 30 hari ke depan jika tidak ada efisiensi.']
          : ['Rasio tabungan belum mencapai target optimal 20%.'],
        recommendations: [
          'Evaluasi pengeluaran pada kategori Kebutuhan Harian & Makan Diluar.',
          'Alokasikan minimal 10-20% pemasukan bersih langsung ke dompet Tabungan/Investasi di awal bulan.',
          'Pantau pengeluaran bernominal > Rp 200.000 agar tidak melampaui batas anggaran.'
        ],
        savingsPotential: totalExpense * 0.15,
        cashflowForecast: netCashflow >= 0 
          ? 'Arus kas diproyeksikan tetap positif bulan depan selama pola pengeluaran dipertahankan.'
          : 'Diproyeksikan membutuhkan pengambilan dana cadangan jika tidak ada efisiensi segera.'
      };
    }
  },

  async analyzeCashflow(transactions: any[], wallets: any[], budgets: any[]) {
    return this.analyzeCashflowHealth(transactions, wallets, budgets);
  }
};
