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
import {
  initialWallets,
  initialTransactions,
  initialCategories,
  initialBudgets,
  initialGoals,
  initialBillsAndDebts,
  initialInvoices,
  initialInvestments,
  initialAuditLogs
} from '../data/initialData';

const KEYS = {
  WALLETS: 'aln_wallets_v1',
  TRANSACTIONS: 'aln_transactions_v1',
  CATEGORIES: 'aln_categories_v1',
  BUDGETS: 'aln_budgets_v1',
  GOALS: 'aln_goals_v1',
  DEBTS: 'aln_debts_v1',
  INVOICES: 'aln_invoices_v1',
  INVESTMENTS: 'aln_investments_v1',
  AUDIT_LOGS: 'aln_audit_logs_v1',
  OFFLINE_QUEUE: 'aln_offline_queue_v1'
};

const getStorageItem = <T>(key: string, defaultValue: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing ${key} to localStorage:`, error);
  }
};

export const StorageService = {
  getWallets: (): Wallet[] => getStorageItem(KEYS.WALLETS, initialWallets),
  saveWallets: (wallets: Wallet[]) => setStorageItem(KEYS.WALLETS, wallets),

  getTransactions: (): Transaction[] => getStorageItem(KEYS.TRANSACTIONS, initialTransactions),
  saveTransactions: (transactions: Transaction[]) => setStorageItem(KEYS.TRANSACTIONS, transactions),

  getCategories: (): Category[] => getStorageItem(KEYS.CATEGORIES, initialCategories),
  saveCategories: (categories: Category[]) => setStorageItem(KEYS.CATEGORIES, categories),

  getBudgets: (): Budget[] => getStorageItem(KEYS.BUDGETS, initialBudgets),
  saveBudgets: (budgets: Budget[]) => setStorageItem(KEYS.BUDGETS, budgets),

  getGoals: (): FinancialGoal[] => getStorageItem(KEYS.GOALS, initialGoals),
  saveGoals: (goals: FinancialGoal[]) => setStorageItem(KEYS.GOALS, goals),

  getDebts: (): BillAndDebt[] => getStorageItem(KEYS.DEBTS, initialBillsAndDebts),
  saveDebts: (debts: BillAndDebt[]) => setStorageItem(KEYS.DEBTS, debts),

  getInvoices: (): Invoice[] => getStorageItem(KEYS.INVOICES, initialInvoices),
  saveInvoices: (invoices: Invoice[]) => setStorageItem(KEYS.INVOICES, invoices),

  getInvestments: (): Investment[] => getStorageItem(KEYS.INVESTMENTS, initialInvestments),
  saveInvestments: (investments: Investment[]) => setStorageItem(KEYS.INVESTMENTS, investments),

  getAuditLogs: (): AuditLog[] => getStorageItem(KEYS.AUDIT_LOGS, initialAuditLogs),
  saveAuditLogs: (logs: AuditLog[]) => setStorageItem(KEYS.AUDIT_LOGS, logs),

  addAuditLog: (action: string, module: string, details: string, role = 'Pemilik Bisnis') => {
    const logs = StorageService.getAuditLogs();
    const newLog: AuditLog = {
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      user: 'Arya Kelana (User)',
      role: role as any,
      action,
      module,
      details
    };
    const updated = [newLog, ...logs].slice(0, 100); // keep last 100
    StorageService.saveAuditLogs(updated);
    return updated;
  },

  getOfflineQueue: (): any[] => getStorageItem(KEYS.OFFLINE_QUEUE, []),
  saveOfflineQueue: (queue: any[]) => setStorageItem(KEYS.OFFLINE_QUEUE, queue),

  exportFullBackup: () => {
    return {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      app: 'ALN Finance Pro',
      data: {
        wallets: StorageService.getWallets(),
        transactions: StorageService.getTransactions(),
        categories: StorageService.getCategories(),
        budgets: StorageService.getBudgets(),
        goals: StorageService.getGoals(),
        debts: StorageService.getDebts(),
        invoices: StorageService.getInvoices(),
        investments: StorageService.getInvestments(),
        auditLogs: StorageService.getAuditLogs()
      }
    };
  },

  importFullBackup: (jsonContent: any) => {
    if (!jsonContent || !jsonContent.data) {
      throw new Error('Format file backup JSON tidak valid.');
    }
    const d = jsonContent.data;
    if (d.wallets) StorageService.saveWallets(d.wallets);
    if (d.transactions) StorageService.saveTransactions(d.transactions);
    if (d.categories) StorageService.saveCategories(d.categories);
    if (d.budgets) StorageService.saveBudgets(d.budgets);
    if (d.goals) StorageService.saveGoals(d.goals);
    if (d.debts) StorageService.saveDebts(d.debts);
    if (d.invoices) StorageService.saveInvoices(d.invoices);
    if (d.investments) StorageService.saveInvestments(d.investments);
    if (d.auditLogs) StorageService.saveAuditLogs(d.auditLogs);

    StorageService.addAuditLog('Restore Backup Database', 'System Settings', 'Mengimpor file restore JSON lokal');
  },

  resetToDefault: () => {
    localStorage.removeItem(KEYS.WALLETS);
    localStorage.removeItem(KEYS.TRANSACTIONS);
    localStorage.removeItem(KEYS.CATEGORIES);
    localStorage.removeItem(KEYS.BUDGETS);
    localStorage.removeItem(KEYS.GOALS);
    localStorage.removeItem(KEYS.DEBTS);
    localStorage.removeItem(KEYS.INVOICES);
    localStorage.removeItem(KEYS.INVESTMENTS);
    localStorage.removeItem(KEYS.AUDIT_LOGS);
    localStorage.removeItem(KEYS.OFFLINE_QUEUE);
  }
};
