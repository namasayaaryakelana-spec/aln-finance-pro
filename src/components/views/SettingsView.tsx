import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Activity,
  UserCheck,
  Table,
  Sun,
  ShieldCheck,
  CloudCheck,
  CloudDownload,
  CloudUpload,
  RefreshCw,
  RefreshCcw
} from 'lucide-react';
import { ExportService } from '../../services/export';
import { StorageService } from '../../services/storage';
import { ThemeToggle } from '../layout/ThemeToggle';

export const SettingsView: React.FC = () => {
  const { auditLogs, resetAllData, restoreData, addToast, isOnline, pullCloudData, pushCloudData } = useFinance();
  const [activeTab, setActiveTab] = useState<'general' | 'sync' | 'erd' | 'backup' | 'audit'>('general');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager' | 'user'>('owner');
  const [showUploadConfirmModal, setShowUploadConfirmModal] = useState(false);

  const handleBackup = () => {
    const backupObj = StorageService.exportFullBackup();
    ExportService.exportJSON(backupObj, `ALN_Finance_Backup_${new Date().toISOString().split('T')[0]}.json`);
    addToast('success', 'Backup Berhasil', 'File JSON backup database telah diunduh.');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      try {
        const json = JSON.parse(event.target?.result as string);
        restoreData(json);
      } catch (err) {
        addToast('error', 'Format File Salah', 'File JSON tidak valid.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex items-center justify-between transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] font-bold">
            <SettingsIcon className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">System Settings & Config DB</h3>
            <p className="text-xs text-[var(--text-secondary)]">Sinkronisasi Cloud, ERD Diagram, Theme System, Role Management, Audit Logs & Backup</p>
          </div>
        </div>

        {/* Supabase Status Indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] text-xs font-bold">
          <span className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
          <span className="text-[var(--text-primary)] font-mono">
            {isOnline ? '● Cloud Connected' : '● Offline Mode'}
          </span>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-[var(--input-bg)] p-2 rounded-3xl border border-[var(--border)]">
        {[
          { id: 'general', label: 'Umum & Theme OS', icon: UserCheck },
          { id: 'sync', label: 'Sinkronisasi & Data', icon: CloudCheck },
          { id: 'erd', label: 'ERD Database Canvas', icon: Table },
          { id: 'backup', label: 'Backup & Restore', icon: Database },
          { id: 'audit', label: 'Audit Log Activity', icon: Activity }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2.5 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-md font-extrabold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: GENERAL & ROLE PRESETS */}
      {activeTab === 'general' && (
        <div className="space-y-6">
          {/* Dual Theme Selector Section */}
          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-3 transition-colors">
            <div className="flex items-center gap-2 text-[var(--gold-primary)] font-extrabold text-sm font-['Plus_Jakarta_Sans',sans-serif]">
              <Sun className="w-4 h-4" />
              <h4>Mode Tampilan Visual (Dual Theme OS)</h4>
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Pilih mode tampilan <strong>Dark (Premium Private Banking)</strong> atau <strong>Light (Clean Executive Banking)</strong>, atau ikuti preferensi sistem perangkat Anda.
            </p>
            <div className="max-w-md pt-1">
              <ThemeToggle variant="buttons" />
            </div>
          </div>

          <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
            <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Pilih Role Akses Pengguna</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'owner',
                  title: 'Pemilik Bisnis (Owner)',
                  desc: 'Akses penuh ke laporan eksekutif, P&L, Neraca, Invoice & Pengaturan.'
                },
                {
                  id: 'manager',
                  title: 'Manajer Keuangan (Finance Manager)',
                  desc: 'Akses pencatatan transaksi, budgeting, transfer & audit logs.'
                },
                {
                  id: 'user',
                  title: 'Pengguna Pribadi (Personal)',
                  desc: 'Fokus pada manajemen dompet harian & tabungan pribadi.'
                }
              ].map(r => (
                <button
                  key={r.id}
                  onClick={() => setSelectedRole(r.id as any)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    selectedRole === r.id
                      ? 'bg-[var(--gold-badge-bg)] border-[var(--gold-badge-border)] text-[var(--text-primary)] font-extrabold shadow-md'
                      : 'bg-[var(--input-bg)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--gold-primary)]'
                  }`}
                >
                  <h5 className="font-bold text-xs mb-1 text-[var(--text-primary)]">{r.title}</h5>
                  <p className="text-[10px] leading-relaxed opacity-80">{r.desc}</p>
                </button>
              ))}
            </div>

            <div className="p-4.5 rounded-2xl bg-[var(--input-bg)] border border-[var(--border)] space-y-2 text-xs">
              <span className="font-bold text-[var(--text-primary)] block font-['Plus_Jakarta_Sans',sans-serif]">Sertifikasi Progressive Web App (PWA)</span>
              <p className="text-[11px] text-[var(--text-secondary)]">
                ALN Finance Pro fully supports production-grade PWA standards: Standalone display, offline persistence, service worker caching, and secure operation without internet connection.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ERD DIAGRAM CANVAS */}
      {activeTab === 'erd' && (
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-4 transition-colors">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
            <div>
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Skema Database Relasional (ERD)</h4>
              <p className="text-xs text-[var(--text-secondary)]">Arsitektur Data ALN Finance Pro System Kernel</p>
            </div>
            <span className="text-[10px] font-mono text-[var(--gold-primary)] font-extrabold bg-[var(--gold-badge-bg)] px-3 py-1 rounded-full border border-[var(--gold-badge-border)]">
              8 Core Entities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Entity 1: Wallets */}
            <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--gold-badge-border)]">
              <div className="font-bold text-[var(--gold-primary)] border-b border-[var(--border)] pb-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                📦 Table: WALLETS
              </div>
              <ul className="text-[10px] space-y-1 text-[var(--text-secondary)]">
                <li>• id (PK, string)</li>
                <li>• name (string)</li>
                <li>• type (bank|ewallet|cash)</li>
                <li>• currency (IDR|USD...)</li>
                <li>• balance (number)</li>
                <li>• scope (personal|business)</li>
              </ul>
            </div>

            {/* Entity 2: Transactions */}
            <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-emerald-500/30">
              <div className="font-bold text-emerald-500 border-b border-[var(--border)] pb-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                💳 Table: TRANSACTIONS
              </div>
              <ul className="text-[10px] space-y-1 text-[var(--text-secondary)]">
                <li>• id (PK, string)</li>
                <li>• walletId (FK &gt; WALLETS)</li>
                <li>• type (income|expense)</li>
                <li>• amount (number)</li>
                <li>• category (string)</li>
                <li>• scope (personal|business)</li>
                <li>• date (string)</li>
              </ul>
            </div>

            {/* Entity 3: Invoices */}
            <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--gold-badge-border)]">
              <div className="font-bold text-[var(--gold-primary)] border-b border-[var(--border)] pb-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                📄 Table: INVOICES
              </div>
              <ul className="text-[10px] space-y-1 text-[var(--text-secondary)]">
                <li>• id (PK, string)</li>
                <li>• invoiceNumber (string)</li>
                <li>• clientName (string)</li>
                <li>• items (JSON Array)</li>
                <li>• totalAmount (number)</li>
                <li>• status (pending|paid)</li>
              </ul>
            </div>

            {/* Entity 4: AuditLogs */}
            <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)]">
              <div className="font-bold text-[var(--text-primary)] border-b border-[var(--border)] pb-1.5 mb-2 font-['Plus_Jakarta_Sans',sans-serif]">
                📜 Table: AUDIT_LOGS
              </div>
              <ul className="text-[10px] space-y-1 text-[var(--text-secondary)]">
                <li>• id (PK, string)</li>
                <li>• action (string)</li>
                <li>• module (string)</li>
                <li>• description (string)</li>
                <li>• timestamp (ISO String)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 3: BACKUP & RESTORE */}
      {activeTab === 'backup' && (
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
          <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Manajemen Cadangan Data (Backup & Restore)</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 text-emerald-500 font-bold text-xs">
                <Download className="w-4 h-4 text-emerald-500" />
                Unduh Cadangan JSON
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Simpan seluruh data dompet, transaksi, invoice, dan anggaran ke file lokal.
              </p>
              <button
                onClick={handleBackup}
                className="w-full py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
              >
                Unduh File Backup JSON
              </button>
            </div>

            <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--border)] space-y-3">
              <div className="flex items-center gap-2 text-[var(--gold-primary)] font-bold text-xs">
                <Upload className="w-4 h-4 text-[var(--gold-primary)]" />
                Restore Data dari File JSON
              </div>
              <p className="text-[11px] text-[var(--text-secondary)]">
                Pulihkan data dari cadangan file JSON sebelumnya.
              </p>
              <label className="w-full py-2.5 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-primary)] font-extrabold text-xs rounded-2xl transition-colors text-center block cursor-pointer border border-[var(--border)]">
                Pilih File JSON Backup
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            <button
              onClick={resetAllData}
              className="py-2.5 px-4 bg-red-500/15 hover:bg-red-500/25 text-red-500 border border-red-500/30 text-xs font-bold rounded-2xl transition-colors"
            >
              Reset Seluruh Data Ke Kondisi Awal (Default)
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 2: SINKRONISASI & DATA */}
      {activeTab === 'sync' && (
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-6 transition-colors">
          <div className="flex items-center justify-between border-b border-[var(--border)] pb-3.5">
            <div>
              <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Pengaturan Sinkronisasi & Data Cloud</h4>
              <p className="text-xs text-[var(--text-secondary)]">Manajemen integrasi data antara Perangkat Lokal & Supabase Cloud</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-500 font-extrabold bg-emerald-500/15 px-3 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1">
              <CloudCheck className="w-3.5 h-3.5" />
              Smart Auto-Sync Active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Action 1: Perbarui Data (Cloud -> Perangkat) */}
            <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-[var(--border)] space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[var(--gold-primary)] font-bold text-xs">
                  <CloudDownload className="w-4.5 h-4.5 text-[var(--gold-primary)]" />
                  <span>🔄 PERBARUI DATA</span>
                </div>
                <p className="text-[11px] text-[var(--text-primary)] font-bold">Cloud ➔ Perangkat</p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Ambil data terbaru dari Cloud ke perangkat ini. Data lokal Anda akan diperbarui dengan data Supabase terbaru.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await pullCloudData(true);
                }}
                className="w-full py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <RefreshCw className="w-4 h-4" />
                Perbarui Data Sekarang
              </button>
            </div>

            {/* Action 2: Unggah Data ke Cloud (Perangkat -> Cloud) */}
            <div className="bg-[var(--input-bg)] p-5 rounded-2xl border border-amber-500/30 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-amber-500 font-bold text-xs">
                  <CloudUpload className="w-4.5 h-4.5 text-amber-500" />
                  <span>☁️ UNGGAH DATA KE CLOUD</span>
                </div>
                <p className="text-[11px] text-[var(--text-primary)] font-bold">Perangkat ➔ Cloud</p>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  Kirim data dari perangkat ini ke Cloud. Memperbarui data yang tersimpan di Supabase PostgreSQL dengan data lokal saat ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowUploadConfirmModal(true)}
                className="w-full py-2.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-500 border border-amber-500/30 font-extrabold text-xs rounded-2xl transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <CloudUpload className="w-4 h-4" />
                Unggah Data ke Cloud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl space-y-4 transition-colors">
          <h4 className="text-sm font-extrabold text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Audit Log Activity Tracker</h4>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                    <span className="text-[var(--gold-primary)]">[{log.module}]</span>
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">{log.description}</p>
                </div>
                <span className="text-[10px] text-[var(--text-muted)] font-mono">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL FOR MANUAL UPLOAD */}
      {showUploadConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-fade-in text-[var(--text-primary)]">
            <div className="flex items-center gap-3 text-amber-500 font-extrabold text-base border-b border-[var(--border)] pb-3">
              <CloudUpload className="w-6 h-6 text-amber-500" />
              <h3>Unggah Data ke Cloud?</h3>
            </div>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed font-medium">
              Data lokal pada perangkat ini akan dikirim ke Cloud dan dapat memperbarui data yang tersimpan di Supabase. Pastikan data lokal sudah benar sebelum melanjutkan.
            </p>
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border)]">
              <button
                type="button"
                onClick={() => setShowUploadConfirmModal(false)}
                className="px-4 py-2 bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold text-xs rounded-2xl cursor-pointer hover:bg-[var(--border)] transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={async () => {
                  setShowUploadConfirmModal(false);
                  await pushCloudData();
                }}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-2xl cursor-pointer transition-all shadow-md active:scale-95 flex items-center gap-1.5"
              >
                <CloudUpload className="w-4 h-4" />
                Ya, Unggah Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
