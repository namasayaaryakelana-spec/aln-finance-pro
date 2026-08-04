import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  RotateCcw,
  ShieldCheck,
  Activity,
  Layers,
  FileCode,
  UserCheck,
  Table,
  Eye
} from 'lucide-react';
import { ExportService } from '../../services/export';
import { StorageService } from '../../services/storage';

export const SettingsView: React.FC = () => {
  const { auditLogs, resetAllData, restoreData, addToast } = useFinance();
  const [activeTab, setActiveTab] = useState<'general' | 'erd' | 'backup' | 'audit'>('general');
  const [selectedRole, setSelectedRole] = useState<'owner' | 'manager' | 'user'>('owner');

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
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-bold">
            <SettingsIcon className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Pengaturan System & Database Kernel</h3>
            <p className="text-xs text-slate-400">ERD Diagram, Role Management, Audit Logs & Backup/Restore</p>
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-950 p-1.5 rounded-2xl border border-slate-800">
        {[
          { id: 'general', label: 'Umum & Role Preset', icon: UserCheck },
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
              className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* SUBTAB 1: GENERAL & ROLE PRESETS */}
      {activeTab === 'general' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <h4 className="text-sm font-extrabold text-white">Pilih Role Akses Pengguna</h4>

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
                className={`p-4 rounded-2xl border text-left transition-all ${
                  selectedRole === r.id
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <h5 className="font-bold text-xs mb-1 text-white">{r.title}</h5>
                <p className="text-[10px] leading-relaxed opacity-80">{r.desc}</p>
              </button>
            ))}
          </div>

          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
            <span className="font-bold text-white block">Sertifikasi Progressive Web App (PWA)</span>
            <p className="text-[11px] text-slate-400">
              ALN Finance Pro sepenuhnya mendukung standar PWA tingkat produksi: Standalone display, offline persistence, service worker caching, dan aman digunakan tanpa koneksi internet.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ERD DIAGRAM CANVAS */}
      {activeTab === 'erd' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h4 className="text-sm font-extrabold text-white">Skema Database Relasional (ERD)</h4>
              <p className="text-xs text-slate-400">Arsitektur Data ALN Finance Pro System Kernel</p>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/20 px-2.5 py-1 rounded-full border border-emerald-500/30">
              8 Core Entities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Entity 1: Wallets */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-emerald-500/30">
              <div className="font-bold text-emerald-400 border-b border-slate-800 pb-1 mb-2">
                📦 Table: WALLETS
              </div>
              <ul className="text-[10px] space-y-1 text-slate-300">
                <li>• id (PK, string)</li>
                <li>• name (string)</li>
                <li>• type (bank|ewallet|cash)</li>
                <li>• currency (IDR|USD...)</li>
                <li>• balance (number)</li>
                <li>• scope (personal|business)</li>
              </ul>
            </div>

            {/* Entity 2: Transactions */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-blue-500/30">
              <div className="font-bold text-blue-400 border-b border-slate-800 pb-1 mb-2">
                💳 Table: TRANSACTIONS
              </div>
              <ul className="text-[10px] space-y-1 text-slate-300">
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
            <div className="bg-slate-950 p-4 rounded-2xl border border-purple-500/30">
              <div className="font-bold text-purple-400 border-b border-slate-800 pb-1 mb-2">
                📄 Table: INVOICES
              </div>
              <ul className="text-[10px] space-y-1 text-slate-300">
                <li>• id (PK, string)</li>
                <li>• invoiceNumber (string)</li>
                <li>• clientName (string)</li>
                <li>• items (JSON Array)</li>
                <li>• totalAmount (number)</li>
                <li>• status (pending|paid)</li>
              </ul>
            </div>

            {/* Entity 4: AuditLogs */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-amber-500/30">
              <div className="font-bold text-amber-400 border-b border-slate-800 pb-1 mb-2">
                📜 Table: AUDIT_LOGS
              </div>
              <ul className="text-[10px] space-y-1 text-slate-300">
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
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-6">
          <h4 className="text-sm font-extrabold text-white">Manajemen Cadangan Data (Backup & Restore)</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                <Download className="w-4 h-4" />
                Unduh Cadangan JSON
              </div>
              <p className="text-[11px] text-slate-400">
                Simpan seluruh data dompet, transaksi, invoice, dan anggaran ke file lokal.
              </p>
              <button
                onClick={handleBackup}
                className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs rounded-xl transition-colors shadow-md"
              >
                Unduh File Backup JSON
              </button>
            </div>

            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center gap-2 text-blue-400 font-bold text-xs">
                <Upload className="w-4 h-4" />
                Restore Data dari File JSON
              </div>
              <p className="text-[11px] text-slate-400">
                Pulihkan data dari cadangan file JSON sebelumnya.
              </p>
              <label className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-extrabold text-xs rounded-xl transition-colors text-center block cursor-pointer border border-slate-700">
                Pilih File JSON Backup
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <button
              onClick={resetAllData}
              className="py-2.5 px-4 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-xl transition-colors"
            >
              Reset Seluruh Data Ke Kondisi Awal (Default)
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-slate-900/90 p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-4">
          <h4 className="text-sm font-extrabold text-white">Audit Log Activity Tracker</h4>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3 bg-slate-950 rounded-2xl border border-slate-800/80 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="text-emerald-400">[{log.module}]</span>
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">{log.description}</p>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">
                  {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
