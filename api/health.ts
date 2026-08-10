export default function handler(req: any, res: any) {
  const hasKey = !!(process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  res.status(200).json({
    status: 'ok',
    appName: 'ALN Finance Pro',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    aiConfigured: hasKey
  });
}
