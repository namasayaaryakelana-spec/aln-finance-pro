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
  FileText,
  Info,
  Edit2,
  ShieldCheck,
  Tag,
  Wallet,
  Calendar,
  UserCheck,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowRightLeft
} from 'lucide-react';

interface AITransactionRecorderProps {
  onSuccess?: () => void;
  isModal?: boolean;
}

export const AITransactionRecorder: React.FC<AITransactionRecorderProps> = ({
  onSuccess,
  isModal = false
}) => {
  const { categories, filteredWallets, addTransaction, addToast } = useFinance();

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
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleUpdateParsedResult = (index: number, field: string, value: any) => {
    setParsedResults(prev => {
      const copy = [...prev];
      if (copy[index]) {
        copy[index] = { ...copy[index], [field]: value };
        if (field === 'amount') {
          const isIncome = (copy[index].type || '').toUpperCase() === 'INCOME';
          copy[index].debit = isIncome ? Number(value) || 0 : 0;
          copy[index].credit = !isIncome ? Number(value) || 0 : 0;
        }
      }
      return copy;
    });
  };

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
      {parsedResults.length > 0 && (() => {
        const targetWalletName = (() => {
          const firstTx = parsedResults[0];
          const accName = firstTx?.account || firstTx?.walletName;
          if (accName) {
            const matched = filteredWallets.find(w => w.name.toLowerCase().includes(accName.toLowerCase()));
            if (matched) return matched.name;
          }
          return filteredWallets[0]?.name || 'Kas Utama';
        })();

        const formatDateID = (dateStr?: string) => {
          if (!dateStr) return new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          try {
            const d = new Date(dateStr);
            if (isNaN(d.getTime())) return dateStr;
            return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
          } catch {
            return dateStr;
          }
        };

        return (
          <div className="p-5 md:p-6 bg-[var(--input-bg)] border border-[var(--gold-badge-border)] rounded-3xl space-y-5 text-xs animate-fade-in shadow-xl">
            {/* Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-[var(--text-primary)]">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                <span>✓ Hasil Analisis AI ({parsedResults.length} Transaksi Terdeteksi)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2.5 py-1 rounded-full font-bold">
                  {activeMode === 'chat' ? 'Chat / Teks' : activeMode === 'image' ? 'Struk Vision' : 'Suara AI'}
                </span>
                <span className="text-[10px] bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] px-2.5 py-1 rounded-full border border-[var(--gold-badge-border)] font-extrabold uppercase">
                  {parsedResults.some(t => (t.scope || '').toUpperCase() === 'SHARED') ? 'Keluarga (SHARED)' : 'Pribadi'}
                </span>
              </div>
            </div>

            {/* Transaction Cards List */}
            <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
              {parsedResults.map((tx, index) => {
                const txType = (tx.type || 'EXPENSE').toUpperCase();
                const isIncome = txType === 'INCOME';
                const isTransfer = txType === 'TRANSFER';
                const isExpense = txType === 'EXPENSE' || (!isIncome && !isTransfer);

                const isEditing = editingIndex === index;
                const accountName = tx.account || tx.walletName || 'Akun belum terdeteksi';
                const matchedWallet = filteredWallets.find(w => w.name.toLowerCase().includes(accountName.toLowerCase()));
                const walletDisplayName = matchedWallet ? matchedWallet.name : accountName;
                const displayDate = formatDateID(tx.date || tx.transaction_date);

                const sourceModeText = activeMode === 'chat' ? 'CHAT' : activeMode === 'image' ? 'STRUK' : 'VOICE';

                // Master Data category resolution for Edit Mode
                const targetType = isIncome ? 'income' : 'expense';
                const availableCategoryList = categories;

                const aiCategory = (tx.category || '').trim();
                const matchedCatObj = availableCategoryList.find(c => c.name.toLowerCase() === aiCategory.toLowerCase());

                const selectedCategoryName = matchedCatObj ? matchedCatObj.name : (aiCategory || (availableCategoryList[0]?.name || 'Lainnya'));
                const currentCategoryObj = categories.find(c => c.name === selectedCategoryName);
                const availableSubcategories = currentCategoryObj?.subcategories || [];

                const aiSubcategory = (tx.subcategory || '').trim();
                const matchedSub = availableSubcategories.find(s => s.toLowerCase() === aiSubcategory.toLowerCase());
                const selectedSubcategoryName = matchedSub || (availableSubcategories.length > 0 ? availableSubcategories[0] : aiSubcategory || '');

                return (
                  <div
                    key={index}
                    className="bg-[var(--card-bg)] p-4 md:p-5 rounded-2xl border border-[var(--border)] hover:border-[var(--gold-primary)] transition-all space-y-3 shadow-sm"
                  >
                    {/* Header: Status & Icon (Baris Atas) */}
                    <div className="flex items-center justify-between gap-2 border-b border-[var(--border)] pb-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                          isIncome
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : isTransfer
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            : 'bg-red-500/10 text-red-500 border border-red-500/20'
                        }`}>
                          {isIncome ? <ArrowDownLeft className="w-4 h-4" /> : isTransfer ? <ArrowRightLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-[var(--text-muted)] block">
                            TRANSAKSI #{index + 1}
                          </span>
                          <span className="text-[11px] font-black uppercase tracking-wide flex items-center gap-1 mt-0.5">
                            {isIncome && <span className="text-emerald-500">🟢 PEMASUKAN</span>}
                            {isExpense && <span className="text-red-500">🔴 PENGELUARAN</span>}
                            {isTransfer && <span className="text-blue-500">🔵 TRANSFER</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Baris Judul Transaksi */}
                    <div className="min-w-0">
                      <h4 className="text-base md:text-lg font-extrabold text-[var(--text-primary)] truncate tracking-tight">
                        {tx.title || 'Transaksi AI'}
                      </h4>
                    </div>

                    {/* Baris Nominal & Tombol Periksa & Edit */}
                    <div className="flex flex-wrap items-center justify-between gap-2 py-1">
                      <span className={`text-lg md:text-xl font-black font-mono tracking-tight whitespace-nowrap shrink-0 ${
                        isIncome ? 'text-emerald-500' : isTransfer ? 'text-blue-500' : 'text-red-500'
                      }`}>
                        {isIncome ? '+ ' : isExpense ? '- ' : ''}Rp {(tx.amount || 0).toLocaleString('id-ID')}
                      </span>

                      <button
                        type="button"
                        onClick={() => setEditingIndex(isEditing ? null : index)}
                        className="px-3 py-1.5 rounded-xl bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 active:scale-95"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>{isEditing ? 'Selesai' : 'Periksa & Edit'}</span>
                      </button>
                    </div>

                    {/* Baris Detail / Inline Edit Form */}
                    {isEditing ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-[var(--input-bg)] rounded-xl border border-[var(--gold-badge-border)] animate-fade-in mt-2 text-xs">
                        {/* 1. Deskripsi Transaksi */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Deskripsi Transaksi</label>
                          <input
                            type="text"
                            value={tx.title || ''}
                            onChange={e => handleUpdateParsedResult(index, 'title', e.target.value)}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-medium"
                          />
                        </div>

                        {/* 2. Nominal (Rp) */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Nominal (Rp)</label>
                          <input
                            type="number"
                            value={tx.amount || 0}
                            onChange={e => handleUpdateParsedResult(index, 'amount', Number(e.target.value))}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-mono font-bold"
                          />
                        </div>

                        {/* 3. Tanggal */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Tanggal</label>
                          <input
                            type="date"
                            value={tx.date || tx.transaction_date || new Date().toISOString().split('T')[0]}
                            onChange={e => {
                              handleUpdateParsedResult(index, 'date', e.target.value);
                              handleUpdateParsedResult(index, 'transaction_date', e.target.value);
                            }}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)]"
                          />
                        </div>

                        {/* 4. Kategori Dropdown (Master Data) */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Kategori</label>
                          <select
                            value={selectedCategoryName}
                            onChange={e => {
                              const newCatName = e.target.value;
                              handleUpdateParsedResult(index, 'category', newCatName);
                              const catObj = categories.find(c => c.name === newCatName);
                              const defaultSub = catObj?.subcategories?.[0] || '';
                              handleUpdateParsedResult(index, 'subcategory', defaultSub);
                            }}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-semibold"
                          >
                            {!matchedCatObj && selectedCategoryName && (
                              <option value={selectedCategoryName}>{selectedCategoryName}</option>
                            )}
                            {availableCategoryList.map(c => (
                              <option key={c.id} value={c.name}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* 5. Subkategori Dropdown (Tergantung Kategori Terpilih) */}
                        <div>
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Subkategori</label>
                          <select
                            value={selectedSubcategoryName}
                            onChange={e => handleUpdateParsedResult(index, 'subcategory', e.target.value)}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-semibold"
                          >
                            {availableSubcategories.length > 0 ? (
                              availableSubcategories.map((sub, sIdx) => (
                                <option key={sIdx} value={sub}>
                                  {sub}
                                </option>
                              ))
                            ) : (
                              <option value="">(Tanpa Subkategori)</option>
                            )}
                          </select>
                        </div>

                        {/* 6. Akun / Dompet Dropdown (Master Data Wallet) */}
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-[var(--text-muted)] block mb-1">Akun / Dompet</label>
                          <select
                            value={walletDisplayName}
                            onChange={e => handleUpdateParsedResult(index, 'account', e.target.value)}
                            className="w-full bg-[var(--card-bg)] px-3 py-2 rounded-lg border border-[var(--input-border)] text-xs text-[var(--input-text)] focus:outline-none focus:border-[var(--gold-primary)] font-semibold"
                          >
                            {filteredWallets.map(w => (
                              <option key={w.id} value={w.name}>{w.name} ({w.currency})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ) : (
                      <div className="pt-2 border-t border-[var(--border)] space-y-1 text-xs">
                        <div className="font-semibold text-[var(--text-secondary)] flex items-center gap-1.5 flex-wrap">
                          <span>{tx.category || 'Lainnya'}</span>
                          {tx.subcategory && (
                            <>
                              <span className="text-[var(--text-muted)]">•</span>
                              <span className="text-[var(--gold-primary)] font-bold">{tx.subcategory}</span>
                            </>
                          )}
                        </div>
                        <div className="font-medium text-[var(--text-muted)] text-[11px]">
                          {isExpense && `Dari: ${walletDisplayName}`}
                          {isIncome && `Ke: ${walletDisplayName}`}
                          {isTransfer && `${accountName} → ${walletDisplayName}`}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* FASE 3: Keterangan & Verification Guide */}
            <div className="bg-cyan-950/20 border border-cyan-500/20 rounded-2xl p-4 space-y-2 text-[11px] text-cyan-200/90">
              <div className="font-bold flex items-center gap-1.5 text-cyan-400">
                <Info className="w-4 h-4 text-cyan-400 shrink-0" />
                <span>ℹ️ Keterangan & Verifikasi AI</span>
              </div>
              <ul className="space-y-1 pl-5 list-disc text-[11px] text-[var(--text-secondary)]">
                <li>AI mendeteksi <strong>{parsedResults.length} transaksi</strong> dari input Anda.</li>
                <li>Periksa kembali kategori, jumlah nominal, akun dompet, dan tanggal sebelum disimpan ke kas.</li>
                <li>Anda dapat menggunakan tombol <strong>"Periksa & Edit"</strong> di atas jika ingin mengubah detail transaksi sebelum disimpan.</li>
              </ul>
            </div>

            {/* FASE 7: Save & Reset Actions */}
            <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
              <button
                onClick={handleConfirmSaveAll}
                className="flex-1 py-3.5 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-lg transition-all text-xs flex items-center justify-center gap-2 active:scale-95"
              >
                <CheckCircle2 className="w-4.5 h-4.5 stroke-[2.5]" />
                <span>+ Simpan Semua {parsedResults.length} Transaksi Ke {targetWalletName}</span>
              </button>
              <button
                onClick={() => { setParsedResults([]); setEditingIndex(null); }}
                className="py-3.5 px-5 bg-[var(--card-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl text-xs font-bold border border-[var(--border)] transition-all"
              >
                Ulangi
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};
