import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUS = [
  'nuevo',
  'contactado',
  'interesado',
  'presupuesto',
  'cerrado',
  'perdido',
] as const

type AllowedStatus = (typeof ALLOWED_STATUS)[number]

export async function PATCH(request: Request) {
  try {
    const { lead_id, status, changed_by } = await request.json()

    if (!lead_id || !status) {
      return NextResponse.json(
        {
          success: false,
          error: 'Los campos lead_id y status son obligatorios.',
        },
        { status: 400 }
      )
    }

    if (!ALLOWED_STATUS.includes(status as AllowedStatus)) {
      return NextResponse.json(
        {
          success: false,
          error: `Estado inválido. Valores permitidos: ${ALLOWED_STATUS.join(', ')}`,
        },
        { status: 400 }
      )
    }

    const supabase = createClient()

    const { data: currentLead, error: fetchError } = await supabase
      .from('leads')
      .select('id, status')
      .eq('id', lead_id)
      .single()

    if (fetchError || !currentLead) {
      return NextResponse.json(
        {
          success: false,
          error: 'Lead no encontrado.',
        },
        { status: 404 }
      )
    }

    const { data: updatedLead, error: updateError } = await supabase
      .from('leads')
      .update({ status })
      .eq('id', lead_id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json(
        {
          success: false,
          error: updateError.message,
        },
        { status: 500 }
      )
    }

    const historyPayload = {
      lead_id,
      old_status: currentLead.status,
      new_status: status,
      changed_by: changed_by ?? null,
    }

    const { error: historyError } = await supabase
      .from('lead_history')
      .insert(historyPayload)

    if (historyError) {
      return NextResponse.json(
        {
          success: false,
          error: `Estado actualizado, pero no se pudo registrar el historial: ${historyError.message}`,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, data: updatedLead })
  } catch (error) {
    console.error('PATCH /api/leads/update-status error', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Error inesperado al actualizar el estado del lead.',
      },
      { status: 500 }
    )
  }
}
