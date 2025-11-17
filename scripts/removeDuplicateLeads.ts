import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function removeDuplicateLeads() {
  console.log('🔍 Buscando leads duplicados...')

  const { data: leads, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Error al obtener leads:', error)
    throw error
  }

  if (!leads || leads.length === 0) {
    console.log('ℹ️  No hay leads en la base de datos.')
    return
  }

  const uniqueMap = new Map()
  const duplicates: string[] = []

  leads.forEach((lead) => {
    const key = lead.email || lead.phone

    if (!key) {
      console.warn(`⚠️  Lead sin email ni teléfono (ID: ${lead.id})`)
      return
    }

    if (uniqueMap.has(key)) {
      // Este es un duplicado, marcar para eliminación
      duplicates.push(lead.id)
      console.log(`🔄 Duplicado encontrado: ${key} (ID: ${lead.id})`)
    } else {
      // Primer registro con este email/phone
      uniqueMap.set(key, lead.id)
    }
  })

  if (duplicates.length > 0) {
    console.log(`\n🗑️  Eliminando ${duplicates.length} leads duplicados...`)

    const { error: delError } = await supabase
      .from('leads')
      .delete()
      .in('id', duplicates)

    if (delError) {
      console.error('❌ Error al eliminar duplicados:', delError)
      throw delError
    }

    console.log(`✅ Eliminados ${duplicates.length} leads duplicados exitosamente`)
  } else {
    console.log('✅ No se encontraron leads duplicados.')
  }

  console.log(`\n📊 Resumen:`)
  console.log(`   - Total leads procesados: ${leads.length}`)
  console.log(`   - Leads únicos: ${uniqueMap.size}`)
  console.log(`   - Duplicados eliminados: ${duplicates.length}`)
}

// Ejecutar el script
removeDuplicateLeads()
  .then(() => {
    console.log('\n✅ Script completado exitosamente')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Error ejecutando el script:', error)
    process.exit(1)
  })
