import { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth, parseJsonBody } from './_helpers'

type LeadField =
  | 'business_name'
  | 'name'
  | 'phone'
  | 'sector'
  | 'city'
  | 'status'
  | 'assigned_to'
  | 'notes'
  | 'created_at'

type RawLead = Record<string, unknown>

type LeadInsertPayload = {
  business_name: string | null
  name: string | null
  phone: string | null
  sector: string | null
  city: string | null
  status: string
  assigned_to: string | null
  notes: string | null
  created_at?: string
}

const ACCEPTED_STATUSES: LeadInsertPayload['status'][] = [
  'nuevo',
  'en_progreso',
  'contactado',
  'ganado',
  'perdido',
]

const ALLOWED_FIELDS: LeadField[] = [
  'business_name',
  'name',
  'phone',
  'sector',
  'city',
  'status',
  'assigned_to',
  'notes',
  'created_at',
]

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const toStringOrNull = (value: unknown): string | null => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const toUuidOrNull = (value: unknown): string | null => {
  const str = toStringOrNull(value)
  return str && UUID_REGEX.test(str) ? str : null
}

const toIsoTimestamp = (value: unknown): string | undefined => {
  const str = toStringOrNull(value)
  if (!str) return undefined
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString()
}

const normalizeStatus = (value: unknown): LeadInsertPayload['status'] => {
  const raw = toStringOrNull(value)?.toLowerCase() as LeadInsertPayload['status'] | null
  return raw && ACCEPTED_STATUSES.includes(raw) ? raw : 'nuevo'
}

const sanitizeLead = (lead: Partial<LeadInsertPayload>): LeadInsertPayload | null => {
  const payload: Partial<LeadInsertPayload> = {}

  ALLOWED_FIELDS.forEach((field) => {
    const value = lead[field]
    if (value !== undefined && value !== null && value !== '') {
      payload[field] = value as never
    }
  })

  const hasIdentity =
    (payload.business_name && payload.business_name.length > 0) ||
    (payload.name && payload.name.length > 0) ||
    (payload.phone && payload.phone.length > 0)

  if (!hasIdentity) {
    return null
  }

  return payload as LeadInsertPayload
}

const normalizeLead = (incoming: RawLead): LeadInsertPayload | null => {
  const base: Partial<LeadInsertPayload> = {
    business_name: toStringOrNull(incoming.business_name),
    name: toStringOrNull(incoming.name),
    phone: toStringOrNull(incoming.phone),
    sector: toStringOrNull(incoming.sector),
    city: toStringOrNull(incoming.city),
    notes: toStringOrNull(incoming.notes),
    assigned_to: toUuidOrNull(incoming.assigned_to),
    status: normalizeStatus(incoming.status),
    created_at: toIsoTimestamp(incoming.created_at),
  }

  if (!base.name && base.business_name) {
    base.name = base.business_name
  }

  return sanitizeLead(base)
}

const extractLeadsFromBody = (body: unknown): RawLead[] => {
  if (!body || typeof body !== 'object') return []
  if (Array.isArray((body as Record<string, unknown>).leads)) {
    return ((body as Record<string, unknown>).leads ?? []) as RawLead[]
  }
  return [body as RawLead]
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      return res.status(200).end()
    }

    if (req.method === 'GET') {
      return res
        .status(200)
        .json({ status: 'ok', message: 'Use POST para crear leads en /api/leads/create' })
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['GET', 'POST', 'OPTIONS'])
      return res.status(405).json({ success: false, error: 'Method Not Allowed' })
    }

    if (!checkAuth(req, res)) return

    res.setHeader('Access-Control-Allow-Origin', '*')

    const body = parseJsonBody(req)
    const incoming = extractLeadsFromBody(body)
    const mappedLeads = incoming
      .map((lead) => normalizeLead(lead))
      .filter((lead): lead is LeadInsertPayload => lead !== null)

    if (!mappedLeads.length) {
      return res.status(400).json({
        success: false,
        error:
          'El body debe incluir un array "leads" (o un objeto único) con business_name, name o phone.',
      })
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


