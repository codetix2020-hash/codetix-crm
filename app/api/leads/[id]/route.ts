import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadId = params.id

    // Obtener lead con assignment
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select(`
        *,
        assignments!inner(
          agent_id,
          assigned_at,
          method
        )
      `)
      .eq('id', leadId)
      .single()

    if (leadError) {
      if (leadError.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      throw leadError
    }

    // Obtener interacciones
    const { data: interactions } = await supabase
      .from('interactions')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    return NextResponse.json({ 
      lead,
      interactions: interactions || []
    })
    
  } catch (error: any) {
    console.error('Get lead error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const leadId = params.id
    const body = await req.json()

    // Campos permitidos para actualizar
    const allowedFields = ['status', 'notes', 'phone', 'email', 'city', 'priority']
    const updates: any = {}

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Actualizar lead
    const { data: lead, error: updateError } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', leadId)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      throw new Error('Failed to update lead')
    }

    // Si hay una nota nueva, registrar como interacción
    if (body.note) {
      await supabase
        .from('interactions')
        .insert({
          lead_id: leadId,
          agent_id: user.id,
          channel: 'note',
          message: body.note
        })
    }

    return NextResponse.json({ lead })
    
  } catch (error: any) {
    console.error('Update lead error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 })
  }
}
