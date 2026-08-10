export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { message, history = [], contextData } = req.body || {};
    
    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Parameter message diperlukan.' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      return res.status(401).json({
        error: 'GEMINI_API_KEY belum terkonfigurasi pada Environment Variables Vercel.',
        status: 401
      });
    }

    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

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

    return res.status(200).json({
      reply: response.text || 'Maaf, saya tidak dapat memproses tanggapan saat ini.',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in api/ai/chat:', error);
    const status = error.status || 500;
    
    // Transparent error diagnostics
    let errorMessage = error.message || 'Gagal menghubungkan ke AI Financial Advisor.';
    if (status === 404) {
      errorMessage = 'Model AI (gemini-2.5-flash) tidak ditemukan atau tidak tersedia.';
    } else if (status === 401 || status === 403) {
      errorMessage = 'API Key Gemini tidak valid atau tidak memiliki akses.';
    } else if (status === 429) {
      errorMessage = 'Kuota Gemini sedang habis atau rate limit tercapai.';
    }

    return res.status(status).json({
      error: errorMessage,
      status,
      details: String(error)
    });
  }
}
