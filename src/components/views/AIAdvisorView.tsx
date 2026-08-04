import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AIService } from '../../services/ai';
import { ChatMessage, FinancialHealthAnalysis } from '../../types';
import {
  Sparkles,
  Send,
  Bot,
  User,
  Activity,
  AlertTriangle,
  Lightbulb,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export const AIAdvisorView: React.FC = () => {
  const { filteredTransactions, filteredWallets, totalBalance, totalIncome, totalExpense, healthScore, budgets } = useFinance();

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'assistant',
      text: `Halo! Saya **ALN AI Financial OS Advisor** (powered by Gemini 3.6).

Saya telah menganalisis kondisi keuangan Anda:
• **Total Likuiditas:** Rp ${totalBalance.toLocaleString('id-ID')}
• **Net Arus Kas:** Rp ${(totalIncome - totalExpense).toLocaleString('id-ID')}
• **Skor Kesehatan Keuangan:** **${healthScore}/100**

Ada yang ingin Anda tanyakan atau butuh strategi penghematan taktis hari ini?`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<FinancialHealthAnalysis | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSendMessage = async (customText?: string) => {
    const textToSend = customText || inputMessage;
    if (!textToSend.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!customText) setInputMessage('');
    setLoading(true);

    const contextData = {
      totalBalance,
      totalIncome,
      totalExpense,
      healthScore,
      walletsCount: filteredWallets.length,
      transactionsCount: filteredTransactions.length
    };

    const history = messages.map(m => ({
      role: m.sender === 'assistant' ? 'model' : 'user',
      text: m.text
    }));

    const res = await AIService.chatWithAdvisor(textToSend, history, contextData);

    const botMsg: ChatMessage = {
      id: `bot-${Date.now()}`,
      sender: 'assistant',
      text: res.reply || 'Maaf, terjadi kesalahan pada layanan AI.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, botMsg]);
    setLoading(false);
  };

  const handleRunHealthCheck = async () => {
    setLoadingAnalysis(true);
    const result = await AIService.analyzeCashflow({
      transactions: filteredTransactions,
      wallets: filteredWallets,
      budgets
    });
    setAnalysis(result);
    setLoadingAnalysis(false);
  };

  const prompts = [
    'Analisis potensi pemborosan di kategori Makanan',
    'Berikan strategi penghematan 20% bulan depan',
    'Rekomendasi alokasi investasi berdasarkan total saldo',
    'Apakah arus kas saya aman untuk beli aset baru?'
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-[#100B26] to-slate-950 p-6 rounded-3xl border border-purple-500/30 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-300 shadow-lg">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
              ALN AI Financial Advisor
              <span className="text-[10px] bg-purple-500/30 text-purple-200 px-2 py-0.5 rounded-full border border-purple-500/40 uppercase font-bold">
                Gemini 3.6 Flash
              </span>
            </h3>
            <p className="text-xs text-slate-300">
              Penasihat keuangan pintar untuk analisis rasio belanja, penghematan & prediksi arus kas.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunHealthCheck}
          disabled={loadingAnalysis}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-all active:scale-95 disabled:opacity-50"
        >
          {loadingAnalysis ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Activity className="w-4 h-4" />
          )}
          <span>Audit Kesehatan Keuangan</span>
        </button>
      </div>

      {/* Analysis Result Banner */}
      {analysis && (
        <div className="bg-slate-900/95 p-6 rounded-3xl border border-purple-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h4 className="text-sm font-extrabold text-white">Hasil Audit Kesehatan Keuangan AI</h4>
            </div>
            <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">
              Skor: {analysis.healthScore}/100 ({analysis.healthGrade})
            </span>
          </div>

          <p className="text-xs text-slate-200 leading-relaxed">{analysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Risks */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-red-500/30">
              <span className="font-bold text-red-400 flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4" />
                Risiko Potential
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                {analysis.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-4 h-4" />
                Rekomendasi Taktis
              </span>
              <ul className="space-y-1 text-slate-300 text-[11px] list-disc list-inside">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      <div className="bg-slate-900/90 rounded-3xl border border-slate-800/80 shadow-2xl flex flex-col h-[520px] overflow-hidden">
        {/* Chat Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-white font-bold text-xs ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-purple-600 border border-purple-400/30'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30 rounded-tr-none'
                    : 'bg-slate-950 text-slate-100 border border-slate-800 rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div>{msg.text}</div>
                <span className="text-[9px] text-slate-500 block mt-2 text-right">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 text-xs text-purple-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-purple-400" />
                <span>ALN AI sedang menganalisis data keuangan Anda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2 bg-slate-950/80 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto no-scrollbar">
          {prompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              className="text-[10px] font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 px-3 py-1.5 rounded-full border border-slate-800 shrink-0 transition-colors"
            >
              💡 {promptText}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
          <input
            type="text"
            placeholder="Tanyakan analisis keuangan, strategi hemat, atau tips investasi..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-slate-900 text-xs px-4 py-3 rounded-2xl border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="p-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white shadow-md disabled:opacity-40 transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
