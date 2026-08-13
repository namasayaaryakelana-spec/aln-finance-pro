import {
  Wallet,
  Transaction,
  Category,
  Budget,
  FinancialGoal,
  BillAndDebt,
  Invoice,
  Investment,
  AuditLog
} from '../types';

export const initialWallets: Wallet[] = [
  {
    id: 'w-1',
    name: 'BCA',
    type: 'bank',
    accountNumber: '8830192841',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Building2',
    color: '#10B981',
    isDefault: true,
    scope: 'all'
  },
  {
    id: 'w-2',
    name: 'GOPAY',
    type: 'ewallet',
    accountNumber: '081298765432',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Smartphone',
    color: '#06B6D4',
    scope: 'all'
  },
  {
    id: 'w-3',
    name: 'JAGO',
    type: 'ewallet',
    accountNumber: '1420018294021',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Landmark',
    color: '#3B82F6',
    scope: 'all'
  },
  {
    id: 'w-4',
    name: 'CASH',
    type: 'cash',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Banknote',
    color: '#F59E0B',
    scope: 'all'
  },
  {
    id: 'w-bni-lina',
    name: 'BNI LINA',
    type: 'bank',
    accountNumber: '9912048201',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Building2',
    color: '#6366F1',
    scope: 'all'
  },
  {
    id: 'w-bni-lana',
    name: 'BNI LANA',
    type: 'bank',
    accountNumber: '9912048202',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Building2',
    color: '#8B5CF6',
    scope: 'all'
  },
  {
    id: 'w-bpd',
    name: 'BPD DIY',
    type: 'bank',
    accountNumber: '5501928401',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Building2',
    color: '#EC4899',
    scope: 'all'
  },
  {
    id: 'w-bri',
    name: 'BRI',
    type: 'bank',
    accountNumber: '7712049281',
    initialBalance: 0,
    balance: 0,
    currency: 'IDR',
    icon: 'Building2',
    color: '#14B8A6',
    scope: 'all'
  }
];

export const initialCategories: Category[] = [
  // 1. Penghasilan Utama (income)
  {
    id: 'c-main-income',
    name: 'Penghasilan Utama',
    type: 'income',
    icon: 'Briefcase',
    color: '#10B981',
    scope: 'all',
    subcategories: ['Gaji Lana', 'Gaji Lina', 'Insentif Lina', 'Transport Bulanan Lana', 'Honorarium Kegiatan']
  },
  // 2. Pemasukan Lainnya (income)
  {
    id: 'c-other-income',
    name: 'Pemasukan Lainnya',
    type: 'income',
    icon: 'TrendingUp',
    color: '#34D399',
    scope: 'all',
    subcategories: ['Pemasukan Lain', 'Pemberian / Hadiah', 'Refunds / Reimbursements']
  },
  // 3. Makanan (expense)
  {
    id: 'c-food',
    name: 'Makanan',
    type: 'expense',
    icon: 'Utensils',
    color: '#F87171',
    scope: 'all',
    subcategories: ['Makan di Luar', 'Belanja Makanan', 'Jajan', 'Oleh-oleh']
  },
  // 4. Transportasi (expense)
  {
    id: 'c-transport',
    name: 'Transportasi',
    type: 'expense',
    icon: 'Car',
    color: '#FBBF24',
    scope: 'all',
    subcategories: ['Bensin', 'Parkir', 'Ojek', 'Ongkos Kirim', 'Transport Rapat/Bonus']
  },
  // 5. Rumah Tangga (expense)
  {
    id: 'c-household',
    name: 'Rumah Tangga',
    type: 'expense',
    icon: 'Home',
    color: '#A78BFA',
    scope: 'all',
    subcategories: ['Keperluan Rumah Tangga', 'Gas', 'Sampah', 'Kontrakan']
  },
  // 6. Keperluan Bayi (expense)
  {
    id: 'c-baby',
    name: 'Keperluan Bayi',
    type: 'expense',
    icon: 'Baby',
    color: '#FB923C',
    scope: 'all',
    subcategories: ['Keperluan Bayi']
  },
  // 7. Tagihan & Utilitas (expense)
  {
    id: 'c-bills',
    name: 'Tagihan & Utilitas',
    type: 'expense',
    icon: 'FileText',
    color: '#60A5FA',
    scope: 'all',
    subcategories: ['Listrik', 'WiFi', 'Paket Data', 'Aplikasi & Software', 'Netflix']
  },
  // 8. Kesehatan (expense)
  {
    id: 'c-health',
    name: 'Kesehatan',
    type: 'expense',
    icon: 'HeartPulse',
    color: '#F472B6',
    scope: 'all',
    subcategories: ['Kesehatan', 'Obat-obatan', 'Dokter Kandungan']
  },
  // 9. Perawatan (expense)
  {
    id: 'c-care',
    name: 'Perawatan',
    type: 'expense',
    icon: 'Sparkles',
    color: '#EC4899',
    scope: 'all',
    subcategories: ['Skincare', 'Makeup & Kosmetik', 'Potong Rambut', 'Perawatan']
  },
  // 10. Belanja Pribadi (expense)
  {
    id: 'c-personal-shopping',
    name: 'Belanja Pribadi',
    type: 'expense',
    icon: 'ShoppingBag',
    color: '#E11D48',
    scope: 'all',
    subcategories: ['Pakaian', 'Accessories', 'Emas', 'Kado & Hadiah', 'Dekorasi & Pesta', 'Elektronik HP/TV']
  },
  // 11. Sosial (expense)
  {
    id: 'c-social',
    name: 'Sosial',
    type: 'expense',
    icon: 'Users',
    color: '#8B5CF6',
    scope: 'all',
    subcategories: ['Iuran RT & Sampah', 'Nyumbang']
  },
  // 12. Biaya Keuangan (expense)
  {
    id: 'c-financial-fees',
    name: 'Biaya Keuangan',
    type: 'expense',
    icon: 'CreditCard',
    color: '#64748B',
    scope: 'all',
    subcategories: ['Admin Bank', 'Pembayaran Shopee PayLater']
  },
  // 13. Utang & Cicilan (expense)
  {
    id: 'c-debt-installments',
    name: 'Utang & Cicilan',
    type: 'expense',
    icon: 'Landmark',
    color: '#EF4444',
    scope: 'all',
    subcategories: ['Pembayaran Utang', 'Cicilan']
  },
  // 14. Service & Perbaikan (expense)
  {
    id: 'c-service-repair',
    name: 'Service & Perbaikan',
    type: 'expense',
    icon: 'Wrench',
    color: '#D97706',
    scope: 'all',
    subcategories: ['Service Motor', 'Service', 'Cuci Motor']
  },
  // 15. Perjalanan (expense)
  {
    id: 'c-travel',
    name: 'Perjalanan',
    type: 'expense',
    icon: 'Plane',
    color: '#0284C7',
    scope: 'all',
    subcategories: ['Tiket', 'Biaya Perjalanan', 'Staycation']
  },
  // 16. Olahraga (expense)
  {
    id: 'c-sports',
    name: 'Olahraga',
    type: 'expense',
    icon: 'Activity',
    color: '#059669',
    scope: 'all',
    subcategories: ['Olahraga', 'Futsal']
  },
  // 17. Lain-Lain (expense)
  {
    id: 'c-miscellaneous',
    name: 'Lain-Lain',
    type: 'expense',
    icon: 'MoreHorizontal',
    color: '#94A3B8',
    scope: 'all',
    subcategories: ['Lain-Lain']
  },
  // 18. Transfer (transfer)
  {
    id: 'c-transfer',
    name: 'Transfer',
    type: 'transfer',
    icon: 'ArrowRightLeft',
    color: '#3B82F6',
    scope: 'all',
    subcategories: ['Transfer Antar Wallet']
  }
];

const today = new Date();
const formatDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return d.toISOString().split('T')[0];
};

import finalCsvTransactions from './finalCsvTransactions.json';

export const initialTransactions: Transaction[] = finalCsvTransactions as Transaction[];

export const initialBudgets: Budget[] = [
  {
    id: 'b-1',
    categoryId: 'c-exp-1',
    categoryName: 'Makanan & Kuliner',
    monthlyLimit: 4000000,
    spent: 2600000,
    scope: 'personal',
    period: '2026-07'
  },
  {
    id: 'b-2',
    categoryId: 'c-exp-3',
    categoryName: 'Transportasi & Bensin',
    monthlyLimit: 1500000,
    spent: 1680000, // OVERBUDGET Alert!
    scope: 'personal',
    period: '2026-07'
  },
  {
    id: 'b-3',
    categoryId: 'c-exp-8',
    categoryName: 'Server, SaaS & Software',
    monthlyLimit: 5000000,
    spent: 3200000,
    scope: 'business',
    period: '2026-07'
  },
  {
    id: 'b-4',
    categoryId: 'c-exp-9',
    categoryName: 'Pemasaran & Iklan Ads',
    monthlyLimit: 6000000,
    spent: 4500000,
    scope: 'business',
    period: '2026-07'
  }
];

export const initialGoals: FinancialGoal[] = [
  {
    id: 'g-1',
    title: 'Dana Darurat 6 Bulan (Emergency Fund)',
    targetAmount: 120000000,
    currentAmount: 85000000,
    deadline: '2026-12-31',
    category: 'Tabungan Pribadi',
    color: '#10B981',
    icon: 'ShieldCheck'
  },
  {
    id: 'g-2',
    title: 'DP Rumah Minimalis BSD',
    targetAmount: 250000000,
    currentAmount: 112000000,
    deadline: '2027-06-30',
    category: 'Properti',
    color: '#3B82F6',
    icon: 'Home'
  },
  {
    id: 'g-3',
    title: 'Cadangan Modal Ekspansi Bisnis Q4',
    targetAmount: 200000000,
    currentAmount: 145000000,
    deadline: '2026-10-15',
    category: 'Bisnis',
    color: '#8B5CF6',
    icon: 'TrendingUp'
  }
];

export const initialBillsAndDebts: BillAndDebt[] = [
  {
    id: 'bd-1',
    title: 'Tagihan Internet Biznet Dedicated 100Mbps',
    amount: 1250000,
    dueDate: formatDate(-3), // Jatuh tempo 3 hari lagi
    type: 'bill',
    party: 'Biznet Networks',
    status: 'pending',
    note: 'Tagihan bulanan kantor'
  },
  {
    id: 'bd-2',
    title: 'Pelunasan Pembelian Server Hardware GPU',
    amount: 15000000,
    dueDate: formatDate(-7),
    type: 'debt_payable',
    party: 'PT Tech Solution Utama',
    status: 'pending',
    note: 'Sisa termin ke-2'
  },
  {
    id: 'bd-3',
    title: 'Piutang Jasa Konsultasi IT',
    amount: 12000000,
    dueDate: formatDate(5), // Sudah lewat tanggal
    type: 'receivable',
    party: 'CV Surya Digital',
    status: 'overdue',
    note: 'Belum ditransfer oleh Klien'
  }
];

export const initialInvoices: Invoice[] = [
  {
    id: 'inv-1',
    invoiceNumber: 'INV-2026-001',
    companyName: 'ALN Digital Technology',
    companyEmail: 'billing@alnstudio.id',
    companyPhone: '+62 812-3456-7890',
    companyAddress: 'Financial Tower Lt 8, Menara Palma, Jakarta Selatan',
    companyBankDetails: 'Bank BCA: 8830-1928-31 a/n PT ALN Digital Technology',
    clientName: 'PT Global Media Nusantara',
    clientEmail: 'finance@globalmedia.co.id',
    clientAddress: 'Gedung Cyber 2, Lt 15, Jakarta Selatan',
    issueDate: formatDate(10),
    dueDate: formatDate(2),
    items: [
      {
        id: 'item-1',
        description: 'Pengembangan Custom Financial Dashboard Module',
        quantity: 1,
        unitPrice: 35000000,
        total: 35000000
      },
      {
        id: 'item-2',
        description: 'Integrasi API Payment Gateway & Security Audit',
        quantity: 1,
        unitPrice: 10000000,
        total: 10000000
      }
    ],
    subtotal: 45000000,
    tax: 11,
    discount: 0,
    total: 49950000,
    status: 'paid',
    notes: 'Terima kasih atas kerja sama Anda dengan ALN Finance Pro.',
    createdAt: new Date().toISOString()
  },
  {
    id: 'inv-2',
    invoiceNumber: 'INV-2026-002',
    companyName: 'ALN Digital Technology',
    companyEmail: 'billing@alnstudio.id',
    companyPhone: '+62 812-3456-7890',
    companyAddress: 'Financial Tower Lt 8, Menara Palma, Jakarta Selatan',
    companyBankDetails: 'Bank Mandiri: 127-00-9831923-1 a/n PT ALN Digital Technology',
    clientName: 'CV Megah Kreatif Nusantara',
    clientEmail: 'billing@megahkreatif.com',
    clientAddress: 'Jl. Riau No 88, Bandung',
    issueDate: formatDate(3),
    dueDate: formatDate(-10),
    items: [
      {
        id: 'item-3',
        description: 'Langganan ALN Business OS Enterprise Level (6 Bulan)',
        quantity: 6,
        unitPrice: 3500000,
        total: 21000000
      }
    ],
    subtotal: 21000000,
    tax: 11,
    discount: 1000000,
    total: 22310000,
    status: 'pending',
    notes: 'Mohon lakukan pembayaran sebelum tanggal jatuh tempo.',
    createdAt: new Date().toISOString()
  }
];

export const initialInvestments: Investment[] = [
  {
    id: 'invst-1',
    name: 'BBCA - Bank Central Asia Tbk',
    category: 'saham',
    initialAmount: 45000000,
    currentAmount: 58500000,
    returnPercentage: 30.0,
    units: 60,
    platform: 'Ajaib / Stockbit'
  },
  {
    id: 'invst-2',
    name: 'Sucorinvest Money Market Fund',
    category: 'reksadana',
    initialAmount: 25000000,
    currentAmount: 26800000,
    returnPercentage: 7.2,
    platform: 'Bibit'
  },
  {
    id: 'invst-3',
    name: 'Bitcoin (BTC) Reserve',
    category: 'crypto',
    initialAmount: 20000000,
    currentAmount: 28400000,
    returnPercentage: 42.0,
    units: 0.021,
    platform: 'Indodax'
  },
  {
    id: 'invst-4',
    name: 'Emas Fisik Antam CertiCard',
    category: 'emas',
    initialAmount: 15000000,
    currentAmount: 18200000,
    returnPercentage: 21.3,
    units: 15,
    platform: 'Pegadaian Digital'
  }
];

export const initialAuditLogs: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: new Date().toISOString(),
    user: 'Arya Kelana (Admin)',
    role: 'Pemilik Bisnis',
    action: 'Inisialisasi Sistem',
    module: 'System Boot',
    details: 'Berhasil mengaitkan Service Worker PWA & database lokal ALN Finance Pro'
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    user: 'Arya Kelana (Admin)',
    role: 'Pemilik Bisnis',
    action: 'Cetak Invoice',
    module: 'Business Tools',
    details: 'Menerbitkan Invoice INV-2026-001 kepada PT Global Media'
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    user: 'Arya Kelana (Admin)',
    role: 'Pemilik Bisnis',
    action: 'Tambah Transaksi Kilat AI',
    module: 'Transactions',
    details: 'Diproses otomatis via Gemini AI Parsing: Rp 45.000.000 (Layanan Jasa Pro)'
  }
];
