export type LeadStatus = 'Nuevo' | 'Contactado' | 'Rechazado' | 'Cerrado'

export type Lead = {
  id: string
  business_name: string | null
  name: string | null
  phone: string | null
  city: string | null
  sector: string | null
  status: LeadStatus
  created_at: string
  notes: string | null
  assigned_to: string | null
}

export type DistributionLead = Lead

export type DistributionAgent = {
  id: string
  name: string
  email: string
}

export type LeadHistoryEntry = {
  id: string
  lead_id: string
  new_status: string | null
  old_status: string | null
  changed_by: string | null
  created_at: string
}

export const STATUS_MAP: Record<string, LeadStatus> = {
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

export const toCanonicalStatus = (value?: string | null): LeadStatus => {
  const key = (value ?? '').toLowerCase()
  return STATUS_MAP[key] ?? 'Nuevo'
}

