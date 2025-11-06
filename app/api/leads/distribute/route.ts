import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type Lead = {
  id: string
  zone: string | null
  created_at: string
}

type Agent = {
  id: string
  name: string
  zone: string | null
}

const MAX_ACTIVE_LEADS = 15
const ACTIVE_STATUSES = ['nuevo', 'contactado', 'interesado', 'presupuesto', 'asignado']

export async function POST() {
  const supabase = createClient()

  const {
    data: { user },
    error: sessionError,
  } = await supabase.auth.getUser()

  if (sessionError || !user) {
    return NextResponse.json({ success: false, error: 'No autenticado.' }, { status: 401 })
  }

  const { data: currentUser, error: profileError } = await supabase
    .from('users')
    .select('id, role')
    .eq('id', user.id)
    .single()

  if (profileError || !currentUser || currentUser.role !== 'admin') {
    return NextResponse.json(
      { success: false, error: 'Solo los administradores pueden repartir leads.' },
      { status: 403 }
    )
  }

  const { data: agents, error: agentsError } = await supabase
    .from('users')
    .select('id, name, zone')
    .eq('role', 'agent')
    .eq('status', 'active')

  if (agentsError) {
    return NextResponse.json(
      { success: false, error: `Error al obtener comerciales: ${agentsError.message}` },
      { status: 500 }
    )
  }

  if (!agents?.length) {
    return NextResponse.json(
      { success: false, error: 'No hay comerciales activos para repartir los leads.' },
      { status: 400 }
    )
  }

  const { data: unassignedLeads, error: leadsError } = await supabase
    .from('leads')
    .select('id, zone, created_at')
    .is('assigned_to', null)
    .order('created_at', { ascending: true })

  if (leadsError) {
    return NextResponse.json(
      { success: false, error: `Error al obtener leads pendientes: ${leadsError.message}` },
      { status: 500 }
    )
  }

  if (!unassignedLeads?.length) {
    return NextResponse.json({ success: true, total_distributed: 0, details: [] })
  }

  const pendingLeads: Lead[] = [...unassignedLeads]
  const assignmentMap = new Map<string, string[]>()

  for (const agent of agents) {
    assignmentMap.set(agent.id, [])
  }

  const getAgentActiveLeadCount = async (agentId: string) => {
    const { count, error } = await supabase
      .from('leads')
      .select('id', { count: 'exact', head: true })
      .eq('assigned_to', agentId)
      .in('status', ACTIVE_STATUSES)

    if (error) {
      throw new Error(`Error al contar leads de ${agentId}: ${error.message}`)
    }

    return count ?? 0
  }

  const pullLeads = (zone: string | null, amount: number) => {
    if (amount <= 0) return [] as Lead[]

    const normalizedZone = zone?.toLowerCase().trim()
    const selected: Lead[] = []
    const remaining: Lead[] = []

    for (const lead of pendingLeads) {
      if (selected.length >= amount) {
        remaining.push(lead)
        continue
      }

      const matchesZone = normalizedZone
        ? lead.zone?.toLowerCase().includes(normalizedZone)
        : false

      if (matchesZone) {
        selected.push(lead)
      } else {
        remaining.push(lead)
      }
    }

    if (selected.length < amount) {
      const stillNeeded = amount - selected.length
      const extra = remaining.slice(0, stillNeeded)
      selected.push(...extra)
      remaining.splice(0, stillNeeded)
    }

    pendingLeads.length = 0
    pendingLeads.push(...remaining)

    return selected
  }

  const assignments: { agent: Agent; leads: Lead[] }[] = []

  try {
    for (const agent of agents) {
      const currentCount = await getAgentActiveLeadCount(agent.id)
      const missing = Math.max(0, MAX_ACTIVE_LEADS - currentCount)
      if (missing === 0) continue

      const agentLeads = pullLeads(agent.zone ?? null, missing)
      if (!agentLeads.length) continue

      assignmentMap.get(agent.id)?.push(...agentLeads.map((lead) => lead.id))
      assignments.push({ agent, leads: agentLeads })
      if (!pendingLeads.length) break
    }

    if (pendingLeads.length) {
      for (const agent of agents) {
        const assignedIds = assignmentMap.get(agent.id) ?? []
        const currentCount = await getAgentActiveLeadCount(agent.id)
        const missing = Math.max(0, MAX_ACTIVE_LEADS - currentCount - assignedIds.length)
        if (missing <= 0) continue

        const extraLeads = pendingLeads.splice(0, missing)
        if (!extraLeads.length) break

        assignmentMap.get(agent.id)?.push(...extraLeads.map((lead) => lead.id))
        assignments.push({ agent, leads: extraLeads })
      }
    }

    for (const [agentId, leadIds] of assignmentMap.entries()) {
      if (!leadIds.length) continue

      const { error: updateError } = await supabase
        .from('leads')
        .update({ assigned_to: agentId, status: 'asignado' })
        .in('id', leadIds)

      if (updateError) {
        throw new Error(`Error al actualizar leads para ${agentId}: ${updateError.message}`)
      }

      const historyRows = leadIds.map((leadId) => ({
        lead_id: leadId,
        user_id: currentUser.id,
        action: 'assign',
        description: `Lead asignado a ${agents.find((agent) => agent.id === agentId)?.name ?? 'comercial'}`,
      }))

      const { error: historyError } = await supabase.from('lead_history').insert(historyRows)

      if (historyError) {
        throw new Error(`Error al registrar historial para ${agentId}: ${historyError.message}`)
      }
    }

    const details = Array.from(assignmentMap.entries())
      .filter(([, leadIds]) => leadIds.length)
      .map(([agentId, leadIds]) => ({
        agent: agents.find((agent) => agent.id === agentId)?.name ?? 'Comercial',
        assigned_count: leadIds.length,
      }))

    const totalDistributed = details.reduce((acc, item) => acc + item.assigned_count, 0)

    return NextResponse.json({ success: true, total_distributed: totalDistributed, details })
  } catch (error) {
    console.error('POST /api/leads/distribute error', error)
    return NextResponse.json(
      { success: false, error: 'No se pudo completar el reparto inteligente.' },
      { status: 500 }
    )
  }
}
