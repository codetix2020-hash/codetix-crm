#!/bin/bash

# Script para probar la conexión a Supabase antes de usar MCP
# Ejecutar: bash .cursor/test-connection.sh

echo "🔍 Probando conexión a Supabase PostgreSQL..."
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Credenciales
PROJECT_REF="vdgbtiuamlgtyuyabpsr"
PASSWORD="dinosaurioverde123"

# Test 1: Session Pooler (Transaction Mode) - Puerto 6543
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST 1: Session Pooler (Transaction Mode) - Puerto 6543"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONN_STRING="postgresql://postgres.$PROJECT_REF:$PASSWORD@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

if command -v psql &> /dev/null; then
    echo "Probando con psql..."
    RESULT=$(psql "$CONN_STRING" -c "SELECT current_setting('transaction_read_only') as readonly, version();" -t 2>&1)

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Conexión exitosa${NC}"
        echo "$RESULT"

        if echo "$RESULT" | grep -q "off"; then
            echo -e "${GREEN}✅ Modo ESCRITURA habilitado (read_only = off)${NC}"
            echo ""
            echo "👉 RECOMENDACIÓN: Usa esta configuración en mcp.json"
        else
            echo -e "${YELLOW}⚠️  Modo SOLO LECTURA (read_only = on)${NC}"
        fi
    else
        echo -e "${RED}❌ Error de conexión${NC}"
        echo "$RESULT"
    fi
else
    echo -e "${YELLOW}⚠️  psql no está instalado. Probando con curl...${NC}"
    # Test básico de conectividad
    nc -zv aws-0-eu-west-1.pooler.supabase.com 6543 2>&1
fi

echo ""
echo ""

# Test 2: Direct Connection - Puerto 5432
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 TEST 2: Direct Connection - Puerto 5432"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CONN_STRING_DIRECT="postgresql://postgres.$PROJECT_REF:$PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres?sslmode=require"

if command -v psql &> /dev/null; then
    echo "Probando con psql..."
    RESULT=$(psql "$CONN_STRING_DIRECT" -c "SELECT current_setting('transaction_read_only') as readonly, version();" -t 2>&1)

    if [[ $? -eq 0 ]]; then
        echo -e "${GREEN}✅ Conexión exitosa${NC}"
        echo "$RESULT"

        if echo "$RESULT" | grep -q "off"; then
            echo -e "${GREEN}✅ Modo ESCRITURA habilitado (read_only = off)${NC}"
            echo ""
            echo "👉 ALTERNATIVA: También puedes usar esta configuración"
        else
            echo -e "${YELLOW}⚠️  Modo SOLO LECTURA (read_only = on)${NC}"
        fi
    else
        echo -e "${RED}❌ Error de conexión${NC}"
        echo "$RESULT"
    fi
else
    nc -zv db.$PROJECT_REF.supabase.co 5432 2>&1
fi

echo ""
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 RESUMEN Y SIGUIENTES PASOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Si algún test muestra ✅ con modo ESCRITURA:"
echo "   → Usa esa configuración en .cursor/mcp.json"
echo ""
echo "2. Si ambos tests fallan:"
echo "   → Verifica que el proyecto Supabase esté activo (no pausado)"
echo "   → Verifica las credenciales en el dashboard de Supabase"
echo "   → Verifica que tu firewall/red permita conexiones salientes"
echo ""
echo "3. Si la conexión funciona pero está en modo SOLO LECTURA:"
echo "   → Prueba cambiar el puerto (5432 ↔ 6543)"
echo "   → Contacta al soporte de Supabase"
echo ""
echo "4. Para instalar psql (recomendado para testing):"
echo "   Ubuntu/Debian: sudo apt-get install postgresql-client"
echo "   macOS: brew install postgresql"
echo "   Windows: Descarga desde https://www.postgresql.org/download/windows/"
echo ""
