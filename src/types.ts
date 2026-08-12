export type Scope = 'all' | 'personal' | 'business';

export type Currency = 'IDR' | 'USD' | 'EUR' | 'SGD' | 'JPY';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'credit';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  accountNumber?: string;
  balance: number;
  initialBalance?: number;
  currency: Currency;
  icon: string;
  color: string;
  isDefault?: boolean;
  scope: Scope;
}

export type TransactionType = 'income' | 'expense' | 'transfer';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: Currency;
  title: string;
  category: string;
  subcategory?: string;
  walletId: string;
  targetWalletId?: string; // for transfer
  scope: Scope;
  date: string; // YYYY-MM-DD
  note?: string;
  receiptUrl?: string; // base64 or URL
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'transfer';
  icon: string;
  color: string;
  scope: Scope;
  isCustom?: boolean;
  subcategories?: string[];
}

export interface Budget {
  id: string;
  categoryId: string;
  categoryName: string;
  monthlyLimit: number;
  spent: number;
  scope: Scope;
  period: string; // YYYY-MM
}

export interface FinancialGoal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline: string;
  category: string;
  color: string;
  icon: string;
}

export interface BillAndDebt {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  type: 'bill' | 'debt_payable' | 'receivable'; // bill = tagihan rutin, debt_payable = hutang kita, receivable = piutang
  party?: string; // nama penagih / peminjam
  status: 'pending' | 'paid' | 'overdue';
  note?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  // Perusahaan / Issuer Details
  companyName?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
  companyBankDetails?: string;
  // Client Details
  clientName: string;
  clientEmail?: string;
  clientAddress?: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number; // percentage
  discount: number; // nominal
  total: number;
  status: 'pending' | 'paid' | 'overdue';
  paymentProofUrl?: string;
  notes?: string;
  createdAt: string;
}

export interface Investment {
  id: string;
  name: string;
  category: 'saham' | 'reksadana' | 'crypto' | 'emas' | 'obligasi' | 'deposito' | 'properti' | 'lainnya' | string;
  initialAmount: number;
  currentAmount: number;
  returnPercentage: number;
  units?: number;
  platform: string;
  scope?: Scope;
  notes?: string;
  createdAt?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  role: 'Pemilik Bisnis' | 'Manajer Keuangan' | 'Pengguna Pribadi';
  action: string;
  module: string;
  details: string;
}

export interface FinancialHealthAnalysis {
  healthScore: number;
  healthGrade: string;
  summary: string;
  risks: string[];
  recommendations: string[];
  savingsPotential?: number;
  cashflowForecast?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}
