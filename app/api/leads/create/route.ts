import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { checkAuth } from "../_helpers";

export async function OPTIONS() {
  return NextResponse.json({});
}

export async function POST(request: Request) {
  const unauthorized = checkAuth(request);
  if (unauthorized) return unauthorized;

  try {
    const payload = await request.json().catch(() => null);

    if (!payload || !Array.isArray(payload.leads) || payload.leads.length === 0) {
      return NextResponse.json(
        { success: false, error: 'El body debe incluir un array "leads" con al menos un elemento.' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    const mappedLeads = payload.leads
      .map((lead: Record<string, any>) => {
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
      .filter(Boolean);

    if (!mappedLeads.length) {
      return NextResponse.json(
        {
          success: false,
          error: 'Ningún lead contiene los campos mínimos (name/email/phone).',
        },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('leads')
      .upsert(mappedLeads, {
        onConflict: 'place_id',
        ignoreDuplicates: true,
      })
      .select('id');

    if (error) {
      console.error('POST /api/leads/create Supabase error', error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, count: data?.length ?? 0 });
  } catch (error) {
    console.error('POST /api/leads/create error', error);
    return NextResponse.json(
      { success: false, error: 'Error inesperado al procesar los leads.' },
      { status: 500 }
    );
  }
}
