import React, { createContext, useContext, useState, useEffect, useMemo, useRef, ReactNode } from 'react';
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
import { StorageService, safeMergeEntityArray, purgeDemoData } from '../services/storage';
import { normalizeTransactions, upgradeMasterCategories, FINAL_MASTER_CATEGORIES } from '../utils/masterCategoryHelper';
import { calculateWalletBalance, recalculateAllWalletBalances, repairAndMigrateTransactions } from '../utils/balanceHelper';

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
  clearAllTransactions: () => Promise<void>;
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

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const rawT = StorageService.getTransactions();
    return normalizeTransactions(rawT);
  });
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const rawW = StorageService.getWallets();
    const rawT = StorageService.getTransactions();
    const repairedT = repairAndMigrateTransactions(rawT, rawW);
    return recalculateAllWalletBalances(rawW, repairedT);
  });
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
  const isSyncingRef = useRef<boolean>(false);
  const realtimeDebounceTimerRef = useRef<any>(null);

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

  // SMART AUTO-SYNC (Cloud -> Device): Pulls latest data from Supabase Cloud
  const pullCloudData = async (force = false): Promise<boolean> => {
    if (!currentUser) {
      if (force) openAuthModal();
      return false;
    }

    // Duplicate sync protection guard
    if (isSyncingRef.current) {
      console.log('[AutoSync] Sync request already in progress, skipping duplicate.');
      return false;
    }

    // 5-Minute Cooldown Check for automatic triggers
    const COOLDOWN_MS = 5 * 60 * 1000;
    const lastSync = StorageService.getLastSyncTimestamp();
    const elapsed = Date.now() - lastSync;

    if (!force && lastSync > 0 && elapsed < COOLDOWN_MS) {
      console.log(`[AutoSync] Cooldown active (${Math.round((COOLDOWN_MS - elapsed) / 1000)}s remaining), skipping auto-pull.`);
      return false;
    }

    isSyncingRef.current = true;
    setIsCloudSyncing(true);
    setSyncStatus('syncing');

    try {
      let remote = await SupabaseSyncService.fetchUserData(currentUser.id);
      
      // Ensure Cloud has the 8 canonical wallets & 18 master categories initialized for currentUser.id
      const isCloudMissingMaster = !remote || !remote.wallets || remote.wallets.length < 8;
      if (isCloudMissingMaster) {
        console.log('[AutoSync] Supabase Cloud missing master wallets/categories for current user ID -> Initializing 8 canonical wallets & 18 categories...');
        const {
          initialWallets,
          initialCategories,
          initialBudgets,
          initialGoals,
          initialBillsAndDebts,
          initialInvoices,
          initialInvestments,
          initialAuditLogs
        } = await import('../data/initialData');

        const canonicalMasterBundle = {
          wallets: initialWallets,
          transactions: [],
          categories: initialCategories,
          budgets: initialBudgets,
          goals: initialGoals,
          debts: initialBillsAndDebts,
          invoices: initialInvoices,
          investments: initialInvestments,
          auditLogs: initialAuditLogs
        };

        await SupabaseSyncService.saveFullUserBundle(currentUser.id, canonicalMasterBundle);
        remote = await SupabaseSyncService.fetchUserData(currentUser.id);
      }

      if (remote) {
        isRemoteUpdateRef.current = true;

        // Retrieve FRESH local state from StorageService
        const localWallets = StorageService.getWallets();
        const localTransactions = StorageService.getTransactions();
        const localCategories = StorageService.getCategories();
        const localBudgets = StorageService.getBudgets();
        const localGoals = StorageService.getGoals();
        const localDebts = StorageService.getDebts();
        const localInvoices = StorageService.getInvoices();
        const localInvestments = StorageService.getInvestments();
        const localAuditLogs = StorageService.getAuditLogs();

        // Perform Safe Merge for all 9 entities: Local-First + Cloud Sync
        const mergedWallets = safeMergeEntityArray('wallets', localWallets, remote.wallets || []);
        const rawMergedTransactions = safeMergeEntityArray('transactions', localTransactions, remote.transactions || []);
        const normMergedTransactions = normalizeTransactions(rawMergedTransactions);
        const mergedTransactions = repairAndMigrateTransactions(normMergedTransactions, mergedWallets);
        
        const upgradedCloudCategories = upgradeMasterCategories(remote.categories || []);
        const rawMergedCategories = safeMergeEntityArray('categories', localCategories, upgradedCloudCategories);
        const mergedCategories = upgradeMasterCategories(rawMergedCategories);

        const mergedBudgets = safeMergeEntityArray('budgets', localBudgets, remote.budgets || []);
        const mergedGoals = safeMergeEntityArray('goals', localGoals, remote.goals || []);
        const mergedDebts = safeMergeEntityArray('debts', localDebts, remote.debts || []);
        const mergedInvoices = safeMergeEntityArray('invoices', localInvoices, remote.invoices || []);
        const mergedInvestments = safeMergeEntityArray('investments', localInvestments, remote.investments || []);
        const mergedAuditLogs = safeMergeEntityArray('auditLogs', localAuditLogs, remote.auditLogs || []);

        console.log(`[SYNC DEBUG] wallets -> Local: ${localWallets.length}, Cloud: ${remote.wallets?.length || 0}, Merged: ${mergedWallets.length}`);
        console.log(`[SYNC DEBUG] transactions -> Local: ${localTransactions.length}, Cloud: ${remote.transactions?.length || 0}, Merged: ${mergedTransactions.length}`);

        const recalculatedWallets = recalculateAllWalletBalances(mergedWallets, mergedTransactions);

        setWallets(recalculatedWallets);
        setTransactions(mergedTransactions);
        setCategories(mergedCategories);
        setBudgets(mergedBudgets);
        setGoals(mergedGoals);
        setDebts(mergedDebts);
        setInvoices(mergedInvoices);
        setInvestments(mergedInvestments);
        setAuditLogs(mergedAuditLogs);

        // Save merged 9-entity cache to localStorage & update last sync timestamp
        const mergedBundle = {
          wallets: recalculatedWallets,
          transactions: mergedTransactions,
          categories: mergedCategories,
          budgets: mergedBudgets,
          goals: mergedGoals,
          debts: mergedDebts,
          invoices: mergedInvoices,
          investments: mergedInvestments,
          auditLogs: mergedAuditLogs
        };
        StorageService.saveAllEntities(mergedBundle);
        StorageService.saveLastSyncTimestamp(Date.now());

        // Incrementally sync upgraded 18 Master Categories to Supabase
        if (currentUser) {
          mergedCategories.forEach(cat => {
            SupabaseSyncService.upsertRow('categories', {
              id: cat.id,
              name: cat.name,
              type: cat.type,
              color: cat.color,
              icon: cat.icon,
              subcategories: cat.subcategories,
              scope: cat.scope || 'all'
            }, currentUser.id);
          });
        }

        // Flush genuine offline-created pending transactions if any exist in queue
        flushPendingQueue();

        setSyncStatus('synced');
        if (force && recalculatedWallets.length >= 8) {
          addToast('success', 'Data Diperbarui', 'Data terbaru berhasil disinkronkan dari Cloud.');
        }
        setTimeout(() => { isRemoteUpdateRef.current = false; }, 1500);
        return true;
      } else {
        // Sync failed: keep local data, don't erase cache or update timestamp
        setSyncStatus('error');
        if (force) {
          addToast('error', 'Gagal Memperbarui', 'Gagal mengambil data dari Cloud. Data lokal tetap aman.');
        }
        return false;
      }
    } catch (err) {
      console.error('[AutoSync] Exception in pullCloudData:', err);
      setSyncStatus('error');
      return false;
    } finally {
isSyncingRef.current = false;
      setIsCloudSyncing(false);
    }
  };

  // --- PENDING QUEUE & LIGHTWEIGHT AUTO-UPLOAD FOR NEW TRANSACTIONS ---
  const enqueuePendingTx = (tx: Transaction) => {
    const queue: Transaction[] = StorageService.getOfflineQueue();
    if (!queue.some(q => q.id === tx.id)) {
      const updatedQueue = [...queue, tx];
      StorageService.saveOfflineQueue(updatedQueue);
    }
  };

  const flushPendingQueue = async (): Promise<void> => {
    if (!currentUser || !navigator.onLine) return;
    const queue: Transaction[] = StorageService.getOfflineQueue();
    if (!queue || queue.length === 0) return;

    console.log(`[AutoUpload] Flushing ${queue.length} pending offline transaction(s)...`);
    const remainingQueue: Transaction[] = [];
    let successCount = 0;

    for (const tx of queue) {
      try {
        const txPayload = {
          id: tx.id,
          wallet_id: tx.walletId,
          type: tx.type,
          amount: tx.amount,
          currency: tx.currency,
          title: tx.title,
          category: tx.category,
          subcategory: tx.subcategory,
          scope: tx.scope,
          date: tx.date,
          note: tx.note
        };
        const ok = await SupabaseSyncService.upsertRow('transactions', txPayload, currentUser.id);
        if (ok) {
          successCount++;
        } else {
          remainingQueue.push(tx);
        }
      } catch (err) {
        console.warn(`[AutoUpload] Failed flushing tx ${tx.id}:`, err);
        remainingQueue.push(tx);
      }
    }

    StorageService.saveOfflineQueue(remainingQueue);

    if (successCount > 0) {
      StorageService.saveLastSyncTimestamp(Date.now());
      addToast('success', 'Transaksi Pending Tersinkron', `${successCount} transaksi lokal berhasil diunggah ke Cloud.`);
    }
  };

  const tryAutoUploadNewTx = async (tx: Transaction, targetWalletId: string, newWalletBalance: number) => {
    if (!currentUser || !navigator.onLine) {
      enqueuePendingTx(tx);
      addToast('info', 'Mode Offline', `Perangkat offline. Transaksi disimpan di perangkat.`);
      return;
    }

    try {
      const txPayload = {
        id: tx.id,
        wallet_id: tx.walletId,
        type: tx.type,
        amount: tx.amount,
        currency: tx.currency || 'IDR',
        title: tx.title,
        category: tx.category,
        subcategory: tx.subcategory || null,
        scope: tx.scope || 'all',
        date: tx.date,
        note: tx.note || null
      };

      const txOk = await SupabaseSyncService.upsertRow('transactions', txPayload, currentUser.id);

      if (txOk) {
        // Also update primary wallet balance in Cloud
        SupabaseSyncService.upsertRow('wallets', { id: targetWalletId, balance: newWalletBalance }, currentUser.id);
        StorageService.saveLastSyncTimestamp(Date.now());
        addToast('success', 'Transaksi Berhasil', `Berhasil mencatat ${tx.title} (Tersimpan & Tersinkron ke Cloud)`);
      } else {
        if (!navigator.onLine) {
          enqueuePendingTx(tx);
          addToast('info', 'Mode Offline', `Perangkat offline. Transaksi disimpan di perangkat.`);
        } else {
          console.error(`[AutoUpload] Transaction ${tx.id} failed to upload to Supabase Cloud DB.`);
          addToast('error', 'Gagal Sync Cloud', `Transaksi tersimpan di perangkat, namun gagal terunggah ke Cloud.`);
        }
      }
    } catch (err) {
      console.warn('[AutoUpload] Error during transaction auto-upload:', err);
      enqueuePendingTx(tx);
      addToast('info', 'Mode Offline', `Terjadi kendala. Transaksi disimpan di perangkat.`);
    }
  };

  // UPLOAD DATA (Device -> Cloud): Pushes local data to Supabase (Manual with Confirmation)
  const pushCloudData = async (): Promise<boolean> => {
    if (!currentUser) {
      openAuthModal();
      return false;
    }
    if (isSyncingRef.current) {
      addToast('warning', 'Proses Berjalan', 'Harap tunggu hingga proses sinkronisasi sebelumnya selesai.');
      return false;
    }
    isSyncingRef.current = true;
    setIsCloudSyncing(true);
    setSyncStatus('syncing');
    try {
      // Flush pending queue first
      await flushPendingQueue();

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
      if (success) {
        StorageService.saveLastSyncTimestamp(Date.now());
        setSyncStatus('synced');
        addToast('success', 'Unggah Data Berhasil', 'Data lokal berhasil dikirim dan tersimpan di Supabase Cloud.');
      } else {
        setSyncStatus('error');
        addToast('error', 'Unggah Data Gagal', 'Gagal mengirim data ke Supabase Cloud. Data lokal Anda tetap aman.');
      }
      return success;
    } catch (err) {
      console.error('[AutoSync] Exception in pushCloudData:', err);
      setSyncStatus('error');
      addToast('error', 'Unggah Data Gagal', 'Terjadi kesalahan saat mengirim data ke Cloud.');
      return false;
    } finally {
      isSyncingRef.current = false;
      setIsCloudSyncing(false);
    }
  };

  // Fetch & Subscribe to Supabase PostgreSQL Realtime Sync when user is authenticated
  useEffect(() => {
    if (!currentUser) {
      setSyncStatus('local_only');
      return;
    }

    const client = initSupabaseClient();
    if (!client) return;

    let isSubscribed = true;

    // Trigger initial forced smart pull when session is ready (bypasses cooldown)
    pullCloudData(true);
    flushPendingQueue();

    // Subscribe to Realtime Postgres changes with 2-second debounce
    const realtimeChannel = SupabaseSyncService.subscribeToUserRealtime(currentUser.id, () => {
      console.log('[AutoSync] Realtime change event received, debouncing 2s...');
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current);
      }
      realtimeDebounceTimerRef.current = setTimeout(() => {
        if (isSubscribed) {
          pullCloudData(true); // Force update on debounced realtime change
        }
      }, 2000);
    });

    return () => {
      isSubscribed = false;
      if (realtimeDebounceTimerRef.current) {
        clearTimeout(realtimeDebounceTimerRef.current);
      }
      if (realtimeChannel) {
        client.removeChannel(realtimeChannel);
      }
    };
  }, [currentUser]);

  // SUPABASE AUTH ACTIONS
  const loginWithSupabaseEmail = async (email: string, pass: string): Promise<boolean> => {
    const client = initSupabaseClient();
    if (!client) {
      addToast('error', 'Supabase Tidak Terhubung', 'Silakan konfigurasi URL dan ANON Key di tab Config DB.');
      return false;
    }

    try {
      const { data, error } = await client.auth.signInWithPassword({ email, password: pass });
      if (error) {
        const msg = error.message?.toLowerCase() || '';
        if (msg.includes('email not confirmed') || msg.includes('user not confirmed')) {
          addToast('warning', 'Email Belum Diverifikasi', 'Silakan verifikasi email Anda sebelum masuk.');
        } else if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials')) {
          addToast('error', 'Login Gagal', 'Email atau Password yang Anda masukkan salah.');
        } else if (msg.includes('user not found')) {
          addToast('error', 'Login Gagal', 'Akun dengan email tersebut tidak ditemukan.');
        } else {
          addToast('error', 'Login Gagal', error.message);
        }
        return false;
      }

      const user = data?.user || data?.session?.user;
      if (user) {
        setCurrentUser(user);
        addToast('success', 'Login Berhasil', `Terhubung sebagai ${user.email}`);
        return true;
      }

      addToast('error', 'Login Gagal', 'Data pengguna tidak ditemukan dari respons Supabase.');
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

  // Foreground Resume (visibilitychange) & Online Event Listeners
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && currentUser) {
        console.log('[AutoSync] App brought to foreground. Checking 5-minute cooldown...');
        pullCloudData(false);
      }
    };

    const handleOnline = () => {
      setIsOffline(false);
      addToast('success', 'Koneksi Pulih', 'Anda kembali online.');
      if (currentUser) {
        console.log('[AutoSync] Network online. Checking 5-minute cooldown...');
        pullCloudData(false);
        flushPendingQueue();
      }
    };

    const handleOffline = () => {
      setIsOffline(true);
      addToast('warning', 'Mode Offline', 'Perangkat tidak terhubung ke internet. Perubahan akan disimpan sementara.');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [currentUser]);

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

  // Single Source of Truth: Compute live recalculated wallet balances dynamically from current transaction history
  const liveWallets = useMemo(() => {
    return recalculateAllWalletBalances(wallets, transactions);
  }, [wallets, transactions]);

  // Filtered by active scope
  const filteredWallets = useMemo(() => {
    return liveWallets.filter(w => currentScope === 'all' || !w.scope || w.scope === 'all' || w.scope === currentScope);
  }, [liveWallets, currentScope]);

  const filteredTransactions = transactions.filter(t => currentScope === 'all' || !t.scope || t.scope === 'all' || t.scope === currentScope);
  const filteredBudgets = budgets.filter(b => currentScope === 'all' || !b.scope || b.scope === 'all' || b.scope === currentScope);
  const filteredInvestments = investments.filter(i => currentScope === 'all' || !i.scope || i.scope === 'all' || i.scope === currentScope);
  const filteredDebts = debts.filter(d => currentScope === 'all' || d.status === 'pending' || d.status === 'overdue');

  const totalBalance = useMemo(() => {
    return filteredWallets.reduce((sum, w) => sum + w.balance, 0);
  }, [filteredWallets]);
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
      id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString()
    };

    // 1. Save transaction locally FIRST
    setTransactions(prev => {
      const updatedTxs = [newTx, ...prev];
      StorageService.saveTransactions(updatedTxs);
      return updatedTxs;
    });

    // 2. Update wallet balance using central recalculation engine
    let updatedBal = 0;
    setWallets(prev => {
      const allTxs = [newTx, ...transactions];
      const nextWallets = recalculateAllWalletBalances(prev, allTxs);
      const primaryW = nextWallets.find(w => w.id === txData.walletId);
      if (primaryW) updatedBal = primaryW.balance;

      if (currentUser) {
        nextWallets.forEach(w => {
          SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: w.balance }, currentUser.id);
        });
      }
      StorageService.saveWallets(nextWallets);
      return nextWallets;
    });

    // 3. Update budget spent if expense
    if (txData.type === 'expense') {
      const category = categories.find(c => c.name === txData.category);
      if (category) {
        updateBudgetSpent(category.id, txData.amount);
      }
    }

    // 4. Lightweight transaction auto-upload to Cloud (non-blocking)
    tryAutoUploadNewTx(newTx, txData.walletId, updatedBal);
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

    // Recalculate wallet balances using central balance engine
    setWallets(prev => {
      const nextWallets = recalculateAllWalletBalances(prev, updated);
      if (currentUser) {
        nextWallets.forEach(w => {
          SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: w.balance }, currentUser.id);
        });
      }
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

    const newTx: Transaction = {
      id: `tx-tr-${Date.now()}`,
      type: 'transfer',
      amount,
      currency: source.currency,
      title: `Transfer ${source.name} ➔ ${target.name}`,
      category: 'Transfer Antar Wallet',
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

    const nextWallets = recalculateAllWalletBalances(wallets, nextTxs);
    setWallets(nextWallets);
    StorageService.saveWallets(nextWallets);

    if (currentUser) {
      nextWallets.forEach(w => {
        SupabaseSyncService.upsertRow('wallets', { id: w.id, balance: w.balance }, currentUser.id);
      });
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
        category: newBudget.categoryName,
        amount: newBudget.monthlyLimit,
        spent: newBudget.spent,
        period: newBudget.period
      }, currentUser.id);
    }

    addToast('success', 'Anggaran Dibuat', `Target anggaran ${newBudget.categoryName} diset Rp ${newBudget.monthlyLimit.toLocaleString('id-ID')}`);
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
        category: updatedBudget.categoryName,
        amount: updatedBudget.monthlyLimit,
        spent: updatedBudget.spent,
        period: updatedBudget.period
      }, currentUser.id);
    }

    addToast('info', 'Anggaran Diperbarui', `Batas anggaran ${updatedBudget.categoryName} telah diperbarui.`);
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
        person: newDebt.party || '',
        title: newDebt.title,
        amount: newDebt.amount,
        due_date: newDebt.dueDate,
        status: newDebt.status,
        notes: newDebt.note || ''
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
        person: updatedDebt.party || '',
        title: updatedDebt.title,
        amount: updatedDebt.amount,
        due_date: updatedDebt.dueDate,
        status: updatedDebt.status,
        notes: updatedDebt.note || ''
      }, currentUser.id);
    }

    addToast('info', 'Tagihan Diperbarui', `Catatan ${updatedDebt.title} telah diperbarui.`);
  };

  const deleteDebt = (id: string) => {
    const targetDebt = debts.find(x => x.id === id);
    setDebts(prev => {
      const next = prev.filter(x => x.id !== id);
      StorageService.saveDebts(next);
      return next;
    });
    if (currentUser) {
      SupabaseSyncService.deleteRow('debts', id, currentUser.id);
    }
    addToast('info', 'Tagihan Dihapus', targetDebt ? `Catatan "${targetDebt.title}" telah dihapus.` : 'Catatan tagihan / hutang telah dihapus.');
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

  /**
   * SURGICAL: Hapus HANYA semua transaksi milik user yang sedang login.
   * Tidak menyentuh wallet, kategori, budget, goals, debts, invoices, investments, audit logs.
   */
  const clearAllTransactions = async (): Promise<void> => {
    const beforeCount = transactions.length;
    const walletsBefore = wallets.length;
    console.log(`[clearAllTransactions] BEFORE: transactions=${beforeCount}, wallets=${walletsBefore}`);

    // 1. Clear React state immediately
    setTransactions([]);

    // 2. Clear localStorage transactions
    StorageService.saveTransactions([]);

    // 3. Clear offline/pending queue so old transactions cannot re-appear
    StorageService.saveOfflineQueue([]);

    // 4. Bulk delete from Supabase (only for logged-in user)
    let cloudResult = { success: false, deletedCount: 0 };
    if (currentUser) {
      cloudResult = await SupabaseSyncService.deleteAllUserTransactions(currentUser.id);
    }

    const walletIds = wallets.map(w => `${w.name}(${w.id})`).join(', ');
    console.log(`[clearAllTransactions] AFTER: transactions=0, wallets=${wallets.length}`);
    console.log(`[clearAllTransactions] Wallets preserved: ${walletIds}`);
    console.log(`[clearAllTransactions] Supabase result:`, cloudResult);

    addToast(
      cloudResult.success ? 'success' : 'info',
      'Transaksi Dihapus',
      currentUser
        ? `${beforeCount} transaksi lokal dihapus. Cloud: ${cloudResult.deletedCount} baris dihapus dari Supabase.`
        : `${beforeCount} transaksi lokal dihapus. (Offline mode — Supabase tidak tersentuh.)`
    );
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
        clearAllTransactions,
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
