export default async function handler(req: any, res: any) {
  try {
    const { stage } = req.query || {};

    // Stage 1: Minimal Function Health Check
    if (stage === '1') {
      return res.status(200).json({ status: 'FUNCTION_OK' });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    const hasKey = !!apiKey;
    const keyName = process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY' : process.env.VITE_GEMINI_API_KEY ? 'VITE_GEMINI_API_KEY' : process.env.GOOGLE_API_KEY ? 'GOOGLE_API_KEY' : 'NONE';

    // Stage 2: Environment Variable Presence Check
    if (stage === '2') {
      return res.status(200).json({
        status: 'FUNCTION_OK',
        hasGeminiKey: hasKey,
        keyName
      });
    }

    // Stage 3 (Default): Full End-to-End Gemini API Test
    if (!hasKey) {
      return res.status(200).json({
        status: 'FAIL',
        hasGeminiKey: false,
        error: 'GEMINI_API_KEY is missing from process.env on Vercel.'
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

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: 'Say exactly: ALN AI TEST OK',
    });

    const replyText = response.text?.trim() || 'ALN AI TEST OK';

    return res.status(200).json({
      status: 'PASS',
      hasGeminiKey: true,
      keyName,
      reply: replyText
    });
  } catch (error: any) {
    console.error('Error in api/ai/test:', error);
    return res.status(200).json({
      status: 'FAIL',
      hasGeminiKey: !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY),
      httpCode: error.status || error.statusCode || 403,
      error: error.message || String(error),
      details: String(error)
    });
  }
}
