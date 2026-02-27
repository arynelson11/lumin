-- ============================================================
-- CRIAR TABELA: profiles (Integração WhatsApp)
-- ============================================================
-- Cria a tabela de perfis de usuário, atrelada diretamente
-- a auth.users e configurada com coluna para n8n WhatsApp.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name TEXT,
    whatsapp_number TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================
-- RLS (Row Level Security)
-- =====================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Permitir que o próprio usuário crie/sobreescreva seu profile.
DO $$ BEGIN
    CREATE POLICY "Users can insert own profile" 
    ON public.profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
SELECT 'Tabela profiles (WhatsApp Integration) criada com sucesso!' AS resultado;
