-- ================================================================
-- ALN FINANCE PRO - SUPABASE POSTGRESQL DATABASE SCHEMA & RLS
-- Copy and paste this script into your Supabase SQL Editor.
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

-- 2. WALLETS TABLE
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_id TEXT REFERENCES public.wallets(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  amount NUMERIC(15, 2) NOT NULL,
  currency TEXT DEFAULT 'IDR',
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  scope TEXT DEFAULT 'personal',
  date DATE NOT NULL,
  note TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
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
  amount NUMERIC(15, 2) NOT NULL,
  spent NUMERIC(15, 2) DEFAULT 0,
  period TEXT DEFAULT 'monthly',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. GOALS TABLE
CREATE TABLE IF NOT EXISTS public.goals (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  target_amount NUMERIC(15, 2) NOT NULL,
  current_amount NUMERIC(15, 2) DEFAULT 0,
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
  amount NUMERIC(15, 2) NOT NULL,
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
  subtotal NUMERIC(15, 2) DEFAULT 0,
  tax NUMERIC(5, 2) DEFAULT 0,
  discount NUMERIC(15, 2) DEFAULT 0,
  total NUMERIC(15, 2) DEFAULT 0,
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
  initial_amount NUMERIC(15, 2) DEFAULT 0,
  current_amount NUMERIC(15, 2) DEFAULT 0,
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
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read/write their own financial data
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

-- Create Policies for Profiles
DROP POLICY IF EXISTS "Users can access own profile" ON public.profiles;
CREATE POLICY "Users can access own profile" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Create Policies for Wallets
DROP POLICY IF EXISTS "Users can access own wallets" ON public.wallets;
CREATE POLICY "Users can access own wallets" ON public.wallets FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Transactions
DROP POLICY IF EXISTS "Users can access own transactions" ON public.transactions;
CREATE POLICY "Users can access own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Categories
DROP POLICY IF EXISTS "Users can access own categories" ON public.categories;
CREATE POLICY "Users can access own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Budgets
DROP POLICY IF EXISTS "Users can access own budgets" ON public.budgets;
CREATE POLICY "Users can access own budgets" ON public.budgets FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Goals
DROP POLICY IF EXISTS "Users can access own goals" ON public.goals;
CREATE POLICY "Users can access own goals" ON public.goals FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Debts
DROP POLICY IF EXISTS "Users can access own debts" ON public.debts;
CREATE POLICY "Users can access own debts" ON public.debts FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Invoices
DROP POLICY IF EXISTS "Users can access own invoices" ON public.invoices;
CREATE POLICY "Users can access own invoices" ON public.invoices FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Investments
DROP POLICY IF EXISTS "Users can access own investments" ON public.investments;
CREATE POLICY "Users can access own investments" ON public.investments FOR ALL USING (auth.uid() = user_id);

-- Create Policies for Audit Logs
DROP POLICY IF EXISTS "Users can access own audit_logs" ON public.audit_logs;
CREATE POLICY "Users can access own audit_logs" ON public.audit_logs FOR ALL USING (auth.uid() = user_id);

-- ================================================================
-- REALTIME PUBLICATION
-- Enables Supabase Realtime subscriptions across all tables
-- ================================================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets, public.transactions, public.categories, public.budgets, public.goals, public.debts, public.invoices, public.investments, public.audit_logs;
