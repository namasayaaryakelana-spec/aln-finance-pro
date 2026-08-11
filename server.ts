import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Vercel Serverless Function Path Normalization Middleware
app.use((req: any, res: any, next: any) => {
  if (req.originalUrl) {
    req.url = req.originalUrl;
  }
  if (!req.url.startsWith('/api') && (req.url.startsWith('/ai/') || req.url.startsWith('/health'))) {
    req.url = '/api' + req.url;
  }
  next();
});

// Initialize Google GenAI Client safely
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    const err: any = new Error('GEMINI_API_KEY belum terkonfigurasi pada Environment Variables server/Vercel.');
    err.status = 401;
    throw err;
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
app.get(['/api/health', '/health'], (req, res) => {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.json({
    status: 'ok',
    appName: 'ALN Finance Pro',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiConfigured: hasKey
  });
});

// AI Server Diagnostics Test Endpoint (Supports Stage 1, Stage 2, Stage 3)
app.get(['/api/ai/test', '/ai/test'], async (req, res) => {
  try {
    const stage = req.query.stage;

    // Stage 1: Minimal Serverless Function Health Check (No Key, No Gemini)
    if (stage === '1') {
      return res.json({ status: 'FUNCTION_OK' });
    }

    const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
    const keyName = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.VITE_GEMINI_API_KEY ? 'VITE_GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'NONE';
    
    // Stage 2: Environment Variable Presence Check
    if (stage === '2') {
      return res.json({
        status: 'FUNCTION_OK',
        hasGeminiKey: hasKey,
        keyName
      });
    }

    // Stage 3 (Default): Full End-to-End Gemini API Test
    if (!hasKey) {
      return res.status(401).json({
        status: 'FUNCTION_OK',
        hasGeminiKey: false,
        error: 'GEMINI_API_KEY is missing from process.env on Vercel.'
      });
    }

    const ai = getAiClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say exactly: ALN AI TEST OK',
    });

    const replyText = response.text?.trim() || 'ALN AI TEST OK';

    res.json({
      status: 'PASS',
      hasGeminiKey: true,
      keyName,
      reply: replyText
    });
  } catch (error: any) {
    console.error('Error in /api/ai/test:', error);
    res.status(error.status || 500).json({
      status: 'FAIL',
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      error: error.message || String(error),
      details: String(error)
    });
  }
});

// AI Financial Assistant Chat
app.post(['/api/ai/chat', '/ai/chat'], async (req, res) => {
  try {
    const { message, history = [], contextData } = req.body;
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Parameter message diperlukan.' });
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
      model: 'gemini-2.5-flash',
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
    const status = error.status || (error.message?.includes('belum terkonfigurasi') ? 401 : 500);
    res.status(status).json({
      error: error.message || 'Gagal menghubungkan ke AI Financial Advisor.',
      status,
      details: String(error)
    });
  }
});

// AI Multimodal Transaction Parser (Text / Chat, Image / Struk, Voice Input)
app.post(['/api/ai/fast-transaction', '/ai/fast-transaction'], async (req, res) => {
  try {
    const { prompt, image } = req.body;
    
    if (!prompt && !image) {
      return res.status(400).json({ error: 'Prompt teks atau gambar struk/nota diperlukan.' });
    }

    const ai = getAiClient();
    const contentsParts: any[] = [];

    if (image && image.data) {
      contentsParts.push({
        inlineData: {
          data: image.data,
          mimeType: image.mimeType || 'image/jpeg'
        }
      });
    }

    const textInstruction = `Anda adalah "AI Fast Input Engine" ALN Finance Pro.
Tugas Anda: Ekstrak secara presisi data transaksi keuangan dari input pengguna atau gambar struk/nota.

Aturan Ekstraksi Sangat Ketat:
1. Klasifikasi Jenis Transaksi (type):
   - Jika pengguna membelanjakan/membayar uang -> type: "EXPENSE", debit: 0, credit: Nominal.
   - Jika pengguna menerima uang/gaji/omzet -> type: "INCOME", debit: Nominal, credit: 0.
2. Nominal (debit / credit):
   - Wajib angka murni tanpa simbol Rp / K / Jt. (Contoh: "bensin 50rb" -> credit: 50000, debit: 0).
3. Lingkup Keuangan (scope):
   - "PERSONAL" untuk pengeluaran pribadi (contoh: bensin pribadi, kopi, baju pribadi).
   - "SHARED" untuk pengeluaran keluarga / rumah tangga (contoh: bensin mobil keluarga, listrik rumah, pampers anak, belanja dapur, sekolah).
4. Subjek Pembayar (paid_by):
   - Jika disebutkan nama orang (contoh: "Lana", "Lina", "Ayah", "Ibu") set paid_by sesuai nama tersebut.
5. Rekening / Dompet (account):
   - Set sesuai nama dompet/bank jika disebutkan (contoh: "BCA", "Mandiri", "GoPay", "Cash").
6. Kategori & Sub-Kategori (category & subcategory):
   - ATURAN UTAMA: JANGAN menentukan kategori dari kata kerja (seperti "beli", "bayar", "pesan", "kirim", "ambil"). Tentukan kategori berdasarkan SEMANTIK OBJEK, TUJUAN, dan KONTEKS LENGKAP transaksi!
   - Contoh di bawah ini HANYA CONTOH ILUSTRASI, BUKAN BATASAN KAKU. Anda HARUS secara cerdas dan fleksibel memahami serta mengklasifikasikan transaksi baru yang belum pernah dicontohkan:
     * "Fashion" (Sub: "Sepatu", "Pakaian", "Tas", dll) -> Contoh: "beli sepatu" -> Fashion • Sepatu
     * "Transportasi" (Sub: "Bensin", "Servis Kendaraan", "Tiket", "Tol", dll) -> Contoh: "bayar servis motor" -> Transportasi • Servis Kendaraan
     * "Hiburan" (Sub: "Langganan", "Bioskop", "Hobi", dll) -> Contoh: "langganan Netflix" -> Hiburan • Langganan
     * "Pendidikan" (Sub: "Sekolah", "Kursus", "Buku", dll) -> Contoh: "bayar uang sekolah anak" -> Pendidikan • Sekolah
     * "Elektronik & Gadget" (Sub: "Laptop", "HP / Aksesoris", dll) -> Contoh: "beli laptop untuk kerja" -> Elektronik & Gadget • Laptop
     * "Makanan & Kuliner" (Sub: "Makanan", "Minuman", "Restoran", "Belanja Dapur", dll)
     * "Kebutuhan Rumah" (Sub: "Gas LPG", "Peralatan Rumah", "Kebersihan", dll)
     * "Kebutuhan Keluarga & Anak" (Sub: "Pampers", "Susu", "Sekolah", dll)
     * "Tagihan & Utilitas" (Sub: "Listrik", "Internet", "Pulsa", "Air", dll)
     * "Kesehatan" (Sub: "Obat", "Dokter / Klinik", dll)
     * "Penghasilan Utama" (Sub: "Gaji Suami", "Gaji Istri")
     * "Penghasilan Sampingan" (Sub: "Honorarium Kegiatan", "Usaha Sampingan")
   - PENTING: Jika transaksi mengenai objek/keperluan baru yang belum dicantumkan di atas, pilihlah Kategori & Subkategori yang paling relevan dan presisi sesuai konteks objek tersebut. JANGAN pernah memilih "Makanan" hanya karena kata "beli" atau "bayar" muncul!
7. Penanganan Multi-Transaksi dalam 1 Input (SANGAT PENTING):
   - Jika pengguna menyebutkan beberapa transaksi terpisah sekaligus (contoh: "bensin bca 50rb terus makan siang 35rb dan bayar wifi 250rb"), Anda WAJIB mengembalikan array "transactions" dengan 3 objek transaksi terpisah!
   - KONTINUITAS SUBJEK & DOMPET: Jika transaksi ke-2 atau ke-3 tidak menyebutkan nama pembayar/dompet secara eksplisit, warisi subjek (paid_by) dan dompet (account) dari transaksi pertama!`;

    const familyFinanceSchema = {
      type: Type.OBJECT,
      properties: {
        transactions: {
          type: Type.ARRAY,
          description: "Daftar objek transaksi yang berhasil diekstrak",
          items: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: "Judul ringkas transaksi (Contoh: Bensin Pertamax, Belanja Dapur, Gaji Bulanan)" },
              type: { type: Type.STRING, description: "INCOME atau EXPENSE" },
              debit: { type: Type.NUMBER, description: "Nominal Pemasukan (0 jika EXPENSE)" },
              credit: { type: Type.NUMBER, description: "Nominal Pengeluaran (0 jika INCOME)" },
              paid_by: { type: Type.STRING, nullable: true, description: "Nama subjek pembayar (Contoh: Lana, Lina, Ayah, Ibu) atau null" },
              scope: { type: Type.STRING, description: "PERSONAL atau SHARED" },
              account: { type: Type.STRING, nullable: true, description: "Nama akun / dompet yang digunakan (Contoh: BCA, Mandiri, Cash) atau null" },
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
      model: 'gemini-2.5-flash',
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
    const status = error.status || (error.message?.includes('belum terkonfigurasi') ? 401 : 500);
    res.status(status).json({
      error: error.message || 'Gagal memproses transaksi kilat berbasis AI.',
      status,
      details: String(error)
    });
  }
});

// AI Cashflow Risk & Financial Health Analyzer
app.post(['/api/ai/analyze-cashflow', '/ai/analyze-cashflow'], async (req, res) => {
  try {
    const { transactions, wallets, budgets } = req.body;
    const ai = getAiClient();

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
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
    const status = error.status || (error.message?.includes('belum terkonfigurasi') ? 401 : 500);
    res.status(status).json({
      error: error.message || 'Gagal menganalisis kesehatan keuangan.',
      status,
      details: String(error)
    });
  }
});

// Fallback Unmatched API Handler
app.use('/api', (req, res) => {
  res.status(404).json({ error: `Rute API '${req.url}' tidak ditemukan.` });
});

// --- VITE MIDDLEWARE / STATIC SERVING (DEVELOPMENT ONLY) ---
async function startServer() {
  if (!process.env.VERCEL) {
    if (process.env.NODE_ENV !== 'production') {
      const { createServer: createViteServer } = await import('vite');
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
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
