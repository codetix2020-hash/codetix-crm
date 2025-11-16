-- ============================================================================
-- QUERIES DE VERIFICACIÓN Y TROUBLESHOOTING
-- ============================================================================
-- Usa estas queries para verificar el estado de tu tabla leads después
-- del saneamiento o cuando necesites diagnosticar problemas.
-- ============================================================================

-- ============================================================================
-- 1. VERIFICACIÓN DE ESTRUCTURA
-- ============================================================================

-- Ver todas las columnas de la tabla leads
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads'
ORDER BY ordinal_position;

-- Contar columnas totales (debe ser 10)
SELECT COUNT(*) as total_columnas
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'leads';


-- ============================================================================
-- 2. VERIFICACIÓN DE POLÍTICAS RLS
-- ============================================================================

-- Ver todas las políticas activas en leads
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'leads';

-- Contar políticas activas (debe ser 4)
SELECT COUNT(*) as total_policies
FROM pg_policies
WHERE tablename = 'leads';

-- Verificar si RLS está habilitado
SELECT
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE tablename = 'leads';


-- ============================================================================
-- 3. VERIFICACIÓN DE DATOS
-- ============================================================================

-- Contar total de leads
SELECT COUNT(*) as total_leads FROM public.leads;

-- Ver distribución por status
SELECT
  status,
  COUNT(*) as cantidad
FROM public.leads
GROUP BY status
ORDER BY cantidad DESC;

-- Ver distribución por ciudad
SELECT
  city,
  COUNT(*) as cantidad
FROM public.leads
GROUP BY city
ORDER BY cantidad DESC
LIMIT 10;

-- Ver leads sin asignar
SELECT COUNT(*) as leads_sin_asignar
FROM public.leads
WHERE assigned_to IS NULL;

-- Ver leads asignados por agente
SELECT
  u.name as agente,
  COUNT(l.id) as leads_asignados
FROM public.leads l
LEFT JOIN public.users u ON l.assigned_to = u.id
WHERE l.assigned_to IS NOT NULL
GROUP BY u.name, u.id
ORDER BY leads_asignados DESC;


-- ============================================================================
-- 4. VERIFICACIÓN DE INTEGRIDAD
-- ============================================================================

-- Ver leads con datos incompletos (sin nombre o teléfono)
SELECT
  id,
  name,
  phone,
  business_name,
  created_at
FROM public.leads
WHERE name IS NULL OR phone IS NULL
ORDER BY created_at DESC;

-- Ver leads con assigned_to que no existe en users
SELECT
  l.id,
  l.name,
  l.assigned_to
FROM public.leads l
LEFT JOIN public.users u ON l.assigned_to = u.id
WHERE l.assigned_to IS NOT NULL AND u.id IS NULL;


-- ============================================================================
-- 5. QUERIES ÚTILES PARA DEBUGGING
-- ============================================================================

-- Ver los últimos 10 leads creados
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
LIMIT 10;

-- Ver leads creados hoy
SELECT
  id,
  name,
  phone,
  business_name,
  created_at
FROM public.leads
WHERE created_at::date = CURRENT_DATE
ORDER BY created_at DESC;

-- Ver leads creados en los últimos 7 días
SELECT
  DATE(created_at) as fecha,
  COUNT(*) as cantidad
FROM public.leads
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY fecha DESC;


-- ============================================================================
-- 6. VERIFICACIÓN DE PERMISOS
-- ============================================================================

-- Ver tu usuario actual y permisos
SELECT
  current_user as usuario_actual,
  current_setting('transaction_read_only') as readonly,
  session_user,
  current_database(),
  current_schema();

-- Ver roles y permisos en la tabla leads
SELECT
  grantee,
  privilege_type
FROM information_schema.role_table_grants
WHERE table_name = 'leads'
ORDER BY grantee, privilege_type;


-- ============================================================================
-- 7. PRUEBAS DE RLS
-- ============================================================================

-- Simular acceso como admin (cambia el UUID por uno real)
-- NOTA: Esto solo funciona en algunos entornos, no en todos
SET LOCAL "request.jwt.claims" = '{"sub": "uuid-de-admin", "role": "admin"}';
SELECT * FROM public.leads LIMIT 5;

-- Simular acceso como agente
SET LOCAL "request.jwt.claims" = '{"sub": "uuid-de-agente", "role": "agent"}';
SELECT * FROM public.leads LIMIT 5;

-- Reset de configuración local
RESET "request.jwt.claims";


-- ============================================================================
-- 8. MANTENIMIENTO
-- ============================================================================

-- Actualizar estadísticas de la tabla (mejora performance)
ANALYZE public.leads;

-- Ver tamaño de la tabla
SELECT
  pg_size_pretty(pg_total_relation_size('public.leads')) as tamaño_total,
  pg_size_pretty(pg_relation_size('public.leads')) as tamaño_tabla,
  pg_size_pretty(pg_indexes_size('public.leads')) as tamaño_indices;

-- Ver índices en la tabla
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'leads';


-- ============================================================================
-- 9. QUERIES DE LIMPIEZA (usar con cuidado)
-- ============================================================================

-- Eliminar leads duplicados por teléfono (CUIDADO: ejecuta solo si estás seguro)
-- Esto mantiene solo el lead más reciente de cada teléfono
/*
DELETE FROM public.leads
WHERE id NOT IN (
  SELECT DISTINCT ON (phone) id
  FROM public.leads
  ORDER BY phone, created_at DESC
);
*/

-- Eliminar leads muy antiguos sin actividad (ejemplo: más de 1 año)
-- CUIDADO: Solo ejecuta si estás seguro
/*
DELETE FROM public.leads
WHERE created_at < CURRENT_DATE - INTERVAL '1 year'
  AND status = 'rejected';
*/


-- ============================================================================
-- 10. EXPORTACIÓN DE DATOS
-- ============================================================================

-- Exportar leads a CSV (copia el resultado y pégalo en Excel/Sheets)
SELECT
  name,
  phone,
  business_name,
  sector,
  city,
  status,
  created_at
FROM public.leads
ORDER BY created_at DESC;

-- Ver resumen estadístico
SELECT
  COUNT(*) as total_leads,
  COUNT(DISTINCT assigned_to) as agentes_activos,
  COUNT(CASE WHEN status = 'new' THEN 1 END) as nuevos,
  COUNT(CASE WHEN status = 'contacted' THEN 1 END) as contactados,
  COUNT(CASE WHEN status = 'qualified' THEN 1 END) as calificados,
  COUNT(CASE WHEN status = 'converted' THEN 1 END) as convertidos,
  COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as sin_asignar,
  MIN(created_at) as primer_lead,
  MAX(created_at) as ultimo_lead
FROM public.leads;


-- ============================================================================
-- NOTAS DE USO
-- ============================================================================
-- 1. Ejecuta estas queries desde el SQL Editor de Supabase
-- 2. Algunas queries pueden tardar si tienes muchos registros
-- 3. Las queries con comentarios /* */ están comentadas por seguridad
-- 4. Adapta los UUIDs de ejemplo a tus datos reales
-- 5. Para queries de debugging diarias, crea vistas (VIEW) para reutilizarlas
-- ============================================================================
