import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from 'firebase/auth';
import { auth, googleProvider, testFirestoreConnection } from '../lib/firebase';
import { FirestoreSyncService, UserFinancialBundle } from '../services/firestoreSync';
import {
  Scope,
  Currency,
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
import { StorageService } from '../services/storage';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message: string;
}

export type SyncStatus = 'synced' | 'syncing' | 'local_only' | 'error';

interface FinanceContextType {
  currentUser: User | null;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  pushCloudData: () => Promise<boolean>;
  pullCloudData: () => Promise<boolean>;
  currentScope: Scope;
  setScope: (scope: Scope) => void;
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;

  syncStatus: SyncStatus;
  isCloudSyncing: boolean;

  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  debts: BillAndDebt[];
  invoices: Invoice[];
  investments: Investment[];
  auditLogs: AuditLog[];
  isOffline: boolean;

  toasts: Toast[];
  addToast: (type: Toast['type'], title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Actions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => void;
  deleteTransaction: (id: string) => void;

  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (wallet: Wallet) => void;
  deleteWallet: (id: string) => void;
  transferFunds: (fromWalletId: string, toWalletId: string, amount: number, note?: string) => void;

  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (category: Category) => void;
  deleteCategory: (id: string) => void;
  addBudget: (budget: Omit<Budget, 'id' | 'spent'>) => void;
  updateBudget: (budget: Budget) => void;
  deleteBudget: (id: string) => void;
  updateBudgetSpent: (categoryId: string, amountChange: number) => void;

  addGoal: (goal: Omit<FinancialGoal, 'id' | 'currentAmount'>) => void;
  updateGoal: (goal: FinancialGoal) => void;
  deleteGoal: (id: string) => void;
  topupGoal: (goalId: string, amount: number, walletId?: string) => void;

  addDebt: (debt: Omit<BillAndDebt, 'id' | 'status'>) => void;
  updateDebt: (debt: BillAndDebt) => void;
  deleteDebt: (id: string) => void;
  markDebtStatus: (debtId: string, status: 'pending' | 'paid' | 'overdue') => void;

  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt'>) => void;
  updateInvoice: (invoice: Invoice) => void;
  deleteInvoice: (id: string) => void;
  updateInvoiceStatus: (invoiceId: string, status: 'pending' | 'paid' | 'overdue') => void;

  addInvestment: (inv: Omit<Investment, 'id'>) => void;
  updateInvestment: (inv: Investment) => void;
  deleteInvestment: (id: string) => void;

  resetAllData: () => void;
  restoreData: (jsonData: any) => void;

  // Computed metrics
  filteredTransactions: Transaction[];
  filteredWallets: Wallet[];
  filteredBudgets: Budget[];
  filteredInvestments: Investment[];
  filteredDebts: BillAndDebt[];
  totalBalance: number;
  totalInvestment: number;
  totalInvestmentInitial: number;
  totalInvestmentReturn: number;
  totalAssets: number;
  totalLiabilities: number;
  totalReceivables: number;
  totalNetWorth: number;
  totalIncome: number;
  totalExpense: number;
  netFlow: number;
  healthScore: number;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentScope, setScopeState] = useState<Scope>('personal');
  const [currentCurrency, setCurrency] = useState<Currency>('IDR');

  const [wallets, setWallets] = useState<Wallet[]>(() => StorageService.getWallets());
  const [transactions, setTransactions] = useState<Transaction[]>(() => StorageService.getTransactions());
  const [categories, setCategories] = useState<Category[]>(() => StorageService.getCategories());
  const [budgets, setBudgets] = useState<Budget[]>(() => StorageService.getBudgets());
  const [goals, setGoals] = useState<FinancialGoal[]>(() => StorageService.getGoals());
  const [debts, setDebts] = useState<BillAndDebt[]>(() => StorageService.getDebts());
  const [invoices, setInvoices] = useState<Invoice[]>(() => StorageService.getInvoices());
  const [investments, setInvestments] = useState<Investment[]>(() => StorageService.getInvestments());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => StorageService.getAuditLogs());

  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local_only');
  const [isCloudSyncing, setIsCloudSyncing] = useState<boolean>(false);
  const isRemoteUpdateRef = useRef<boolean>(false);
  const remoteUpdateTimeoutRef = useRef<any>(null);

  // Test connection, catch redirect auth result & Auth state observer
  useEffect(() => {
    testFirestoreConnection();

    getRedirectResult(auth).catch((err: any) => {
      if (err && err.code !== 'auth/popup-closed-by-user') {
        console.warn('Firebase Auth Redirect Result Warning:', err);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      if (user) {
        addToast('success', 'Firebase Auth', `Terhubung sebagai ${user.displayName || user.email}`);
      } else {
        setSyncStatus('local_only');
      }
    });

    return () => unsubscribe();
  }, []);

  // Real-time Firestore Listener
  useEffect(() => {
    if (!currentUser) {
      setSyncStatus('local_only');
      return;
    }

    setSyncStatus('syncing');
    let isInitial = true;

    const unsubscribe = FirestoreSyncService.subscribeToUserData(
      currentUser.uid,
      (remoteData) => {
        if (remoteData) {
          isRemoteUpdateRef.current = true;
          if (remoteUpdateTimeoutRef.current) clearTimeout(remoteUpdateTimeoutRef.current);

          if (remoteData.wallets) { setWallets(remoteData.wallets); StorageService.saveWallets(remoteData.wallets); }
          if (remoteData.transactions) { setTransactions(remoteData.transactions); StorageService.saveTransactions(remoteData.transactions); }
          if (remoteData.categories) { setCategories(remoteData.categories); StorageService.saveCategories(remoteData.categories); }
          if (remoteData.budgets) { setBudgets(remoteData.budgets); StorageService.saveBudgets(remoteData.budgets); }
          if (remoteData.goals) { setGoals(remoteData.goals); StorageService.saveGoals(remoteData.goals); }
          if (remoteData.debts) { setDebts(remoteData.debts); StorageService.saveDebts(remoteData.debts); }
          if (remoteData.invoices) { setInvoices(remoteData.invoices); StorageService.saveInvoices(remoteData.invoices); }
          if (remoteData.investments) { setInvestments(remoteData.investments); StorageService.saveInvestments(remoteData.investments); }
          if (remoteData.auditLogs) { setAuditLogs(remoteData.auditLogs); StorageService.saveAuditLogs(remoteData.auditLogs); }

          setSyncStatus('synced');
          if (!isInitial) {
            addToast('info', 'Cloud Sync', 'Data otomatis tersinkronisasi dari Cloud Firestore.');
          }

          // Buffer remote update flag for 2.5 seconds to cover all React re-render passes
          remoteUpdateTimeoutRef.current = setTimeout(() => {
            isRemoteUpdateRef.current = false;
          }, 2500);
        } else {
          // Cloud document does not exist yet -> Seed current local data to Firestore
          const initialBundle: UserFinancialBundle = {
            wallets,
            transactions,
            categories,
            budgets,
            goals,
            debts,
            invoices,
            investments,
            auditLogs
          };
          FirestoreSyncService.saveUserData(currentUser.uid, initialBundle).then(() => {
            setSyncStatus('synced');
            addToast('success', 'Cloud Setup', 'Data awal berhasil disinkronkan ke Cloud Firebase.');
          });
        }
        isInitial = false;
      },
      (err) => {
        console.error('Cloud Sync Subscription Error:', err);
        setSyncStatus('error');
      }
    );

    return () => {
      unsubscribe();
      if (remoteUpdateTimeoutRef.current) clearTimeout(remoteUpdateTimeoutRef.current);
    };
  }, [currentUser]);

  // Auto-push local changes to Cloud Firestore when authenticated
  useEffect(() => {
    if (!currentUser) return;
    if (isRemoteUpdateRef.current) return;

    const timer = setTimeout(async () => {
      if (isRemoteUpdateRef.current) return;
      setIsCloudSyncing(true);
      setSyncStatus('syncing');
      const success = await FirestoreSyncService.saveUserData(currentUser.uid, {
        wallets,
        transactions,
        categories,
        budgets,
        goals,
        debts,
        invoices,
        investments,
        auditLogs
      });
      setIsCloudSyncing(false);
      if (success) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('error');
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [wallets, transactions, categories, budgets, goals, debts, invoices, investments, auditLogs, currentUser]);

  const loginWithGoogle = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (
        err?.code === 'auth/popup-closed-by-user' ||
        err?.code === 'auth/cancelled-popup-request'
      ) {
        return;
      }
      console.warn('Google Sign-In Popup failed, attempting redirect fallback:', err);
      try {
        await signInWithRedirect(auth, googleProvider);
      } catch (redirectErr: any) {
        console.error('Google Sign-In Error:', redirectErr);
        const errDetail = redirectErr?.code || err?.code || redirectErr?.message || String(err);
        addToast('error', 'Login Gagal', `Detail Error: ${errDetail}`);
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      addToast('info', 'Logged Out', 'Berhasil keluar dari akun Firebase.');
    } catch (err) {
      console.error('Logout Error:', err);
    }
  };

  const pushCloudData = async (): Promise<boolean> => {
    if (!currentUser) return false;
    setIsCloudSyncing(true);
    setSyncStatus('syncing');
    const success = await FirestoreSyncService.saveUserData(currentUser.uid, {
      wallets,
      transactions,
      categories,
      budgets,
      goals,
      debts,
      invoices,
      investments,
      auditLogs
    });
    setIsCloudSyncing(false);
    if (success) {
      setSyncStatus('synced');
      addToast('success', 'Upload Berhasil', 'Seluruh data lokal berhasil diunggah ke Cloud Firestore.');
    } else {
      setSyncStatus('error');
      addToast('error', 'Upload Gagal', 'Gagal mengunggah data ke Cloud Firestore.');
    }
    return success;
  };

  const pullCloudData = async (): Promise<boolean> => {
    if (!currentUser) return false;
    setIsCloudSyncing(true);
    setSyncStatus('syncing');
    const remoteData = await FirestoreSyncService.getUserData(currentUser.uid);
    setIsCloudSyncing(false);
    if (remoteData) {
      isRemoteUpdateRef.current = true;
      if (remoteData.wallets) { setWallets(remoteData.wallets); StorageService.saveWallets(remoteData.wallets); }
      if (remoteData.transactions) { setTransactions(remoteData.transactions); StorageService.saveTransactions(remoteData.transactions); }
      if (remoteData.categories) { setCategories(remoteData.categories); StorageService.saveCategories(remoteData.categories); }
      if (remoteData.budgets) { setBudgets(remoteData.budgets); StorageService.saveBudgets(remoteData.budgets); }
      if (remoteData.goals) { setGoals(remoteData.goals); StorageService.saveGoals(remoteData.goals); }
      if (remoteData.debts) { setDebts(remoteData.debts); StorageService.saveDebts(remoteData.debts); }
      if (remoteData.invoices) { setInvoices(remoteData.invoices); StorageService.saveInvoices(remoteData.invoices); }
      if (remoteData.investments) { setInvestments(remoteData.investments); StorageService.saveInvestments(remoteData.investments); }
      if (remoteData.auditLogs) { setAuditLogs(remoteData.auditLogs); StorageService.saveAuditLogs(remoteData.auditLogs); }

      setSyncStatus('synced');
      addToast('success', 'Download Berhasil', 'Data berhasil diperbarui langsung dari Cloud Firestore.');
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 2500);
      return true;
    } else {
      setSyncStatus('synced');
      addToast('info', 'Cloud Kosong', 'Belum ada data di Cloud. Data lokal Anda akan dijadikan data utama.');
      await pushCloudData();
      return true;
    }
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('success', 'Koneksi Pulih', 'Anda kembali online. Data lokal disinkronkan.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      addToast('warning', 'Mode Offline', 'Perangkat tidak terhubung ke internet. Transaksi disimpan secara lokal.');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const setScope = (scope: Scope) => {
    setScopeState(scope);
    StorageService.addAuditLog('Ganti Mode Scope', 'System', `Mengubah scope tampilan ke ${scope.toUpperCase()}`);
  };

  const addToast = (type: Toast['type'], title: string, message: string) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  // Filtered by active scope
  const filteredWallets = wallets.filter(w => currentScope === 'all' || w.scope === 'all' || w.scope === currentScope);
  const filteredTransactions = transactions.filter(t => currentScope === 'all' || t.scope === 'all' || t.scope === currentScope);
  const filteredBudgets = budgets.filter(b => currentScope === 'all' || b.scope === 'all' || b.scope === currentScope);
  const filteredInvestments = investments.filter(i => currentScope === 'all' || !i.scope || i.scope === 'all' || i.scope === currentScope);
  const filteredDebts = debts.filter(d => currentScope === 'all' || d.status === 'pending' || d.status === 'overdue');

  const totalBalance = filteredWallets.reduce((sum, w) => sum + w.balance, 0);
  const totalInvestment = filteredInvestments.reduce((sum, inv) => sum + inv.currentAmount, 0);
  const totalInvestmentInitial = filteredInvestments.reduce((sum, inv) => sum + inv.initialAmount, 0);
  const totalInvestmentReturn = totalInvestment - totalInvestmentInitial;
  const totalAssets = totalBalance + totalInvestment;

  const totalLiabilities = filteredDebts
    .filter(d => (d.type === 'debt_payable' || d.type === 'bill') && d.status !== 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalReceivables = filteredDebts
    .filter(d => d.type === 'receivable' && d.status !== 'paid')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalNetWorth = totalAssets + totalReceivables - totalLiabilities;

  const totalIncome = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const netFlow = totalIncome - totalExpense;

  // Calculate Financial Health Score (0-100)
  let score = 70; // Base score netral

  if (totalIncome === 0 && totalExpense === 0) {
    // Belum ada transaksi sama sekali
    score = 70;
  } else if (totalIncome === 0 && totalExpense > 0) {
    // Hanya ada pengeluaran tanpa pemasukan
    score = 40;
  } else if (totalIncome > 0) {
    const savingsRate = (netFlow / totalIncome) * 100;
    if (savingsRate >= 30) score += 20;
    else if (savingsRate >= 15) score += 10;
    else if (savingsRate >= 0) score += 0;
    else score -= 25; // Pengeluaran melebihi pemasukan
  }

  // Pengurangan poin jika ada anggaran (budget) yang terlampaui
  const overbudgetCount = filteredBudgets.filter(b => b.spent > b.monthlyLimit).length;
  if (overbudgetCount > 0) score -= overbudgetCount * 10;

  // Pengurangan poin jika utang belum dibayar melebihi aset
  if (totalAssets > 0 && totalLiabilities > totalAssets) {
    score -= 15;
  }

  const healthScore = Math.min(100, Math.max(10, Math.round(score)));

  // --- ACTIONS ---
  const addTransaction = (txData: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newTx: Transaction = {
      ...txData,
      id: `tx-${Date.now()}`,
      createdAt: new Date().toISOString()
    };

    const updatedTxs = [newTx, ...transactions];
    setTransactions(updatedTxs);
    StorageService.saveTransactions(updatedTxs);

    // Update wallet balance
    setWallets(prev => {
      const nextWallets = prev.map(w => {
        if (w.id === txData.walletId) {
          const delta = txData.type === 'income' ? txData.amount : -txData.amount;
          return { ...w, balance: w.balance + delta };
        }
        return w;
      });
      StorageService.saveWallets(nextWallets);
      return nextWallets;
    });

    // Update budget spent if expense
    if (txData.type === 'expense') {
      const category = categories.find(c => c.name === txData.category);
      if (category) {
        updateBudgetSpent(category.id, txData.amount);
      }
    }

    const logs = StorageService.addAuditLog(
      'Tambah Transaksi',
      'Transactions',
      `${txData.type.toUpperCase()}: ${txData.title} (Rp ${txData.amount.toLocaleString('id-ID')})`
    );
    setAuditLogs(logs);

    addToast('success', 'Transaksi Berhasil', `Berhasil mencatat ${txData.title}`);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    StorageService.saveTransactions(updated);

    // Revert wallet balance
    setWallets(prev => {
      const nextWallets = prev.map(w => {
        if (w.id === tx.walletId) {
          const delta = tx.type === 'income' ? -tx.amount : tx.amount;
          return { ...w, balance: w.balance + delta };
        }
        return w;
      });
      StorageService.saveWallets(nextWallets);
      return nextWallets;
    });

    const logs = StorageService.addAuditLog('Hapus Transaksi', 'Transactions', `Menghapus transaksi ${tx.title}`);
    setAuditLogs(logs);

    addToast('info', 'Transaksi Dihapus', `Transaksi ${tx.title} telah dihapus.`);
  };

  const addWallet = (wData: Omit<Wallet, 'id'>) => {
    const newWallet: Wallet = {
      ...wData,
      id: `w-${Date.now()}`
    };
    const updated = [...wallets, newWallet];
    setWallets(updated);
    StorageService.saveWallets(updated);

    const logs = StorageService.addAuditLog('Tambah Dompet', 'Wallets', `Menambah dompet baru: ${newWallet.name}`);
    setAuditLogs(logs);

    addToast('success', 'Dompet Ditambahkan', `Akun/Dompet ${newWallet.name} berhasil dibuat.`);
  };

  const updateWallet = (updatedWallet: Wallet) => {
    const nextWallets = wallets.map(w => (w.id === updatedWallet.id ? updatedWallet : w));
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);
    addToast('info', 'Dompet Diperbarui', `Informasi ${updatedWallet.name} disimpan.`);
  };

  const deleteWallet = (id: string) => {
    const w = wallets.find(x => x.id === id);
    const nextWallets = wallets.filter(x => x.id !== id);
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

    if (w) {
      const logs = StorageService.addAuditLog('Hapus Dompet', 'Wallets', `Menghapus dompet ${w.name}`);
      setAuditLogs(logs);
    }
  };

  const transferFunds = (fromWalletId: string, toWalletId: string, amount: number, note?: string) => {
    const source = wallets.find(w => w.id === fromWalletId);
    const target = wallets.find(w => w.id === toWalletId);

    if (!source || !target) return;
    if (source.balance < amount) {
      addToast('error', 'Transfer Gagal', `Saldo ${source.name} tidak mencukupi untuk transfer Rp ${amount.toLocaleString('id-ID')}`);
      return;
    }

    // Adjust balances
    const nextWallets = wallets.map(w => {
      if (w.id === fromWalletId) return { ...w, balance: w.balance - amount };
      if (w.id === toWalletId) return { ...w, balance: w.balance + amount };
      return w;
    });
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

    // Record transfer transaction
    const newTx: Transaction = {
      id: `tx-tr-${Date.now()}`,
      type: 'transfer',
      amount,
      currency: source.currency,
      title: `Transfer ${source.name} ➔ ${target.name}`,
      category: 'Transfer Antar Akun',
      walletId: fromWalletId,
      targetWalletId: toWalletId,
      scope: currentScope,
      date: new Date().toISOString().split('T')[0],
      note: note || `Transfer internal dari ${source.name} ke ${target.name}`,
      createdAt: new Date().toISOString()
    };

    const nextTxs = [newTx, ...transactions];
    setTransactions(nextTxs);
    StorageService.saveTransactions(nextTxs);

    const logs = StorageService.addAuditLog(
      'Transfer Antar Dompet',
      'Wallets',
      `Transfer Rp ${amount.toLocaleString('id-ID')} dari ${source.name} ke ${target.name}`
    );
    setAuditLogs(logs);

    addToast('success', 'Transfer Berhasil', `Berhasil memindahkan saldo Rp ${amount.toLocaleString('id-ID')}`);
  };

  const addCategory = (catData: Omit<Category, 'id'>) => {
    const newCat: Category = {
      ...catData,
      id: `c-custom-${Date.now()}`,
      isCustom: true
    };
    const updated = [...categories, newCat];
    setCategories(updated);
    StorageService.saveCategories(updated);
    addToast('success', 'Kategori Dibuat', `Kategori ${newCat.name} ditambahkan.`);
  };

  const updateCategory = (updatedCat: Category) => {
    const nextCategories = categories.map(c => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(nextCategories);
    StorageService.saveCategories(nextCategories);
    addToast('info', 'Kategori Diperbarui', `Kategori ${updatedCat.name} berhasil diperbarui.`);
  };

  const deleteCategory = (id: string) => {
    const catToDelete = categories.find(c => c.id === id);
    const nextCategories = categories.filter(c => c.id !== id);
    setCategories(nextCategories);
    StorageService.saveCategories(nextCategories);
    if (catToDelete) {
      addToast('warning', 'Kategori Dihapus', `Kategori ${catToDelete.name} telah dihapus.`);
    }
  };

  const addBudget = (budgetData: Omit<Budget, 'id' | 'spent'>) => {
    const newBudget: Budget = {
      ...budgetData,
      id: `b-${Date.now()}`,
      spent: 0
    };
    const updated = [...budgets, newBudget];
    setBudgets(updated);
    StorageService.saveBudgets(updated);
    addToast('success', 'Anggaran Dibuat', `Target anggaran ${newBudget.categoryName} diset Rp ${newBudget.monthlyLimit.toLocaleString('id-ID')}`);
  };

  const updateBudget = (updatedBudget: Budget) => {
    setBudgets(prev => {
      const next = prev.map(b => (b.id === updatedBudget.id ? updatedBudget : b));
      StorageService.saveBudgets(next);
      return next;
    });
    addToast('info', 'Anggaran Diperbarui', `Batas anggaran ${updatedBudget.categoryName} telah diperbarui.`);
  };

  const deleteBudget = (id: string) => {
    const b = budgets.find(x => x.id === id);
    setBudgets(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveBudgets(next);
      return next;
    });
    addToast('info', 'Anggaran Dihapus', `Anggaran ${b?.categoryName || ''} telah dihapus.`);
  };

  const updateBudgetSpent = (categoryId: string, amountChange: number) => {
    setBudgets(prev => {
      const nextBudgets = prev.map(b => {
        if (b.categoryId === categoryId) {
          const newSpent = b.spent + amountChange;
          if (newSpent > b.monthlyLimit) {
            addToast(
              'warning',
              'Peringatan Overbudget!',
              `Pengeluaran kategori ${b.categoryName} telah melebihi batas anggaran bulanan!`
            );
          }
          return { ...b, spent: Math.max(0, newSpent) };
        }
        return b;
      });
      StorageService.saveBudgets(nextBudgets);
      return nextBudgets;
    });
  };

  const addGoal = (goalData: Omit<FinancialGoal, 'id' | 'currentAmount'>) => {
    const newGoal: FinancialGoal = {
      ...goalData,
      id: `g-${Date.now()}`,
      currentAmount: 0
    };
    const updated = [...goals, newGoal];
    setGoals(updated);
    StorageService.saveGoals(updated);
    addToast('success', 'Target Tabungan Dibuat', `Financial Goal: ${newGoal.title}`);
  };

  const updateGoal = (updatedGoal: FinancialGoal) => {
    setGoals(prev => {
      const next = prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g));
      StorageService.saveGoals(next);
      return next;
    });
    addToast('info', 'Target Goal Diperbarui', `Target ${updatedGoal.title} disimpan.`);
  };

  const deleteGoal = (id: string) => {
    const g = goals.find(x => x.id === id);
    setGoals(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveGoals(next);
      return next;
    });
    addToast('info', 'Target Goal Dihapus', `Target ${g?.title || ''} telah dihapus.`);
  };

  const topupGoal = (goalId: string, amount: number, walletId?: string) => {
    const targetGoal = goals.find(g => g.id === goalId);
    if (!targetGoal) return;

    if (walletId) {
      const wallet = wallets.find(w => w.id === walletId);
      if (wallet) {
        if (wallet.balance < amount) {
          addToast('error', 'Saldo Tidak Mencukupi', `Saldo di ${wallet.name} (Rp ${wallet.balance.toLocaleString('id-ID')}) tidak cukup untuk topup Rp ${amount.toLocaleString('id-ID')}`);
          return;
        }

        // Deduct balance from selected wallet
        const nextWallets = wallets.map(w => (w.id === walletId ? { ...w, balance: w.balance - amount } : w));
        setWallets(nextWallets);
        StorageService.saveWallets(nextWallets);

        // Record a transaction for audit/history
        const newTx: Transaction = {
          id: `tx-topup-${Date.now()}`,
          type: 'expense',
          amount,
          currency: wallet.currency,
          title: `Top Up Target: ${targetGoal.title}`,
          category: 'Tabungan & Investasi',
          walletId,
          scope: currentScope,
          date: new Date().toISOString().split('T')[0],
          note: `Alokasi tabungan target ${targetGoal.title} dari ${wallet.name}`,
          createdAt: new Date().toISOString()
        };
        const nextTxs = [newTx, ...transactions];
        setTransactions(nextTxs);
        StorageService.saveTransactions(nextTxs);
      }
    }

    setGoals(prev => {
      const next = prev.map(g => (g.id === goalId ? { ...g, currentAmount: g.currentAmount + amount } : g));
      StorageService.saveGoals(next);
      return next;
    });

    const wName = walletId ? wallets.find(w => w.id === walletId)?.name : null;
    addToast(
      'success',
      'Top-up Target Berhasil',
      `Menambahkan Rp ${amount.toLocaleString('id-ID')} ke target "${targetGoal.title}"${wName ? ` dari ${wName}` : ''}.`
    );
  };

  const addDebt = (debtData: Omit<BillAndDebt, 'id' | 'status'>) => {
    const newDebt: BillAndDebt = {
      ...debtData,
      id: `bd-${Date.now()}`,
      status: 'pending'
    };
    const updated = [...debts, newDebt];
    setDebts(updated);
    StorageService.saveDebts(updated);
    addToast('success', 'Catatan Tagihan / Hutang', `Pengingat ${newDebt.title} ditambahkan.`);
  };

  const updateDebt = (updatedDebt: BillAndDebt) => {
    setDebts(prev => {
      const next = prev.map(d => (d.id === updatedDebt.id ? updatedDebt : d));
      StorageService.saveDebts(next);
      return next;
    });
    addToast('info', 'Tagihan Diperbarui', `Catatan ${updatedDebt.title} telah diperbarui.`);
  };

  const deleteDebt = (id: string) => {
    const d = debts.find(x => x.id === id);
    setDebts(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveDebts(next);
      return next;
    });
    addToast('info', 'Tagihan Dihapus', `Catatan ${d?.title || ''} telah dihapus.`);
  };

  const markDebtStatus = (debtId: string, status: 'pending' | 'paid' | 'overdue') => {
    setDebts(prev => {
      const next = prev.map(d => (d.id === debtId ? { ...d, status } : d));
      StorageService.saveDebts(next);
      return next;
    });
    addToast('info', 'Status Diperbarui', `Status tagihan/hutang diubah menjadi ${status.toUpperCase()}`);
  };

  const addInvoice = (invData: Omit<Invoice, 'id' | 'createdAt'>) => {
    const newInvoice: Invoice = {
      ...invData,
      id: `inv-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const updated = [newInvoice, ...invoices];
    setInvoices(updated);
    StorageService.saveInvoices(updated);

    const logs = StorageService.addAuditLog('Buat Invoice', 'Business Tools', `Menerbitkan Invoice ${newInvoice.invoiceNumber} untuk ${newInvoice.clientName}`);
    setAuditLogs(logs);

    addToast('success', 'Invoice Diterbitkan', `Invoice ${newInvoice.invoiceNumber} siap dikirim atau dicetak.`);
  };

  const updateInvoice = (updatedInv: Invoice) => {
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv));
      StorageService.saveInvoices(next);
      return next;
    });
    addToast('info', 'Invoice Diperbarui', `Invoice ${updatedInv.invoiceNumber} telah diperbarui.`);
  };

  const deleteInvoice = (id: string) => {
    const inv = invoices.find(x => x.id === id);
    setInvoices(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveInvoices(next);
      return next;
    });
    addToast('info', 'Invoice Dihapus', `Invoice ${inv?.invoiceNumber || ''} telah dihapus.`);
  };

  const updateInvoiceStatus = (invoiceId: string, status: 'pending' | 'paid' | 'overdue') => {
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === invoiceId ? { ...inv, status } : inv));
      StorageService.saveInvoices(next);
      return next;
    });
    addToast('info', 'Status Invoice', `Invoice diubah ke status ${status.toUpperCase()}`);
  };

  const addInvestment = (invData: Omit<Investment, 'id'>) => {
    const newInv: Investment = {
      ...invData,
      id: `invst-${Date.now()}`
    };
    const updated = [...investments, newInv];
    setInvestments(updated);
    StorageService.saveInvestments(updated);
    addToast('success', 'Investasi Ditambahkan', `Aset ${newInv.name} dicatat.`);
  };

  const updateInvestment = (updatedInv: Investment) => {
    setInvestments(prev => {
      const next = prev.map(i => (i.id === updatedInv.id ? updatedInv : i));
      StorageService.saveInvestments(next);
      return next;
    });
    addToast('info', 'Investasi Diperbarui', `Portofolio ${updatedInv.name} telah disimpan.`);
  };

  const deleteInvestment = (id: string) => {
    const inv = investments.find(x => x.id === id);
    setInvestments(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveInvestments(next);
      return next;
    });
    addToast('info', 'Investasi Dihapus', `Aset ${inv?.name || ''} telah dihapus.`);
  };

  const resetAllData = () => {
    StorageService.resetToDefault();
    setWallets(StorageService.getWallets());
    setTransactions(StorageService.getTransactions());
    setCategories(StorageService.getCategories());
    setBudgets(StorageService.getBudgets());
    setGoals(StorageService.getGoals());
    setDebts(StorageService.getDebts());
    setInvoices(StorageService.getInvoices());
    setInvestments(StorageService.getInvestments());
    setAuditLogs(StorageService.getAuditLogs());
    addToast('info', 'Reset Database', 'Seluruh data aplikasi telah dikembalikan ke data awal.');
  };

  const restoreData = (jsonData: any) => {
    try {
      StorageService.importFullBackup(jsonData);
      setWallets(StorageService.getWallets());
      setTransactions(StorageService.getTransactions());
      setCategories(StorageService.getCategories());
      setBudgets(StorageService.getBudgets());
      setGoals(StorageService.getGoals());
      setDebts(StorageService.getDebts());
      setInvoices(StorageService.getInvoices());
      setInvestments(StorageService.getInvestments());
      setAuditLogs(StorageService.getAuditLogs());
      addToast('success', 'Restore Selesai', 'Data berhasil dipulihkan dari file backup JSON.');
    } catch (e: any) {
      addToast('error', 'Gagal Restore Data', e.message || 'File tidak valid.');
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        loginWithGoogle,
        logout,
        pushCloudData,
        pullCloudData,
        currentScope,
        setScope,
        currentCurrency,
        setCurrency,
        syncStatus,
        isCloudSyncing,
        wallets,
        transactions,
        categories,
        budgets,
        goals,
        debts,
        invoices,
        investments,
        auditLogs,
        isOffline,
        toasts,
        addToast,
        removeToast,
        addTransaction,
        deleteTransaction,
        addWallet,
        updateWallet,
        deleteWallet,
        transferFunds,
        addCategory,
        updateCategory,
        deleteCategory,
        addBudget,
        updateBudget,
        deleteBudget,
        updateBudgetSpent,
        addGoal,
        updateGoal,
        deleteGoal,
        topupGoal,
        addDebt,
        updateDebt,
        deleteDebt,
        markDebtStatus,
        addInvoice,
        updateInvoice,
        deleteInvoice,
        updateInvoiceStatus,
        addInvestment,
        updateInvestment,
        deleteInvestment,
        resetAllData,
        restoreData,
        filteredTransactions,
        filteredWallets,
        filteredBudgets,
        filteredInvestments,
        filteredDebts,
        totalBalance,
        totalInvestment,
        totalInvestmentInitial,
        totalInvestmentReturn,
        totalAssets,
        totalLiabilities,
        totalReceivables,
        totalNetWorth,
        totalIncome,
        totalExpense,
        netFlow,
        healthScore
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
