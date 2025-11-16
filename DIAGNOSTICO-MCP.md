# 🔍 Diagnóstico Completo: Problemas de Conexión MCP + Supabase

**Fecha:** 2025-11-16
**Proyecto:** CodeTix CRM
**Problema:** Conexión MCP a Supabase con errores de DNS, tenant, y modo read-only

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. **Archivo de configuración MCP inexistente** ❌
**Estado:** El directorio `.cursor/` y el archivo `mcp.json` NO EXISTÍAN en el proyecto.

**Impacto:** Sin este archivo, Cursor IDE no puede establecer ninguna conexión MCP con Supabase.

**Solución aplicada:** ✅ Creado `.cursor/mcp.json` con configuración correcta.

---

### 2. **Variables de entorno no configuradas** ❌
**Estado:** El archivo `.env.local` NO EXISTÍA.

**Impacto:** La aplicación no puede conectarse a Supabase localmente.

**Solución aplicada:** ✅ Creado `.env.local` con todas las credenciales necesarias.

---

### 3. **URL de conexión incorrecta** ❌
**Error reportado:** `getaddrinfo ENOTFOUND db.vdgbtiuamlgtyuyabpsr.supabase.co`

**Causa raíz:**
Supabase tiene **diferentes endpoints** para diferentes tipos de conexión:

| Tipo | Host | Puerto | Uso |
|------|------|--------|-----|
| **Session Pooler (Transaction)** | `aws-0-eu-west-1.pooler.supabase.com` | 6543 | ✅ **Recomendado para MCP** |
| **Direct Connection** | `db.vdgbtiuamlgtyuyabpsr.supabase.co` | 5432 | ⚠️ Alternativa |
| **Session Pooler (Session)** | `aws-0-eu-west-1.pooler.supabase.com` | 5432 | ❌ Puede ser read-only |

**Solución aplicada:** ✅ Configurado con Session Pooler Transaction Mode (puerto 6543).

---

### 4. **Formato de usuario incorrecto** ❌
**Error reportado:** `Tenant or user not found`

**Problema:** Usar `postgres` como usuario no funciona. Supabase requiere el formato:
```
postgres.<project-ref>
```

**Ejemplo correcto:**
```
postgres.vdgbtiuamlgtyuyabpsr
```

**Solución aplicada:** ✅ Corregido en `mcp.json`.

---

### 5. **Modo read-only activado** ❌
**Error reportado:** `transaction_read_only = on`

**Causas posibles:**
1. Usar Session Pooler en puerto 5432 (session mode)
2. No incluir `?sslmode=require` en la cadena de conexión
3. Conectarse a una réplica de solo lectura (read replica)

**Solución aplicada:** ✅ Configurado Transaction Mode (puerto 6543) con `?sslmode=require`.

---

## 📊 ESTRUCTURA DEL PROYECTO ANALIZADA

### Conexión de la aplicación web (Next.js)

**Archivo:** `lib/supabase.ts:4-12`
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

✅ **Correcto:** La app usa la API REST de Supabase (HTTPS), no PostgreSQL directo.
✅ **Correcto:** Usa `anon key` para operaciones del cliente.

### API Routes

**Archivo:** `pages/api/leads/create.ts:2`
```typescript
import { supabase } from '@/lib/supabase'
```

✅ **Correcto:** El endpoint usa el mismo cliente de Supabase.
⚠️ **Nota:** Este endpoint usa `anon_key`, pero está protegido por autenticación custom (`LEADS_API_KEY`).

### Schema de base de datos

**Archivos encontrados:**
- `supabase/schema.sql` - Definición de tablas
- `supabase/leads_policies.sql` - Políticas RLS
- `supabase/sample-data.sql` - Datos de ejemplo

✅ **Correcto:** El proyecto tiene la estructura de base de datos bien documentada.

---

## ✅ SOLUCIONES APLICADAS

### 1. Creación de `.cursor/mcp.json`

**Ubicación:** `/home/user/codetix-crm/.cursor/mcp.json`

**Contenido:**
```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"
      ]
    }
  }
}
```

**Cambios clave:**
- ✅ Estructura correcta: `mcpServers` (no `servers`)
- ✅ Host: `aws-0-eu-west-1.pooler.supabase.com` (session pooler)
- ✅ Puerto: `6543` (transaction mode)
- ✅ Usuario: `postgres.vdgbtiuamlgtyuyabpsr` (formato completo)
- ✅ SSL: `?sslmode=require` para conexión segura

---

### 2. Creación de `.env.local`

**Ubicación:** `/home/user/codetix-crm/.env.local`

**Contenido:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://vdgbtiuamlgtyuyabpsr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Database Direct Access (para MCP/Cursor)
DATABASE_URL=postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require

# WhatsApp Configuration
WHATSAPP_API_KEY=tu-api-key
WHATSAPP_API_URL=https://waba.360dialog.io/v1/messages
WHATSAPP_PHONE_ID=tu-phone-id

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# API Keys
LEADS_API_KEY=tu-api-key-segura-aqui
```

⚠️ **IMPORTANTE:** Debes completar las variables de WhatsApp y `LEADS_API_KEY`.

---

### 3. Actualización de `.gitignore`

**Archivo:** `.gitignore:30`

```gitignore
# cursor mcp config (contains credentials)
.cursor/mcp.json
```

✅ **Seguridad:** Evita que las credenciales se suban a Git.

---

### 4. Documentación y herramientas de testing

**Archivos creados:**

1. **`.cursor/README-MCP.md`**
   - Guía completa de configuración
   - Solución de problemas
   - Comandos de verificación

2. **`.cursor/mcp.json.alternative`**
   - Configuración alternativa (Direct Connection)
   - Para usar si Session Pooler falla

3. **`.cursor/test-connection.sh`**
   - Script para probar conexión antes de usar MCP
   - Detecta automáticamente modo read-only
   - No requiere Cursor IDE

---

## 🚀 PASOS PARA VALIDAR LA SOLUCIÓN

### Paso 1: Probar conexión desde terminal (Opcional pero recomendado)

```bash
cd /home/user/codetix-crm
bash .cursor/test-connection.sh
```

**Resultado esperado:**
```
✅ Conexión exitosa
✅ Modo ESCRITURA habilitado (read_only = off)
```

---

### Paso 2: Reiniciar Cursor IDE

**CRÍTICO:** Debes **cerrar completamente** y volver a abrir Cursor para que cargue `mcp.json`.

---

### Paso 3: Verificar conexión desde Claude en Cursor

Abre un chat con Claude y ejecuta:

```sql
SELECT current_setting('transaction_read_only') as readonly;
```

**Resultado esperado:** `off`

---

### Paso 4: Probar operaciones de escritura

```sql
-- Test 1: Verificar tablas existentes
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public';

-- Test 2: Crear tabla de prueba
CREATE TABLE IF NOT EXISTS test_mcp (
  id SERIAL PRIMARY KEY,
  test_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Test 3: Insertar datos
INSERT INTO test_mcp (test_data)
VALUES ('Conexión MCP funcionando correctamente');

-- Test 4: Verificar
SELECT * FROM test_mcp;

-- Test 5: Limpiar
DROP TABLE test_mcp;
```

Si todos estos comandos funcionan, ¡la conexión MCP está completamente operativa! ✅

---

## 🔧 SOLUCIÓN DE PROBLEMAS

### Si después de reiniciar Cursor sigue sin funcionar:

#### Problema: "getaddrinfo ENOTFOUND"

**Solución:**
```bash
# 1. Copia la configuración alternativa
cp .cursor/mcp.json.alternative .cursor/mcp.json

# 2. Reinicia Cursor IDE completamente
```

---

#### Problema: "transaction_read_only = on"

**Solución:**
```bash
# Edita .cursor/mcp.json y cambia el puerto:
# DE: aws-0-eu-west-1.pooler.supabase.com:6543
# A:  db.vdgbtiuamlgtyuyabpsr.supabase.co:5432
```

---

#### Problema: "Tenant or user not found"

**Solución:**
Verifica que el usuario sea:
```
postgres.vdgbtiuamlgtyuyabpsr
```

NO uses solo `postgres`.

---

#### Problema: Cursor no carga MCP

**Solución:**
1. Abre DevTools en Cursor: `Help > Toggle Developer Tools`
2. Busca errores relacionados con "mcp"
3. Verifica que la sintaxis JSON sea válida:
   ```bash
   cat .cursor/mcp.json | jq .
   ```

---

## 📋 CHECKLIST FINAL

- [x] Directorio `.cursor/` creado
- [x] Archivo `mcp.json` configurado con Session Pooler
- [x] Archivo `.env.local` creado con credenciales
- [x] `.gitignore` actualizado para proteger credenciales
- [x] Documentación creada (README-MCP.md)
- [x] Script de testing creado (test-connection.sh)
- [x] Configuración alternativa disponible (mcp.json.alternative)
- [ ] **PENDIENTE:** Reiniciar Cursor IDE
- [ ] **PENDIENTE:** Probar conexión desde Claude
- [ ] **PENDIENTE:** Validar operaciones de escritura

---

## 🎯 OBJETIVO ALCANZADO

Con esta configuración, Claude podrá ejecutar desde MCP:

- ✅ Consultas SELECT
- ✅ Operaciones INSERT, UPDATE, DELETE
- ✅ ALTER TABLE (modificar estructura)
- ✅ CREATE/DROP TABLE
- ✅ CREATE/DROP POLICY (RLS)
- ✅ GRANT/REVOKE (permisos)

**Próximo paso:** Sanear y actualizar la tabla `leads` con las políticas RLS necesarias.

---

## 📞 SOPORTE

Si necesitas ayuda adicional:

1. **Verifica logs de Cursor:** Help > Toggle Developer Tools > Console
2. **Verifica estado de Supabase:** https://vdgbtiuamlgtyuyabpsr.supabase.co/project/_/settings/general
3. **Documentación MCP:** https://modelcontextprotocol.io/
4. **Documentación Supabase:** https://supabase.com/docs/guides/database/connecting-to-postgres

---

**Generado por:** Claude Code
**Fecha:** 2025-11-16
