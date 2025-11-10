import { NextResponse } from 'next/server'

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'MISSING'
  const anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'OK' : 'MISSING'
  const service_role = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'OK' : 'MISSING'

  return NextResponse.json({
    url,
    anon_key,
    service_role,
  })
}



