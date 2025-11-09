import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '@/lib/supabase';
import { checkAuth } from './_helpers';

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  (async () => {
    try {
      // ✅ CORS para Google Apps Script
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.status(200).end();
        return;
      }

      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST, OPTIONS');
        res.status(405).json({ success: false, error: 'Method Not Allowed' });
        return;
      }

      if (!checkAuth(req, res)) return;

      res.setHeader('Access-Control-Allow-Origin', '*');

      const body =
        typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

      const mappedLeads = Array.isArray(body?.leads)
        ? body.leads
            .map((lead: any) => {
              const businessName = lead.name || lead.business_name;
              if (!businessName && !lead.email && !lead.phone) {
                return null;
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
              };

              return Object.fromEntries(
                Object.entries(base).filter(([, value]) => value !== undefined)
              );
            })
            .filter(Boolean)
        : null;

      if (!mappedLeads || !mappedLeads.length) {
        res.status(400).json({
          success: false,
          error: 'El body debe incluir un array "leads" con al menos un elemento.',
        });
        return;
      }

      const { data, error } = await supabase
        .from('leads')
        .upsert(mappedLeads, {
          onConflict: 'place_id',
          ignoreDuplicates: true,
        })
        .select('id');

      if (error) {
        console.error('[CREATE LEADS SUPABASE ERROR]', error);
        res.status(500).json({ success: false, error: error.message });
        return;
      }

      res.status(200).json({ success: true, count: data?.length ?? 0 });
    } catch (err: any) {
      console.error('[CREATE LEADS ERROR]', err);
      res.status(500).json({ success: false, error: String(err?.message || err) });
    }
  })();
}
