import LeadsClient from './LeadsClient'
import { createClient } from '@/lib/supabase/server'
import type { Lead } from './LeadCard'
import { getServerUserRole } from '@/lib/auth/getServerUserRole'
import { redirect } from 'next/navigation'

type LeadStatus = 'Nuevo' | 'Contactado' | 'Rechazado' | 'Cerrado'

const STATUS_MAP: Record<string, LeadStatus> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  contactada: 'Contactado',
  en_progreso: 'Contactado',
  progreso: 'Contactado',
  ganado: 'Cerrado',
  cerrado: 'Cerrado',
  perdida: 'Rechazado',
  perdido: 'Rechazado',
  rechazado: 'Rechazado',
  rechazada: 'Rechazado',
}

const toCanonicalStatus = (value?: string | null): LeadStatus => {
  const key = (value ?? '').toLowerCase()
  return STATUS_MAP[key] ?? 'Nuevo'
}

export default async function LeadsPage() {
  const { user, role } = await getServerUserRole()
  if (!user) redirect('/')

  const supabase = createClient()

  let query = supabase
    .from('leads')
    .select('id, business_name, name, phone, city, sector, status, notes, created_at, assigned_to')
    .order('created_at', { ascending: false })

  if (role !== 'admin') {
    query = query.eq('assigned_to', user.id)
  }

  const { data, error } = await query
  if (error) console.error('[LEADS DASHBOARD] fetch error', error)

  const normalizedLeads: Lead[] =
    (data ?? []).map((lead: any): Lead => ({
      ...lead,
      status: toCanonicalStatus(lead.status),
      sector: lead.sector ?? null,
      assigned_to: lead.assigned_to ?? null,
      notes: lead.notes ?? null,
      created_at: lead.created_at
        ? new Date(lead.created_at).toISOString()
        : new Date().toISOString(),
    }))

  return <LeadsClient initialLeads={normalizedLeads} role={role} currentUserId={user.id} />
}
