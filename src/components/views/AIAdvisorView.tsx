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
      <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden transition-colors">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-12 h-12 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] shadow-lg">
            <Sparkles className="w-6 h-6 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              AI Financial Advisor
              <span className="text-[10px] bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] px-2.5 py-0.5 rounded-full border border-[var(--gold-badge-border)] uppercase font-extrabold">
                Gemini 3.6 Flash
              </span>
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Personal Financial Intelligence: Penasihat keuangan pintar untuk analisis belanja & rasio arus kas.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunHealthCheck}
          disabled={loadingAnalysis}
          className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95 disabled:opacity-50 relative z-10"
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
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--gold-badge-border)] shadow-2xl space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Hasil Audit Kesehatan Keuangan AI</h4>
            </div>
            <span className="text-xs font-bold text-[var(--gold-primary)] bg-[var(--gold-badge-bg)] px-3 py-1 rounded-full border border-[var(--gold-badge-border)] font-mono">
              Skor: {analysis.healthScore}/100 ({analysis.healthGrade})
            </span>
          </div>

          <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{analysis.summary}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Risks */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-red-500/30">
              <span className="font-bold text-red-500 flex items-center gap-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                <AlertTriangle className="w-4 h-4" />
                Risiko Potensial
              </span>
              <ul className="space-y-1 text-[var(--text-secondary)] text-[11px] list-disc list-inside">
                {analysis.risks.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="bg-[var(--input-bg)] p-4 rounded-2xl border border-emerald-500/30">
              <span className="font-bold text-emerald-500 flex items-center gap-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                <Lightbulb className="w-4 h-4" />
                Rekomendasi Taktis
              </span>
              <ul className="space-y-1 text-[var(--text-secondary)] text-[11px] list-disc list-inside">
                {analysis.recommendations.map((rec, i) => (
                  <li key={i}>{rec}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Main Chat Panel */}
      <div className="bg-[var(--card-bg)] rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col h-[520px] overflow-hidden transition-colors">
        {/* Chat Messages Stream */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 custom-scrollbar">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.sender === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 font-bold text-xs ${
                  msg.sender === 'user'
                    ? 'btn-gold text-[#0B1220]'
                    : 'bg-[var(--input-bg)] border border-[var(--gold-badge-border)] text-[var(--gold-primary)]'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[80%] p-4 rounded-2xl text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] rounded-tr-none font-medium'
                    : 'bg-[var(--input-bg)] text-[var(--text-primary)] border border-[var(--border)] rounded-tl-none whitespace-pre-line'
                }`}
              >
                <div>{msg.text}</div>
                <span className="text-[9px] text-[var(--text-muted)] block mt-2 text-right font-mono">{msg.timestamp}</span>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-[var(--input-bg)] border border-[var(--gold-badge-border)] text-[var(--gold-primary)] flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-bounce" />
              </div>
              <div className="bg-[var(--input-bg)] p-3.5 rounded-2xl border border-[var(--border)] text-xs text-[var(--gold-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 animate-spin text-[var(--gold-primary)]" />
                <span>ALN AI sedang menganalisis data keuangan Anda...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompts Pills */}
        <div className="px-4 py-2.5 bg-[var(--input-bg)] border-t border-[var(--border)] flex items-center gap-2 overflow-x-auto no-scrollbar">
          {prompts.map((promptText, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(promptText)}
              className="text-[10px] font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--card-bg)] hover:bg-[var(--border)] px-3 py-1.5 rounded-full border border-[var(--border)] shrink-0 transition-colors"
            >
              💡 {promptText}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-4 bg-[var(--input-bg)] border-t border-[var(--border)] flex items-center gap-2">
          <input
            type="text"
            placeholder="Tanyakan analisis keuangan, strategi hemat, atau tips investasi..."
            value={inputMessage}
            onChange={e => setInputMessage(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
            className="flex-1 bg-[var(--card-bg)] text-xs px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
          />

          <button
            onClick={() => handleSendMessage()}
            disabled={loading || !inputMessage.trim()}
            className="p-3 rounded-2xl btn-gold text-[#0B1220] shadow-md disabled:opacity-40 transition-all active:scale-95 shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
