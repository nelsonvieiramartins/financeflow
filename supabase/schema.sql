-- FinanceFlow Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- ENUMS
-- =============================================

CREATE TYPE expense_category AS ENUM (
  'alimentacao',
  'delivery',
  'transporte',
  'viagem',
  'entretenimento',
  'saude',
  'beleza',
  'casa',
  'compras',
  'outros'
);

CREATE TYPE payment_type AS ENUM (
  'pix_boleto',
  'cartao_fixo',
  'variavel'
);

CREATE TYPE income_source AS ENUM (
  'salario',
  'beneficio',
  'freelance',
  'investimento',
  'outros'
);

-- =============================================
-- PROFILES (extends Supabase auth.users)
-- =============================================

CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name TEXT,
  avatar_url TEXT,
  currency TEXT DEFAULT 'BRL',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =============================================
-- EXPENSES
-- =============================================

CREATE TABLE public.expenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  category expense_category NOT NULL DEFAULT 'outros',
  payment_type payment_type NOT NULL DEFAULT 'variavel',
  due_date DATE,                    -- "Até quando" field
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  is_recurring BOOLEAN DEFAULT FALSE, -- gasto fixo que repete todo mês
  notes TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INCOME (Receitas)
-- =============================================

CREATE TABLE public.income (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  source income_source NOT NULL DEFAULT 'salario',
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- RECEIVABLES (A Receber)
-- =============================================

CREATE TABLE public.receivables (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  from_person TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  received BOOLEAN DEFAULT FALSE,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INVESTMENTS (Investimentos/Poupança)
-- =============================================

CREATE TABLE public.investments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INTEGER NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- Users can only see and modify their own data
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receivables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Expenses
CREATE POLICY "Users can CRUD own expenses" ON public.expenses
  FOR ALL USING (auth.uid() = user_id);

-- Income
CREATE POLICY "Users can CRUD own income" ON public.income
  FOR ALL USING (auth.uid() = user_id);

-- Receivables
CREATE POLICY "Users can CRUD own receivables" ON public.receivables
  FOR ALL USING (auth.uid() = user_id);

-- Investments
CREATE POLICY "Users can CRUD own investments" ON public.investments
  FOR ALL USING (auth.uid() = user_id);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_expenses_user_month ON public.expenses(user_id, year, month);
CREATE INDEX idx_income_user_month ON public.income(user_id, year, month);
CREATE INDEX idx_receivables_user_month ON public.receivables(user_id, year, month);
CREATE INDEX idx_investments_user_month ON public.investments(user_id, year, month);

-- =============================================
-- REALTIME
-- =============================================

ALTER PUBLICATION supabase_realtime ADD TABLE public.expenses;
ALTER PUBLICATION supabase_realtime ADD TABLE public.income;
ALTER PUBLICATION supabase_realtime ADD TABLE public.receivables;
ALTER PUBLICATION supabase_realtime ADD TABLE public.investments;
