import { NextResponse } from 'next/server'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders })
}

export async function GET() {
  return NextResponse.json(
    {
      status: 'ok',
      message: 'CRM CodeTix activo',
      timestamp: new Date().toISOString(),
    },
    { headers: corsHeaders }
  )
}
