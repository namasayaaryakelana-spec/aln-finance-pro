import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  FileText,
  Plus,
  Printer,
  Pencil,
  Trash2,
  Building2,
  AlertTriangle
} from 'lucide-react';
import { ExportService } from '../../services/export';
import { Invoice } from '../../types';

interface BusinessToolsViewProps {
  openAddInvoiceModal: () => void;
  openEditInvoiceModal: (invoice: Invoice) => void;
}

export const BusinessToolsView: React.FC<BusinessToolsViewProps> = ({
  openAddInvoiceModal,
  openEditInvoiceModal
}) => {
  const { invoices, updateInvoiceStatus, deleteInvoice } = useFinance();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
  const [deletingInvoice, setDeletingInvoice] = useState<Invoice | null>(null);

  const filteredInvoices = invoices.filter(
    inv => filterStatus === 'all' || inv.status === filterStatus
  );

  const handlePrint = (invoice: Invoice) => {
    ExportService.printInvoiceHTML(invoice);
  };

  const handleDeleteConfirm = () => {
    if (deletingInvoice) {
      deleteInvoice(deletingInvoice.id);
      setDeletingInvoice(null);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Banner */}
      <div className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] flex items-center justify-center text-[var(--gold-primary)] font-bold">
            <FileText className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">Invoice Generator & Business Tools</h3>
            <p className="text-xs text-[var(--text-secondary)]">Penerbitan Tagihan Profesional Klien & Custom Perusahaan (Business OS)</p>
          </div>
        </div>

        <button
          onClick={openAddInvoiceModal}
          className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Buat Invoice Baru
        </button>
      </div>

      {/* Filter Status Bar */}
      <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Semua Invoice' },
          { id: 'pending', label: 'Menunggu Pembayaran' },
          { id: 'paid', label: 'Lunas (Paid)' },
          { id: 'overdue', label: 'Jatuh Tempo (Overdue)' }
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setFilterStatus(st.id as any)}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all shrink-0 ${
              filterStatus === st.id
                ? 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)] shadow-md font-extrabold'
                : 'bg-[var(--card-bg)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--card-border)]'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredInvoices.map(inv => (
          <div
            key={inv.id}
            className="bg-[var(--card-bg)] p-6 rounded-3xl border border-[var(--card-border)] shadow-2xl flex flex-col justify-between space-y-4 transition-colors"
          >
            <div>
              <div className="flex items-start justify-between border-b border-[var(--border)] pb-3.5">
                <div>
                  <span className="text-[10px] font-mono text-[var(--gold-primary)] font-extrabold uppercase">
                    {inv.invoiceNumber}
                  </span>
                  <h4 className="text-sm font-extrabold text-[var(--text-primary)] mt-0.5 font-['Plus_Jakarta_Sans',sans-serif]">{inv.clientName}</h4>
                  <p className="text-[11px] text-[var(--text-secondary)]">{inv.clientEmail}</p>

                  <div className="mt-2 text-[10px] text-[var(--gold-primary)] bg-[var(--gold-badge-bg)] border border-[var(--gold-badge-border)] px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1 font-semibold">
                    <Building2 className="w-3 h-3 text-[var(--gold-primary)]" />
                    <span>Penerbit: <strong>{inv.companyName || 'ALN Digital Technology'}</strong></span>
                  </div>
                </div>

                <select
                  value={inv.status}
                  onChange={e => updateInvoiceStatus(inv.id, e.target.value as any)}
                  className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-2xl border focus:outline-none cursor-pointer ${
                    inv.status === 'paid'
                      ? 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30'
                      : inv.status === 'overdue'
                      ? 'bg-red-500/15 text-red-500 border-red-500/30'
                      : 'bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border-[var(--gold-badge-border)]'
                  }`}
                >
                  <option value="pending" className="bg-[var(--card-bg)] text-[var(--gold-primary)]">
                    PENDING
                  </option>
                  <option value="paid" className="bg-[var(--card-bg)] text-emerald-500">
                    PAID (LUNAS)
                  </option>
                  <option value="overdue" className="bg-[var(--card-bg)] text-red-500">
                    OVERDUE
                  </option>
                </select>
              </div>

              {/* Items preview */}
              <div className="space-y-2 py-3 border-b border-[var(--border)]">
                {inv.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[var(--text-secondary)] font-medium">
                      {item.description} ({item.quantity}x)
                    </span>
                    <span className="text-[var(--text-primary)] font-bold font-mono">
                      Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between items-center text-xs">
                <span className="text-[var(--text-secondary)]">Jatuh Tempo: <strong className="text-[var(--text-primary)] font-mono">{inv.dueDate}</strong></span>
                <div className="text-right">
                  <span className="text-[10px] text-[var(--text-muted)] block font-bold uppercase tracking-wider">Total Invoice:</span>
                  <span className="text-base font-black text-[var(--gold-primary)] font-mono">
                    Rp {inv.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[var(--border)]">
              <button
                onClick={() => handlePrint(inv)}
                className="flex-1 py-2 bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-[var(--border)]"
              >
                <Printer className="w-3.5 h-3.5 text-[var(--gold-primary)]" />
                Cetak PDF
              </button>
              <button
                onClick={() => openEditInvoiceModal(inv)}
                title="Edit Invoice"
                className="p-2 bg-[var(--input-bg)] hover:bg-[var(--border)] text-[var(--gold-primary)] font-bold text-xs rounded-2xl transition-colors border border-[var(--border)]"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingInvoice(inv)}
                title="Hapus Invoice"
                className="p-2 bg-[var(--input-bg)] hover:bg-red-500/10 text-[var(--text-muted)] hover:text-red-500 font-bold text-xs rounded-2xl transition-colors border border-[var(--border)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Delete Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[var(--card-bg)] border border-red-500/30 w-full max-w-sm rounded-3xl p-6 text-[var(--text-primary)] shadow-2xl space-y-4 animate-fade-in transition-colors">
            <div className="w-12 h-12 rounded-2xl bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-500 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-[var(--text-primary)]">Hapus Invoice?</h3>
              <p className="text-xs text-[var(--text-secondary)]">
                Apakah Anda yakin ingin menghapus invoice <strong className="text-[var(--text-primary)]">{deletingInvoice.invoiceNumber}</strong> ({deletingInvoice.clientName})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-95"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setDeletingInvoice(null)}
                className="py-2.5 px-4 bg-[var(--surface-secondary)] text-[var(--text-secondary)] font-bold text-xs rounded-2xl hover:bg-[var(--border)]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
