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
import { upgradeMasterCategories, normalizeTransactions } from '../utils/masterCategoryHelper';
import { repairAndMigrateTransactions, mergeWalletPreservingAccountNumber, getCanonicalAccountNumber } from '../utils/balanceHelper';

const KEYS = {
  WALLETS: 'aln_wallets_v1',
  TRANSACTIONS: 'aln_transactions_v1',
  CATEGORIES: 'aln_categories_v1',
  CATEGORY_VERSION: 'aln_category_version_v2',
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

export const CANONICAL_WALLET_IDS = new Set([
  'w-1',
  'w-2',
  'w-3',
  'w-4',
  'w-bni-lana',
  'w-bni-lina',
  'w-bpd',
  'w-bri'
]);

export const DEMO_IDS = {
  WALLETS: new Set<string>([]),
  TRANSACTIONS: new Set(['tx-1', 'tx-2', 'tx-3', 'tx-4', 'tx-5', 'tx-6', 'tx-7', 'tx-8', 'tx-9', 'tx-10']),
  BUDGETS: new Set(['b-1', 'b-2', 'b-3', 'b-4']),
  GOALS: new Set(['g-1', 'g-2', 'g-3']),
  DEBTS: new Set(['bd-1', 'bd-2', 'bd-3']),
  INVOICES: new Set(['inv-1', 'inv-2']),
  INVESTMENTS: new Set(['invst-1', 'invst-2', 'invst-3', 'invst-4']),
  AUDIT_LOGS: new Set(['log-1', 'log-2', 'log-3'])
};

export function purgeDemoWallets(wallets: Wallet[]): Wallet[] {
  return wallets.filter(w => CANONICAL_WALLET_IDS.has(w.id) || !DEMO_IDS.WALLETS.has(w.id));
}

export function purgeDemoData(): {
  wallets: { removed: number; remaining: number };
  transactions: { removed: number; remaining: number };
  budgets: { removed: number; remaining: number };
  goals: { removed: number; remaining: number };
  debts: { removed: number; remaining: number };
  invoices: { removed: number; remaining: number };
  investments: { removed: number; remaining: number };
  auditLogs: { removed: number; remaining: number };
} {
  const currentWallets = StorageService.getWallets();
  const currentTx = StorageService.getTransactions();
  const currentBudgets = StorageService.getBudgets();
  const currentGoals = StorageService.getGoals();
  const currentDebts = StorageService.getDebts();
  const currentInvoices = StorageService.getInvoices();
  const currentInvestments = StorageService.getInvestments();
  const currentLogs = StorageService.getAuditLogs();

  const isDemoWallet = (id: string) => DEMO_IDS.WALLETS.has(id) && !CANONICAL_WALLET_IDS.has(id);
  const cleanWallets = currentWallets.filter(w => CANONICAL_WALLET_IDS.has(w.id) || !isDemoWallet(w.id));
  const cleanTx = currentTx.filter(t => !DEMO_IDS.TRANSACTIONS.has(t.id) && (CANONICAL_WALLET_IDS.has(t.walletId) || !isDemoWallet(t.walletId)));
  const cleanBudgets = currentBudgets.filter(b => !DEMO_IDS.BUDGETS.has(b.id));
  const cleanGoals = currentGoals.filter(g => !DEMO_IDS.GOALS.has(g.id));
  const cleanDebts = currentDebts.filter(d => !DEMO_IDS.DEBTS.has(d.id));
  const cleanInvoices = currentInvoices.filter(i => !DEMO_IDS.INVOICES.has(i.id));
  const cleanInvestments = currentInvestments.filter(inv => !DEMO_IDS.INVESTMENTS.has(inv.id));
  const cleanLogs = currentLogs.filter(l => !DEMO_IDS.AUDIT_LOGS.has(l.id));

  StorageService.saveWallets(cleanWallets);
  StorageService.saveTransactions(cleanTx);
  StorageService.saveBudgets(cleanBudgets);
  StorageService.saveGoals(cleanGoals);
  StorageService.saveDebts(cleanDebts);
  StorageService.saveInvoices(cleanInvoices);
  StorageService.saveInvestments(cleanInvestments);
  StorageService.saveAuditLogs(cleanLogs);

  const stats = {
    wallets: { removed: currentWallets.length - cleanWallets.length, remaining: cleanWallets.length },
    transactions: { removed: currentTx.length - cleanTx.length, remaining: cleanTx.length },
    budgets: { removed: currentBudgets.length - cleanBudgets.length, remaining: cleanBudgets.length },
    goals: { removed: currentGoals.length - cleanGoals.length, remaining: cleanGoals.length },
    debts: { removed: currentDebts.length - cleanDebts.length, remaining: cleanDebts.length },
    invoices: { removed: currentInvoices.length - cleanInvoices.length, remaining: cleanInvoices.length },
    investments: { removed: currentInvestments.length - cleanInvestments.length, remaining: cleanInvestments.length },
    auditLogs: { removed: currentLogs.length - cleanLogs.length, remaining: cleanLogs.length }
  };

  console.log('[DEMO CLEANUP]', stats);
  return stats;
}

export const StorageService = {
  getWallets: (): Wallet[] => getStorageItem(KEYS.WALLETS, initialWallets),
  saveWallets: (wallets: Wallet[]) => setStorageItem(KEYS.WALLETS, wallets),

  getTransactions: (): Transaction[] => {
    const rawTxs = getStorageItem<Transaction[]>(KEYS.TRANSACTIONS, []);
    const normalized = normalizeTransactions(rawTxs);
    const repaired = repairAndMigrateTransactions(normalized, StorageService.getWallets());
    return repaired;
  },
  saveTransactions: (transactions: Transaction[]) => {
    const normalized = normalizeTransactions(transactions);
    const repaired = repairAndMigrateTransactions(normalized, StorageService.getWallets());
    setStorageItem(KEYS.TRANSACTIONS, repaired);
  },

  getCategories: (): Category[] => {
    const rawCategories = getStorageItem<Category[]>(KEYS.CATEGORIES, initialCategories);
    const version = getStorageItem<number>(KEYS.CATEGORY_VERSION, 0);

    // Auto-migrate to 18 Master Data categories if version < 2 or if categories contains legacy definitions
    if (version < 2 || !rawCategories || rawCategories.length < 18 || rawCategories.some(c => c.name === 'Makanan & Kuliner' || c.name === 'Bill & Utilitas' || c.name === 'Kebutuhan Keluarga & Anak')) {
      const upgraded = upgradeMasterCategories(rawCategories);
      setStorageItem(KEYS.CATEGORIES, upgraded);
      setStorageItem(KEYS.CATEGORY_VERSION, 2);
      return upgraded;
    }

    return rawCategories;
  },
  saveCategories: (categories: Category[]) => {
    setStorageItem(KEYS.CATEGORIES, categories);
    setStorageItem(KEYS.CATEGORY_VERSION, 2);
  },

  getBudgets: (): Budget[] => getStorageItem(KEYS.BUDGETS, []),
  saveBudgets: (budgets: Budget[]) => setStorageItem(KEYS.BUDGETS, budgets),

  getGoals: (): FinancialGoal[] => getStorageItem(KEYS.GOALS, []),
  saveGoals: (goals: FinancialGoal[]) => setStorageItem(KEYS.GOALS, goals),

  getDebts: (): BillAndDebt[] => getStorageItem(KEYS.DEBTS, []),
  saveDebts: (debts: BillAndDebt[]) => setStorageItem(KEYS.DEBTS, debts),

  getInvoices: (): Invoice[] => getStorageItem(KEYS.INVOICES, []),
  saveInvoices: (invoices: Invoice[]) => setStorageItem(KEYS.INVOICES, invoices),

  getInvestments: (): Investment[] => getStorageItem(KEYS.INVESTMENTS, []),
  saveInvestments: (investments: Investment[]) => setStorageItem(KEYS.INVESTMENTS, investments),

  getAuditLogs: (): AuditLog[] => getStorageItem(KEYS.AUDIT_LOGS, []),
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

  getLastSyncTimestamp: (): number => getStorageItem('aln_last_sync_timestamp_v1', 0),
  saveLastSyncTimestamp: (ts: number): void => setStorageItem('aln_last_sync_timestamp_v1', ts),

  saveAllEntities: (bundle: {
    wallets?: Wallet[];
    transactions?: Transaction[];
    categories?: Category[];
    budgets?: Budget[];
    goals?: FinancialGoal[];
    debts?: BillAndDebt[];
    invoices?: Invoice[];
    investments?: Investment[];
    auditLogs?: AuditLog[];
  }): void => {
    if (bundle.wallets) StorageService.saveWallets(bundle.wallets);
    if (bundle.transactions) StorageService.saveTransactions(bundle.transactions);
    if (bundle.categories && bundle.categories.length > 0) StorageService.saveCategories(bundle.categories);
    if (bundle.budgets) StorageService.saveBudgets(bundle.budgets);
    if (bundle.goals) StorageService.saveGoals(bundle.goals);
    if (bundle.debts) StorageService.saveDebts(bundle.debts);
    if (bundle.invoices) StorageService.saveInvoices(bundle.invoices);
    if (bundle.investments) StorageService.saveInvestments(bundle.investments);
    if (bundle.auditLogs && bundle.auditLogs.length > 0) StorageService.saveAuditLogs(bundle.auditLogs);
  },

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

export function safeMergeEntityArray<T extends { id: string; updatedAt?: string; createdAt?: string; date?: string; timestamp?: string }>(
  entityName: string,
  localItems: T[],
  remoteItems: T[]
): T[] {
  const safeLocal = localItems || [];
  const safeRemote = remoteItems || [];

  // 1. Wallets Cloud-First: Cloud data is the Single Source of Truth for wallet balance & properties.
  // We only fallback to local if remote is completely empty or unavailable.
  if (entityName === 'wallets') {
    if (safeRemote.length > 0) {
      return safeRemote.map(remoteItem => {
        const rW = remoteItem as unknown as Wallet;
        const acc = rW.accountNumber || getCanonicalAccountNumber(rW.id, rW.name) || '';
        return { ...rW, accountNumber: acc } as unknown as T;
      });
    }
    return safeLocal.map(localItem => {
      const lW = localItem as unknown as Wallet;
      const acc = lW.accountNumber || getCanonicalAccountNumber(lW.id, lW.name) || '';
      return { ...lW, accountNumber: acc } as unknown as T;
    });
  }

  // 2. Transactions & Other Entities Cloud-First:
  // Cloud items + Genuine Pending Offline Queue items = Authoritative State.
  const offlineQueue = StorageService.getOfflineQueue();
  const offlineIds = new Set(offlineQueue.map(q => String(q.id)));

  // If remote is returned (even empty array for clean/new user in Cloud):
  // Preserve Cloud items PLUS genuine pending offline items.
  const pendingOfflineItems = safeLocal.filter(l => l && l.id && offlineIds.has(String(l.id)));
  
  const remoteMap = new Map<string, T>();
  safeRemote.forEach(item => {
    if (item && item.id) {
      remoteMap.set(String(item.id), item);
    }
  });

  pendingOfflineItems.forEach(pending => {
    if (!remoteMap.has(String(pending.id))) {
      remoteMap.set(String(pending.id), pending);
    }
  });

  return Array.from(remoteMap.values());
}
