import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createClient()

    // Verificar autenticación
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 })
    }

    // Verificar que el usuario es admin
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    if (userProfile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar duplicados' },
        { status: 403 }
      )
    }

    // Obtener todos los leads
    const { data: leads, error: fetchError } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('[DEDUPE] Error al obtener leads:', fetchError)
      return NextResponse.json(
        { error: 'Error al obtener leads', details: fetchError.message },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay leads en la base de datos',
        duplicates_found: 0,
        duplicates_removed: 0,
      })
    }

    // Identificar duplicados por:
    // 1. Mismo email
    // 2. Mismo teléfono
    // 3. Mismo nombre + mismo teléfono
    // 4. Mismo business_name (web)
    const uniqueMap = new Map<string, string>()
    const duplicates: string[] = []

    leads.forEach((lead) => {
      const keys: string[] = []

      // Normalizar y crear claves para detectar duplicados
      if (lead.email?.trim()) {
        keys.push(`email:${lead.email.toLowerCase().trim()}`)
      }

      if (lead.phone?.trim()) {
        // Normalizar teléfono removiendo espacios y caracteres especiales
        const normalizedPhone = lead.phone.replace(/[\s\-\(\)]/g, '')
        keys.push(`phone:${normalizedPhone}`)

        // Si tiene nombre + teléfono, crear clave combinada
        if (lead.name?.trim()) {
          const normalizedName = lead.name.toLowerCase().trim()
          keys.push(`name-phone:${normalizedName}:${normalizedPhone}`)
        }
      }

      // Detectar duplicados por business_name (web)
      if (lead.business_name?.trim()) {
        const normalizedBusiness = lead.business_name.toLowerCase().trim()
        keys.push(`business:${normalizedBusiness}`)
      }

      // Si el lead no tiene ninguna clave única, lo ignoramos
      if (keys.length === 0) {
        return
      }

      // Verificar si alguna de las claves ya existe
      let isDuplicate = false
      for (const key of keys) {
        if (uniqueMap.has(key)) {
          isDuplicate = true
          console.log(`[DEDUPE] Duplicado encontrado: ${key} (ID: ${lead.id})`)
          break
        }
      }

      if (isDuplicate) {
        duplicates.push(lead.id)
      } else {
        // Registrar todas las claves para este lead
        keys.forEach((key) => uniqueMap.set(key, lead.id))
      }
    })

    // Si no hay duplicados, retornar
    if (duplicates.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No se encontraron leads duplicados',
        duplicates_found: 0,
        duplicates_removed: 0,
      })
    }

    // Eliminar duplicados
    const { error: deleteError } = await supabase
      .from('leads')
      .delete()
      .in('id', duplicates)

    if (deleteError) {
      console.error('[DEDUPE] Error al eliminar duplicados:', deleteError)
      return NextResponse.json(
        { error: 'Error al eliminar duplicados', details: deleteError.message },
        { status: 500 }
      )
    }

    console.log(`[DEDUPE] Eliminados ${duplicates.length} leads duplicados`)

    return NextResponse.json({
      success: true,
      message: `Eliminados ${duplicates.length} leads duplicados`,
      duplicates_found: duplicates.length,
      duplicates_removed: duplicates.length,
      total_leads: leads.length,
      unique_leads: uniqueMap.size,
    })
  } catch (error) {
    console.error('[DEDUPE] Error inesperado:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    )
  }
}
