-- ============================================================================
-- SANEAMIENTO COMPLETO DE LA TABLA public.leads
-- ============================================================================
-- Proyecto: Codetix CRM
-- Fecha: 2025-11-16
-- Objetivo: Limpiar estructura, eliminar columnas sobrantes y recrear RLS
--
-- IMPORTANTE: Ejecutar estos comandos EN ORDEN desde el SQL Editor de Supabase
-- ============================================================================

-- ============================================================================
-- PASO 1: CREAR BACKUP DE SEGURIDAD
-- ============================================================================
-- Esto crea una copia completa de la tabla antes de hacer cambios
CREATE TABLE IF NOT EXISTS leads_backup_mcp AS TABLE public.leads;

-- Verificar que el backup se creó correctamente
SELECT COUNT(*) as total_registros_backup FROM leads_backup_mcp;


-- ============================================================================
-- PASO 2: CORREGIR COLUMNAS CLAVE
-- ============================================================================

-- 2.1 Renombrar contact_name → name (si existe)
ALTER TABLE public.leads
RENAME COLUMN contact_name TO name;

-- 2.2 Asegurar que created_at sea timestamptz con default now()
ALTER TABLE public.leads
ALTER COLUMN created_at TYPE timestamptz USING created_at,
ALTER COLUMN created_at SET DEFAULT now();

-- 2.3 Asegurar que status tenga default 'new'
ALTER TABLE public.leads
ALTER COLUMN status SET DEFAULT 'new';

-- 2.4 Agregar columna notes si no existe
ALTER TABLE public.leads
ADD COLUMN IF NOT EXISTS notes TEXT;


-- ============================================================================
-- PASO 3: ELIMINAR COLUMNAS INNECESARIAS
-- ============================================================================
-- ⚠️ IMPORTANTE: Revisa esta lista antes de ejecutar.
-- Si necesitas alguna columna, elimínala de este DROP COLUMN
-- ============================================================================

ALTER TABLE public.leads
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS postal_code,
  DROP COLUMN IF EXISTS zone,
  DROP COLUMN IF EXISTS source,
  DROP COLUMN IF EXISTS priority,
  DROP COLUMN IF EXISTS updated_at,
  DROP COLUMN IF EXISTS address,
  DROP COLUMN IF EXISTS website,
  DROP COLUMN IF EXISTS rating,
  DROP COLUMN IF EXISTS reviews,
  DROP COLUMN IF EXISTS web_quality,
  DROP COLUMN IF EXISTS social_media,
  DROP COLUMN IF EXISTS analysis,
  DROP COLUMN IF EXISTS opportunities,
  DROP COLUMN IF EXISTS conversion_probability,
  DROP COLUMN IF EXISTS requested_agent,
  DROP COLUMN IF EXISTS place_id,
  DROP COLUMN IF EXISTS score,
  DROP COLUMN IF EXISTS score_reason,
  DROP COLUMN IF EXISTS last_contact,
  DROP COLUMN IF EXISTS tags;


-- ============================================================================
-- PASO 4: RESETEAR POLÍTICAS RLS
-- ============================================================================

-- 4.1 Borrar TODAS las políticas existentes
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE tablename = 'leads' LOOP
    EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON public.leads;';
  END LOOP;
END $$;

-- 4.2 Habilitar Row Level Security
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;


-- ============================================================================
-- PASO 5: CREAR NUEVAS POLÍTICAS RLS
-- ============================================================================

-- 5.1 ADMIN: Acceso total (SELECT, INSERT, UPDATE, DELETE)
CREATE POLICY admin_full_access
ON public.leads
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);

-- 5.2 AGENTE: Solo puede VER sus propios leads
CREATE POLICY agent_select_own
ON public.leads
FOR SELECT
TO authenticated
USING (assigned_to = auth.uid());

-- 5.3 AGENTE: Solo puede EDITAR sus propios leads
CREATE POLICY agent_update_own
ON public.leads
FOR UPDATE
TO authenticated
USING (assigned_to = auth.uid())
WITH CHECK (assigned_to = auth.uid());

-- 5.4 INSERT: Permitido desde service_role o admin
CREATE POLICY allowed_insert
ON public.leads
FOR INSERT
TO authenticated
WITH CHECK (
  auth.role() = 'service_role'
  OR EXISTS (
    SELECT 1 FROM public.users u
    WHERE u.id = auth.uid() AND u.role = 'admin'
  )
);


-- ============================================================================
-- PASO 6: PRUEBA DE INSERCIÓN
-- ============================================================================
-- Inserta un lead de prueba para validar que todo funciona

INSERT INTO public.leads (name, phone, business_name, sector, city)
VALUES ('Lead Test MCP', '999888777', 'Tienda Test', 'panadería', 'Barcelona')
RETURNING *;


-- ============================================================================
-- PASO 7: VERIFICACIÓN FINAL
-- ============================================================================

-- 7.1 Verificar estructura final de la tabla
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;

-- 7.2 Verificar políticas RLS activas
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'leads';

-- 7.3 Contar registros totales
SELECT COUNT(*) as total_leads FROM public.leads;

-- 7.4 Ver los últimos 5 leads creados
SELECT
  id,
  name,
  phone,
  business_name,
  sector,
  city,
  status,
  assigned_to,
  created_at
FROM public.leads
ORDER BY created_at DESC
LIMIT 5;


-- ============================================================================
-- ESTRUCTURA FINAL ESPERADA
-- ============================================================================
-- La tabla public.leads debería tener SOLO estas columnas:
--
-- ┌──────────────────┬─────────────────────────────────────┐
-- │ Columna          │ Tipo                                │
-- ├──────────────────┼─────────────────────────────────────┤
-- │ id               │ uuid (primary key, default gen...)  │
-- │ name             │ text                                │
-- │ phone            │ text                                │
-- │ business_name    │ text                                │
-- │ sector           │ text                                │
-- │ city             │ text                                │
-- │ status           │ text (default 'new')                │
-- │ assigned_to      │ uuid (foreign key → users)          │
-- │ created_at       │ timestamptz (default now())         │
-- │ notes            │ text                                │
-- └──────────────────┴─────────────────────────────────────┘
--
-- ============================================================================
-- POLÍTICAS RLS ESPERADAS
-- ============================================================================
-- 1. admin_full_access → Admin puede hacer TODO
-- 2. agent_select_own  → Agentes solo VEN sus leads
-- 3. agent_update_own  → Agentes solo EDITAN sus leads
-- 4. allowed_insert    → INSERT permitido a service_role o admin
-- ============================================================================

-- ============================================================================
-- NOTAS IMPORTANTES
-- ============================================================================
-- 1. Se creó backup en: leads_backup_mcp
-- 2. Si algo sale mal, puedes restaurar con:
--    DROP TABLE public.leads;
--    CREATE TABLE public.leads AS TABLE leads_backup_mcp;
-- 3. Las políticas RLS dependen de que exista la tabla 'users' con columna 'role'
-- 4. El auth.uid() debe coincidir con un usuario existente en 'users'
-- ============================================================================
