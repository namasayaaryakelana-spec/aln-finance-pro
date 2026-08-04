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

    const familyFinanceSchema = {
      type: Type.OBJECT,
      properties: {
        transactions: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Nama / Keterangan transaksi" },
              type: { type: Type.STRING, enum: ["EXPENSE", "INCOME"], description: "EXPENSE untuk Kredit / Pengeluaran, INCOME untuk Debet / Pemasukan" },
              debit: { type: Type.NUMBER, description: "Nominal angka jika PEMASUKAN (Menambah Saldo), 0 jika Pengeluaran" },
              credit: { type: Type.NUMBER, description: "Nominal angka jika PENGELUARAN (Mengurangi Saldo), 0 jika Pemasukan" },
              paid_by: { type: Type.STRING, nullable: true, description: "Nama/subjek pembayar (contoh: Lana, Lina, Ayah, Ibu), atau null" },
              scope: { type: Type.STRING, enum: ["SHARED", "PERSONAL"], description: "SHARED (kebutuhan bersama) atau PERSONAL (kebutuhan pribadi)" },
              account: { type: Type.STRING, nullable: true, description: "Sumber bank/dompet digital (contoh: BCA, Cash, GoPay, Mandiri), atau null" },
              category: { 
                type: Type.STRING, 
                description: "Kategori utama transaksi sesuai master acuan" 
              },
              subcategory: {
                type: Type.STRING,
                description: "Sub-kategori transaksi sesuai acuan master"
              },
              transaction_date: { type: Type.STRING, nullable: true, description: "Tanggal transaksi format YYYY-MM-DD jika disebutkan, atau null" },
              is_high_impact: { type: Type.BOOLEAN, description: "Set true jika berupa EXPENSE bernominal besar (> 200rb), else false" }
            },
            required: ["title", "type", "debit", "credit", "scope", "category", "subcategory", "is_high_impact"]
          }
        }
      },
      required: ["transactions"]
    };

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
ATURAN EKSTRAKSI & VALIDASI:
===============================================================

1. KONVERSI ANGKA:
   - "k" / "rb" = x 1.000 (contoh: 25k -> 25000, 50rb -> 50000)
   - "jt" = x 1.000.000 (contoh: 1.5jt -> 1500000)

2. HITMAP KALENDER & TANGGAL ("transaction_date"):
   - Ekstrak keterangan waktu (misal: "kemarin", "tgl 15", "2 hari lalu") dan konversikan ke format YYYY-MM-DD. Tanggal acuan hari ini adalah ${new Date().toISOString().split('T')[0]}.
   - Jika tidak ada keterangan waktu dalam teks, isi dengan null.

3. INDIKATOR PENGELUARAN BESAR ("is_high_impact"):
   - Set true jika berupa transaksi Kredit/Pengeluaran bernominal besar (di atas Rp 200.000 / disesuaikan) yang berpotensi menjadi Hari Paling Boros di Kalender Heatmap. Sebaliknya set false.

4. PEMBAYAR / SUBJEK ("paid_by"):
   - Ekstrak nama jika ada (contoh: "Lana", "Lina", "Ayah", "Ibu"). Jika tidak ada, isi null.

5. CAKUPAN ("scope"):
   - "SHARED": Kebutuhan Bersama / Rumah Tangga.
   - "PERSONAL": Kebutuhan Pribadi.

6. MULTI-TRANSAKSI:
   - Ekstrak seluruh transaksi jika terdapat lebih dari satu dalam 1 teks input.

Input Pengguna: ${prompt ? `"${prompt}"` : 'Gambar Struk/Nota'}`;

    contentsParts.push({ text: textInstruction });

    const response = await ai.models.generateContent({
      model: 'gemini-3.6-flash',
      contents: { parts: contentsParts },
      config: {
        responseMimeType: 'application/json',
        responseSchema: familyFinanceSchema
      }
    });

    const parsedData = JSON.parse(response.text || '{"transactions":[]}');
    const transactionsList = (parsedData.transactions || []).map((t: any) => {
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
