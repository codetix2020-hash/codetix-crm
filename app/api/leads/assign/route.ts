import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'PATCH,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const LEADS_API_KEY = process.env.LEADS_API_KEY

function validateApiKey(request: Request) {
  if (!LEADS_API_KEY) return true
  const authHeader = request.headers.get('authorization')
  if (!authHeader) return false
  const token = authHeader.replace('Bearer', '').trim()
  return token === LEADS_API_KEY
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function PATCH(request: Request) {
  if (!validateApiKey(request)) {
    return NextResponse.json(
      { success: false, message: 'No autorizado.' },
      { status: 401, headers: corsHeaders }
    )
  }

  try {
    const body = await request.json().catch(() => null)

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Body inválido.' },
        { status: 400, headers: corsHeaders }
      )
    }

    const supabase = createClient()

    if (body.lead_id && body.assigned_to) {
      const { lead_id, assigned_to } = body

      const { error } = await supabase
        .from('leads')
        .update({ assigned_to, status: 'assigned', assigned_at: new Date().toISOString() })
        .eq('id', lead_id)

      if (error) {
        return NextResponse.json(
          { success: false, message: error.message },
          { status: 500, headers: corsHeaders }
        )
      }

      await supabase.from('lead_history').insert({
        lead_id,
        user_id: assigned_to,
        action: 'assign',
        description: 'Asignación manual desde panel',
      })

      return NextResponse.json(
        { success: true, message: 'Lead asignado correctamente.' },
        { headers: corsHeaders }
      )
    }

    const agentName = body.agent
    const limit = typeof body.limit === 'number' && body.limit > 0 ? body.limit : 15

    if (!agentName) {
      return NextResponse.json(
        { success: false, message: 'Debes indicar el comercial (agent).' },
        { status: 400, headers: corsHeaders }
      )
    }

    const { data: agent, error: agentError } = await supabase
      .from('users')
      .select('id, name')
      .ilike('name', agentName)
      .eq('role', 'agent')
      .maybeSingle()

    if (agentError || !agent) {
      return NextResponse.json(
        { success: false, message: 'Comercial no encontrado o inactivo.' },
        { status: 404, headers: corsHeaders }
      )
    }

    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .eq('status', 'new')
      .is('assigned_to', null)
      .order('created_at', { ascending: true })
      .limit(limit)

    if (leadsError) {
      return NextResponse.json(
        { success: false, message: leadsError.message },
        { status: 500, headers: corsHeaders }
      )
    }

    if (!leads?.length) {
      return NextResponse.json(
        { success: true, assigned: 0, message: 'No hay leads disponibles.' },
        { headers: corsHeaders }
      )
    }

    const leadIds = leads.map((lead) => lead.id)

    const { error: updateError } = await supabase
      .from('leads')
      .update({ assigned_to: agent.id, status: 'assigned', assigned_at: new Date().toISOString() })
      .in('id', leadIds)

    if (updateError) {
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500, headers: corsHeaders }
      )
    }

    const historyRows = leadIds.map((leadId) => ({
      lead_id: leadId,
      user_id: agent.id,
      action: 'assign',
      description: `Asignado automáticamente a ${agent.name}`,
    }))

    await supabase.from('lead_history').insert(historyRows)

    return NextResponse.json(
      { success: true, assigned: leadIds.length },
      { headers: corsHeaders }
    )
  } catch (error) {
    console.error('PATCH /api/leads/assign error', error)
    return NextResponse.json(
      { success: false, message: 'Error inesperado al asignar los leads.' },
      { status: 500, headers: corsHeaders }
    )
  }
}
