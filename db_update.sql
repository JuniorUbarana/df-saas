-- 1. Adicionar o campo WhatsApp na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- 2. Corrigir a política de SELECT da tabela tenants.
-- O erro ocorre porque no momento que você insere o tenant, o Supabase tenta ler a linha inserida,
-- mas a política antiga exigia que o usuário já tivesse um perfil criado no banco vinculado a ele.
-- Essa alteração permite simplesmente a leitura dos tenants pelo usuário autenticado.
DROP POLICY IF EXISTS "Permitir select no proprio tenant" ON public.tenants;
CREATE POLICY "Permitir select no proprio tenant" ON public.tenants FOR SELECT TO authenticated USING (true);
