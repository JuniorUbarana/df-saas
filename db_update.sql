-- Atualiza a tabela de clientes para incluir os dados completos necessários para gerar os relatórios e contratos (RIPD / ROPA) futuramente.
ALTER TABLE public.clients
ADD COLUMN IF NOT EXISTS cnpj TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT,
ADD COLUMN IF NOT EXISTS responsible_name TEXT,
ADD COLUMN IF NOT EXISTS dpo_name TEXT;
