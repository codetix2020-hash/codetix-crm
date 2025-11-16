# Configuración MCP para Supabase en Cursor IDE

## 📋 Archivos creados

- **mcp.json** - Configuración principal (Session Pooler - RECOMENDADO)
- **mcp.json.alternative** - Configuración alternativa (Direct Connection)

## ✅ Verificar la conexión

### 1. Reiniciar Cursor IDE
Después de crear o modificar `mcp.json`, **debes reiniciar completamente** Cursor IDE para que cargue la nueva configuración.

### 2. Verificar que MCP está activo
En Cursor, abre la consola de desarrollador (Help > Toggle Developer Tools) y busca mensajes relacionados con MCP.

### 3. Probar la conexión desde Claude
Una vez reiniciado Cursor, pregunta a Claude:

```
Por favor ejecuta: SELECT current_setting('transaction_read_only');
```

**Resultado esperado:** `off` (significa que tienes permisos de escritura)
**Resultado problemático:** `on` (modo solo lectura)

### 4. Probar operaciones de escritura

```sql
-- Crear una tabla de prueba
CREATE TABLE IF NOT EXISTS test_mcp (
  id SERIAL PRIMARY KEY,
  test_data TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar datos
INSERT INTO test_mcp (test_data) VALUES ('MCP funciona correctamente');

-- Verificar
SELECT * FROM test_mcp;

-- Limpiar
DROP TABLE test_mcp;
```

## 🔧 Solución de problemas

### Error: "getaddrinfo ENOTFOUND"

**Causa:** El host no se puede resolver (DNS)
**Solución:** Verifica que estás usando el host correcto:
- Session Pooler: `aws-0-eu-west-1.pooler.supabase.com`
- Direct: `db.vdgbtiuamlgtyuyabpsr.supabase.co`

Si ninguno funciona, copia `mcp.json.alternative` a `mcp.json` y reinicia.

### Error: "Tenant or user not found"

**Causa:** El usuario o formato de autenticación es incorrecto
**Solución:** Asegúrate de usar el formato correcto:
```
postgres.vdgbtiuamlgtyuyabpsr:password@aws-0-eu-west-1.pooler.supabase.com:6543
```

### Error: "transaction_read_only = on"

**Causa:** Conexión en modo solo lectura
**Solución:**
1. Verifica que estás usando el puerto **6543** (transaction pooler)
2. Asegúrate de incluir `?sslmode=require` al final de la URL
3. Si persiste, usa `mcp.json.alternative`

### Error: SSL/TLS problems

**Causa:** Certificado SSL rechazado
**Solución:** Cambia `sslmode=require` por `sslmode=disable` (NO RECOMENDADO para producción)

## 🔐 Seguridad

⚠️ **IMPORTANTE:**
- El archivo `mcp.json` contiene credenciales sensibles
- **NO lo subas** a Git (debe estar en .gitignore)
- La contraseña está en texto plano por requisitos de MCP
- Solo úsalo en entornos de desarrollo seguros

## 📊 URLs de conexión disponibles

### Session Pooler (Transaction Mode) - Puerto 6543 ✅ RECOMENDADO
```
postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require
```
- **Ventajas:** Optimizado para herramientas MCP, conexiones cortas
- **Modo:** Read-write
- **Timeout:** Corto (ideal para queries rápidas)

### Direct Connection - Puerto 5432
```
postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@db.vdgbtiuamlgtyuyabpsr.supabase.co:5432/postgres?sslmode=require
```
- **Ventajas:** Conexión directa, sin pooler
- **Desventajas:** Puede tener límites de conexión
- **Modo:** Read-write

### Session Pooler (Session Mode) - Puerto 5432 ⚠️ NO USAR
```
postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@aws-0-eu-west-1.pooler.supabase.com:5432/postgres
```
- **Problema:** Puede entrar en modo read-only
- **No recomendado** para MCP

## 🎯 Siguiente paso

Después de configurar:

1. Cierra completamente Cursor IDE
2. Vuelve a abrir el proyecto
3. Abre un chat con Claude
4. Pide ejecutar: `SELECT version();`
5. Si responde con la versión de PostgreSQL, ¡la conexión funciona! ✅

## 📞 Soporte

Si ninguna configuración funciona, verifica:
1. Que el proyecto de Supabase esté activo (no pausado)
2. Que las credenciales sean correctas en el dashboard de Supabase
3. Que tu red permita conexiones salientes al puerto 6543/5432
4. Que `@modelcontextprotocol/server-postgres` esté instalado (npx lo descarga automáticamente)
