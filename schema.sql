-- Supabase Schema para SaaS de Auditoria e Governança

-- 1. Tenants (Organizações dos Auditores/Clientes)
CREATE TABLE public.tenants (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Profiles (Vínculo do Usuário autenticado com o Tenant)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  full_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Segments (Segmentos de Mercado: Educação, Saúde, Fitness, Igrejas, Outros)
CREATE TABLE public.segments (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL
);

INSERT INTO public.segments (name) VALUES ('Educação'), ('Saúde'), ('Fitness'), ('Igrejas'), ('Outros');

-- 4. Audits (Auditorias realizadas)
CREATE TABLE public.audits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.tenants(id) NOT NULL,
  title TEXT NOT NULL,
  segment_id INTEGER REFERENCES public.segments(id) NOT NULL,
  status TEXT DEFAULT 'Em Andamento',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Inventories / ROPA (Mapeamento de Processos)
CREATE TABLE public.inventories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  audit_id UUID REFERENCES public.audits(id) ON DELETE CASCADE,
  process_name TEXT NOT NULL,
  legal_basis TEXT NOT NULL, -- Ex: Execução de Contrato, Tutela da Saúde, etc.
  has_minor_data BOOLEAN DEFAULT false,
  has_sensitive_data BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Risks (Riscos e DPIA/RIPD)
CREATE TABLE public.risks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  inventory_id UUID REFERENCES public.inventories(id) ON DELETE CASCADE,
  risk_description TEXT NOT NULL,
  probability INTEGER CHECK (probability BETWEEN 1 AND 5),
  impact INTEGER CHECK (impact BETWEEN 1 AND 5),
  mitigation_plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY (RLS)
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks ENABLE ROW LEVEL SECURITY;

-- POLICIES EXAMPLES (Isolation per tenant)
-- (Considerando que vamos criar uma função get_tenant_id() ou buscar do profile)
