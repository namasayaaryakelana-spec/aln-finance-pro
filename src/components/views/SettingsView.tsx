import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  Settings as SettingsIcon,
  Database,
  Download,
  Upload,
  Activity,
  UserCheck,
  Table
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
      <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#F6D365] font-bold">
            <SettingsIcon className="w-5 h-5 text-[#F6D365]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Pengaturan System & Database Kernel</h3>
            <p className="text-xs text-[#7C8799]">ERD Diagram, Role Management, Audit Logs & Backup/Restore</p>
          </div>
        </div>
      </div>

      {/* Subtabs Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#0B1220] p-2 rounded-3xl border border-[rgba(255,255,255,0.08)]">
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
              className={`py-2.5 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                isActive
                  ? 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-md font-extrabold'
                  : 'text-[#7C8799] hover:text-[#BFC8D6]'
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
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
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
                className={`p-5 rounded-2xl border text-left transition-all ${
                  selectedRole === r.id
                    ? 'bg-[rgba(212,175,55,0.15)] border-[rgba(212,175,55,0.35)] text-white'
                    : 'bg-[#0B1220] border-[rgba(255,255,255,0.08)] text-[#7C8799] hover:border-[rgba(255,255,255,0.15)]'
                }`}
              >
                <h5 className="font-bold text-xs mb-1 text-white">{r.title}</h5>
                <p className="text-[10px] leading-relaxed opacity-80">{r.desc}</p>
              </button>
            ))}
          </div>

          <div className="p-4.5 rounded-2xl bg-[#0B1220] border border-[rgba(255,255,255,0.08)] space-y-2 text-xs">
            <span className="font-bold text-white block">Sertifikasi Progressive Web App (PWA)</span>
            <p className="text-[11px] text-[#7C8799]">
              ALN Finance Pro fully supports production-grade PWA standards: Standalone display, offline persistence, service worker caching, and secure operation without internet connection.
            </p>
          </div>
        </div>
      )}

      {/* SUBTAB 2: ERD DIAGRAM CANVAS */}
      {activeTab === 'erd' && (
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.08)] pb-3.5">
            <div>
              <h4 className="text-sm font-extrabold text-white">Skema Database Relasional (ERD)</h4>
              <p className="text-xs text-[#7C8799]">Arsitektur Data ALN Finance Pro System Kernel</p>
            </div>
            <span className="text-[10px] font-mono text-[#F6D365] font-extrabold bg-[rgba(212,175,55,0.12)] px-3 py-1 rounded-full border border-[rgba(212,175,55,0.25)]">
              8 Core Entities
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
            {/* Entity 1: Wallets */}
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(212,175,55,0.25)]">
              <div className="font-bold text-[#F6D365] border-b border-[rgba(255,255,255,0.08)] pb-1.5 mb-2">
                📦 Table: WALLETS
              </div>
              <ul className="text-[10px] space-y-1 text-[#BFC8D6]">
                <li>• id (PK, string)</li>
                <li>• name (string)</li>
                <li>• type (bank|ewallet|cash)</li>
                <li>• currency (IDR|USD...)</li>
                <li>• balance (number)</li>
                <li>• scope (personal|business)</li>
              </ul>
            </div>

            {/* Entity 2: Transactions */}
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(34,197,94,0.25)]">
              <div className="font-bold text-[#22C55E] border-b border-[rgba(255,255,255,0.08)] pb-1.5 mb-2">
                💳 Table: TRANSACTIONS
              </div>
              <ul className="text-[10px] space-y-1 text-[#BFC8D6]">
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
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(212,175,55,0.25)]">
              <div className="font-bold text-[#F6D365] border-b border-[rgba(255,255,255,0.08)] pb-1.5 mb-2">
                📄 Table: INVOICES
              </div>
              <ul className="text-[10px] space-y-1 text-[#BFC8D6]">
                <li>• id (PK, string)</li>
                <li>• invoiceNumber (string)</li>
                <li>• clientName (string)</li>
                <li>• items (JSON Array)</li>
                <li>• totalAmount (number)</li>
                <li>• status (pending|paid)</li>
              </ul>
            </div>

            {/* Entity 4: AuditLogs */}
            <div className="bg-[#0B1220] p-4.5 rounded-2xl border border-[rgba(255,255,255,0.12)]">
              <div className="font-bold text-[#BFC8D6] border-b border-[rgba(255,255,255,0.08)] pb-1.5 mb-2">
                📜 Table: AUDIT_LOGS
              </div>
              <ul className="text-[10px] space-y-1 text-[#BFC8D6]">
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
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-6">
          <h4 className="text-sm font-extrabold text-white">Manajemen Cadangan Data (Backup & Restore)</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0B1220] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex items-center gap-2 text-[#22C55E] font-bold text-xs">
                <Download className="w-4 h-4 text-[#22C55E]" />
                Unduh Cadangan JSON
              </div>
              <p className="text-[11px] text-[#7C8799]">
                Simpan seluruh data dompet, transaksi, invoice, dan anggaran ke file lokal.
              </p>
              <button
                onClick={handleBackup}
                className="w-full py-2.5 btn-gold text-[#0B1220] font-extrabold text-xs rounded-2xl shadow-md transition-all"
              >
                Unduh File Backup JSON
              </button>
            </div>

            <div className="bg-[#0B1220] p-5 rounded-2xl border border-[rgba(255,255,255,0.08)] space-y-3">
              <div className="flex items-center gap-2 text-[#F6D365] font-bold text-xs">
                <Upload className="w-4 h-4 text-[#F6D365]" />
                Restore Data dari File JSON
              </div>
              <p className="text-[11px] text-[#7C8799]">
                Pulihkan data dari cadangan file JSON sebelumnya.
              </p>
              <label className="w-full py-2.5 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] font-extrabold text-xs rounded-2xl transition-colors text-center block cursor-pointer border border-[rgba(255,255,255,0.08)]">
                Pilih File JSON Backup
                <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-[rgba(255,255,255,0.08)]">
            <button
              onClick={resetAllData}
              className="py-2.5 px-4 bg-[rgba(239,68,68,0.15)] hover:bg-[rgba(239,68,68,0.25)] text-[#EF4444] border border-[rgba(239,68,68,0.3)] text-xs font-bold rounded-2xl transition-colors"
            >
              Reset Seluruh Data Ke Kondisi Awal (Default)
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB 4: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl space-y-4">
          <h4 className="text-sm font-extrabold text-white">Audit Log Activity Tracker</h4>

          <div className="space-y-2">
            {auditLogs.map(log => (
              <div key={log.id} className="p-3.5 bg-[#0B1220] rounded-2xl border border-[rgba(255,255,255,0.08)] flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2 font-bold text-white">
                    <span className="text-[#F6D365]">[{log.module}]</span>
                    <span>{log.action}</span>
                  </div>
                  <p className="text-[11px] text-[#7C8799] mt-0.5">{log.description}</p>
                </div>
                <span className="text-[10px] text-[#7C8799] font-mono">
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
