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
      <div className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[rgba(212,175,55,0.12)] border border-[rgba(212,175,55,0.25)] flex items-center justify-center text-[#F6D365] font-bold">
            <FileText className="w-5 h-5 text-[#F6D365]" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-white">Invoice Generator & Business Tools</h3>
            <p className="text-xs text-[#7C8799]">Penerbitan Tagihan Profesional Klien & Custom Perusahaan</p>
          </div>
        </div>

        <button
          onClick={openAddInvoiceModal}
          className="px-4 py-2.5 rounded-2xl btn-gold text-[#0B1220] font-extrabold text-xs flex items-center gap-2 shadow-lg transition-all"
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
                ? 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border border-[rgba(212,175,55,0.3)] shadow-md font-extrabold'
                : 'bg-[#121A2A] text-[#7C8799] hover:text-[#BFC8D6] border border-[rgba(255,255,255,0.08)]'
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
            className="bg-[#121A2A] p-6 rounded-3xl border border-[rgba(255,255,255,0.08)] shadow-2xl flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.08)] pb-3.5">
                <div>
                  <span className="text-[10px] font-mono text-[#F6D365] font-extrabold uppercase">
                    {inv.invoiceNumber}
                  </span>
                  <h4 className="text-sm font-extrabold text-white mt-0.5">{inv.clientName}</h4>
                  <p className="text-[11px] text-[#7C8799]">{inv.clientEmail}</p>

                  <div className="mt-2 text-[10px] text-[#F6D365] bg-[rgba(212,175,55,0.1)] border border-[rgba(212,175,55,0.2)] px-2.5 py-0.5 rounded-lg inline-flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-[#F6D365]" />
                    <span>Penerbit: <strong>{inv.companyName || 'ALN Digital Technology'}</strong></span>
                  </div>
                </div>

                <select
                  value={inv.status}
                  onChange={e => updateInvoiceStatus(inv.id, e.target.value as any)}
                  className={`text-[10px] font-extrabold uppercase px-3 py-1 rounded-2xl border focus:outline-none cursor-pointer ${
                    inv.status === 'paid'
                      ? 'bg-[rgba(34,197,94,0.15)] text-[#22C55E] border-[rgba(34,197,94,0.3)]'
                      : inv.status === 'overdue'
                      ? 'bg-[rgba(239,68,68,0.15)] text-[#EF4444] border-[rgba(239,68,68,0.3)]'
                      : 'bg-[rgba(212,175,55,0.15)] text-[#F6D365] border-[rgba(212,175,55,0.3)]'
                  }`}
                >
                  <option value="pending" className="bg-[#0B1220] text-[#F6D365]">
                    PENDING
                  </option>
                  <option value="paid" className="bg-[#0B1220] text-[#22C55E]">
                    PAID (LUNAS)
                  </option>
                  <option value="overdue" className="bg-[#0B1220] text-[#EF4444]">
                    OVERDUE
                  </option>
                </select>
              </div>

              {/* Items preview */}
              <div className="space-y-2 py-3 border-b border-[rgba(255,255,255,0.08)]">
                {inv.items.map((item, i) => (
                  <div key={i} className="flex justify-between text-xs">
                    <span className="text-[#BFC8D6] font-medium">
                      {item.description} ({item.quantity}x)
                    </span>
                    <span className="text-white font-bold font-mono">
                      Rp {(item.quantity * item.unitPrice).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-between items-center text-xs">
                <span className="text-[#7C8799]">Jatuh Tempo: <strong>{inv.dueDate}</strong></span>
                <div className="text-right">
                  <span className="text-[10px] text-[#7C8799] block font-bold uppercase">Total Invoice:</span>
                  <span className="text-base font-extrabold text-[#F6D365] font-mono">
                    Rp {inv.total.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-[rgba(255,255,255,0.08)]">
              <button
                onClick={() => handlePrint(inv)}
                className="flex-1 py-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#BFC8D6] font-bold text-xs rounded-2xl flex items-center justify-center gap-1.5 transition-colors border border-[rgba(255,255,255,0.08)]"
              >
                <Printer className="w-3.5 h-3.5 text-[#F6D365]" />
                Cetak PDF
              </button>
              <button
                onClick={() => openEditInvoiceModal(inv)}
                title="Edit Invoice"
                className="p-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.08)] text-[#F6D365] font-bold text-xs rounded-2xl transition-colors border border-[rgba(255,255,255,0.08)]"
              >
                <Pencil className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeletingInvoice(inv)}
                title="Hapus Invoice"
                className="p-2 bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(239,68,68,0.1)] text-[#7C8799] hover:text-[#EF4444] font-bold text-xs rounded-2xl transition-colors border border-[rgba(255,255,255,0.08)]"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Delete Modal */}
      {deletingInvoice && (
        <div className="fixed inset-0 z-50 bg-[#0B1220]/85 backdrop-blur-xl flex items-center justify-center p-4">
          <div className="bg-[#121A2A] border border-[rgba(239,68,68,0.3)] w-full max-w-sm rounded-3xl p-6 text-white shadow-2xl space-y-4 animate-fade-in">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(239,68,68,0.15)] border border-[rgba(239,68,68,0.3)] flex items-center justify-center text-[#EF4444] mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-extrabold text-white">Hapus Invoice?</h3>
              <p className="text-xs text-[#7C8799]">
                Apakah Anda yakin ingin menghapus invoice <strong className="text-white">{deletingInvoice.invoiceNumber}</strong> ({deletingInvoice.clientName})?
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white font-extrabold text-xs rounded-2xl transition-all shadow-md"
              >
                Ya, Hapus
              </button>
              <button
                onClick={() => setDeletingInvoice(null)}
                className="py-2.5 px-4 bg-[rgba(255,255,255,0.06)] hover:bg-[rgba(255,255,255,0.12)] text-[#BFC8D6] font-bold text-xs rounded-2xl"
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
