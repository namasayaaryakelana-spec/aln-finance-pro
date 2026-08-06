import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI Client safely
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is missing from environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// --- API ROUTES ---

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'ALN Finance Pro',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// AI Financial Assistant Chat
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { message, history = [], contextData } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message parameter is required.' });
    }

    const ai = getAiClient();
    
    // System Instruction for ALN Finance AI Assistant
    const systemInstruction = `Anda adalah "ALN AI Financial OS Advisor", penasihat keuangan pribadi & bisnis tingkat eksekutif di aplikasi ALN Finance Pro.
Tugas Anda adalah memberikan saran keuangan yang cerdas, praktis, taktis, dan mudah dipahami dalam Bahasa Indonesia yang profesional namun ramah.

Konteks Keuangan Pengguna Saat Ini:
${contextData ? JSON.stringify(contextData, null, 2) : 'Data keuangan umum.'}

Panduan Jawaban:
1. Berikan analisis langsung, solutif, dan terstruktur.
2. Jika ada potensi pemborosan atau risiko overbudget, berikan peringatan taktis.
3. Berikan saran penghematan atau alokasi investasi yang relevan dengan kondisi pengguna.
4. Jawab dalam format Markdown yang rapi dengan poin-poin yang mudah dibaca.`;

    const contents = [];
    if (Array.isArray(history) && history.length > 0) {
      for (const h of history) {
        contents.push({
          role: h.role === 'model' || h.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: h.text || h.message || '' }]
        });
      }
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      reply: response.text || 'Maaf, saya tidak dapat memproses tanggapan saat ini.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in /api/ai/chat:', error);
    res.status(500).json({
      error: 'Gagal menghubungkan ke AI Financial Advisor.',
      details: error.message || String(error)
    });
  }
});

// AI Multimodal Transaction Parser (Text / Chat, Image / Struk, Voice Input)
app.post('/api/ai/fast-transaction', async (req, res) => {
  try {
    const { prompt, image } = req.body;
    if (!prompt && !image) {
      return res.status(400).json({ error: 'Text prompt or image is required.' });
    }

    const ai = getAiClient();
    const contentsParts: any[] = [];

    if (image && image.data) {
      const cleanBase64 = image.data.replace(/^data:image\/\w+;base64,/, '');
      contentsParts.push({
        inlineData: {
          mimeType: image.mimeType || 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const textInstruction = `Anda adalah modul AI parser pencatatan Buku Kas Keuangan Keluarga/Rumah Tangga. Tugas Anda adalah mengubah teks catatan transaksi kasual menjadi format pencatatan Buku Kas terstruktur (Debet & Kredit).

===============================================================
PRINSIP BUKU KAS (DEBET & KREDIT):
===============================================================
1. DEBET (debit):
   - Gunakan untuk PEMASUKAN / UANG MASUK (Menambah Saldo Kas/Akun).
   - Nilai field "debit" diisi dengan nominal angka.
   - Nilai field "credit" diisi dengan 0.
   - Field "type" bernilai "INCOME".

2. KREDIT (credit):
   - Gunakan untuk PENGELUARAN / UANG KELUAR (Mengurangi Saldo Kas/Akun).
   - Nilai field "credit" diisi dengan nominal angka.
   - Nilai field "debit" diisi dengan 0.
   - Field "type" bernilai "EXPENSE".

===============================================================
MASTER KATEGORI & SUB-KATEGORI ACUAN:
===============================================================
1. MASTER PEMASUKAN (DEBET / INCOME):
   - Kategori: "Penghasilan Utama"
     └─ Sub-kategori: "Gaji Suami", "Gaji Istri", "Transport Bulanan", "Insentif / Tunjangan"
   - Kategori: "Penghasilan Sampingan"
     └─ Sub-kategori: "Honorarium Kegiatan", "Transport Rapat / Bonus", "Usaha Sampingan"
   - Kategori: "Pemasukan Lainnya"
     └─ Sub-kategori: "Refunds / Reimbursements", "Pemberian / Hadiah", "Hasil Investasi"

2. MASTER PENGELUARAN (KREDIT / EXPENSE):
   - Kategori: "Transportasi"
     └─ Sub-kategori: "Bensin", "Biaya Perjalanan", "Parkir", "Servis & Perawatan"
   - Kategori: "Makan"
     └─ Sub-kategori: "Belanja Dapur", "Makan Diluar", "Jajan"
   - Kategori: "Bill & Utilitas"
     └─ Sub-kategori: "Listrik", "Gas LPG", "Wifi", "Netflix / Langganan", "Paket Data", "Kontrakan / KPR", "Air PAM"
   - Kategori: "Kebutuhan Keluarga & Anak"
     └─ Sub-kategori: "Pampers / Popok", "Susu & Perlengkapan", "Sekolah / Daycare", "Pakaian"
   - Kategori: "Kesehatan"
     └─ Sub-kategori: "Obat & Vitamin", "Dokter / Rumah Sakit"

===============================================================
ATURAN UTAMA EKSTRAKSI MULTI-TRANSAKSI (SANGAT PENTING):
===============================================================
1. WAJIB SPLIT BANYAK TRANSAKSI:
   - Jika terdapat kata penghubung seperti: "terus", "lalu", "kemudian", "habis itu", "setelah itu", "selanjutnya", "dan", "&", "plus", "sama", "lanjut", "berikutnya", koma (,), atau titik koma (;), ATAU terdapat lebih dari 1 nominal/aktivitas dalam kalimat, WAJIB MEMECAHNYA menjadi beberapa objek transaksi terpisah di dalam array 'transactions'.
   - JIKA TERDAPAT N AKTIVITAS / NOMINAL ANGKA, ARRAY TRANSACTIONS HARUS BERISI TEPAT N OBJEK TRANSAKSI.
   - JANGAN PERNAH menggabungkan dua atau lebih aktivitas terpisah menjadi 1 objek transaksi tunggal.

2. ATURAN PEWARISAN KONTEKS (INHERITANCE):
   - Jika transaksi berikutnya TIDAK menyebutkan nama pembayar ("paid_by") atau sumber akun ("account") secara spesifik, transaksi tersebut WAJIB MEWARISI (inherit) nilai "paid_by" dan/atau "account" dari transaksi sebelumnya dalam urutan kalimat!
   - CONTOH: "Lana beli bensin 50rb bca terus beli kopi 20rb"
     * Transaksi 1: title="Beli bensin", credit=50000, paid_by="Lana", account="BCA"
     * Transaksi 2: title="Beli kopi", credit=20000, paid_by="Lana", account="BCA"
   - Namun jika transaksi berikutnya menyebutkan akun lain (misal: "cash", "gopay", "mandiri"), gunakan akun baru tersebut untuk transaksi itu.
     * CONTOH: "Lana beli bensin 50rb BCA terus beli LPG 22rb cash"
       -> Transaksi 1: title="Beli bensin", credit=50000, paid_by="Lana", account="BCA"
       -> Transaksi 2: title="Beli LPG", credit=22000, paid_by="Lana", account="Cash"

3. PEMASANGAN NOMINAL & AKUN:
   - Pasangkan nominal angka dengan deskripsi aktivitas terdekat.
   - Kenali berbagai format nominal angka: 50rb, 50 rb, 50ribu, 50 ribu, 22k, 22 k, 1jt, 1.5jt, 2 juta, 250000, 250.000, 250,000 -> Konversi menjadi integer rupiah.`;

    const familyFinanceSchema = {
      type: Type.OBJECT,
      properties: {
        transactions: {
          type: Type.ARRAY,
          description: "Daftar seluruh transaksi terpisah. Buat 1 objek per aktivitas/nominal angka.",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Deskripsi singkat aktivitas spesifik (misal: 'Bayar bensin', 'Beli gas LPG')" },
              type: { type: Type.STRING, enum: ["EXPENSE", "INCOME"], description: "EXPENSE atau INCOME" },
              debit: { type: Type.NUMBER, description: "Nominal jika PEMASUKAN, else 0" },
              credit: { type: Type.NUMBER, description: "Nominal jika PENGELUARAN, else 0" },
              paid_by: { type: Type.STRING, nullable: true, description: "Nama pembayar (contoh: Lana). Mewarisi transaksi sebelumnya jika null" },
              scope: { type: Type.STRING, enum: ["SHARED", "PERSONAL"], description: "SHARED atau PERSONAL" },
              account: { type: Type.STRING, nullable: true, description: "Sumber bank/dompet (contoh: BCA, Cash). Mewarisi transaksi sebelumnya jika null" },
              category: { type: Type.STRING, description: "Kategori utama transaksi" },
              subcategory: { type: Type.STRING, description: "Sub-kategori transaksi" },
              transaction_date: { type: Type.STRING, nullable: true, description: "Tanggal YYYY-MM-DD atau null" },
              is_high_impact: { type: Type.BOOLEAN, description: "Set true jika EXPENSE > 200rb" }
            },
            required: ["title", "type", "debit", "credit", "scope", "category", "subcategory", "is_high_impact"]
          }
        }
      },
      required: ["transactions"]
    };

    // Pre-check for multi-clause inputs
    const conjunctionRegex = /\b(?:terus|lalu|kemudian|habis\s+itu|setelah\s+itu|selanjutnya|dan|&|plus|sama|lanjut|berikutnya)\b|[,;]/gi;
    const splitClauses = prompt ? prompt.split(conjunctionRegex).map((s: string) => s.trim()).filter(Boolean) : [];

    let promptUserInstruction = prompt ? `Input Pengguna: "${prompt}"` : 'Gambar Struk/Nota';
    if (splitClauses.length > 1) {
      promptUserInstruction += `\n\nPERHATIAN SANGAT PENTING: Input tersebut memiliki ${splitClauses.length} bagian aktivitas (${JSON.stringify(splitClauses)}). Anda WAJIB mengembalikan TEPAT ${splitClauses.length} objek transaksi terpisah di dalam array transactions!`;
    }

    contentsParts.push({ text: promptUserInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        systemInstruction: textInstruction,
        responseMimeType: 'application/json',
        responseSchema: familyFinanceSchema
      }
    });

    const parsedData = JSON.parse(response.text || '{"transactions":[]}');
    let transactionsList = (parsedData.transactions || []).map((t: any) => {
      const isIncome = (t.type || 'EXPENSE').toUpperCase() === 'INCOME';
      const debitVal = isIncome ? (t.debit || t.amount || 0) : 0;
      const creditVal = !isIncome ? (t.credit || t.amount || 0) : 0;
      const finalAmount = isIncome ? debitVal : creditVal;

      return {
        title: t.title || 'Catatan Transaksi',
        type: isIncome ? 'INCOME' : 'EXPENSE',
        debit: debitVal,
        credit: creditVal,
        amount: finalAmount,
        paid_by: t.paid_by || null,
        scope: (t.scope || 'PERSONAL').toUpperCase() === 'SHARED' ? 'SHARED' : 'PERSONAL',
        account: t.account || t.walletName || null,
        walletName: t.account || t.walletName || null,
        category: t.category || (isIncome ? 'Penghasilan Utama' : 'Makan'),
        subcategory: t.subcategory || null,
        transaction_date: t.transaction_date || null,
        is_high_impact: Boolean(t.is_high_impact),
        date: t.transaction_date || t.date || new Date().toISOString().split('T')[0]
      };
    });

    // Apply context inheritance pass to ensure paid_by and account inherit properly
    let runningPaidBy: string | null = null;
    let runningAccount: string | null = null;

    transactionsList = transactionsList.map((tx: any) => {
      if (tx.paid_by) runningPaidBy = tx.paid_by;
      else tx.paid_by = runningPaidBy;

      if (tx.account) runningAccount = tx.account;
      else {
        tx.account = runningAccount;
        tx.walletName = runningAccount;
      }
      return tx;
    });

    res.json({ success: true, transactions: transactionsList, transaction: transactionsList[0] || null });
  } catch (error: any) {
    console.error('Error in /api/ai/fast-transaction:', error);
    res.status(500).json({
      error: 'Gagal memproses transaksi kilat berbasis AI.',
      details: error.message || String(error)
    });
  }
});

// AI Cashflow Risk & Financial Health Analyzer
app.post('/api/ai/analyze-cashflow', async (req, res) => {
  try {
    const { transactions, wallets, budgets } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: `Lakukan analisis kesehatan keuangan menyeluruh dari data berikut:
Wallets: ${JSON.stringify(wallets || [])}
Transactions: ${JSON.stringify(transactions || [])}
Budgets: ${JSON.stringify(budgets || [])}

Berikan skor kesehatan (0-100), analisis risiko arus kas, 3 rekomendasi penghematan utama, dan proyeksi keuangan bulan depan.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            healthScore: { type: Type.NUMBER, description: 'Skor 0 hingga 100' },
            healthGrade: { type: Type.STRING, description: 'Sangat Sehat / Sehat / Waspada / Kritis' },
            summary: { type: Type.STRING, description: 'Ringkasan eksekutif 2-3 kalimat' },
            risks: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Daftar risiko potensi masalah keuangan'
            },
            recommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Langkah konkret penghematan & perbaikan'
            },
            savingsPotential: { type: Type.NUMBER, description: 'Potensi estimasi penghematan bulanan' },
            cashflowForecast: { type: Type.STRING, description: 'Proyeksi arus kas singkat bulan depan' }
          },
          required: ['healthScore', 'healthGrade', 'summary', 'risks', 'recommendations']
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    res.json({ success: true, analysis: result });
  } catch (error: any) {
    console.error('Error in /api/ai/analyze-cashflow:', error);
    res.status(500).json({
      error: 'Gagal menganalisis kesehatan keuangan.',
      details: error.message || String(error)
    });
  }
});

// --- VITE MIDDLEWARE / STATIC SERVING ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ALN Finance Pro Server] Running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
