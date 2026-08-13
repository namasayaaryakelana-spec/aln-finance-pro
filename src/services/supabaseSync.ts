import { RealtimeChannel } from '@supabase/supabase-js';
import { initSupabaseClient } from '../lib/supabase';
import { getCanonicalAccountNumber } from '../utils/balanceHelper';
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

export interface SupabaseUserBundle {
  wallets: Wallet[];
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  goals: FinancialGoal[];
  debts: BillAndDebt[];
  invoices: Invoice[];
  investments: Investment[];
  auditLogs: AuditLog[];
}

export const SupabaseSyncService = {
  /**
   * Fetch all 9 domain entities for a logged in user from Supabase PostgreSQL
   */
  async fetchUserData(userId: string): Promise<SupabaseUserBundle | null> {
    const client = initSupabaseClient();
    if (!client) return null;

    try {
      const [
        { data: rawWallets },
        { data: rawTxs },
        { data: rawCats },
        { data: rawBudgets },
        { data: rawGoals },
        { data: rawDebts },
        { data: rawInvoices },
        { data: rawInvestments },
        { data: rawLogs }
      ] = await Promise.all([
        client.from('wallets').select('*').eq('user_id', userId),
        client.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
        client.from('categories').select('*').eq('user_id', userId),
        client.from('budgets').select('*').eq('user_id', userId),
        client.from('goals').select('*').eq('user_id', userId),
        client.from('debts').select('*').eq('user_id', userId),
        client.from('invoices').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        client.from('investments').select('*').eq('user_id', userId),
        client.from('audit_logs').select('*').eq('user_id', userId).order('timestamp', { ascending: false }).limit(100)
      ]);

      const wallets: Wallet[] = (rawWallets || []).map((w: any) => ({
        id: w.id,
        name: w.name,
        type: w.type,
        currency: w.currency || 'IDR',
        balance: Number(w.balance || 0),
        accountNumber: w.account_number || getCanonicalAccountNumber(w.id, w.name) || '',
        icon: w.icon || 'Wallet',
        scope: w.scope || 'all',
        color: w.color || '#D4AF37',
        isDefault: Boolean(w.is_default)
      }));

      const transactions: Transaction[] = (rawTxs || []).map((t: any) => ({
        id: t.id,
        walletId: t.wallet_id || '',
        type: t.type,
        amount: Number(t.amount || 0),
        currency: t.currency || 'IDR',
        title: t.title,
        category: t.category,
        subcategory: t.subcategory || undefined,
        scope: t.scope || 'all',
        date: t.date,
        note: t.note || undefined,
        createdAt: t.created_at
      }));

      const categories: Category[] = (rawCats || []).map((c: any) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        color: c.color || '#D4AF37',
        icon: c.icon || 'Tag',
        subcategories: Array.isArray(c.subcategories) ? c.subcategories : [],
        scope: c.scope || 'all'
      }));

      const budgets: Budget[] = (rawBudgets || []).map((b: any) => ({
        id: b.id,
        categoryId: b.category_id || b.categoryId || b.id || 'cat-general',
        categoryName: b.category || b.categoryName || 'Umum',
        monthlyLimit: Number(b.amount || b.monthlyLimit || 0),
        spent: Number(b.spent || 0),
        scope: b.scope || 'all',
        period: b.period || 'monthly'
      }));

      const goals: FinancialGoal[] = (rawGoals || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        targetAmount: Number(g.target_amount || g.targetAmount || 0),
        currentAmount: Number(g.current_amount || g.currentAmount || 0),
        deadline: g.deadline || '',
        category: g.category || 'Umum',
        color: g.color || '#D4AF37',
        icon: g.icon || 'Target'
      }));

      const debts: BillAndDebt[] = (rawDebts || []).map((d: any) => ({
        id: d.id,
        type: d.type || 'bill',
        party: d.person || d.party || '',
        title: d.title,
        amount: Number(d.amount || 0),
        dueDate: d.due_date || d.dueDate || '',
        status: d.status || 'pending',
        note: d.notes || d.note || undefined
      }));

      const invoices: Invoice[] = (rawInvoices || []).map((i: any) => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        companyName: i.company_name,
        companyEmail: i.company_email,
        companyPhone: i.company_phone,
        companyAddress: i.company_address,
        companyBankDetails: i.company_bank_details,
        clientName: i.client_name,
        clientEmail: i.client_email,
        clientAddress: i.client_address,
        issueDate: i.issue_date,
        dueDate: i.due_date,
        notes: i.notes,
        items: Array.isArray(i.items) ? i.items : [],
        subtotal: Number(i.subtotal || 0),
        tax: Number(i.tax || 0),
        discount: Number(i.discount || 0),
        total: Number(i.total || 0),
        status: i.status || 'pending',
        createdAt: i.created_at
      }));

      const investments: Investment[] = (rawInvestments || []).map((inv: any) => ({
        id: inv.id,
        name: inv.name,
        category: inv.category,
        initialAmount: Number(inv.initial_amount || 0),
        currentAmount: Number(inv.current_amount || 0),
        returnPercentage: Number(inv.return_percentage || 0),
        units: inv.units ? Number(inv.units) : undefined,
        platform: inv.platform || '',
        scope: inv.scope || 'personal',
        notes: inv.notes || undefined
      }));

      const auditLogs: AuditLog[] = (rawLogs || []).map((l: any) => ({
        id: l.id,
        timestamp: l.timestamp || l.created_at,
        user: l.details || 'User',
        role: l.role || 'Pemilik Bisnis',
        action: l.action,
        module: l.module,
        details: l.details
      }));

      return {
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
    } catch (err) {
      console.warn('[SupabaseSyncService] Error fetching user data:', err);
      return null;
    }
  },

  /**
   * Subscribe to Supabase Realtime channel across PostgreSQL tables
   */
  subscribeToUserRealtime(
    userId: string,
    onRealtimeChange: () => void
  ): RealtimeChannel | null {
    const client = initSupabaseClient();
    if (!client || !userId) return null;

    try {
      const channel = client
        .channel(`public-user-sync:${userId}`)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', filter: `user_id=eq.${userId}` },
          (payload) => {
            console.log('[SupabaseRealtime] PostgreSQL change detected:', payload.eventType, payload.table);
            onRealtimeChange();
          }
        )
        .subscribe();

      return channel;
    } catch (err) {
      console.warn('[SupabaseRealtime] Error establishing subscription:', err);
      return null;
    }
  },

  // Save / Upsert Single Record to PostgreSQL
  async upsertRow(tableName: string, record: any, userId: string): Promise<boolean> {
    const client = initSupabaseClient();
    if (!client) {
      console.error('[DIAG] upsertRow: initSupabaseClient() returned NULL — TITIK GAGAL: client tidak tersedia');
      return false;
    }

    try {
      // Verify active session for RLS compliance
      const { data: sessionData } = await client.auth.getSession();
      const activeUser = sessionData?.session?.user;

      // ===== [DIAG-LOG] SESSION CHECK =====
      console.log('[DIAG] upsertRow: SESSION CHECK', {
        table: tableName,
        activeUserId: activeUser?.id ?? 'NULL',
        targetUserId: userId,
        sessionMatch: activeUser?.id === userId
      });
      
      if (!activeUser) {
        console.warn(`[DIAG] upsertRow: TITIK GAGAL — No active session! table=${tableName}, userId=${userId}`);
      } else if (activeUser.id !== userId) {
        console.warn(`[DIAG] upsertRow: TITIK GAGAL — Session user ID MISMATCH! session=${activeUser.id} vs target=${userId}`);
      }

      const payload = {
        ...record,
        user_id: userId
        // NOTE: updated_at is NOT auto-injected here.
        // If your schema has updated_at, add it explicitly in the record payload.
        // Auto-injecting it caused HTTP 400 on tables that don't have this column.
      };

      // ===== [WALLET SYNC] Specific log for wallet upserts =====
      if (tableName === 'wallets') {
        console.log('[WALLET SYNC]', {
          wallet_id: record.id,
          wallet_name: record.name ?? 'MISSING_NAME',
          payload_name: payload.name ?? 'MISSING_NAME',
          user_id: userId,
          has_name: payload.name != null
        });
      }

      // ===== [DIAG-LOG] UPSERT CALL =====
      console.log('[DIAG] upsertRow: Calling client.from().upsert()', {
        table: tableName,
        payloadKeys: Object.keys(payload),
        recordId: payload.id
      });

      const { data: upsertData, error, status, statusText } = await client
        .from(tableName)
        .upsert(payload, { onConflict: 'id' })
        .select();

      // ===== [CLOUD WRITE] Standard Log =====
      console.log('[CLOUD WRITE]', {
        operation: 'UPSERT',
        table: tableName,
        recordId: payload.id,
        success: !error,
        error: error ? error.message : null
      });

      if (error) {
        console.error(`[DIAG] upsertRow: UPSERT ERROR — TITIK GAGAL`, {
          table: tableName,
          user_id: userId,
          record_id: record.id,
          httpStatus: status,
          httpStatusText: statusText,
          errorCode: error.code,
          errorMessage: error.message,
          errorDetails: error.details,
          errorHint: error.hint,
          fullError: error
        });
        return false;
      }
      return true;
    } catch (err: any) {
      console.error(`[DIAG] upsertRow: EXCEPTION — TITIK GAGAL`, {
        table: tableName,
        userId,
        recordId: record?.id,
        errorMessage: err?.message,
        errorCode: err?.code,
        errorStatus: err?.status,
        fullError: err
      });
      return false;
    }
  },

  // Delete Single Record from PostgreSQL
  async deleteRow(tableName: string, id: string, userId: string): Promise<boolean> {
    const client = initSupabaseClient();
    if (!client) return false;

    try {
      const { error } = await client
        .from(tableName)
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) {
        console.error(`[SupabaseSyncService] Error deleting from ${tableName}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SupabaseSyncService] Exception deleting from ${tableName}:`, err);
      return false;
    }
  },

  // Save Full User Bundle in Batch (used for restore or initial seed)
  async saveFullUserBundle(userId: string, bundle: SupabaseUserBundle): Promise<boolean> {
    const client = initSupabaseClient();
    if (!client) return false;

    try {
      const walletsPayload = bundle.wallets.map(w => ({
        id: w.id,
        user_id: userId,
        name: w.name,
        type: w.type,
        currency: w.currency,
        balance: w.balance,
        account_number: w.accountNumber,
        scope: w.scope,
        color: w.color,
        is_default: w.isDefault,
        updated_at: new Date().toISOString()
      }));

      const txsPayload = bundle.transactions.map(t => ({
        id: t.id,
        user_id: userId,
        wallet_id: t.walletId,
        type: t.type,
        amount: t.amount,
        currency: t.currency,
        title: t.title,
        category: t.category,
        subcategory: t.subcategory,
        scope: t.scope,
        date: t.date,
        note: t.note,
        updated_at: new Date().toISOString()
      }));

      const catsPayload = bundle.categories.map(c => ({
        id: c.id,
        user_id: userId,
        name: c.name,
        type: c.type,
        color: c.color,
        icon: c.icon,
        subcategories: c.subcategories,
        scope: c.scope,
        updated_at: new Date().toISOString()
      }));

      const budgetsPayload = bundle.budgets.map(b => ({
        id: b.id,
        user_id: userId,
        category: b.categoryName,
        amount: b.monthlyLimit,
        spent: b.spent,
        period: b.period,
        updated_at: new Date().toISOString()
      }));

      const goalsPayload = bundle.goals.map(g => ({
        id: g.id,
        user_id: userId,
        title: g.title,
        target_amount: g.targetAmount,
        current_amount: g.currentAmount,
        deadline: g.deadline,
        color: g.color,
        updated_at: new Date().toISOString()
      }));

      const debtsPayload = bundle.debts.map(d => ({
        id: d.id,
        user_id: userId,
        type: d.type,
        person: d.party || '',
        title: d.title,
        amount: d.amount,
        due_date: d.dueDate,
        status: d.status,
        notes: d.note || '',
        updated_at: new Date().toISOString()
      }));

      const invoicesPayload = bundle.invoices.map(i => ({
        id: i.id,
        user_id: userId,
        invoice_number: i.invoiceNumber,
        company_name: i.companyName,
        company_email: i.companyEmail,
        company_phone: i.companyPhone,
        company_address: i.companyAddress,
        company_bank_details: i.companyBankDetails,
        client_name: i.clientName,
        client_email: i.clientEmail,
        client_address: i.clientAddress,
        issue_date: i.issueDate,
        due_date: i.dueDate,
        notes: i.notes,
        items: i.items,
        subtotal: i.subtotal,
        tax: i.tax,
        discount: i.discount,
        total: i.total,
        status: i.status,
        updated_at: new Date().toISOString()
      }));

      const invsPayload = bundle.investments.map(inv => ({
        id: inv.id,
        user_id: userId,
        name: inv.name,
        category: inv.category,
        initial_amount: inv.initialAmount,
        current_amount: inv.currentAmount,
        return_percentage: inv.returnPercentage,
        units: inv.units,
        platform: inv.platform,
        scope: inv.scope,
        notes: inv.notes,
        updated_at: new Date().toISOString()
      }));

      await Promise.all([
        chunkedUpsert(client, 'wallets', walletsPayload),
        chunkedUpsert(client, 'transactions', txsPayload),
        chunkedUpsert(client, 'categories', catsPayload),
        chunkedUpsert(client, 'budgets', budgetsPayload),
        chunkedUpsert(client, 'goals', goalsPayload),
        chunkedUpsert(client, 'debts', debtsPayload),
        chunkedUpsert(client, 'invoices', invoicesPayload),
        chunkedUpsert(client, 'investments', invsPayload)
      ]);

      return true;
    } catch (err) {
      console.error('[SupabaseSyncService] Error saving full user bundle:', err);
      return false;
    }
  },

  /**
   * Checks if Cloud has 0/incomplete transactions for a user.
   * Background automatic re-upload is disabled to prevent stale device data from overwriting Cloud.
   */
  async ensureCloudDataInitialized(_userId: string, _bundle: SupabaseUserBundle, _remoteBundle: SupabaseUserBundle | null): Promise<boolean> {
    // Disabled background auto-seed to protect Cloud authority and prevent stale cache loops
    return false;
  },

  /**
   * Bulk-delete ALL transactions for a given user from Supabase PostgreSQL.
   * Does NOT touch wallets, categories, budgets, goals, debts, invoices, investments, or audit_logs.
   */
  async deleteAllUserTransactions(userId: string): Promise<{ success: boolean; deletedCount: number }> {
    const client = initSupabaseClient();
    if (!client || !userId) {
      console.warn('[SupabaseSyncService] deleteAllUserTransactions: no client or userId');
      return { success: false, deletedCount: 0 };
    }

    try {
      // First count how many rows exist for this user
      const { count: beforeCount } = await client
        .from('transactions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const totalBefore = beforeCount || 0;
      console.log(`[SupabaseSyncService] deleteAllUserTransactions: ${totalBefore} rows found for user ${userId}`);

      // Bulk delete all transactions for this user in a single query
      const { error } = await client
        .from('transactions')
        .delete()
        .eq('user_id', userId);

      if (error) {
        console.error('[SupabaseSyncService] deleteAllUserTransactions error:', error.message);
        return { success: false, deletedCount: 0 };
      }

      console.log(`[SupabaseSyncService] deleteAllUserTransactions: successfully deleted ${totalBefore} rows from Supabase`);
      return { success: true, deletedCount: totalBefore };
    } catch (err) {
      console.error('[SupabaseSyncService] deleteAllUserTransactions exception:', err);
      return { success: false, deletedCount: 0 };
    }
  }
};

async function chunkedUpsert(client: any, tableName: string, payload: any[], chunkSize = 200) {
  if (!payload || payload.length === 0) return;
  for (let i = 0; i < payload.length; i += chunkSize) {
    const chunk = payload.slice(i, i + chunkSize);
    const { error } = await client.from(tableName).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.warn(`[SupabaseSyncService] Error upserting chunk on ${tableName}:`, error.message);
    }
  }
}
