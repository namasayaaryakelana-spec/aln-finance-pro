import { RealtimeChannel } from '@supabase/supabase-js';
import { initSupabaseClient } from '../lib/supabase';
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
        accountNumber: w.account_number || '',
        scope: w.scope || 'personal',
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
        scope: t.scope || 'personal',
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
        scope: c.scope || 'personal'
      }));

      const budgets: Budget[] = (rawBudgets || []).map((b: any) => ({
        id: b.id,
        category: b.category,
        amount: Number(b.amount || 0),
        spent: Number(b.spent || 0),
        period: b.period || 'monthly'
      }));

      const goals: FinancialGoal[] = (rawGoals || []).map((g: any) => ({
        id: g.id,
        title: g.title,
        targetAmount: Number(g.target_amount || 0),
        currentAmount: Number(g.current_amount || 0),
        deadline: g.deadline || '',
        color: g.color || '#D4AF37'
      }));

      const debts: BillAndDebt[] = (rawDebts || []).map((d: any) => ({
        id: d.id,
        type: d.type,
        person: d.person,
        title: d.title,
        amount: Number(d.amount || 0),
        dueDate: d.due_date || '',
        status: d.status || 'pending',
        notes: d.notes || undefined
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
    if (!client) return false;

    try {
      const payload = {
        ...record,
        user_id: userId,
        updated_at: new Date().toISOString()
      };
      const { error } = await client.from(tableName).upsert(payload, { onConflict: 'id' });
      if (error) {
        console.error(`[SupabaseSyncService] Error upserting ${tableName}:`, error.message);
        return false;
      }
      return true;
    } catch (err) {
      console.error(`[SupabaseSyncService] Exception upserting ${tableName}:`, err);
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
        category: b.category,
        amount: b.amount,
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
        person: d.person,
        title: d.title,
        amount: d.amount,
        due_date: d.dueDate,
        status: d.status,
        notes: d.notes,
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
        walletsPayload.length ? client.from('wallets').upsert(walletsPayload) : Promise.resolve(),
        txsPayload.length ? client.from('transactions').upsert(txsPayload) : Promise.resolve(),
        catsPayload.length ? client.from('categories').upsert(catsPayload) : Promise.resolve(),
        budgetsPayload.length ? client.from('budgets').upsert(budgetsPayload) : Promise.resolve(),
        goalsPayload.length ? client.from('goals').upsert(goalsPayload) : Promise.resolve(),
        debtsPayload.length ? client.from('debts').upsert(debtsPayload) : Promise.resolve(),
        invoicesPayload.length ? client.from('invoices').upsert(invoicesPayload) : Promise.resolve(),
        invsPayload.length ? client.from('investments').upsert(invsPayload) : Promise.resolve()
      ]);

      return true;
    } catch (err) {
      console.error('[SupabaseSyncService] Error saving full user bundle:', err);
      return false;
    }
  }
};
