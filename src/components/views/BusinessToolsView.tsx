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
      <div className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Invoice Generator & Business Tools</h3>
            <p className="text-xs text-slate-400">Penerbitan Tagihan Profesional Klien & Custom Perusahaan</p>
          </div>
        </div>

        <button
          onClick={openAddInvoiceModal}
          className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/40"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          Buat Invoice Baru
        </button>
      </div>

      {/* Filter Status Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'all', label: 'Semua Invoice' },
          { id: 'pending', label: 'Menunggu Pembayaran' },
          { id: 'paid', label: 'Lunas (Paid)' },
          { id: 'overdue', label: 'Jatuh Tempo (Overdue)' }
        ].map(st => (
          <button
            key={st.id}
            onClick={() => setFilterStatus(st.id as any)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
              filterStatus === st.id
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            {st.label}
          </button>
        ))}
      </div>

      {/* Invoice List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredInvoices.map(inv => (
          <div
            key={inv.id}
            className="bg-slate-900/90 p-5 rounded-3xl border border-slate-800/80 shadow-xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between border-b border-slate-800 pb-3">
                <div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">
                    {inv.invoiceNumber}
                  </span>
                  <h4 className="text-sm font-extrabold text-white mt-0.5">{inv.clientName}</h4>
                  <p className="text-[11px] text-slate-400">{inv.clientEmail}</p>

                  <div className="mt-2 text-[10px] text-blue-300 bg-blue-950/60 border border-blue-800/50 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-400" />
                    <span>Penerbit: <strong>{inv.companyName || 'ALN Digital Technology'}</strong></span>
                  </div>
                </div>

                <select
                  value={inv.status}
                  onChange={e => updateInvoiceStatus(inv.id, e.target.value as any)}
                  className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-xl border focus:outline-none cursor-pointer ${
                    inv.status === 'paid'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : inv.status === 'overdue'
                      ? 'bg-red-500/20 text-red-300 border-red-500/30'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                  }`}
                >
                  <option value="pending" className="bg-slate-900 text-amber-300">
                    PENDING
                  </option>
                  <option value="paid" className="bg-slate-900 text-emerald-300">
                    PAID (LUNAS)
                  </option>
                  <option value="overdue" className="bg-slate-900 text-red-300">
                    OVERDUE
                  </option>
                </select>
              </div>

              {/* Items preview */}
              <div className="space-y-1.5 py-3 border-b border-slate-800/80">
                {inv.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-slate-300 font-medium">
                      {item.description} ({item.quantity}x)
                    </span>
                    <span className="text-white font-bold">
                      Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between items-center text-xs">
                <span className="text-slate-400">Jatuh Tempo: <strong>{inv.dueDate}</strong></span>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block">Total Invoice:</span>
                  <span className="text-base font-extrabold text-emerald-400">
                    Rp {inv.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
              <button
                onClick={() => handlePrint(inv)}
                className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors border border-slate-700"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                Cetak PDF
              </button>
              <button
                onClick={() => openEditInvoiceModal(inv)}
                title="Edit Invoice"
                className="p-2 bg-slate-800 hover:bg-slate-700 text-blue-400 hover:text-blue-300 font-bold text-xs rounded-xl transition-colors border border-slate-700"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingInvoice(inv)}
                title="Hapus Invoice"
                className="p-2 bg-slate-800 hover:bg-red-950 text-slate-400 hover:text-red-400 font-bold text-xs rounded-xl transition-colors border border-slate-700"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Delete Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0A0F1D] border border-red-900/50 w-full max-w-sm rounded-3xl p-6 text-slate-100 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-400 mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Hapus Invoice?</h3>
              <p className="text-xs text-slate-400">
                Apakah Anda yakin ingin menghapus invoice <strong className="text-white">{deletingInvoice.invoiceNumber}</strong> ({deletingInvoice.clientName})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-extrabold text-xs rounded-xl transition-all shadow-md"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setDeletingInvoice(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl"
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
