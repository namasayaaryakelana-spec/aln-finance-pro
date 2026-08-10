import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { initSupabaseClient } from '../lib/supabase';
import { SupabaseSyncService, SupabaseUserBundle } from '../services/supabaseSync';
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
  currentUser: SupabaseUser | null;
  loginWithSupabaseEmail: (e: string, p: string) => Promise<boolean>;
  signUpWithSupabaseEmail: (e: string, p: string) => Promise<boolean>;
  loginWithSupabaseGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  pushCloudData: () => Promise<boolean>;
  pullCloudData: () => Promise<boolean>;
  currentScope: Scope;
  setScope: (scope: Scope) => void;
  currentCurrency: Currency;
  setCurrency: (currency: Currency) => void;

  syncStatus: SyncStatus;
  isCloudSyncing: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;

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
  const [currentUser, setCurrentUser] = useState<SupabaseUser | null>(null);
  const [currentScope, setScopeState] = useState<Scope>('personal');
  const [currentCurrency, setCurrency] = useState<Currency>('IDR');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

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

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Initialize Supabase Auth Listener & Session Persistence
  useEffect(() => {
    const client = initSupabaseClient();
    if (!client) {
      setSyncStatus('local_only');
      return;
    }

    client.auth.getSession().then(({ data }) => {
      if (data.session?.user) {
        setCurrentUser(data.session.user);
      }
    });

    const { data: authSubscription } = client.auth.onAuthStateChange((_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        setSyncStatus('syncing');
      } else {
        setSyncStatus('local_only');
      }
    });

    return () => {
      authSubscription.subscription.unsubscribe();
    };
  }, []);

  // Fetch & Subscribe to Supabase PostgreSQL Realtime Sync when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setSyncStatus('local_only');
      return;
    }

    const client = initSupabaseClient();
    if (!client) return;

    let isSubscribed = true;
    setSyncStatus('syncing');

    const loadData = async () => {
      const remote = await SupabaseSyncService.fetchUserData(currentUser.id);
      if (!isSubscribed) return;

      if (remote && (remote.wallets.length > 0 || remote.transactions.length > 0)) {
        isRemoteUpdateRef.current = true;
        setWallets(remote.wallets);
        setTransactions(remote.transactions);
        setCategories(remote.categories.length ? remote.categories : categories);
        setBudgets(remote.budgets);
        setGoals(remote.goals);
        setDebts(remote.debts);
        setInvoices(remote.invoices);
        setInvestments(remote.investments);
        if (remote.auditLogs.length) setAuditLogs(remote.auditLogs);

        // Save light cache
        StorageService.saveWallets(remote.wallets);
        StorageService.saveTransactions(remote.transactions);
        setSyncStatus('synced');

        setTimeout(() => { isRemoteUpdateRef.current = false; }, 1500);
      } else {
        // First time user or empty database -> seed initial bundle to Supabase PostgreSQL
        const initialBundle: SupabaseUserBundle = {
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
        await SupabaseSyncService.saveFullUserBundle(currentUser.id, initialBundle);
        setSyncStatus('synced');
      }
    };

    loadData();

    // Subscribe to Realtime Postgres changes across devices
    const realtimeChannel = SupabaseSyncService.subscribeToUserRealtime(currentUser.id, () => {
      loadData();
    });

    return () => {
      isSubscribed = false;
      if (realtimeChannel) {
        client.removeChannel(realtimeChannel);
      }
    };
  }, [currentUser]);

  // SUPABASE AUTH ACTIONS
  const loginWithSupabaseEmail = async (email: string, pass: string): Promise<boolean> => {
    const client = initSupabaseClient();
    if (!client) {
      addToast('error', 'Supabase Not Configured', 'Konfigurasikan Supabase URL & Anon Key di menu Auth Modal.');
      return false;
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) {
        addToast('error', 'Login Gagal', error.message);
        return false;
      }
      if (data.user) {
        setCurrentUser(data.user);
        addToast('success', 'Supabase Login Berhasil', `Terhubung sebagai ${data.user.email}`);
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', 'Login Error', err.message || String(err));
      return false;
    }
  };

  const signUpWithSupabaseEmail = async (email: string, pass: string): Promise<boolean> => {
    const client = initSupabaseClient();
    if (!client) {
      addToast('error', 'Supabase Not Configured', 'Konfigurasikan Supabase URL & Anon Key di menu Auth Modal.');
      return false;
    }

    try {
      const { data, error } = await client.auth.signUp({ email, password: pass });
      if (error) {
        addToast('error', 'Registrasi Gagal', error.message);
        return false;
      }
      if (data.user) {
        setCurrentUser(data.user);
        addToast('success', 'Akun Berhasil Dibuat', 'Email terverifikasi & terhubung ke Supabase PostgreSQL Cloud.');
        return true;
      }
      return false;
    } catch (err: any) {
      addToast('error', 'SignUp Error', err.message || String(err));
      return false;
    }
  };

  const loginWithSupabaseGoogle = async () => {
    const client = initSupabaseClient();
    if (!client) {
      addToast('error', 'Supabase Not Configured', 'Konfigurasikan Supabase URL & Anon Key terlebih dahulu.');
      return;
    }
    try {
      await client.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin }
      });
    } catch (err: any) {
      addToast('error', 'Google Auth Error', err.message || String(err));
    }
  };

  const logout = async () => {
    const client = initSupabaseClient();
    if (client) {
      await client.auth.signOut();
    }
    setCurrentUser(null);
    setSyncStatus('local_only');
    addToast('info', 'Logged Out', 'Berhasil keluar dari akun Supabase.');
  };

  const pushCloudData = async (): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal();
      return false;
    }
    setIsCloudSyncing(true);
    setSyncStatus('syncing');
    const success = await SupabaseSyncService.saveFullUserBundle(currentUser.id, {
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
      addToast('success', 'Sync PostgreSQL Berhasil', 'Seluruh data berhasil diunggah ke Supabase PostgreSQL.');
    } else {
      setSyncStatus('error');
      addToast('error', 'Sync Gagal', 'Gagal mengunggah data ke Supabase.');
    }
    return success;
  };

  const pullCloudData = async (): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal();
      return false;
    }
    setIsCloudSyncing(true);
    setSyncStatus('syncing');
    const remote = await SupabaseSyncService.fetchUserData(currentUser.id);
    setIsCloudSyncing(false);
    if (remote) {
      setWallets(remote.wallets);
      setTransactions(remote.transactions);
      setCategories(remote.categories.length ? remote.categories : categories);
      setBudgets(remote.budgets);
      setGoals(remote.goals);
      setDebts(remote.debts);
      setInvoices(remote.invoices);
      setInvestments(remote.investments);
      if (remote.auditLogs.length) setAuditLogs(remote.auditLogs);

      setSyncStatus('synced');
      addToast('success', 'Download Berhasil', 'Data diperbarui langsung dari Supabase PostgreSQL.');
      return true;
    }
    return false;
  };

  // Online / Offline listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      addToast('success', 'Koneksi Pulih', 'Anda kembali online. Data otomatis tersinkronkan.');
    };
    const handleOffline = () => {
      setIsOffline(true);
      addToast('warning', 'Mode Offline', 'Perangkat tidak terhubung ke internet. Perubahan akan disimpan sementara.');
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
  let score = 70;
  if (totalIncome === 0 && totalExpense === 0) {
    score = 70;
  } else if (totalIncome === 0 && totalExpense > 0) {
    score = 40;
  } else if (totalIncome > 0) {
    const savingsRate = (netFlow / totalIncome) * 100;
    if (savingsRate >= 30) score += 20;
    else if (savingsRate >= 15) score += 10;
    else if (savingsRate >= 0) score += 0;
    else score -= 25;
  }

  const overbudgetCount = filteredBudgets.filter(b => b.spent > b.amount).length;
  if (overbudgetCount > 0) score -= overbudgetCount * 10;
  if (totalAssets > 0 && totalLiabilities > totalAssets) {
    score -= 15;
  }
  const healthScore = Math.min(100, Math.max(10, Math.round(score)));

  // --- ACTIONS (SYNCED TO SUPABASE POSTGRESQL & STATE) ---
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
          const newBal = w.balance + delta;
          if (currentUser) {
            SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: newBal }, currentUser.id);
          }
          return { ...w, balance: newBal };
        }
        return w;
      });
      StorageService.saveWallets(nextWallets);
      return nextWallets;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('transactions', {
        id: newTx.id,
        wallet_id: newTx.walletId,
        type: newTx.type,
        amount: newTx.amount,
        currency: newTx.currency,
        title: newTx.title,
        category: newTx.category,
        subcategory: newTx.subcategory,
        scope: newTx.scope,
        date: newTx.date,
        note: newTx.note
      }, currentUser.id);
    }

    // Update budget spent if expense
    if (txData.type === 'expense') {
      const category = categories.find(c => c.name === txData.category);
      if (category) {
        updateBudgetSpent(category.id, txData.amount);
      }
    }

    addToast('success', 'Transaksi Berhasil', `Berhasil mencatat ${txData.title}`);
  };

  const deleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    StorageService.saveTransactions(updated);

    if (currentUser) {
      SupabaseSyncService.deleteRow('transactions', id, currentUser.id);
    }

    // Revert wallet balance
    setWallets(prev => {
      const nextWallets = prev.map(w => {
        if (w.id === tx.walletId) {
          const delta = tx.type === 'income' ? -tx.amount : tx.amount;
          const newBal = w.balance + delta;
          if (currentUser) {
            SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: newBal }, currentUser.id);
          }
          return { ...w, balance: newBal };
        }
        return w;
      });
      StorageService.saveWallets(nextWallets);
      return nextWallets;
    });

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

    if (currentUser) {
      SupabaseSyncService.upsertRow('wallets', {
        id: newWallet.id,
        name: newWallet.name,
        type: newWallet.type,
        currency: newWallet.currency,
        balance: newWallet.balance,
        account_number: newWallet.accountNumber,
        scope: newWallet.scope,
        color: newWallet.color,
        is_default: newWallet.isDefault
      }, currentUser.id);
    }

    addToast('success', 'Dompet Ditambahkan', `Akun/Dompet ${newWallet.name} berhasil dibuat.`);
  };

  const updateWallet = (updatedWallet: Wallet) => {
    const nextWallets = wallets.map(w => (w.id === updatedWallet.id ? updatedWallet : w));
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

    if (currentUser) {
      SupabaseSyncService.upsertRow('wallets', {
        id: updatedWallet.id,
        name: updatedWallet.name,
        type: updatedWallet.type,
        currency: updatedWallet.currency,
        balance: updatedWallet.balance,
        account_number: updatedWallet.accountNumber,
        scope: updatedWallet.scope,
        color: updatedWallet.color,
        is_default: updatedWallet.isDefault
      }, currentUser.id);
    }

    addToast('info', 'Dompet Diperbarui', `Informasi ${updatedWallet.name} disimpan.`);
  };

  const deleteWallet = (id: string) => {
    const nextWallets = wallets.filter(x => x.id !== id);
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

    if (currentUser) {
      SupabaseSyncService.deleteRow('wallets', id, currentUser.id);
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

    const nextWallets = wallets.map(w => {
      if (w.id === fromWalletId) {
        const newBal = w.balance - amount;
        if (currentUser) SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: newBal }, currentUser.id);
        return { ...w, balance: newBal };
      }
      if (w.id === toWalletId) {
        const newBal = w.balance + amount;
        if (currentUser) SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: newBal }, currentUser.id);
        return { ...w, balance: newBal };
      }
      return w;
    });
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

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

    if (currentUser) {
      SupabaseSyncService.upsertRow('transactions', {
        id: newTx.id,
        wallet_id: newTx.walletId,
        type: newTx.type,
        amount: newTx.amount,
        currency: newTx.currency,
        title: newTx.title,
        category: newTx.category,
        scope: newTx.scope,
        date: newTx.date,
        note: newTx.note
      }, currentUser.id);
    }

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

    if (currentUser) {
      SupabaseSyncService.upsertRow('categories', {
        id: newCat.id,
        name: newCat.name,
        type: newCat.type,
        color: newCat.color,
        icon: newCat.icon,
        subcategories: newCat.subcategories,
        scope: newCat.scope
      }, currentUser.id);
    }

    addToast('success', 'Kategori Dibuat', `Kategori ${newCat.name} ditambahkan.`);
  };

  const updateCategory = (updatedCat: Category) => {
    const nextCategories = categories.map(c => (c.id === updatedCat.id ? updatedCat : c));
    setCategories(nextCategories);
    StorageService.saveCategories(nextCategories);

    if (currentUser) {
      SupabaseSyncService.upsertRow('categories', {
        id: updatedCat.id,
        name: updatedCat.name,
        type: updatedCat.type,
        color: updatedCat.color,
        icon: updatedCat.icon,
        subcategories: updatedCat.subcategories,
        scope: updatedCat.scope
      }, currentUser.id);
    }

    addToast('info', 'Kategori Diperbarui', `Kategori ${updatedCat.name} berhasil diperbarui.`);
  };

  const deleteCategory = (id: string) => {
    const nextCategories = categories.filter(c => c.id !== id);
    setCategories(nextCategories);
    StorageService.saveCategories(nextCategories);

    if (currentUser) {
      SupabaseSyncService.deleteRow('categories', id, currentUser.id);
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

    if (currentUser) {
      SupabaseSyncService.upsertRow('budgets', {
        id: newBudget.id,
        category: newBudget.category,
        amount: newBudget.amount,
        spent: newBudget.spent,
        period: newBudget.period
      }, currentUser.id);
    }

    addToast('success', 'Anggaran Dibuat', `Target anggaran ${newBudget.category} diset Rp ${newBudget.amount.toLocaleString('id-ID')}`);
  };

  const updateBudget = (updatedBudget: Budget) => {
    setBudgets(prev => {
      const next = prev.map(b => (b.id === updatedBudget.id ? updatedBudget : b));
      StorageService.saveBudgets(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('budgets', {
        id: updatedBudget.id,
        category: updatedBudget.category,
        amount: updatedBudget.amount,
        spent: updatedBudget.spent,
        period: updatedBudget.period
      }, currentUser.id);
    }

    addToast('info', 'Anggaran Diperbarui', `Batas anggaran ${updatedBudget.category} telah diperbarui.`);
  };

  const deleteBudget = (id: string) => {
    setBudgets(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveBudgets(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('budgets', id, currentUser.id);
    }
  };

  const updateBudgetSpent = (categoryId: string, amountChange: number) => {
    setBudgets(prev => {
      const nextBudgets = prev.map(b => {
        if (b.category === categoryId) {
          const newSpent = b.spent + amountChange;
          if (currentUser) {
            SupabaseSyncService.upsertRow('budgets', { id: b.id, spent: newSpent }, currentUser.id);
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

    if (currentUser) {
      SupabaseSyncService.upsertRow('goals', {
        id: newGoal.id,
        title: newGoal.title,
        target_amount: newGoal.targetAmount,
        current_amount: newGoal.currentAmount,
        deadline: newGoal.deadline,
        color: newGoal.color
      }, currentUser.id);
    }

    addToast('success', 'Target Tabungan Dibuat', `Financial Goal: ${newGoal.title}`);
  };

  const updateGoal = (updatedGoal: FinancialGoal) => {
    setGoals(prev => {
      const next = prev.map(g => (g.id === updatedGoal.id ? updatedGoal : g));
      StorageService.saveGoals(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('goals', {
        id: updatedGoal.id,
        title: updatedGoal.title,
        target_amount: updatedGoal.targetAmount,
        current_amount: updatedGoal.currentAmount,
        deadline: updatedGoal.deadline,
        color: updatedGoal.color
      }, currentUser.id);
    }

    addToast('info', 'Target Goal Diperbarui', `Target ${updatedGoal.title} disimpan.`);
  };

  const deleteGoal = (id: string) => {
    setGoals(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveGoals(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('goals', id, currentUser.id);
    }
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

        const newBal = wallet.balance - amount;
        const nextWallets = wallets.map(w => (w.id === walletId ? { ...w, balance: newBal } : w));
        setWallets(nextWallets);
        StorageService.saveWallets(nextWallets);

        if (currentUser) {
          SupabaseSyncService.upsertRow('wallets', { id: walletId, balance: newBal }, currentUser.id);
        }

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

        if (currentUser) {
          SupabaseSyncService.upsertRow('transactions', {
            id: newTx.id,
            wallet_id: newTx.walletId,
            type: newTx.type,
            amount: newTx.amount,
            currency: newTx.currency,
            title: newTx.title,
            category: newTx.category,
            scope: newTx.scope,
            date: newTx.date,
            note: newTx.note
          }, currentUser.id);
        }
      }
    }

    const newCurrAmt = targetGoal.currentAmount + amount;
    setGoals(prev => {
      const next = prev.map(g => (g.id === goalId ? { ...g, currentAmount: newCurrAmt } : g));
      StorageService.saveGoals(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('goals', { id: goalId, current_amount: newCurrAmt }, currentUser.id);
    }

    addToast('success', 'Top-up Target Berhasil', `Menambahkan Rp ${amount.toLocaleString('id-ID')} ke target "${targetGoal.title}".`);
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

    if (currentUser) {
      SupabaseSyncService.upsertRow('debts', {
        id: newDebt.id,
        type: newDebt.type,
        person: newDebt.person,
        title: newDebt.title,
        amount: newDebt.amount,
        due_date: newDebt.dueDate,
        status: newDebt.status,
        notes: newDebt.notes
      }, currentUser.id);
    }

    addToast('success', 'Catatan Tagihan / Hutang', `Pengingat ${newDebt.title} ditambahkan.`);
  };

  const updateDebt = (updatedDebt: BillAndDebt) => {
    setDebts(prev => {
      const next = prev.map(d => (d.id === updatedDebt.id ? updatedDebt : d));
      StorageService.saveDebts(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('debts', {
        id: updatedDebt.id,
        type: updatedDebt.type,
        person: updatedDebt.person,
        title: updatedDebt.title,
        amount: updatedDebt.amount,
        due_date: updatedDebt.dueDate,
        status: updatedDebt.status,
        notes: updatedDebt.notes
      }, currentUser.id);
    }

    addToast('info', 'Tagihan Diperbarui', `Catatan ${updatedDebt.title} telah diperbarui.`);
  };

  const deleteDebt = (id: string) => {
    setDebts(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveDebts(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('debts', id, currentUser.id);
    }
  };

  const markDebtStatus = (debtId: string, status: 'pending' | 'paid' | 'overdue') => {
    setDebts(prev => {
      const next = prev.map(d => (d.id === debtId ? { ...d, status } : d));
      StorageService.saveDebts(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.upsertRow('debts', { id: debtId, status }, currentUser.id);
    }
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

    if (currentUser) {
      SupabaseSyncService.upsertRow('invoices', {
        id: newInvoice.id,
        invoice_number: newInvoice.invoiceNumber,
        company_name: newInvoice.companyName,
        company_email: newInvoice.companyEmail,
        company_phone: newInvoice.companyPhone,
        company_address: newInvoice.companyAddress,
        company_bank_details: newInvoice.companyBankDetails,
        client_name: newInvoice.clientName,
        client_email: newInvoice.clientEmail,
        client_address: newInvoice.clientAddress,
        issue_date: newInvoice.issueDate,
        due_date: newInvoice.dueDate,
        notes: newInvoice.notes,
        items: newInvoice.items,
        subtotal: newInvoice.subtotal,
        tax: newInvoice.tax,
        discount: newInvoice.discount,
        total: newInvoice.total,
        status: newInvoice.status
      }, currentUser.id);
    }

    addToast('success', 'Invoice Diterbitkan', `Invoice ${newInvoice.invoiceNumber} siap dikirim atau dicetak.`);
  };

  const updateInvoice = (updatedInv: Invoice) => {
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === updatedInv.id ? updatedInv : inv));
      StorageService.saveInvoices(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('invoices', {
        id: updatedInv.id,
        invoice_number: updatedInv.invoiceNumber,
        company_name: updatedInv.companyName,
        company_email: updatedInv.companyEmail,
        company_phone: updatedInv.companyPhone,
        company_address: updatedInv.companyAddress,
        company_bank_details: updatedInv.companyBankDetails,
        client_name: updatedInv.clientName,
        client_email: updatedInv.clientEmail,
        client_address: updatedInv.clientAddress,
        issue_date: updatedInv.issueDate,
        due_date: updatedInv.dueDate,
        notes: updatedInv.notes,
        items: updatedInv.items,
        subtotal: updatedInv.subtotal,
        tax: updatedInv.tax,
        discount: updatedInv.discount,
        total: updatedInv.total,
        status: updatedInv.status
      }, currentUser.id);
    }

    addToast('info', 'Invoice Diperbarui', `Invoice ${updatedInv.invoiceNumber} telah diperbarui.`);
  };

  const deleteInvoice = (id: string) => {
    setInvoices(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveInvoices(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('invoices', id, currentUser.id);
    }
  };

  const updateInvoiceStatus = (invoiceId: string, status: 'pending' | 'paid' | 'overdue') => {
    setInvoices(prev => {
      const next = prev.map(inv => (inv.id === invoiceId ? { ...inv, status } : inv));
      StorageService.saveInvoices(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.upsertRow('invoices', { id: invoiceId, status }, currentUser.id);
    }
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

    if (currentUser) {
      SupabaseSyncService.upsertRow('investments', {
        id: newInv.id,
        name: newInv.name,
        category: newInv.category,
        initial_amount: newInv.initialAmount,
        current_amount: newInv.currentAmount,
        return_percentage: newInv.returnPercentage,
        units: newInv.units,
        platform: newInv.platform,
        scope: newInv.scope,
        notes: newInv.notes
      }, currentUser.id);
    }

    addToast('success', 'Investasi Ditambahkan', `Aset ${newInv.name} dicatat.`);
  };

  const updateInvestment = (updatedInv: Investment) => {
    setInvestments(prev => {
      const next = prev.map(i => (i.id === updatedInv.id ? updatedInv : i));
      StorageService.saveInvestments(next);
      return next;
    });

    if (currentUser) {
      SupabaseSyncService.upsertRow('investments', {
        id: updatedInv.id,
        name: updatedInv.name,
        category: updatedInv.category,
        initial_amount: updatedInv.initialAmount,
        current_amount: updatedInv.currentAmount,
        return_percentage: updatedInv.returnPercentage,
        units: updatedInv.units,
        platform: updatedInv.platform,
        scope: updatedInv.scope,
        notes: updatedInv.notes
      }, currentUser.id);
    }

    addToast('info', 'Investasi Diperbarui', `Portofolio ${updatedInv.name} telah disimpan.`);
  };

  const deleteInvestment = (id: string) => {
    setInvestments(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveInvestments(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('investments', id, currentUser.id);
    }
  };

  const resetAllData = () => {
    StorageService.resetToDefault();
    setWallets([]);
    setTransactions([]);
    setBudgets([]);
    setGoals([]);
    setDebts([]);
    setInvoices([]);
    setInvestments([]);
    setAuditLogs([]);
    addToast('info', 'Reset Database', 'Seluruh data aplikasi telah dibersihkan.');
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

      if (currentUser) {
        pushCloudData();
      }
      addToast('success', 'Restore Selesai', 'Data dipulihkan dan disinkronkan ke Supabase.');
    } catch (e: any) {
      addToast('error', 'Gagal Restore Data', e.message || 'File tidak valid.');
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        currentUser,
        loginWithSupabaseEmail,
        signUpWithSupabaseEmail,
        loginWithSupabaseGoogle,
        logout,
        pushCloudData,
        pullCloudData,
        currentScope,
        setScope,
        currentCurrency,
        setCurrency,
        syncStatus,
        isCloudSyncing,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
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
