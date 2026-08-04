import { Transaction, Invoice, AuditLog } from '../types';

export const ExportService = {
  // Export tabular CSV download
  exportTransactionsCSV: (transactions: Transaction[], filename = 'Laporan_Transaksi_ALN_Finance.csv') => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Scope', 'Judul', 'Kategori', 'Nominal (IDR)', 'Catatan'];
    const rows = transactions.map(t => [
      t.id,
      t.date,
      t.type.toUpperCase(),
      t.scope.toUpperCase(),
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${(t.category || '').replace(/"/g, '""')}"`,
      t.amount,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportInvoiceCSV: (invoices: Invoice[], filename = 'Daftar_Invoice_ALN_Finance.csv') => {
    const headers = ['No Invoice', 'Klien', 'Tanggal Diterbitkan', 'Jatuh Tempo', 'Status', 'Subtotal', 'Pajak (%)', 'Diskon', 'Total'];
    const rows = invoices.map(i => [
      i.invoiceNumber,
      `"${(i.clientName || '').replace(/"/g, '""')}"`,
      i.issueDate,
      i.dueDate,
      i.status.toUpperCase(),
      i.subtotal,
      i.tax,
      i.discount,
      i.total
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  exportJSON: (dataObj: any, filename = 'ALN_Finance_Backup.json') => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(dataObj, null, 2))}`;
    const link = document.createElement('a');
    link.setAttribute('href', jsonString);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // Print / Save to PDF formatted window view for Invoices & Reports
  printInvoiceHTML: (invoice: Invoice) => {
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;

    const itemsHtml = invoice.items.map((item, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 12px; text-align: center;">${idx + 1}</td>
        <td style="padding: 12px; font-weight: 500;">${item.description}</td>
        <td style="padding: 12px; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right;">Rp ${item.unitPrice.toLocaleString('id-ID')}</td>
        <td style="padding: 12px; text-align: right; font-weight: 600;">Rp ${item.total.toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber} - ALN Finance Pro</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0F172A; padding: 40px; margin: 0; background: #fff; }
          .invoice-box { max-width: 800px; margin: auto; border: 1px solid #E2E8F0; padding: 40px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #10B981; padding-bottom: 20px; margin-bottom: 30px; }
          .brand { font-size: 24px; font-weight: 800; color: #050505; text-transform: uppercase; letter-spacing: 1px; }
          .brand span { color: #10B981; }
          .inv-title { font-size: 28px; font-weight: 700; color: #10B981; text-align: right; }
          .info-grid { display: flex; justify-content: space-between; margin-bottom: 30px; font-size: 14px; }
          .info-block { width: 48%; }
          .table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 14px; }
          .table th { background: #F8FAFC; padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #CBD5E1; text-transform: uppercase; font-size: 12px; letter-spacing: 0.5px; }
          .summary { float: right; width: 320px; font-size: 14px; }
          .summary-row { display: flex; justify-content: space-between; padding: 6px 0; }
          .total-row { display: flex; justify-content: space-between; padding: 12px 0; border-top: 2px solid #050505; font-size: 18px; font-weight: 800; color: #10B981; }
          .status-stamp { display: inline-block; padding: 6px 16px; border-radius: 20px; font-weight: 700; text-transform: uppercase; font-size: 12px; margin-top: 10px; }
          .paid { background: #D1FAE5; color: #065F46; border: 1px solid #A7F3D0; }
          .pending { background: #FEF3C7; color: #92400E; border: 1px solid #FDE68A; }
          .footer { margin-top: 60px; border-top: 1px solid #E2E8F0; padding-top: 20px; font-size: 12px; color: #64748B; text-align: center; }
          @media print {
            body { padding: 0; }
            .invoice-box { border: none; box-shadow: none; padding: 0; }
          }
        </style>
      </head>
      <body>
        <div class="invoice-box">
          <div class="header">
            <div>
              <div class="brand">${invoice.companyName || 'ALN FINANCE PRO'}</div>
              <div style="font-size: 12px; color: #64748B; margin-top: 4px;">
                ${invoice.companyAddress ? `${invoice.companyAddress} • ` : ''}${invoice.companyPhone ? `${invoice.companyPhone} • ` : ''}${invoice.companyEmail || 'billing@alnstudio.id'}
              </div>
            </div>
            <div>
              <div class="inv-title">INVOICE</div>
              <div style="font-size: 14px; color: #475569; text-align: right; font-weight: 600;">#${invoice.invoiceNumber}</div>
              <div class="status-stamp ${invoice.status}">${invoice.status}</div>
            </div>
          </div>

          <div class="info-grid">
            <div class="info-block">
              <strong style="color: #64748B; font-size: 12px; text-transform: uppercase;">Ditujukan Kepada:</strong>
              <div style="font-size: 16px; font-weight: 700; margin-top: 4px;">${invoice.clientName}</div>
              <div style="color: #475569;">${invoice.clientEmail || ''}</div>
              <div style="color: #475569;">${invoice.clientAddress || ''}</div>
            </div>
            <div class="info-block" style="text-align: right;">
              <div><strong>Tanggal Terbit:</strong> ${invoice.issueDate}</div>
              <div><strong>Jatuh Tempo:</strong> ${invoice.dueDate}</div>
            </div>
          </div>

          <table class="table">
            <thead>
              <tr>
                <th style="text-align: center; width: 40px;">No</th>
                <th>Deskripsi Item / Layanan</th>
                <th style="text-align: center; width: 60px;">Qty</th>
                <th style="text-align: right; width: 140px;">Harga Satuan</th>
                <th style="text-align: right; width: 140px;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="summary">
            <div class="summary-row">
              <span>Subtotal:</span>
              <span>Rp ${invoice.subtotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Pajak PPN (${invoice.tax}%):</span>
              <span>Rp ${Math.round((invoice.subtotal * invoice.tax) / 100).toLocaleString('id-ID')}</span>
            </div>
            ${invoice.discount > 0 ? `
              <div class="summary-row" style="color: #EF4444;">
                <span>Diskon:</span>
                <span>- Rp ${invoice.discount.toLocaleString('id-ID')}</span>
              </div>
            ` : ''}
            <div class="total-row">
              <span>TOTAL TAGIHAN:</span>
              <span>Rp ${invoice.total.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div style="clear: both;"></div>

          ${(invoice.notes || invoice.companyBankDetails) ? `
            <div style="margin-top: 30px; background: #F8FAFC; padding: 16px; border-radius: 8px; font-size: 13px; color: #475569; border-left: 4px solid #10B981;">
              <strong>Instruksi Pembayaran & Rekening Perusahaan:</strong><br/>
              ${invoice.companyBankDetails ? `<div style="font-weight: 600; color: #0F172A; margin-bottom: 4px;">${invoice.companyBankDetails}</div>` : ''}
              ${invoice.notes || ''}
            </div>
          ` : ''}

          <div class="footer">
            Diterbitkan secara otomatis oleh ALN Finance Pro System • Smart Financial Management OS
          </div>
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  },

  printFinancialReportHTML: (title: string, period: string, summaryData: any, transactions: Transaction[]) => {
    const printWindow = window.open('', '_blank', 'width=900,height=1000');
    if (!printWindow) return;

    const rowsHtml = transactions.map((t, idx) => `
      <tr style="border-bottom: 1px solid #E2E8F0;">
        <td style="padding: 10px; text-align: center;">${idx + 1}</td>
        <td style="padding: 10px;">${t.date}</td>
        <td style="padding: 10px; font-weight: 600;">${t.title}</td>
        <td style="padding: 10px;">${t.category}</td>
        <td style="padding: 10px; text-align: center; text-transform: uppercase; font-size: 11px;">${t.scope}</td>
        <td style="padding: 10px; text-align: right; font-weight: 700; color: ${t.type === 'income' ? '#059669' : t.type === 'expense' ? '#DC2626' : '#2563EB'};">
          ${t.type === 'income' ? '+' : t.type === 'expense' ? '-' : ''} Rp ${t.amount.toLocaleString('id-ID')}
        </td>
      </tr>
    `).join('');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title} - ALN Finance Pro</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #0F172A; padding: 40px; background: #fff; }
          .header { border-bottom: 3px solid #10B981; padding-bottom: 16px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-end; }
          .brand { font-size: 22px; font-weight: 800; color: #050505; }
          .brand span { color: #10B981; }
          .title { font-size: 24px; font-weight: 700; color: #0F172A; text-align: right; }
          .metrics-grid { display: flex; gap: 16px; margin-bottom: 30px; }
          .metric-card { flex: 1; background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; }
          .metric-label { font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 600; }
          .metric-value { font-size: 20px; font-weight: 800; margin-top: 4px; }
          .table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
          .table th { background: #0F172A; color: #fff; padding: 10px; text-align: left; text-transform: uppercase; font-size: 11px; }
          .footer { margin-top: 40px; border-top: 1px solid #E2E8F0; padding-top: 16px; font-size: 11px; color: #64748B; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">ALN <span>FINANCE PRO</span></div>
            <div style="font-size: 12px; color: #64748B;">Laporan Keuangan Eksekutif</div>
          </div>
          <div>
            <div class="title">${title}</div>
            <div style="font-size: 13px; color: #64748B;">Periode: ${period}</div>
          </div>
        </div>

        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">Total Pemasukan</div>
            <div class="metric-value" style="color: #059669;">Rp ${(summaryData.totalIncome || 0).toLocaleString('id-ID')}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Pengeluaran</div>
            <div class="metric-value" style="color: #DC2626;">Rp ${(summaryData.totalExpense || 0).toLocaleString('id-ID')}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Net Flow / Laba Bersih</div>
            <div class="metric-value" style="color: ${(summaryData.netFlow || 0) >= 0 ? '#10B981' : '#DC2626'};">Rp ${(summaryData.netFlow || 0).toLocaleString('id-ID')}</div>
          </div>
        </div>

        <table class="table">
          <thead>
            <tr>
              <th style="width: 40px; text-align: center;">No</th>
              <th>Tanggal</th>
              <th>Judul Transaksi</th>
              <th>Kategori</th>
              <th style="text-align: center;">Scope</th>
              <th style="text-align: right;">Nominal</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          Dicetak dari ALN Finance Pro • Financial OS Modern • ${new Date().toLocaleDateString('id-ID')}
        </div>
        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  }
};
