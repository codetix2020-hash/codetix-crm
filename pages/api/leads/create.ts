import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth, parseJsonBody } from './_helpers'

type RawLead = Record<string, unknown>

type LeadInsertPayload = {
  business_name: string | null
  name: string | null
  phone: string | null
  sector: string | null
  city: string | null
  status: 'Nuevo' | 'Contactado' | 'Rechazado' | 'Cerrado'
  assigned_to: string | null
  notes: string | null
  created_at: string
}

const ACCEPTED_STATUSES: LeadInsertPayload['status'][] = [
  'Nuevo',
  'Contactado',
  'Rechazado',
  'Cerrado',
]

const toStringOrNull = (value: unknown): string | null => {
  if (value === null || value === undefined) return null
  if (value instanceof Date) return value.toISOString()
  if (typeof value === 'number' && !Number.isNaN(value)) return value.toString()
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length ? trimmed : null
}

const toIsoTimestamp = (value: unknown): string | null => {
  const str = toStringOrNull(value)
  if (!str) return null
  const parsed = new Date(str)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

const normalizeStatus = (value: unknown): LeadInsertPayload['status'] => {
  const raw = toStringOrNull(value)?.toLowerCase()
  const normalized =
    raw &&
    ({
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
    } as Record<string, LeadInsertPayload['status'] | undefined>)[raw]

  return normalized && ACCEPTED_STATUSES.includes(normalized)
    ? normalized
    : 'Nuevo'
}

const normalizeLead = (incoming: RawLead): LeadInsertPayload | null => {
  const businessName = toStringOrNull(incoming.business_name)
  const name = toStringOrNull(incoming.name) ?? businessName
  const phone = toStringOrNull(incoming.phone)

  // Rechazar líneas totalmente vacías
  if (!businessName && !name && !phone) return null

  const createdAt = toIsoTimestamp(incoming.created_at) ?? new Date().toISOString()

  return {
    business_name: businessName,
    name,
    phone,
    sector: toStringOrNull(incoming.sector),
    city: toStringOrNull(incoming.city),
    status: normalizeStatus(incoming.status),
    assigned_to: toStringOrNull(incoming.assigned_to),
    notes: toStringOrNull(incoming.notes),
    created_at: createdAt,
  }
}

const extractLeadsFromBody = (body: unknown): RawLead[] => {
  if (!body) return []
  if (Array.isArray(body)) return body as RawLead[]
  if (typeof body !== 'object') return []

  const record = body as Record<string, unknown>
  const maybe = record.leads

  if (Array.isArray(maybe)) return maybe as RawLead[]
  if (maybe && typeof maybe === 'object') return [maybe as RawLead]

  // Si no hay "leads", tratamos el body como un solo lead
  return [record]
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

    const mapped = incoming
      .map((lead) => normalizeLead(lead))
      .filter((l): l is LeadInsertPayload => l !== null)

    if (!mapped.length) {
      return res.status(400).json({
        success: false,
        error:
          'El body debe incluir un array "leads" (o un objeto único) con al menos business_name, name o phone.',
      })
    }

    const { data, error } = await supabase.from('leads').insert(mapped).select('id')
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


