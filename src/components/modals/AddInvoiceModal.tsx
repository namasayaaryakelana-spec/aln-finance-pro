import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { X, Plus, Trash2, FileText } from 'lucide-react';
import { Invoice, InvoiceItem } from '../../types';

interface AddInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingInvoice?: Invoice | null;
}

export const AddInvoiceModal: React.FC<AddInvoiceModalProps> = ({ isOpen, onClose, editingInvoice }) => {
  const { addInvoice, updateInvoice } = useFinance();

  // Company / Issuer State
  const [companyName, setCompanyName] = useState('ALN Digital Technology');
  const [companyEmail, setCompanyEmail] = useState('billing@alnstudio.id');
  const [companyPhone, setCompanyPhone] = useState('+62 812-3456-7890');
  const [companyAddress, setCompanyAddress] = useState('Financial Tower Lt 8, Jakarta Selatan');
  const [companyBankDetails, setCompanyBankDetails] = useState('Bank BCA: 8830-1928-31 a/n PT ALN Digital Technology');

  // Client State
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientAddress, setClientAddress] = useState('');
  const [dueDate, setDueDate] = useState('2026-08-30');
  const [notes, setNotes] = useState('Mohon lakukan pembayaran sebelum tanggal jatuh tempo.');
  const [items, setItems] = useState<InvoiceItem[]>([
    { id: '1', description: 'Layanan Pengembangan Software', quantity: 1, unitPrice: 15000000, total: 15000000 }
  ]);
  const [includeTax, setIncludeTax] = useState(true);

  useEffect(() => {
    if (editingInvoice) {
      setCompanyName(editingInvoice.companyName || 'ALN Digital Technology');
      setCompanyEmail(editingInvoice.companyEmail || 'billing@alnstudio.id');
      setCompanyPhone(editingInvoice.companyPhone || '+62 812-3456-7890');
      setCompanyAddress(editingInvoice.companyAddress || 'Financial Tower Lt 8, Jakarta Selatan');
      setCompanyBankDetails(editingInvoice.companyBankDetails || 'Bank BCA: 8830-1928-31 a/n PT ALN Digital Technology');

      setClientName(editingInvoice.clientName || '');
      setClientEmail(editingInvoice.clientEmail || '');
      setClientAddress(editingInvoice.clientAddress || '');
      setDueDate(editingInvoice.dueDate || '2026-08-30');
      setNotes(editingInvoice.notes || '');
      setItems(editingInvoice.items && editingInvoice.items.length > 0 ? editingInvoice.items : [
        { id: '1', description: 'Layanan Pengembangan Software', quantity: 1, unitPrice: 15000000, total: 15000000 }
      ]);
      setIncludeTax(editingInvoice.tax > 0);
    } else {
      setCompanyName('ALN Digital Technology');
      setCompanyEmail('billing@alnstudio.id');
      setCompanyPhone('+62 812-3456-7890');
      setCompanyAddress('Financial Tower Lt 8, Jakarta Selatan');
      setCompanyBankDetails('Bank BCA: 8830-1928-31 a/n PT ALN Digital Technology');

      setClientName('');
      setClientEmail('');
      setClientAddress('');
      setDueDate('2026-08-30');
      setNotes('Mohon lakukan pembayaran sebelum tanggal jatuh tempo.');
      setItems([
        { id: '1', description: 'Layanan Pengembangan Software', quantity: 1, unitPrice: 15000000, total: 15000000 }
      ]);
      setIncludeTax(true);
    }
  }, [editingInvoice, isOpen]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: `${Date.now()}`, description: 'Layanan Tambahan', quantity: 1, unitPrice: 1000000, total: 1000000 }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    setItems(prev =>
      prev.map((item, i) => {
        if (i !== index) return item;
        const updated = { ...item, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  const tax = includeTax ? 11 : 0;
  const totalAmount = subtotal + (subtotal * tax) / 100;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName || items.length === 0) return;

    if (editingInvoice) {
      updateInvoice({
        ...editingInvoice,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyBankDetails,
        clientName,
        clientEmail,
        clientAddress,
        dueDate,
        notes,
        items,
        subtotal,
        tax,
        total: totalAmount
      });
    } else {
      addInvoice({
        invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        companyBankDetails,
        clientName,
        clientEmail,
        clientAddress,
        issueDate: new Date().toISOString().split('T')[0],
        dueDate,
        notes,
        items,
        subtotal,
        tax,
        discount: 0,
        total: totalAmount,
        status: 'pending'
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xl flex items-center justify-center p-4">
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] w-full max-w-2xl rounded-3xl p-6 relative text-[var(--text-primary)] shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar animate-fade-in transition-colors">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-2xl bg-[var(--surface-secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[var(--gold-badge-bg)] text-[var(--gold-primary)] border border-[var(--gold-badge-border)]">
            <FileText className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h3 className="text-base font-black text-[var(--text-primary)] font-['Plus_Jakarta_Sans',sans-serif]">
              {editingInvoice ? 'Edit Invoice Bisnis' : 'Terbitkan Invoice Bisnis Baru'}
            </h3>
            <p className="text-[11px] text-[var(--text-secondary)]">Form penerbitan tagihan resmi klien & perusahaan</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
          {/* Section 1: Profil Perusahaan Penerbit */}
          <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)] space-y-3">
            <h4 className="text-xs font-extrabold text-[var(--gold-primary)] uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
              🏢 Perusahaan / Bisnis Penerbit (Pengirim)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Nama Perusahaan / Bisnis</label>
                <input
                  type="text"
                  placeholder="Mis: PT ALN Digital Technology"
                  value={companyName}
                  onChange={e => setCompanyName(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Email Perusahaan</label>
                <input
                  type="email"
                  placeholder="billing@perusahaan.com"
                  value={companyEmail}
                  onChange={e => setCompanyEmail(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Telepon / WhatsApp Bisnis</label>
                <input
                  type="text"
                  placeholder="+62 812-3456-7890"
                  value={companyPhone}
                  onChange={e => setCompanyPhone(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Alamat Perusahaan</label>
                <input
                  type="text"
                  placeholder="Gedung / Jalan, Kota"
                  value={companyAddress}
                  onChange={e => setCompanyAddress(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--gold-primary)]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[var(--text-secondary)] font-bold mb-1">Rekening Pembayaran / No. Bank</label>
              <input
                type="text"
                placeholder="Mis: Bank BCA: 8830-1928-31 a/n PT ALN Digital"
                value={companyBankDetails}
                onChange={e => setCompanyBankDetails(e.target.value)}
                className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-[var(--gold-primary)]"
              />
            </div>
          </div>

          {/* Section 2: Profil Klien */}
          <div className="bg-[var(--input-bg)] p-4.5 rounded-2xl border border-[var(--border)] space-y-3">
            <h4 className="text-xs font-extrabold text-emerald-500 uppercase tracking-wider flex items-center gap-1.5 font-['Plus_Jakarta_Sans',sans-serif]">
              👤 Ditujukan Kepada (Klien / Pembeli)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Nama Klien / PT Klien *</label>
                <input
                  type="text"
                  placeholder="Mis: PT Global Media Nusantara"
                  value={clientName}
                  onChange={e => setClientName(e.target.value)}
                  required
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Email Klien</label>
                <input
                  type="email"
                  placeholder="finance@klien.com"
                  value={clientEmail}
                  onChange={e => setClientEmail(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Alamat Klien</label>
                <input
                  type="text"
                  placeholder="Jl. Sudirman No. 45, Jakarta"
                  value={clientAddress}
                  onChange={e => setClientAddress(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[var(--text-secondary)] font-bold mb-1">Jatuh Tempo Pembayaran</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={e => setDueDate(e.target.value)}
                  className="w-full bg-[var(--card-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-medium focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>
            </div>
          </div>

          {/* Itemized Billing Table */}
          <div className="space-y-2 border-t border-[var(--border)] pt-3">
            <div className="flex justify-between items-center">
              <label className="font-bold text-[var(--text-secondary)]">Rincian Item Jasa / Produk</label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-extrabold text-[var(--gold-primary)] hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Baris Item
              </button>
            </div>

            {items.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Deskripsi item..."
                  value={item.description}
                  onChange={e => handleItemChange(idx, 'description', e.target.value)}
                  className="flex-1 bg-[var(--input-bg)] px-3.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)]"
                />
                <input
                  type="number"
                  placeholder="Qty"
                  value={item.quantity}
                  onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value) || 1)}
                  className="w-16 bg-[var(--input-bg)] px-2.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] text-center font-bold font-mono"
                />
                <input
                  type="number"
                  placeholder="Harga (Rp)"
                  value={item.unitPrice}
                  onChange={e => handleItemChange(idx, 'unitPrice', parseFloat(e.target.value) || 0)}
                  className="w-32 bg-[var(--input-bg)] px-2.5 py-2.5 rounded-xl border border-[var(--input-border)] text-[var(--text-primary)] font-bold font-mono"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveItem(idx)}
                  className="p-2 text-[var(--text-muted)] hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-[var(--text-secondary)] font-bold mb-1">Catatan Tambahan / Terms</label>
            <input
              type="text"
              placeholder="Mis: Terima kasih atas kerja samanya."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-[var(--input-bg)] px-4 py-3 rounded-2xl border border-[var(--input-border)] text-[var(--text-primary)]"
            />
          </div>

          <div className="p-4 bg-[var(--input-bg)] rounded-2xl border border-[var(--border)] flex justify-between items-center text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-[var(--text-secondary)] font-medium">
              <input
                type="checkbox"
                checked={includeTax}
                onChange={e => setIncludeTax(e.target.checked)}
                className="rounded accent-[var(--gold-primary)]"
              />
              <span>Sertakan PPN 11%</span>
            </label>

            <div className="text-right">
              <span className="text-[var(--text-muted)] block text-[10px] uppercase font-bold tracking-wider">Total Tagihan:</span>
              <strong className="text-[var(--gold-primary)] text-base font-mono font-black">
                Rp {totalAmount.toLocaleString('id-ID')}
              </strong>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="submit"
              className="flex-1 py-3 btn-gold text-[#0B1220] font-extrabold rounded-2xl shadow-md transition-all text-xs active:scale-95"
            >
              {editingInvoice ? 'Simpan Perubahan Invoice' : 'Terbitkan & Simpan Invoice'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-3 px-4 bg-[var(--surface-secondary)] hover:bg-[var(--border)] text-[var(--text-secondary)] font-bold rounded-2xl text-xs transition-colors"
            >
              Batal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
