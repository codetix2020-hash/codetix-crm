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

    // Identificar duplicados por email o phone
    const uniqueMap = new Map()
    const duplicates: string[] = []

    leads.forEach((lead) => {
      const key = lead.email || lead.phone

      if (!key) {
        // Lead sin email ni teléfono, lo ignoramos
        return
      }

      if (uniqueMap.has(key)) {
        // Este es un duplicado
        duplicates.push(lead.id)
        console.log(`[DEDUPE] Duplicado encontrado: ${key} (ID: ${lead.id})`)
      } else {
        // Primer registro con este email/phone
        uniqueMap.set(key, lead.id)
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
