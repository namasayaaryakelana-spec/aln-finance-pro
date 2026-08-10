import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { AIService } from '../../services/ai';
import {
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Mic,
  MicOff,
  Upload,
  RefreshCw,
  CheckCircle2,
  X,
  FileText
} from 'lucide-react';

interface AITransactionRecorderProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const AITransactionRecorder: React.FC<AITransactionRecorderProps> = ({
  onSuccess,
  isModal = false
}) => {
  const { filteredWallets, addTransaction, addToast } = useFinance();

  const [activeMode, setActiveMode] = useState<'chat' | 'image' | 'voice'>('chat');
  
  // Input states
  const [textPrompt, setTextPrompt] = useState('');
  const [selectedImage, setSelectedImage] = useState<{ data: string; mimeType: string; previewUrl: string } | null>(null);
  
  // Voice states
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [voiceSupported, setVoiceSupported] = useState(true);
  const recognitionRef = useRef<any>(null);

  // Status states
  const [loading, setLoading] = useState(false);
  const [parsedResults, setParsedResults] = useState<any[]>([]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setVoiceTranscript(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          addToast('warning', 'Akses Mikrofon Ditolak', 'Izinkan akses mikrofon di browser untuk fitur suara.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setVoiceSupported(false);
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      addToast('warning', 'Fitur Suara Tidak Didukung', 'Browser Anda tidak mendukung Web Speech API. Silakan ketik perintah suara.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setVoiceTranscript('');
      try {
        recognitionRef.current.start();
        setIsListening(true);
        addToast('info', 'Merekam Suara...', 'Bicara sekarang, contoh: "Catat makan siang soto 35ribu pake BCA"');
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      addToast('warning', 'Format File Tidak Sesuai', 'Harap unggah gambar struk/nota (JPG, PNG, WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setSelectedImage({
        data: result,
        mimeType: file.type,
        previewUrl: URL.createObjectURL(file)
      });
    };
    reader.readAsDataURL(file);
  };

  const handleProcess = async () => {
    let inputPrompt = '';
    if (activeMode === 'chat') inputPrompt = textPrompt.trim();
    if (activeMode === 'voice') inputPrompt = voiceTranscript.trim();

    if (activeMode !== 'image' && !inputPrompt) {
      addToast('warning', 'Input Kosong', 'Harap isi teks atau gunakan rekaman suara.');
      return;
    }

    if (activeMode === 'image' && !selectedImage) {
      addToast('warning', 'Gambar Belum Diunggah', 'Pilih atau foto gambar struk belanjaan terlebih dahulu.');
      return;
    }

    setLoading(true);
    setParsedResults([]);

    const imageData = selectedImage ? { data: selectedImage.data, mimeType: selectedImage.mimeType } : undefined;
    const results = await AIService.parseFastTransaction(inputPrompt, imageData);

    setLoading(false);

    if (results && results.length > 0) {
      setParsedResults(results);
      addToast('success', `AI Berhasil Mendeteksi ${results.length} Transaksi!`, 'Periksa hasil ekstraksi Gemini AI di bawah.');
    } else {
      addToast('error', 'Gagal Memproses Transaksi', 'AI tidak dapat mendeteksi transaksi. Coba berikan gambar/teks lebih jelas.');
    }
  };

  const handleConfirmSaveAll = () => {
    if (parsedResults.length === 0) return;

    let savedCount = 0;
    parsedResults.forEach(item => {
      const accountName = item.account || item.walletName;
      let walletId = filteredWallets[0]?.id || 'w-1';
      if (accountName) {
        const matched = filteredWallets.find(w =>
          w.name.toLowerCase().includes(accountName.toLowerCase())
        );
        if (matched) walletId = matched.id;
      }

      const isIncome = (item.type || '').toUpperCase() === 'INCOME';
      const itemScope = (item.scope || 'PERSONAL').toUpperCase() === 'SHARED' ? 'shared' : 'personal';
      const noteDetails = [
        item.subcategory ? `Sub-kategori: ${item.subcategory}` : null,
        item.paid_by ? `Penanggung Jawab: ${item.paid_by}` : null,
        item.note || `Dicatat via AI (${activeMode.toUpperCase()})`
      ].filter(Boolean).join(' | ');

      addTransaction({
        type: isIncome ? 'income' : 'expense',
        amount: item.amount || 0,
        currency: 'IDR',
        title: item.title || 'Transaksi AI',
        category: item.category || 'Lainnya',
        walletId,
        scope: itemScope,
        date: item.transaction_date || item.date || new Date().toISOString().split('T')[0],
        note: noteDetails
      });
      savedCount++;
    });

    addToast('success', `${savedCount} Transaksi Berhasil Disimpan`, 'Data kas pribadi telah diperbarui.');

    setTextPrompt('');
    setSelectedImage(null);
    setVoiceTranscript('');
    setParsedResults([]);

    if (onSuccess) onSuccess();
  };

  return (
    <div className={`bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl p-5 md:p-6 text-[var(--text-primary)] shadow-2xl relative space-y-4 transition-colors ${isModal ? '' : 'my-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-inner">
            <Sparkles className="w-5 h-5 text-[var(--gold-primary)] animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-[var(--text-primary)] flex items-center gap-2 font-['Plus_Jakarta_Sans',sans-serif]">
              Catat Transaksi AI (Multimodal Gemini 3.6)
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Gunakan Chat AI, Unggah Struk Gambar, atau Rekaman Suara
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)]">
        <button
          onClick={() => setActiveMode('chat')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeMode === 'chat'
              ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm font-extrabold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat / Teks AI</span>
        </button>

        <button
          onClick={() => setActiveMode('image')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeMode === 'image'
              ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm font-extrabold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          <span>Gambar Struk</span>
        </button>

        <button
          onClick={() => setActiveMode('voice')}
          className={`py-2.5 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeMode === 'voice'
              ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-sm font-extrabold'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>Suara AI</span>
        </button>
      </div>

      {/* Mode Content: Chat AI */}
      {activeMode === 'chat' && (
        <div className="space-y-3">
          <textarea
            placeholder="Ketik catatan transaksi keluarga, contoh: 'Lana bayar bensin 50rb pake bca, terus beli gas lpg 22k cash'"
            value={textPrompt}
            onChange={e => setTextPrompt(e.target.value)}
            rows={3}
            className="w-full bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--input-border)] text-xs text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
          />

          {/* Quick Prompts */}
          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <span className="text-[var(--text-muted)] py-1 font-semibold">Contoh Kas Keluarga:</span>
            {[
              'Lana bayar bensin 50rb pake bca, terus beli gas lpg 22k cash',
              'Lina beli pampers & susu anak 180rb GoPay',
              'Ayah bayar listrik PLN 250rb Mandiri',
              'Terima Gaji Suami 12.5 juta BCA'
            ].map((p, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setTextPrompt(p)}
                className="px-3 py-1 rounded-xl bg-[var(--input-bg)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--gold-primary)] font-medium transition-colors text-left"
              >
                + {p}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode Content: Gambar / Struk */}
      {activeMode === 'image' && (
        <div className="space-y-3">
          {selectedImage ? (
            <div className="relative rounded-2xl overflow-hidden border border-[var(--gold-badge-border)] bg-[var(--input-bg)] p-3.5 flex items-center gap-4">
              <img
                src={selectedImage.previewUrl}
                alt="Struk Preview"
                className="w-20 h-20 object-cover rounded-xl border border-[var(--border)]"
              />
              <div className="flex-1 space-y-1 text-xs">
                <p className="font-bold text-[var(--text-primary)] flex items-center gap-1">
                  <FileText className="w-4 h-4 text-[var(--gold-primary)]" />
                  Gambar Struk Siap Diunggah
                </p>
                <p className="text-[11px] text-[var(--text-secondary)]">
                  Gemini AI Vision akan membaca item, nominal total, merchant & tanggal secara otomatis.
                </p>
              </div>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-2 rounded-full bg-[var(--card-bg)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <label className="border-2 border-dashed border-[var(--border)] hover:border-[var(--gold-primary)] rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-[var(--input-bg)] transition-all text-center space-y-2">
              <div className="p-3.5 rounded-full bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-[var(--text-primary)]">Klik atau Tarik Foto Struk / Nota Di Sini</p>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Format JPG, PNG, WEBP (Ekstraksi Otomatis AI)</p>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          <input
            type="text"
            placeholder="Tambahkan catatan tambahan untuk struk (Opsional)..."
            value={textPrompt}
            onChange={e => setTextPrompt(e.target.value)}
            className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-xs text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
          />
        </div>
      )}

      {/* Mode Content: Suara AI */}
      {activeMode === 'voice' && (
        <div className="space-y-3 bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
          <div className="flex flex-col items-center justify-center space-y-3 py-3">
            <button
              onClick={toggleListening}
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/50 scale-110'
                  : 'btn-gold text-[#0B1220] shadow-lg'
              }`}
            >
              {isListening ? <MicOff className="w-7 h-7" /> : <Mic className="w-7 h-7" />}
            </button>

            <div className="text-center">
              <p className="text-xs font-bold text-[var(--text-primary)]">
                {isListening ? 'Merekam Suara Anda...' : 'Klik Tombol Mikrofon Untuk Mulai'}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                {voiceSupported ? 'Bicara transaksi dalam Bahasa Indonesia' : 'Ketik di bawah jika mic tidak aktif'}
              </p>
            </div>
          </div>

          <textarea
            placeholder="Transkrip suara Anda akan muncul di sini..."
            value={voiceTranscript}
            onChange={e => setVoiceTranscript(e.target.value)}
            rows={2}
            className="w-full bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--input-border)] text-xs text-[var(--input-text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--gold-primary)]"
          />
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleProcess}
        disabled={loading}
        className="w-full py-3.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-95"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-[#0B1220]" />
            <span>Menganalisis dengan Gemini 3.6 AI...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 text-[#0B1220]" />
            <span>Proses Transaksi AI</span>
          </>
        )}
      </button>

      {/* Parsed Result Preview */}
      {parsedResults.length > 0 && (
        <div className="p-5 bg-[var(--input-bg)] border border-[var(--gold-badge-border)] rounded-3xl space-y-4 text-xs animate-fade-in">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-2.5">
            <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Hasil Analisis AI ({parsedResults.length} Transaksi Terdeteksi):</span>
            </div>
            <span className="text-[10px] bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] px-2.5 py-0.5 rounded-full border border-[var(--gold-badge-border)] font-extrabold uppercase">
              Pribadi
            </span>
          </div>

          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
            {parsedResults.map((tx, index) => {
              const isIncome = (tx.type || '').toUpperCase() === 'INCOME';
              return (
                <div
                  key={index}
                  className="bg-[var(--card-bg)] p-3.5 rounded-2xl border border-[var(--border)] hover:border-[var(--gold-primary)] transition-all space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[var(--text-primary)] flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${isIncome ? 'bg-emerald-500' : 'bg-red-500'}`} />
                      {tx.title || 'Transaksi AI'}
                    </span>
                    <span className={`font-black text-xs font-mono ${isIncome ? 'text-emerald-500' : 'text-red-500'}`}>
                      {isIncome ? '+' : '-'} Rp {(tx.amount || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={handleConfirmSaveAll}
              className="flex-1 py-2.5 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>+ Simpan Semua {parsedResults.length} Transaksi Ke Kas Pribadi</span>
            </button>
            <button
              onClick={() => setParsedResults([])}
              className="py-2.5 px-4 bg-[var(--card-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] rounded-2xl text-xs font-bold border border-[var(--border)]"
            >
              Ulangi
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
