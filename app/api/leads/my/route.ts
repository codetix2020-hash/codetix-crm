import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Obtener parámetros de query
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Construir query
    let query = supabase
      .from('leads')
      .select(`
        *,
        assignments!inner(
          agent_id,
          assigned_at,
          method
        )
      `)
      .eq('assignments.agent_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filtrar por status si se proporciona
    if (status && status !== 'ALL') {
      query = query.eq('status', status)
    }

    const { data: leads, error, count } = await query

    if (error) {
      console.error('Query error:', error)
      throw new Error('Failed to fetch leads')
    }

    // Obtener estadísticas rápidas
    const { data: stats } = await supabase
      .rpc('get_dashboard_stats', { 
        p_agent_id: user.id,
        p_days: 30
      })

    return NextResponse.json({ 
      leads: leads || [],
      stats: stats || {
        total_leads: 0,
        new: 0,
        contacted: 0,
        demo: 0,
        won: 0,
        lost: 0,
        conversion_rate: 0
      },
      pagination: {
        limit,
        offset,
        total: count || 0
      }
    })
    
  } catch (error: any) {
    console.error('Get leads error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
