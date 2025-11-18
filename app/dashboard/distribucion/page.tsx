import DistributionClient from './DistributionClient'
import { createClient } from '@/lib/supabase/server'
import { getServerUserRole } from '@/lib/auth/getServerUserRole'
import { redirect } from 'next/navigation'

type LeadStatus = 'Nuevo' | 'Contactado' | 'Rechazado' | 'Cerrado'

type Lead = {
  id: string
  name: string | null
  phone: string | null
  email: string | null
  business_name: string | null
  status: string | null
  assigned_to: string | null
  city: string | null
  sector: string | null
  notes: string | null
  created_at: string | null
}

const STATUS_MAP: Record<string, LeadStatus> = {
  nuevo: 'Nuevo',
  contactado: 'Contactado',
  contactada: 'Contactado',
  en_progreso: 'Contactado',
  progreso: 'Contactado',
  ganado: 'Cerrado',
  cerrado: 'Cerrado',
  rechazado: 'Rechazado',
  rechazada: 'Rechazado',
  perdido: 'Rechazado',
  perdida: 'Rechazado',
}

export default async function LeadDistributionPage() {
  const { user, role } = await getServerUserRole()
  if (!user) redirect('/')
  if (role !== 'admin') redirect('/dashboard')

  const supabase = createClient()

  const [
    { data: leadsData, error: leadsError },
    { data: agentsData, error: agentsError },
    { data: historyData, error: historyError },
  ] = await Promise.all([
    supabase
      .from('leads')
      .select('id, business_name, name, phone, city, sector, status, notes, created_at, assigned_to')
      .is('assigned_to', null)
      .order('created_at', { ascending: false }),
    supabase
      .from('users')
      .select('id, name, email, role')
      .neq('role', 'admin')
      .order('name', { ascending: true }),
    supabase
      .from('lead_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  if (leadsError) console.error('[SERVER] leads sin asignar error:', leadsError)
  if (agentsError) console.error('[SERVER] agents error:', agentsError)
  if (historyError) console.error('[SERVER] history error:', historyError)

  const initialLeads =
    ((leadsData ?? []) as Lead[]).map((le: Lead) => ({
      ...le,
      email: le.email ?? null,
      status: STATUS_MAP[(le.status ?? '').toLowerCase()] ?? 'Nuevo',
      assigned_to: le.assigned_to ?? null,
      notes: le.notes ?? null,
      created_at: le.created_at ? new Date(le.created_at).toISOString() : new Date().toISOString(),
    })) ?? []

  const initialHistory =
    (historyData ?? []).map((entry: any) => ({
      ...entry,
      created_at: entry.created_at ? new Date(entry.created_at).toISOString() : new Date().toISOString(),
    })) ?? []

  return (
    <DistributionClient
      initialLeads={initialLeads}
      initialAgents={agentsData ?? []}
      initialHistory={initialHistory}
      role="admin"
    />
  )
}

