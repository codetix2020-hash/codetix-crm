import Link from 'next/link'
import StatusBadge from './StatusBadge'
import { getWhatsAppLink, formatRelativeTime } from '@/lib/utils'

type LeadSummary = {
  id: string
  business_name?: string | null
  name?: string | null
  status: string
  city?: string | null
  created_at: string
  phone?: string | null
  notes?: string | null
}

interface LeadCardProps {
  lead: LeadSummary
  showActions?: boolean
}

export default function LeadCard({ lead, showActions = true }: LeadCardProps) {
  const displayName = lead.business_name || lead.name || 'Lead sin nombre'
  const contactName =
    lead.business_name && lead.name && lead.business_name !== lead.name ? lead.name : null

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">{displayName}</h3>
            <StatusBadge status={lead.status} />
          </div>
          <div className="text-sm text-gray-500">
            {lead.city && <span>{lead.city}</span>}
            {contactName && <span className="ml-2">• {contactName}</span>}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          {formatRelativeTime(lead.created_at)}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        {lead.phone && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <span className="text-gray-400">📞</span>
            <span>{lead.phone}</span>
          </div>
        )}
      </div>

      {lead.notes && (
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm text-gray-700 border border-gray-100">
          <span className="font-medium">Notas:</span> {lead.notes}
        </div>
      )}

      {showActions && (
        <div className="flex gap-2 pt-4 border-t border-gray-100">
          {lead.phone && (
            <a
              href={getWhatsAppLink(
                lead.phone,
                `Hola ${
                  lead.name ?? lead.business_name ?? ''
                }, soy de CodeTix. Te contacto por tu solicitud.`
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 text-white text-center px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
            >
              💬 WhatsApp
            </a>
          )}
          <Link
            href={`/leads/${lead.id}`}
            className="flex-1 bg-blue-600 text-white text-center px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            Ver Detalle
          </Link>
        </div>
      )}
    </div>
  )
}
