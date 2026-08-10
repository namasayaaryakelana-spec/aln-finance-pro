-- ================================================================
-- ALN FINANCE PRO - HARDENED SUPABASE POSTGRESQL SCHEMA & RLS
-- Security, Data Integrity, Granular RLS, Wallet Ownership & Realtime
-- ================================================================

-- 1. PROFILES / USERS TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  current_scope TEXT DEFAULT 'personal',
  current_currency TEXT DEFAULT 'IDR',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. WALLETS TABLE (Includes composite unique constraint for ownership foreign key)
CREATE TABLE IF NOT EXISTS public.wallets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  currency TEXT DEFAULT 'IDR',
  balance NUMERIC(15, 2) DEFAULT 0,
  account_number TEXT,
  scope TEXT DEFAULT 'personal',
  color TEXT DEFAULT '#D4AF37',
  is_default BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wallets_id_user_id_key UNIQUE (id, user_id)
);

-- 3. TRANSACTIONS TABLE (Composite Foreign Key enforces strict wallet ownership by same user)
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id TEXT,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer', 'INCOME', 'EXPENSE', 'TRANSFER')),
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  currency TEXT DEFAULT 'IDR',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  scope TEXT DEFAULT 'personal',
  date DATE NOT NULL,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_transactions_wallet_user FOREIGN KEY (wallet_id, user_id) 
    REFERENCES public.wallets(id, user_id) ON DELETE SET NULL ON UPDATE CASCADE
);

-- 4. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  color TEXT DEFAULT '#D4AF37',
  icon TEXT DEFAULT 'Tag',
  subcategories JSONB DEFAULT '[]'::jsonb,
  scope TEXT DEFAULT 'personal',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BUDGETS TABLE
CREATE TABLE IF NOT EXISTS public.budgets (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  spent NUMERIC(15, 2) DEFAULT 0 CHECK (spent >= 0),
  period TEXT DEFAULT 'monthly',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL CHECK (target_amount >= 0),
  current_amount NUMERIC(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  deadline DATE,
  color TEXT DEFAULT '#D4AF37',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEBTS TABLE
CREATE TABLE IF NOT EXISTS public.debts (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  person TEXT NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
  due_date DATE,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. INVOICES TABLE
CREATE TABLE IF NOT EXISTS public.invoices (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  company_name TEXT,
  company_email TEXT,
  company_phone TEXT,
  company_address TEXT,
  company_bank_details TEXT,
  client_name TEXT NOT NULL,
  client_email TEXT,
  client_address TEXT,
  issue_date DATE,
  due_date DATE,
  notes TEXT,
  items JSONB DEFAULT '[]'::jsonb,
  subtotal NUMERIC(15, 2) DEFAULT 0 CHECK (subtotal >= 0),
  tax NUMERIC(5, 2) DEFAULT 0 CHECK (tax >= 0),
  discount NUMERIC(15, 2) DEFAULT 0 CHECK (discount >= 0),
  total NUMERIC(15, 2) DEFAULT 0 CHECK (total >= 0),
  status TEXT DEFAULT 'pending',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. INVESTMENTS TABLE
CREATE TABLE IF NOT EXISTS public.investments (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  initial_amount NUMERIC(15, 2) DEFAULT 0 CHECK (initial_amount >= 0),
  current_amount NUMERIC(15, 2) DEFAULT 0 CHECK (current_amount >= 0),
  return_percentage NUMERIC(8, 2) DEFAULT 0,
  units NUMERIC(15, 4),
  platform TEXT,
  scope TEXT DEFAULT 'personal',
  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  action TEXT NOT NULL,
  module TEXT NOT NULL,
  details TEXT,
  role TEXT DEFAULT 'Pemilik Bisnis',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- AUTOMATIC PROFILE CREATION TRIGGER ON AUTH SIGNUP
-- ================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES - GRANULAR FOR AUTHENTICATED ROLES
-- ================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 1. PROFILES POLICIES
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON public.profiles;
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;

CREATE POLICY "profiles_select_policy" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_insert_policy" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_policy" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_delete_policy" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- 2. WALLETS POLICIES
DROP POLICY IF EXISTS "wallets_select_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_insert_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_update_policy" ON public.wallets;
DROP POLICY IF EXISTS "wallets_delete_policy" ON public.wallets;
DROP POLICY IF EXISTS "Users can access own wallets" ON public.wallets;

CREATE POLICY "wallets_select_policy" ON public.wallets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "wallets_insert_policy" ON public.wallets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_update_policy" ON public.wallets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "wallets_delete_policy" ON public.wallets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3. TRANSACTIONS POLICIES
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_update_policy" ON public.transactions;
DROP POLICY IF EXISTS "transactions_delete_policy" ON public.transactions;
DROP POLICY IF EXISTS "Users can access own transactions" ON public.transactions;

CREATE POLICY "transactions_select_policy" ON public.transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "transactions_insert_policy" ON public.transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_update_policy" ON public.transactions FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "transactions_delete_policy" ON public.transactions FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 4. CATEGORIES POLICIES
DROP POLICY IF EXISTS "categories_select_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_insert_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_update_policy" ON public.categories;
DROP POLICY IF EXISTS "categories_delete_policy" ON public.categories;
DROP POLICY IF EXISTS "Users can access own categories" ON public.categories;

CREATE POLICY "categories_select_policy" ON public.categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "categories_insert_policy" ON public.categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_update_policy" ON public.categories FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "categories_delete_policy" ON public.categories FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 5. BUDGETS POLICIES
DROP POLICY IF EXISTS "budgets_select_policy" ON public.budgets;
DROP POLICY IF EXISTS "budgets_insert_policy" ON public.budgets;
DROP POLICY IF EXISTS "budgets_update_policy" ON public.budgets;
DROP POLICY IF EXISTS "budgets_delete_policy" ON public.budgets;
DROP POLICY IF EXISTS "Users can access own budgets" ON public.budgets;

CREATE POLICY "budgets_select_policy" ON public.budgets FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "budgets_insert_policy" ON public.budgets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_update_policy" ON public.budgets FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "budgets_delete_policy" ON public.budgets FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 6. GOALS POLICIES
DROP POLICY IF EXISTS "goals_select_policy" ON public.goals;
DROP POLICY IF EXISTS "goals_insert_policy" ON public.goals;
DROP POLICY IF EXISTS "goals_update_policy" ON public.goals;
DROP POLICY IF EXISTS "goals_delete_policy" ON public.goals;
DROP POLICY IF EXISTS "Users can access own goals" ON public.goals;

CREATE POLICY "goals_select_policy" ON public.goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "goals_insert_policy" ON public.goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_update_policy" ON public.goals FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "goals_delete_policy" ON public.goals FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 7. DEBTS POLICIES
DROP POLICY IF EXISTS "debts_select_policy" ON public.debts;
DROP POLICY IF EXISTS "debts_insert_policy" ON public.debts;
DROP POLICY IF EXISTS "debts_update_policy" ON public.debts;
DROP POLICY IF EXISTS "debts_delete_policy" ON public.debts;
DROP POLICY IF EXISTS "Users can access own debts" ON public.debts;

CREATE POLICY "debts_select_policy" ON public.debts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "debts_insert_policy" ON public.debts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_update_policy" ON public.debts FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "debts_delete_policy" ON public.debts FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 8. INVOICES POLICIES
DROP POLICY IF EXISTS "invoices_select_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_insert_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_update_policy" ON public.invoices;
DROP POLICY IF EXISTS "invoices_delete_policy" ON public.invoices;
DROP POLICY IF EXISTS "Users can access own invoices" ON public.invoices;

CREATE POLICY "invoices_select_policy" ON public.invoices FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "invoices_insert_policy" ON public.invoices FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invoices_update_policy" ON public.invoices FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "invoices_delete_policy" ON public.invoices FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 9. INVESTMENTS POLICIES
DROP POLICY IF EXISTS "investments_select_policy" ON public.investments;
DROP POLICY IF EXISTS "investments_insert_policy" ON public.investments;
DROP POLICY IF EXISTS "investments_update_policy" ON public.investments;
DROP POLICY IF EXISTS "investments_delete_policy" ON public.investments;
DROP POLICY IF EXISTS "Users can access own investments" ON public.investments;

CREATE POLICY "investments_select_policy" ON public.investments FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "investments_insert_policy" ON public.investments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "investments_update_policy" ON public.investments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "investments_delete_policy" ON public.investments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 10. AUDIT LOGS POLICIES
DROP POLICY IF EXISTS "audit_logs_select_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_update_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_delete_policy" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can access own audit_logs" ON public.audit_logs;

CREATE POLICY "audit_logs_select_policy" ON public.audit_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "audit_logs_insert_policy" ON public.audit_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "audit_logs_update_policy" ON public.audit_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "audit_logs_delete_policy" ON public.audit_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- ================================================================
-- REALTIME PUBLICATION SETUP (100% IDEMPOTENT & DUPLICATE-SAFE)
-- ================================================================

DO $$
DECLARE
  t TEXT;
  tables_to_add TEXT[] := ARRAY[
    'profiles',
    'wallets',
    'transactions',
    'categories',
    'budgets',
    'goals',
    'debts',
    'invoices',
    'investments',
    'audit_logs'
  ];
BEGIN
  -- 1. Ensure supabase_realtime publication exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime'
  ) THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;

  -- 2. Add each table individually only if not already a member
  FOREACH t IN ARRAY tables_to_add LOOP
    IF NOT EXISTS (
      SELECT 1 
      FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = t
    ) THEN
      BEGIN
        EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', t);
      EXCEPTION
        WHEN duplicate_object THEN
          -- Table already in publication, safe to ignore
          NULL;
      END;
    END IF;
  END LOOP;
END $$;
