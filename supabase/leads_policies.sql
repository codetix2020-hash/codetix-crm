-- =========================================================
-- RLS policies for table: public.leads
-- Regenera el set limpio de políticas según los requisitos.
-- =========================================================

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- INSERT permissions --------------------------------------------------------

CREATE POLICY "anon_insert_leads"
ON public.leads
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "service_role_insert_leads"
ON public.leads
FOR INSERT
TO service_role
WITH CHECK (true);

-- SELECT permissions --------------------------------------------------------

CREATE POLICY "admin_select_all"
ON public.leads
FOR SELECT
TO authenticated
USING (auth.role() = 'admin');

CREATE POLICY "agents_select_own_leads"
ON public.leads
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- UPDATE permissions --------------------------------------------------------

CREATE POLICY "admin_update_all"
ON public.leads
FOR UPDATE
TO authenticated
USING (auth.role() = 'admin')
WITH CHECK (auth.role() = 'admin');

CREATE POLICY "agents_update_own_leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (assigned_to = auth.uid());

-- DELETE permissions --------------------------------------------------------

CREATE POLICY "admin_delete_all"
ON public.leads
FOR DELETE
TO authenticated
USING (auth.role() = 'admin');


