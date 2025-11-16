#!/usr/bin/env python3
"""
Script para auditoría y saneamiento de la tabla public.leads en Supabase
"""
import psycopg2
import sys

# Configuración de conexión
CONN_STRING = "postgresql://postgres.vdgbtiuamlgtyuyabpsr:dinosaurioverde123@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require"

def execute_query(query, fetch=True, description="Ejecutando query"):
    """Ejecuta una query y retorna los resultados"""
    try:
        conn = psycopg2.connect(CONN_STRING)
        cur = conn.cursor()

        print(f"\n{'='*60}")
        print(f"🔄 {description}")
        print(f"{'='*60}")

        cur.execute(query)

        if fetch:
            results = cur.fetchall()
            columns = [desc[0] for desc in cur.description] if cur.description else []

            # Imprimir encabezados
            if columns:
                print(" | ".join(columns))
                print("-" * 60)

            # Imprimir resultados
            for row in results:
                print(" | ".join(str(val) for val in row))

            print(f"\n✅ Rows returned: {len(results)}")
            conn.commit()
            return results
        else:
            conn.commit()
            print(f"✅ Query ejecutada exitosamente")
            return None

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")
        if 'conn' in locals():
            conn.rollback()
        raise
    finally:
        if 'cur' in locals():
            cur.close()
        if 'conn' in locals():
            conn.close()

def main():
    print("🚀 INICIANDO AUDITORÍA Y SANEAMIENTO DE public.leads")
    print("="*60)

    # 1. Verificar permisos de escritura
    print("\n1️⃣ VERIFICANDO PERMISOS DE ESCRITURA")
    execute_query(
        "SELECT current_setting('transaction_read_only') AS readonly, current_user, now();",
        description="Validar permisos de escritura"
    )

    input("\n⏸️  Presiona ENTER para continuar con el backup...")

    # 2. Crear backup
    print("\n2️⃣ CREANDO BACKUP DE SEGURIDAD")
    execute_query(
        "CREATE TABLE IF NOT EXISTS leads_backup_mcp AS TABLE public.leads;",
        fetch=False,
        description="Crear backup leads_backup_mcp"
    )

    # Verificar que el backup se creó
    execute_query(
        "SELECT COUNT(*) as backup_count FROM leads_backup_mcp;",
        description="Verificar registros en backup"
    )

    input("\n⏸️  Presiona ENTER para continuar con la reestructuración...")

    # 3. Reestructurar tabla
    print("\n3️⃣ REESTRUCTURANDO TABLA LEADS")

    # Ver estructura actual primero
    execute_query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name='leads' ORDER BY ordinal_position;",
        description="Estructura ACTUAL de la tabla"
    )

    try:
        execute_query(
            "ALTER TABLE public.leads RENAME COLUMN contact_name TO name;",
            fetch=False,
            description="Renombrar contact_name → name"
        )
    except Exception as e:
        print(f"⚠️  Columna contact_name probablemente no existe o ya fue renombrada: {e}")

    execute_query(
        """ALTER TABLE public.leads
           ALTER COLUMN created_at TYPE timestamptz USING created_at,
           ALTER COLUMN created_at SET DEFAULT now(),
           ALTER COLUMN status SET DEFAULT 'new';""",
        fetch=False,
        description="Ajustar created_at y status defaults"
    )

    execute_query(
        "ALTER TABLE public.leads ADD COLUMN IF NOT EXISTS notes TEXT;",
        fetch=False,
        description="Agregar columna notes"
    )

    input("\n⏸️  Presiona ENTER para continuar con eliminación de columnas...")

    # 4. Eliminar columnas sobrantes
    print("\n4️⃣ ELIMINANDO COLUMNAS SOBRANTES")
    execute_query(
        """ALTER TABLE public.leads
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
           DROP COLUMN IF EXISTS tags;""",
        fetch=False,
        description="Eliminar columnas innecesarias"
    )

    input("\n⏸️  Presiona ENTER para continuar con políticas RLS...")

    # 5. Recrear políticas RLS
    print("\n5️⃣ RECREANDO POLÍTICAS RLS")

    # Primero ver las políticas actuales
    execute_query(
        "SELECT policyname, cmd FROM pg_policies WHERE tablename='leads';",
        description="Políticas RLS ANTES de los cambios"
    )

    # Borrar políticas existentes
    policies_to_drop = ['admin_full_access', 'agent_select_own', 'agent_update_own',
                        'sheets_can_insert', 'agent_read_own', 'allow_insert',
                        'agent_can_select_own', 'agent_can_update_own', 'service_insert',
                        'public_insert_leads', 'admin_select_all', 'admin_update', 'admin_delete']

    for policy in policies_to_drop:
        try:
            execute_query(
                f'DROP POLICY IF EXISTS "{policy}" ON public.leads;',
                fetch=False,
                description=f"Eliminar política {policy}"
            )
        except Exception as e:
            print(f"⚠️  Política {policy} no existe: {e}")

    # Habilitar RLS
    execute_query(
        "ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;",
        fetch=False,
        description="Habilitar RLS"
    )

    # Crear nuevas políticas
    execute_query(
        """CREATE POLICY admin_full_access ON public.leads
           FOR ALL
           USING (auth.role() = 'admin');""",
        fetch=False,
        description="Crear política: admin_full_access"
    )

    execute_query(
        """CREATE POLICY agent_read_own ON public.leads
           FOR SELECT
           USING (assigned_to = auth.uid());""",
        fetch=False,
        description="Crear política: agent_read_own"
    )

    execute_query(
        """CREATE POLICY agent_update_own ON public.leads
           FOR UPDATE
           USING (assigned_to = auth.uid());""",
        fetch=False,
        description="Crear política: agent_update_own"
    )

    execute_query(
        """CREATE POLICY allow_insert ON public.leads
           FOR INSERT
           WITH CHECK (true);""",
        fetch=False,
        description="Crear política: allow_insert"
    )

    input("\n⏸️  Presiona ENTER para continuar con inserción de prueba...")

    # 6. Insertar lead de prueba
    print("\n6️⃣ INSERTANDO LEAD DE PRUEBA")
    execute_query(
        """INSERT INTO public.leads (name, phone, business_name, sector, city)
           VALUES ('Test via Claude', '123456789', 'Negocio Test', 'prueba', 'Barcelona')
           RETURNING *;""",
        description="Insertar lead de prueba"
    )

    # 7. Verificación final
    print("\n7️⃣ VERIFICACIÓN FINAL")

    execute_query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'leads' ORDER BY ordinal_position;",
        description="Estructura FINAL de la tabla"
    )

    execute_query(
        "SELECT * FROM pg_policies WHERE tablename='leads';",
        description="Políticas RLS FINALES"
    )

    execute_query(
        "SELECT * FROM public.leads ORDER BY created_at DESC LIMIT 5;",
        description="Últimos 5 leads insertados"
    )

    print("\n" + "="*60)
    print("🎉 SANEAMIENTO COMPLETADO CON ÉXITO")
    print("="*60)

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️  Proceso cancelado por el usuario")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ ERROR FATAL: {str(e)}")
        sys.exit(1)
