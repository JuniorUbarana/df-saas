-- POLÍTICAS DE SEGURANÇA RLS (Row Level Security)

-- Permitir leitura da tabela segments por todos
ALTER TABLE public.segments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura segments para locatários" ON public.segments FOR SELECT TO authenticated USING (true);

-- Tenants (Escritórios / Empresas)
CREATE POLICY "Permitir criar tenant" ON public.tenants FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Permitir select no proprio tenant" ON public.tenants FOR SELECT TO authenticated USING (
  id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Profiles (Vínculo Autenticação -> Tenant)
CREATE POLICY "Permitir inserir proprio profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (
  id = auth.uid()
);
CREATE POLICY "Permitir select proprio profile" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid()
);

-- Audits (Auditorias)
CREATE POLICY "Permitir tudo na propria auditoria" ON public.audits FOR ALL TO authenticated USING (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
) WITH CHECK (
  tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())
);

-- Inventories / ROPA
CREATE POLICY "Permitir tudo no proprio inventario" ON public.inventories FOR ALL TO authenticated USING (
  audit_id IN (SELECT id FROM public.audits WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
) WITH CHECK (
  audit_id IN (SELECT id FROM public.audits WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid()))
);

-- Risks
CREATE POLICY "Permitir tudo nos riscos do inventario" ON public.risks FOR ALL TO authenticated USING (
  inventory_id IN (SELECT id FROM public.inventories WHERE audit_id IN (SELECT id FROM public.audits WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())))
) WITH CHECK (
  inventory_id IN (SELECT id FROM public.inventories WHERE audit_id IN (SELECT id FROM public.audits WHERE tenant_id IN (SELECT tenant_id FROM public.profiles WHERE id = auth.uid())))
);
