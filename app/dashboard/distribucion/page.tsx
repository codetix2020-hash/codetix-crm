import DistributionClient from './DistributionClient'
import { createClient } from '@/lib/supabase/server'
import { getServerUserRole } from '@/lib/auth/getServerUserRole'
import { redirect } from 'next/navigation'
import { STATUS_MAP, toCanonicalStatus } from '@/types/lead'

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
    (leadsData ?? []).map((le: any) => ({
      ...le,
      status: toCanonicalStatus(le.status),
      assigned_to: le.assigned_to ?? null,
      notes: le.notes ?? null,
      created_at: le.created_at ? new Date(le.created_at).toISOString() : '1970-01-01T00:00:00.000Z',
    })) ?? []

  const initialHistory =
    (historyData ?? []).map((entry: any) => ({
      ...entry,
      created_at: entry.created_at ? new Date(entry.created_at).toISOString() : '1970-01-01T00:00:00.000Z',
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

