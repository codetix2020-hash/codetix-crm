'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import StatusBadge from '@/components/StatusBadge'
import { 
  getWhatsAppLink, 
  formatRelativeTime, 
  getStatusLabel,
  getWhatsAppTemplate 
} from '@/lib/utils'

type LeadDetail = {
  id: string
  name: string
  phone?: string | null
  email?: string | null
  city?: string | null
  zone?: string | null
  status: string
  created_at: string
  notes?: string | null
}

type Interaction = {
  id: string
  channel: string
  message: string
  created_at: string
}

export default function LeadDetailPage({ params }: { params: { id: string } }) {
  const [lead, setLead] = useState<LeadDetail | null>(null)
  const [interactions, setInteractions] = useState<Interaction[]>([])
  const [loading, setLoading] = useState(true)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    loadLead()
  }, [params.id])

  const loadLead = async () => {
    setLoading(true)
    const res = await fetch(`/api/leads/${params.id}`)
    if (res.ok) {
      const data = await res.json()
      setLead(data.lead)
      setInteractions(data.interactions || [])
    } else {
      alert('Lead no encontrado')
      router.push('/dashboard')
    }
    setLoading(false)
  }

  const updateStatus = async (newStatus: string) => {
    if (!lead) return
    
    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    })

    if (res.ok) {
      await loadLead()
    } else {
      alert('Error al actualizar estado')
    }
    setSaving(false)
  }

  const addNote = async () => {
    if (!note.trim() || !lead) return

    setSaving(true)
    const res = await fetch(`/api/leads/${lead.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ note: note.trim() })
    })

    if (res.ok) {
      setNote('')
      await loadLead()
    } else {
      alert('Error al agregar nota')
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-48 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  if (!lead) return null

  const statuses = ['NEW', 'CONTACTED', 'DEMO', 'WON', 'LOST']

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <button
        onClick={() => router.back()}
        className="mb-6 text-gray-600 hover:text-gray-900 flex items-center gap-2"
      >
        ← Volver
      </button>

      {/* Lead Info Card */}
      <div className="card mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{lead.name}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {lead.city && <span>📍 {lead.city}</span>}
              {lead.zone && <span>• {lead.zone}</span>}
              <span>• {formatRelativeTime(lead.created_at)}</span>
            </div>
          </div>
          <StatusBadge status={lead.status} />
        </div>

        {/* Contact Info */}
        <div className="grid md:grid-cols-2 gap-4 mb-6">
          {lead.phone && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                📞
              </div>
              <div>
                <div className="text-xs text-gray-500">Teléfono</div>
                <div className="font-medium">{lead.phone}</div>
              </div>
            </div>
          )}
          
          {lead.email && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                📧
              </div>
              <div>
                <div className="text-xs text-gray-500">Email</div>
                <div className="font-medium truncate">{lead.email}</div>
              </div>
            </div>
          )}
        </div>

        {lead.notes && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-6">
            <div className="text-sm font-medium text-gray-700 mb-1">Notas iniciales:</div>
            <div className="text-gray-800">{lead.notes}</div>
          </div>
        )}

        {/* Quick Actions */}
        {lead.phone && (
          <div className="flex gap-2">
            <a
              href={getWhatsAppLink(lead.phone, getWhatsAppTemplate(lead.name, lead.status))}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 bg-green-600 text-white text-center px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              💬 Contactar por WhatsApp
            </a>
            <a
              href={`tel:${lead.phone}`}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              📞
            </a>
          </div>
        )}
      </div>

      {/* Status Update */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Actualizar Estado</h2>
        <div className="flex flex-wrap gap-2">
          {statuses.map((status) => (
            <button
              key={status}
              onClick={() => updateStatus(status)}
              disabled={saving || lead.status === status}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                lead.status === status
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              {getStatusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      {/* Add Note */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold mb-4">Agregar Nota</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Escribe una nota..."
            className="flex-1 input-field"
            onKeyPress={(e) => e.key === 'Enter' && addNote()}
          />
          <button
            onClick={addNote}
            disabled={!note.trim() || saving}
            className="btn-primary disabled:opacity-50"
          >
            Agregar
          </button>
        </div>
      </div>

      {/* Timeline/Interactions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Historial</h2>
        <div className="space-y-4">
          {interactions.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No hay interacciones registradas
            </p>
          ) : (
            interactions.map((interaction) => (
              <div
                key={interaction.id}
                className="flex gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <div className="flex-shrink-0">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    {interaction.channel === 'whatsapp' && '💬'}
                    {interaction.channel === 'email' && '📧'}
                    {interaction.channel === 'phone' && '📞'}
                    {interaction.channel === 'note' && '📝'}
                    {interaction.channel === 'system' && '⚙️'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium text-gray-900 capitalize">
                      {interaction.channel}
                    </span>
                    <span className="text-xs text-gray-500">
                      {formatRelativeTime(interaction.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700">{interaction.message}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
