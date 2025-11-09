import type { NextApiRequest, NextApiResponse } from 'next'
import { supabase } from '@/lib/supabase'
import { checkAuth, parseJsonBody } from './_helpers'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST', 'OPTIONS'])
    return res.status(405).json({ success: false, error: 'Method Not Allowed' })
  }

  if (!checkAuth(req, res)) {
    return
  }

  try {
    const body = parseJsonBody<{ leads?: any[] }>(req)

    if (!body || !Array.isArray(body.leads) || body.leads.length === 0) {
      return res
        .status(400)
        .json({ success: false, error: 'El body debe incluir un array "leads" con al menos un elemento.' })
    }

    const mappedLeads = body.leads
      .map((lead) => {
        const businessName = lead.name || lead.business_name
        if (!businessName && !lead.email && !lead.phone) {
          return null
        }

        const base = {
          business_name: businessName,
          contact_name: lead.contact_name ?? null,
          phone: lead.phone ?? null,
          email: lead.email ?? null,
          address: lead.address ?? null,
          website: lead.website ?? null,
          zone: lead.zone ?? null,
          source: lead.source ?? 'Google Sheets Lead Suite v6',
          sector: lead.sector ?? null,
          score: lead.score ?? null,
          rating: lead.rating ?? null,
          reviews: lead.reviews ?? null,
          web_quality: lead.web_quality ?? null,
          social_media: lead.social_media ?? null,
          analysis: lead.analysis ?? null,
          opportunities: lead.opportunities ?? null,
          conversion_probability: lead.conversion_probability ?? null,
          place_id: lead.place_id ?? null,
          status: lead.status ?? 'new',
          assigned_to: null,
          requested_agent: lead.agent ?? null,
          created_at: lead.created_at ?? new Date().toISOString(),
        }

        return Object.fromEntries(
          Object.entries(base).filter(([, value]) => value !== undefined)
        )
      })
      .filter(Boolean)

    if (!mappedLeads.length) {
      return res.status(400).json({
        success: false,
        error: 'Ningún lead contiene los campos mínimos (name/email/phone).',
      })
    }

    const { data, error } = await supabase
      .from('leads')
      .upsert(mappedLeads, {
        onConflict: 'place_id',
        ignoreDuplicates: true,
      })
      .select('id')

    if (error) {
      console.error('POST /api/leads/create Supabase error', error)
      return res.status(500).json({ success: false, error: error.message })
    }

    return res.status(200).json({ success: true, count: data?.length ?? 0 })
  } catch (error: any) {
    console.error('POST /api/leads/create error', error)
    return res.status(500).json({ success: false, error: error.message || 'Error inesperado al procesar los leads.' })
  }
}
