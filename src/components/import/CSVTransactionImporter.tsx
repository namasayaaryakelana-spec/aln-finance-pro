import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useFinance } from '../../context/FinanceContext';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Copy,
  ChevronLeft,
  ChevronRight,
  Filter,
  Check,
  X,
  RefreshCw,
  Sparkles,
  ArrowRightLeft
} from 'lucide-react';
import { Transaction, Wallet } from '../../types';

export interface ParsedCSVRow {
  index: number;
  rawDate: string;
  rawTitle: string;
  rawAmount: string;
  rawCategory: string;
  rawSubcategory: string;
  rawWallet: string;
  rawType: string;

  // Normalized
  parsedDate: string;
  parsedTitle: string;
  parsedAmount: number;
  parsedType: 'income' | 'expense' | 'transfer';
  matchedCategoryId: string;
  matchedCategoryName: string;
  matchedSubcategory: string;
  matchedWalletId: string;
  matchedWalletName: string;

  // Transfer support
  matchedTargetWalletId?: string;
  matchedTargetWalletName?: string;

  // Status
  status: 'valid' | 'warning' | 'duplicate';
  warningMessage?: string;
  isDuplicateInFile?: boolean;
  isDuplicateExisting?: boolean;
}

export const CSVTransactionImporter: React.FC = () => {
  const { categories, wallets, transactions, addTransaction, addToast } = useFinance();

  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvFileName, setCsvFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<ParsedCSVRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'warning' | 'duplicate'>('all');
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [editingRowIndex, setEditingRowIndex] = useState<number | null>(null);

  // XLSX Sheet State
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [workbookObj, setWorkbookObj] = useState<XLSX.WorkBook | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  // --- CSV HELPER PARSERS ---
  const parseCSVText = (text: string): string[][] => {
    const lines = text.split(/\r\n|\n/);
    const result: string[][] = [];

    for (let line of lines) {
      line = line.trim();
      if (!line) continue;

      // Detect delimiter (, or ;)
      const commaCount = (line.match(/,/g) || []).length;
      const semiCount = (line.match(/;/g) || []).length;
      const delimiter = semiCount > commaCount ? ';' : ',';

      const row: string[] = [];
      let insideQuote = false;
      let entry = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          insideQuote = !insideQuote;
        } else if (char === delimiter && !insideQuote) {
          row.push(entry.trim().replace(/^["']|["']$/g, ''));
          entry = '';
        } else {
          entry += char;
        }
      }
      row.push(entry.trim().replace(/^["']|["']$/g, ''));
      result.push(row);
    }
    return result;
  };

  const normalizeAmount = (val: string): number => {
    if (!val) return 0;
    let cleaned = String(val).replace(/Rp|\s/gi, '');
    // Handle negative numbers or brackets e.g. (350.000)
    let isNegative = false;
    if (cleaned.startsWith('-') || (cleaned.startsWith('(') && cleaned.endsWith(')'))) {
      isNegative = true;
      cleaned = cleaned.replace(/[-()]/g, '');
    }

    // Indonesian format e.g. "350.000,00" or "350.000" vs US format "350,000.00"
    if (cleaned.includes('.') && cleaned.includes(',')) {
      if (cleaned.indexOf('.') < cleaned.indexOf(',')) {
        // e.g. 350.000,50 -> 350000.50
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      } else {
        // e.g. 350,000.50 -> 350000.50
        cleaned = cleaned.replace(/,/g, '');
      }
    } else if (cleaned.includes('.')) {
      // Could be "350.000" (Indonesian thousands) or "350.50" (decimal)
      const parts = cleaned.split('.');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        cleaned = cleaned.replace(/\./g, '');
      }
    } else if (cleaned.includes(',')) {
      // Could be "350,000" or "350,50"
      const parts = cleaned.split(',');
      if (parts.length > 2 || (parts.length === 2 && parts[1].length === 3)) {
        cleaned = cleaned.replace(/,/g, '');
      } else {
        cleaned = cleaned.replace(',', '.');
      }
    }

    const num = parseFloat(cleaned);
    const result = isNaN(num) ? 0 : num;
    return isNegative ? -result : result;
  };

  const normalizeDate = (val: string): string => {
    if (!val) return new Date().toISOString().split('T')[0];
    const clean = String(val).trim();

    // ISO format: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}/.test(clean)) {
      return clean.substring(0, 10);
    }

    // DD/MM/YYYY or DD-MM-YYYY
    const ddmmyyyy = clean.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
    if (ddmmyyyy) {
      const day = ddmmyyyy[1].padStart(2, '0');
      const month = ddmmyyyy[2].padStart(2, '0');
      const year = ddmmyyyy[3];
      return `${year}-${month}-${day}`;
    }

    // Try standard JS Date parse
    const parsedDate = new Date(clean);
    if (!isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }

    return new Date().toISOString().split('T')[0];
  };

  const findBestCategoryMatch = (catStr: string): { catName: string; subName: string } => {
    if (!catStr) return { catName: '', subName: '' };
    const query = String(catStr).toLowerCase().trim();

    // 1. Exact Category Name or Subcategory Name
    for (const cat of categories) {
      if (cat.name.toLowerCase() === query) {
        return { catName: cat.name, subName: '' };
      }
      if (Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          if (sub.toLowerCase() === query) {
            return { catName: cat.name, subName: sub };
          }
        }
      }
    }

    // 2. Partial Search Category Name or Subcategory Name
    for (const cat of categories) {
      if (cat.name.toLowerCase().includes(query) || query.includes(cat.name.toLowerCase())) {
        return { catName: cat.name, subName: '' };
      }
      if (Array.isArray(cat.subcategories)) {
        for (const sub of cat.subcategories) {
          if (sub.toLowerCase().includes(query) || query.includes(sub.toLowerCase())) {
            return { catName: cat.name, subName: sub };
          }
        }
      }
    }

    return { catName: '', subName: '' };
  };

  const findBestWalletMatch = (wStr: string): Wallet | null => {
    if (!wStr) return wallets[0] || null;
    const query = String(wStr).toLowerCase().trim();

    // Exact match
    const exact = wallets.find(w => w.name.toLowerCase() === query);
    if (exact) return exact;

    // Partial match (e.g. "BCA" matches "Bank BCA")
    const partial = wallets.find(w => w.name.toLowerCase().includes(query) || query.includes(w.name.toLowerCase()));
    if (partial) return partial;

    return null;
  };

  // --- FILE SELECTION & DUAL PARSING (CSV + XLSX) ---
  const handleFileSelection = (file: File) => {
    const isCsv = file.name.endsWith('.csv') || file.type === 'text/csv';
    const isXlsx = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.type.includes('spreadsheet') || file.type.includes('excel');

    if (!isCsv && !isXlsx) {
      addToast('error', 'Format Tidak Didukung', 'Gunakan file berformat CSV atau Excel (.xlsx).');
      return;
    }

    setCsvFile(file);
    setCsvFileName(file.name);
    setIsProcessing(true);

    if (isXlsx) {
      const reader = new FileReader();
      reader.onload = event => {
        try {
          const data = new Uint8Array(event.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array', cellDates: true });

          if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
            addToast('error', 'Workbook Kosong', 'File Excel tidak memiliki worksheet.');
            setIsProcessing(false);
            return;
          }

          setWorkbookObj(workbook);
          setSheets(workbook.SheetNames);
          const firstSheet = workbook.SheetNames[0];
          setSelectedSheet(firstSheet);
          processWorkbookSheet(workbook, firstSheet);
        } catch (err) {
          addToast('error', 'Gagal Membaca Excel', 'File Excel tidak dapat dibaca atau rusak.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      setSheets([]);
      setSelectedSheet('');
      setWorkbookObj(null);

      const reader = new FileReader();
      reader.onload = event => {
        try {
          const text = event.target?.result as string;
          const rows = parseCSVText(text);
          processMatrixRows(rows);
        } catch (err) {
          addToast('error', 'Gagal Membaca CSV', 'Terjadi kesalahan saat memproses file CSV.');
        } finally {
          setIsProcessing(false);
        }
      };
      reader.readAsText(file);
    }
  };

  const processWorkbookSheet = (wb: XLSX.WorkBook, sheetName: string) => {
    const worksheet = wb.Sheets[sheetName];
    if (!worksheet) {
      addToast('error', 'Sheet Kosong', 'Worksheet terpilih tidak memiliki data.');
      setParsedRows([]);
      return;
    }

    const rawJsonRows = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' });
    const stringMatrixRows = rawJsonRows.map(row => (Array.isArray(row) ? row.map(cell => String(cell ?? '')) : []));
    processMatrixRows(stringMatrixRows);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    if (workbookObj) {
      processWorkbookSheet(workbookObj, sheetName);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelection(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelection(file);
  };

  // --- SHARED MATRIX PROCESSOR ENGINE ---
  const processMatrixRows = (rows: string[][]) => {
    if (rows.length < 2) {
      addToast('error', 'File Kosong', 'File tidak memiliki data transaksi.');
      setParsedRows([]);
      return;
    }

    const header = rows[0].map(h => String(h).toLowerCase().trim());
    const dataRows = rows.slice(1);

    // Auto-detect Column Index Mapping
    let dateIdx = header.findIndex(h => /tanggal|date|tgl|time|created_at/.test(h));
    let titleIdx = header.findIndex(h => /deskripsi|description|keterangan|nama|title|uraian|catatan|memo/.test(h));
    let amountIdx = header.findIndex(h => /nominal|amount|jumlah|nilai|total/.test(h));
    let debitIdx = header.findIndex(h => /debit|pengeluaran_rp|keluar/.test(h));
    let creditIdx = header.findIndex(h => /credit|kredit|pemasukan_rp|masuk/.test(h));
    let categoryIdx = header.findIndex(h => /^kategori$|^category$/.test(h));
    let subcategoryIdx = header.findIndex(h => /sub\s*kategori|subcategory|sub_kategori|sub-kategori/.test(h));
    let walletIdx = header.findIndex(h => /dompet|wallet|rekening|account|akun|bank/.test(h));
    let dariIdx = header.findIndex(h => /^dari$|^from$|sumber_rek|source_wallet/.test(h));
    let keIdx = header.findIndex(h => /^ke$|^to$|tujuan_rek|target_wallet/.test(h));
    let typeIdx = header.findIndex(h => /jenis|type|tipe|transaksi|mode/.test(h));

    // Fallbacks if indices not matched
    if (dateIdx === -1) dateIdx = 0;
    if (titleIdx === -1) titleIdx = 1;

    const parsedResults: ParsedCSVRow[] = [];
    const seenMap = new Map<string, number>();

    dataRows.forEach((row, i) => {
      if (row.length === 0 || (row.length === 1 && !row[0])) return;

      const rawDate = row[dateIdx] || '';
      const rawTitle = row[titleIdx] || `Transaksi #${i + 1}`;
      const rawCategory = categoryIdx !== -1 ? row[categoryIdx] || '' : '';
      const rawSubcategory = subcategoryIdx !== -1 ? row[subcategoryIdx] || '' : '';
      const rawWallet = walletIdx !== -1 ? row[walletIdx] || '' : '';
      const rawDari = dariIdx !== -1 ? row[dariIdx] || '' : '';
      const rawKe = keIdx !== -1 ? row[keIdx] || '' : '';
      const rawType = typeIdx !== -1 ? row[typeIdx] || '' : '';

      // Determine amount & type
      let rawAmount = '';
      let parsedType: 'income' | 'expense' | 'transfer' = 'expense';
      const typeLower = rawType.toLowerCase().trim();

      if (typeLower.includes('pengeluaran') || typeLower.includes('expense') || typeLower.includes('keluar')) {
        parsedType = 'expense';
      } else if (typeLower.includes('pemasukan') || typeLower.includes('income') || typeLower.includes('masuk')) {
        parsedType = 'income';
      } else if (typeLower.includes('transfer')) {
        parsedType = 'transfer';
      } else if (debitIdx !== -1 || creditIdx !== -1) {
        const debitVal = debitIdx !== -1 ? normalizeAmount(row[debitIdx] || '') : 0;
        const creditVal = creditIdx !== -1 ? normalizeAmount(row[creditIdx] || '') : 0;

        if (creditVal > 0) {
          parsedType = 'income';
          rawAmount = String(creditVal);
        } else {
          parsedType = 'expense';
          rawAmount = String(debitVal || Math.abs(creditVal));
        }
      } else if (amountIdx !== -1) {
        rawAmount = row[amountIdx] || '0';
        const numAmount = normalizeAmount(rawAmount);
        if (numAmount < 0) {
          parsedType = 'expense';
          rawAmount = String(Math.abs(numAmount));
        }
      }

      if (!rawAmount && amountIdx !== -1) {
        rawAmount = row[amountIdx] || '0';
      }

      const parsedAmount = Math.abs(normalizeAmount(rawAmount));
      const parsedDate = normalizeDate(rawDate);

      // Wallet matching based on transaction type & DARI / KE context
      let matchedWallet: Wallet | null = null;
      let matchedTargetWallet: Wallet | null = null;

      if (parsedType === 'expense') {
        matchedWallet = findBestWalletMatch(rawDari || rawWallet || rawKe);
      } else if (parsedType === 'income') {
        matchedWallet = findBestWalletMatch(rawKe || rawWallet || rawDari);
      } else if (parsedType === 'transfer') {
        matchedWallet = findBestWalletMatch(rawDari || rawWallet);
        matchedTargetWallet = findBestWalletMatch(rawKe);
      }

      // Category & Subcategory matching (handles empty category with populated subcategory)
      let { catName, subName } = findBestCategoryMatch(rawCategory);
      if (!catName && rawSubcategory) {
        const inferred = findBestCategoryMatch(rawSubcategory);
        if (inferred.catName) {
          catName = inferred.catName;
          subName = inferred.subName || rawSubcategory;
        }
      }

      const matchedCategoryName = catName || (categories[0]?.name || 'Lainnya');
      const matchedCategoryId = categories.find(c => c.name === matchedCategoryName)?.id || '';
      const matchedSubcategory = subName || (subcategoryIdx !== -1 ? row[subcategoryIdx] : '');
      const matchedWalletName = matchedWallet?.name || (wallets[0]?.name || 'Kas Utama');
      const matchedWalletId = matchedWallet?.id || (wallets[0]?.id || 'w-cash');

      const matchedTargetWalletName = matchedTargetWallet?.name || '';
      const matchedTargetWalletId = matchedTargetWallet?.id || '';

      // Warning Checks
      const warnings: string[] = [];
      if (!rawCategory && !catName && !rawSubcategory) warnings.push('Kategori belum ditentukan');
      if (!matchedWallet && (rawWallet || rawDari || rawKe)) warnings.push('Dompet belum ditentukan');
      if (parsedType === 'transfer' && !matchedTargetWalletId && rawKe) warnings.push('Wallet tujuan belum ditentukan');
      if (parsedAmount <= 0) warnings.push('Nominal tidak valid');

      // Duplicate Check in File
      const duplicateKey = `${parsedDate}_${parsedAmount}_${parsedType}_${matchedWalletId}_${rawTitle.toLowerCase().trim()}`;
      let isDuplicateInFile = false;
      if (seenMap.has(duplicateKey)) {
        isDuplicateInFile = true;
        warnings.push('Duplikat dalam file');
      } else {
        seenMap.set(duplicateKey, i);
      }

      // Duplicate Check against Existing App Transactions
      const isDuplicateExisting = transactions.some(t =>
        t.date === parsedDate &&
        Math.abs(t.amount) === parsedAmount &&
        t.type === parsedType &&
        t.walletId === matchedWalletId &&
        t.title.toLowerCase().trim() === rawTitle.toLowerCase().trim()
      );

      if (isDuplicateExisting) {
        warnings.push('Kemungkinan duplikat dengan transaksi existing');
      }

      const isDuplicate = isDuplicateInFile || isDuplicateExisting;
      const status: 'valid' | 'warning' | 'duplicate' = isDuplicate
        ? 'duplicate'
        : warnings.length > 0
        ? 'warning'
        : 'valid';

      parsedResults.push({
        index: i,
        rawDate,
        rawTitle,
        rawAmount,
        rawCategory,
        rawSubcategory,
        rawWallet: rawDari || rawWallet || rawKe,
        rawType,
        parsedDate,
        parsedTitle: rawTitle,
        parsedAmount,
        parsedType,
        matchedCategoryId,
        matchedCategoryName,
        matchedSubcategory,
        matchedWalletId,
        matchedWalletName,
        matchedTargetWalletId,
        matchedTargetWalletName,
        status,
        warningMessage: warnings.join(', '),
        isDuplicateInFile,
        isDuplicateExisting
      });
    });

    setParsedRows(parsedResults);
    setCurrentPage(1);
    addToast('success', 'File CSV Terbaca', `${parsedResults.length} baris transaksi berhasil diurai.`);
  };

  // --- PREVIEW METRICS ---
  const summaryMetrics = useMemo(() => {
    const total = parsedRows.length;
    const valid = parsedRows.filter(r => r.status === 'valid').length;
    const warning = parsedRows.filter(r => r.status === 'warning').length;
    const duplicate = parsedRows.filter(r => r.status === 'duplicate').length;
    return { total, valid, warning, duplicate };
  }, [parsedRows]);

  const filteredRows = useMemo(() => {
    if (activeFilter === 'valid') return parsedRows.filter(r => r.status === 'valid');
    if (activeFilter === 'warning') return parsedRows.filter(r => r.status === 'warning');
    if (activeFilter === 'duplicate') return parsedRows.filter(r => r.status === 'duplicate');
    return parsedRows;
  }, [parsedRows, activeFilter]);

  const totalPages = Math.ceil(filteredRows.length / pageSize) || 1;
  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, currentPage]);

  // --- EDIT INLINE ROW DATA ---
  const handleUpdateRow = (index: number, updatedFields: Partial<ParsedCSVRow>) => {
    setParsedRows(prev => prev.map(row => {
      if (row.index !== index) return row;
      const updated = { ...row, ...updatedFields };

      // Re-evaluate status
      const warnings: string[] = [];
      if (!updated.matchedCategoryName) warnings.push('Kategori tidak ditemukan');
      if (!updated.matchedWalletId) warnings.push('Dompet tidak ditemukan');
      if (updated.parsedAmount <= 0) warnings.push('Nominal tidak valid');

      const isDup = updated.isDuplicateInFile || updated.isDuplicateExisting;
      updated.status = isDup ? 'duplicate' : warnings.length > 0 ? 'warning' : 'valid';
      updated.warningMessage = warnings.join(', ');
      return updated;
    }));
  };

  // --- CONFIRM & EXECUTE IMPORT ---
  const handleConfirmImport = () => {
    const rowsToImport = parsedRows.filter(r => {
      if (skipDuplicates && r.status === 'duplicate') return false;
      return true;
    });

    if (rowsToImport.length === 0) {
      addToast('warning', 'Tidak Ada Transaksi', 'Tidak ada transaksi valid yang siap diimpor.');
      return;
    }

    let successCount = 0;
    rowsToImport.forEach(r => {
      addTransaction({
        type: r.parsedType,
        amount: r.parsedAmount,
        currency: 'IDR',
        title: r.parsedTitle || 'Transaksi CSV',
        category: r.matchedCategoryName || 'Lainnya',
        subcategory: r.matchedSubcategory || undefined,
        walletId: r.matchedWalletId || (wallets[0]?.id || 'w-cash'),
        scope: 'personal',
        date: r.parsedDate,
        note: `Diimpor dari CSV (${csvFileName})`
      });
      successCount++;
    });

    const skippedCount = parsedRows.length - successCount;
    addToast('success', 'Import CSV Selesai', `Berhasil mengimpor ${successCount} transaksi ke ALN Finance Pro.`);
    if (skippedCount > 0) {
      addToast('info', 'Duplikat Dilewati', `${skippedCount} transaksi duplikat/dilewati.`);
    }

    // Reset state
    setCsvFile(null);
    setCsvFileName('');
    setParsedRows([]);
  };

  return (
    <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors text-[var(--text-primary)]">
      {/* Header Banner */}
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] font-bold">
            <FileText className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Import Transaksi CSV & Excel (.xlsx)</h4>
            <p className="text-xs text-[var(--text-secondary)]">Impor riwayat transaksi dari bank/excel (.csv / .xlsx) dengan validasi Master Data</p>
          </div>
        </div>
      </div>

      {/* File Upload Selector & Drag-and-Drop */}
      {!csvFile ? (
        <div
          onDragOver={e => e.preventDefault()}
          onDrop={handleDrop}
          className="p-8 border-2 border-dashed border-[var(--border)] hover:border-[var(--gold-primary)] rounded-3xl bg-[var(--input-bg)] text-center space-y-3 transition-colors cursor-pointer"
        >
          <Upload className="w-8 h-8 text-[var(--gold-primary)] mx-auto animate-bounce" />
          <div>
            <p className="text-xs font-bold text-[var(--text-primary)]">Tarik & lepaskan file atau pilih dari perangkat Anda</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-1">Mendukung format file <strong>.CSV</strong> dan <strong>.XLSX / .XLS</strong></p>
          </div>
          <label className="inline-block px-5 py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-md cursor-pointer transition-all active:scale-95">
            Pilih File CSV / Excel
            <input type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} className="hidden" />
          </label>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Summary Metrics, Sheet Selector & File Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-[var(--input-bg)] p-4 rounded-2xl border border-[var(--border)]">
            <div className="flex items-center gap-3 text-xs font-bold truncate">
              <FileText className="w-4 h-4 text-[var(--gold-primary)] shrink-0" />
              <span className="truncate">{csvFileName}</span>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">({parsedRows.length} rows)</span>

              {/* Sheet Selector Dropdown if Excel file with multiple sheets */}
              {sheets.length > 1 && (
                <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-[var(--border)]">
                  <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Sheet:</span>
                  <select
                    value={selectedSheet}
                    onChange={e => handleSheetChange(e.target.value)}
                    className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-[11px] font-bold text-[var(--text-primary)] cursor-pointer"
                  >
                    {sheets.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setCsvFile(null);
                setCsvFileName('');
                setParsedRows([]);
                setSheets([]);
                setSelectedSheet('');
                setWorkbookObj(null);
              }}
              className="text-xs font-bold text-red-400 hover:text-red-500 flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              Ganti File
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <button
              onClick={() => { setActiveFilter('all'); setCurrentPage(1); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeFilter === 'all'
                  ? 'bg-[var(--surface-secondary)] border-[var(--gold-primary)] shadow-md'
                  : 'bg-[var(--input-bg)] border-[var(--border)] opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold text-[var(--text-secondary)] uppercase block mb-1">Total Entri</span>
              <span className="text-base font-black text-[var(--text-primary)] font-mono">{summaryMetrics.total}</span>
            </button>

            <button
              onClick={() => { setActiveFilter('valid'); setCurrentPage(1); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeFilter === 'valid'
                  ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-500 shadow-md'
                  : 'bg-[var(--input-bg)] border-[var(--border)] text-emerald-500 opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold text-emerald-500 uppercase block mb-1">✓ Valid</span>
              <span className="text-base font-black font-mono">{summaryMetrics.valid}</span>
            </button>

            <button
              onClick={() => { setActiveFilter('warning'); setCurrentPage(1); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeFilter === 'warning'
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-500 shadow-md'
                  : 'bg-[var(--input-bg)] border-[var(--border)] text-amber-500 opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold text-amber-500 uppercase block mb-1">⚠️ Perlu Diperiksa</span>
              <span className="text-base font-black font-mono">{summaryMetrics.warning}</span>
            </button>

            <button
              onClick={() => { setActiveFilter('duplicate'); setCurrentPage(1); }}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                activeFilter === 'duplicate'
                  ? 'bg-blue-500/15 border-blue-500/40 text-blue-400 shadow-md'
                  : 'bg-[var(--input-bg)] border-[var(--border)] text-blue-400 opacity-80'
              }`}
            >
              <span className="text-[10px] font-bold text-blue-400 uppercase block mb-1">🔁 Duplikat</span>
              <span className="text-base font-black font-mono">{summaryMetrics.duplicate}</span>
            </button>
          </div>

          {/* Import Controls & Options */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <label className="flex items-center gap-2 text-xs font-bold text-[var(--text-secondary)] cursor-pointer">
              <input
                type="checkbox"
                checked={skipDuplicates}
                onChange={e => setSkipDuplicates(e.target.checked)}
                className="w-4 h-4 rounded text-[var(--gold-primary)] accent-[var(--gold-primary)] cursor-pointer"
              />
              <span>Lewati Transaksi Duplikat (Rekomendasi)</span>
            </label>

            <button
              type="button"
              onClick={handleConfirmImport}
              className="px-6 py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              Import Transaksi ({skipDuplicates ? parsedRows.length - summaryMetrics.duplicate : parsedRows.length})
            </button>
          </div>

          {/* Table Preview */}
          <div className="bg-[var(--input-bg)] rounded-3xl border border-[var(--border)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs min-w-[700px]">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-[var(--surface-secondary)] text-[10px] text-[var(--text-secondary)] font-extrabold uppercase tracking-wider">
                    <th className="p-3">Tanggal</th>
                    <th className="p-3">Deskripsi Transaksi</th>
                    <th className="p-3 text-center">Jenis</th>
                    <th className="p-3 text-right">Nominal</th>
                    <th className="p-3">Kategori & Subkategori</th>
                    <th className="p-3">Dompet (Dari / Ke)</th>
                    <th className="p-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-medium">
                  {paginatedRows.map(r => {
                    const isEditing = editingRowIndex === r.index;
                    const matchedCategoryObj = categories.find(c => c.id === r.matchedCategoryId || c.name === r.matchedCategoryName);
                    const subcatOptions = matchedCategoryObj?.subcategories || [];

                    return (
                      <tr key={r.index} className="hover:bg-[var(--card-bg)] transition-colors">
                        {/* Tanggal */}
                        <td className="p-3 font-mono text-[var(--text-secondary)] whitespace-nowrap">
                          {r.parsedDate}
                        </td>

                        {/* Deskripsi */}
                        <td className="p-3 font-bold text-[var(--text-primary)]">
                          {r.parsedTitle}
                        </td>

                        {/* Jenis Transaksi */}
                        <td className="p-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                            r.parsedType === 'income'
                              ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                              : r.parsedType === 'transfer'
                              ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                              : 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                          }`}>
                            {r.parsedType === 'income' ? 'Pemasukan' : r.parsedType === 'transfer' ? 'Transfer' : 'Pengeluaran'}
                          </span>
                        </td>

                        {/* Nominal */}
                        <td className="p-3 text-right font-black font-mono whitespace-nowrap">
                          <span className={r.parsedType === 'income' ? 'text-emerald-500' : 'text-[var(--text-primary)]'}>
                            {r.parsedType === 'income' ? '+' : '-'} Rp {r.parsedAmount.toLocaleString('id-ID')}
                          </span>
                        </td>

                        {/* Kategori & Subkategori (Master Data Dropdowns) */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <select
                              value={r.matchedCategoryName}
                              onChange={e => {
                                const newCatName = e.target.value;
                                const newCat = categories.find(c => c.name === newCatName);
                                handleUpdateRow(r.index, {
                                  matchedCategoryName: newCatName,
                                  matchedCategoryId: newCat?.id || '',
                                  matchedSubcategory: ''
                                });
                              }}
                              className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-[11px] font-bold text-[var(--text-primary)]"
                            >
                              <option value="">-- Pilih Kategori --</option>
                              {categories.map(c => (
                                <option key={c.id} value={c.name}>{c.name}</option>
                              ))}
                            </select>

                            {subcatOptions.length > 0 && (
                              <select
                                value={r.matchedSubcategory || ''}
                                onChange={e => handleUpdateRow(r.index, { matchedSubcategory: e.target.value })}
                                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-[10px] text-[var(--text-secondary)]"
                              >
                                <option value="">-- Subkategori (Opsional) --</option>
                                {subcatOptions.map(s => (
                                  <option key={s} value={s}>{s}</option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>

                        {/* Wallet (Master Data Dropdown Context-Aware) */}
                        <td className="p-3">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-primary)]">
                              <span className="text-[10px] text-[var(--text-secondary)] font-semibold">
                                {r.parsedType === 'income' ? 'Ke:' : r.parsedType === 'transfer' ? 'Dari:' : 'Dari:'}
                              </span>
                              <select
                                value={r.matchedWalletId}
                                onChange={e => {
                                  const wId = e.target.value;
                                  const wObj = wallets.find(w => w.id === wId);
                                  handleUpdateRow(r.index, {
                                    matchedWalletId: wId,
                                    matchedWalletName: wObj?.name || ''
                                  });
                                }}
                                className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-[11px] font-bold text-[var(--text-primary)]"
                              >
                                {wallets.map(w => (
                                  <option key={w.id} value={w.id}>{w.name}</option>
                                ))}
                              </select>
                            </div>

                            {r.parsedType === 'transfer' && (
                              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-400">
                                <span className="text-[10px] text-[var(--text-secondary)] font-semibold">Ke:</span>
                                <select
                                  value={r.matchedTargetWalletId || ''}
                                  onChange={e => {
                                    const wId = e.target.value;
                                    const wObj = wallets.find(w => w.id === wId);
                                    handleUpdateRow(r.index, {
                                      matchedTargetWalletId: wId,
                                      matchedTargetWalletName: wObj?.name || ''
                                    });
                                  }}
                                  className="bg-[var(--card-bg)] border border-[var(--border)] rounded-xl px-2 py-1 text-[11px] font-bold text-[var(--text-primary)]"
                                >
                                  <option value="">-- Wallet Tujuan --</option>
                                  {wallets.map(w => (
                                    <option key={w.id} value={w.id}>{w.name}</option>
                                  ))}
                                </select>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="p-3 text-center whitespace-nowrap">
                          {r.status === 'valid' && (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 text-[10px] font-extrabold uppercase">
                              ✓ Valid
                            </span>
                          )}
                          {r.status === 'warning' && (
                            <span className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30 text-[10px] font-extrabold uppercase" title={r.warningMessage}>
                              ⚠️ {r.warningMessage || 'Perlu Diperiksa'}
                            </span>
                          )}
                          {r.status === 'duplicate' && (
                            <span className="px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 text-[10px] font-extrabold uppercase" title={r.warningMessage}>
                              🔁 Duplikat
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-3.5 border-t border-[var(--border)] flex items-center justify-between text-xs bg-[var(--surface-secondary)]">
                <span className="text-[var(--text-secondary)] font-medium">
                  Menampilkan {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, filteredRows.length)} dari {filteredRows.length} entri
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="px-3 py-1 font-bold text-[var(--text-primary)] font-mono">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-xl border border-[var(--border)] bg-[var(--card-bg)] text-[var(--text-primary)] disabled:opacity-40 cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
