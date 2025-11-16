# 🧹 Guía de Saneamiento de la Tabla `public.leads`

## 📋 Resumen

Este documento te guía paso a paso para limpiar y optimizar la tabla `public.leads` en Supabase, eliminando columnas sobrantes y estableciendo políticas RLS correctas.

---

## 🎯 Objetivos

- ✅ Limpiar la tabla de columnas innecesarias
- ✅ Renombrar `contact_name` → `name`
- ✅ Establecer defaults correctos (`created_at`, `status`)
- ✅ Recrear políticas RLS para admins y agentes
- ✅ Probar que INSERT funciona correctamente
- ✅ Validar que el CRM puede operar sin errores

---

## ⚠️ ANTES DE EMPEZAR

### ✋ Pre-requisitos

1. **Acceso al Dashboard de Supabase**: [https://app.supabase.com](https://app.supabase.com)
2. **Permisos de Admin** en tu proyecto
3. **5-10 minutos** de tiempo disponible
4. **Conexión estable** a Internet

### 🔐 Backup automático

El script crea automáticamente un backup (`leads_backup_mcp`) antes de hacer cambios. Si algo sale mal, puedes restaurar.

---

## 🚀 INSTRUCCIONES DE EJECUCIÓN

### Paso 1: Acceder al SQL Editor

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. En el menú lateral izquierdo, haz clic en **SQL Editor**
3. Haz clic en **"New query"** (botón superior derecho)

### Paso 2: Copiar el archivo SQL

1. Abre el archivo `supabase_leads_sanitization.sql` (en este mismo directorio)
2. **Copia TODO el contenido** del archivo
3. **Pega** en el SQL Editor de Supabase

### Paso 3: Revisar columnas a eliminar (IMPORTANTE)

Antes de ejecutar, **revisa el PASO 3** del SQL:

```sql
ALTER TABLE public.leads
  DROP COLUMN IF EXISTS email,        -- ⚠️ ¿Necesitas email?
  DROP COLUMN IF EXISTS postal_code,  -- ⚠️ ¿Necesitas código postal?
  DROP COLUMN IF EXISTS address,      -- ⚠️ ¿Necesitas dirección?
  -- ... etc
```

**Si necesitas alguna columna**, elimina esa línea del DROP COLUMN.

### Paso 4: Ejecutar el script

Tienes **dos opciones**:

#### Opción A: Todo de una vez (más rápido)
- Selecciona TODO el contenido
- Haz clic en **"Run"** (o `Ctrl+Enter` / `Cmd+Enter`)
- Espera a que termine (puede tardar 5-10 segundos)

#### Opción B: Paso a paso (más control)
- Ejecuta cada **PASO** por separado
- Revisa los resultados después de cada paso
- Continúa si todo se ve bien

### Paso 5: Verificar resultados

Al final del script hay queries de verificación que mostrarán:

1. **Estructura final de la tabla** → Debe tener solo 10 columnas
2. **Políticas RLS activas** → Debe mostrar 4 políticas
3. **Total de leads** → Cantidad de registros
4. **Últimos 5 leads** → Para confirmar que los datos están intactos

---

## 📊 RESULTADOS ESPERADOS

### Estructura final de `public.leads`

```
┌──────────────────┬─────────────────────────────────────┐
│ Columna          │ Tipo                                │
├──────────────────┼─────────────────────────────────────┤
│ id               │ uuid (PK, auto-generado)            │
│ name             │ text                                │
│ phone            │ text                                │
│ business_name    │ text                                │
│ sector           │ text                                │
│ city             │ text                                │
│ status           │ text (default: 'new')               │
│ assigned_to      │ uuid (FK → users)                   │
│ created_at       │ timestamptz (default: now())        │
│ notes            │ text                                │
└──────────────────┴─────────────────────────────────────┘
```

### Políticas RLS activas

1. **`admin_full_access`** → Admin puede SELECT, INSERT, UPDATE, DELETE
2. **`agent_select_own`** → Agentes solo VEN sus leads (`assigned_to = auth.uid()`)
3. **`agent_update_own`** → Agentes solo EDITAN sus leads
4. **`allowed_insert`** → INSERT permitido a `service_role` o `admin`

---

## 🧪 PRUEBAS POST-SANEAMIENTO

### Prueba 1: Insertar un lead

```sql
INSERT INTO public.leads (name, phone, business_name, sector, city)
VALUES ('Lead Prueba Final', '666777888', 'Negocio Test', 'retail', 'Madrid')
RETURNING *;
```

**Resultado esperado**: Debe insertarse exitosamente y retornar el registro completo.

### Prueba 2: Verificar RLS como agente

```sql
-- Simular un agente (cambia el UUID por uno real de tu tabla users)
SET LOCAL "request.jwt.claims" = '{"sub": "uuid-de-un-agente"}';

-- Este query debe mostrar SOLO los leads asignados a ese agente
SELECT * FROM public.leads;
```

### Prueba 3: Verificar desde tu aplicación

1. Inicia sesión en el CRM como **admin**
   - ✅ Deberías ver TODOS los leads

2. Inicia sesión como **agente**
   - ✅ Solo deberías ver los leads donde `assigned_to = tu_user_id`

3. Prueba insertar un lead desde **Google Sheets** o tu script
   - ✅ Debe insertarse sin errores

---

## 🚨 TROUBLESHOOTING

### Error: "column 'contact_name' does not exist"

**Causa**: La columna ya fue renombrada anteriormente.

**Solución**: Comenta o elimina la línea:
```sql
-- ALTER TABLE public.leads RENAME COLUMN contact_name TO name;
```

### Error: "permission denied for table leads"

**Causa**: No tienes permisos de admin en Supabase.

**Solución**: Asegúrate de estar ejecutando esto como el usuario propietario del proyecto.

### Error: "policy 'admin_full_access' already exists"

**Causa**: Las políticas ya fueron creadas previamente.

**Solución**: El script debería haber eliminado las políticas viejas. Ejecuta manualmente:
```sql
DROP POLICY IF EXISTS admin_full_access ON public.leads;
-- Luego vuelve a crear la política
```

### Los agentes no ven sus leads

**Causa**: La política RLS depende de que `assigned_to` coincida con `auth.uid()`.

**Verificación**:
```sql
SELECT id, name, assigned_to FROM public.leads WHERE assigned_to IS NOT NULL LIMIT 5;
```

**Solución**: Asegúrate de que:
1. Los leads tienen `assigned_to` con UUIDs válidos
2. Esos UUIDs existen en la tabla `users`
3. El usuario está autenticado correctamente

### El INSERT falla con "new row violates row-level security policy"

**Causa**: La política `allowed_insert` requiere que el usuario sea `admin` o `service_role`.

**Solución**:
- Si insertas desde la app, usa la `service_role_key`
- O asegúrate de que el usuario tiene `role = 'admin'` en la tabla `users`

---

## 🔄 RESTAURAR DESDE BACKUP

Si algo sale mal y necesitas restaurar:

```sql
-- 1. Eliminar la tabla actual
DROP TABLE public.leads;

-- 2. Recrear desde el backup
CREATE TABLE public.leads AS TABLE leads_backup_mcp;

-- 3. Restaurar las políticas RLS manualmente o volver a ejecutar el PASO 4 y 5
```

---

## ✅ CHECKLIST POST-SANEAMIENTO

Marca cada ítem cuando lo completes:

- [ ] Backup creado exitosamente (`leads_backup_mcp`)
- [ ] Columnas renombradas (`contact_name` → `name`)
- [ ] Columnas sobrantes eliminadas
- [ ] Políticas RLS recreadas (4 políticas activas)
- [ ] Lead de prueba insertado exitosamente
- [ ] Estructura final verificada (10 columnas)
- [ ] Admin puede ver todos los leads
- [ ] Agente solo ve sus leads
- [ ] INSERT desde Google Sheets funciona
- [ ] CRM funciona sin errores

---

## 📝 NOTAS FINALES

- **Backup**: El backup `leads_backup_mcp` se mantendrá indefinidamente. Puedes eliminarlo después de confirmar que todo funciona.
- **Performance**: Con menos columnas, las queries serán más rápidas.
- **Seguridad**: Las políticas RLS aseguran que cada usuario solo vea lo que debe ver.
- **Mantenimiento**: Si necesitas agregar columnas en el futuro, hazlo con `ALTER TABLE ... ADD COLUMN`.

---

## 🆘 SOPORTE

Si tienes problemas:

1. **Revisa los errores** en el SQL Editor (parte inferior)
2. **Consulta la sección Troubleshooting** arriba
3. **Revisa los logs** de Supabase (Settings → API → Logs)
4. **Pregunta en Discord/GitHub** del proyecto

---

**✨ ¡Éxito con el saneamiento!**
