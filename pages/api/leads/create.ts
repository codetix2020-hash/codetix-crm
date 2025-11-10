import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth, parseJsonBody } from './_helpers'

type RawLead = Record<string, unknown>

type LeadInsertPayload = {
  id?: string
  business_name: string | null
  name: string | null
  phone: string | null
  city: string | null
  sector: string | null
  status: string
  assigned_to: string | null
  notes: string | null
  created_at?: string
}

const ALLOWED_STATUSES = new Set(['nuevo', 'en_progreso', 'contactado', 'ganado', 'perdido'])
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const asString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const asUuid = (value: unknown): string | null => {
  const str = asString(value)
  return str && UUID_REGEX.test(str) ? str : null
}

const asTimestamp = (value: unknown): string | undefined => {
  const str = asString(value)
  if (!str) return undefined
  const date = new Date(str)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

const normalizeStatus = (value: unknown): string => {
  const status = asString(value)?.toLowerCase() ?? 'nuevo'
  return ALLOWED_STATUSES.has(status) ? status : 'nuevo'
}

const cleanPayload = (payload: LeadInsertPayload): LeadInsertPayload => {
  const cleanedEntries = Object.entries(payload).filter(([, value]) => value !== undefined)
  return Object.fromEntries(cleanedEntries) as LeadInsertPayload
}

const normalizeLead = (lead: RawLead): LeadInsertPayload | null => {
  const businessName = asString(lead.business_name) ?? asString(lead.name) ?? null
  const name = asString(lead.name) ?? asString(lead.contact_name) ?? businessName
  const phone = asString(lead.phone)
  const city = asString(lead.city)
  const sector = asString(lead.sector)
  const notes = asString(lead.notes)
  const assignedTo = asUuid(lead.assigned_to)

  if (!businessName && !name && !phone) {
    return null
  }

  const payload: LeadInsertPayload = cleanPayload({
    id: asUuid(lead.id) ?? undefined,
    business_name: businessName,
    name: name ?? null,
    phone: phone ?? null,
    city: city ?? null,
    sector: sector ?? null,
    status: normalizeStatus(lead.status),
    assigned_to: assignedTo,
    notes: notes ?? null,
    created_at: asTimestamp(lead.created_at),
  })

  return payload
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      return res.status(200).end()
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST, OPTIONS')
      return res.status(405).json({ success: false, error: 'Method Not Allowed' })
    }

    if (!checkAuth(req, res)) return

    res.setHeader('Access-Control-Allow-Origin', '*')

    const body = parseJsonBody(req)
    const incoming = Array.isArray(body?.leads) ? body.leads : []
    const mappedLeads = incoming
      .map((lead: RawLead) => normalizeLead(lead))
      .filter((payload): payload is LeadInsertPayload => payload !== null)

    if (!mappedLeads.length) {
      return res
        .status(400)
        .json({ success: false, error: 'El body debe incluir un array "leads" con datos válidos.' })
    }

    const { data, error } = await supabase.from('leads').insert(mappedLeads).select('id')

    if (error) {
      console.error('[CREATE LEADS SUPABASE ERROR]', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, count: data?.length ?? 0 })
  } catch (err) {
    console.error('[CREATE LEADS ERROR]', err)
    return res.status(500).json({ success: false, error: String(err) })
  }
}
