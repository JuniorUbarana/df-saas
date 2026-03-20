-- Como o aplicativo é para uso EXCLUSIVO dos funcionários / auditores internos da DataFacil Compliance,
-- e nós já bloqueamos a criação de contas por pessoas externas, 
-- NÃO há necessidade de regras complexas de isolamento de banco de dados (RLS) entre os seus próprios usuários.

-- 1. Garante que os perfis tenham o campo Whatsapp que nós adicionamos
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Desliga todos os bloqueios (RLS) das tabelas principais da aplicação
-- Isso permitirá que qualquer Auditor da DataFacil (com login) crie clientes, perfis e auditorias livremente.
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audits DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risks DISABLE ROW LEVEL SECURITY;
