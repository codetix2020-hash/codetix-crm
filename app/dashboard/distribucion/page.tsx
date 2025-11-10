'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { formatDate } from '@/lib/utils'
import { Toaster, toast } from 'react-hot-toast'
import { User, Send, Shuffle } from 'lucide-react'

interface Lead {
  id: string
  business_name: string | null
  name: string | null
  phone: string | null
  city: string | null
  sector: string | null
  status: string | null
  created_at: string
  assigned_to: string | null
  notes: string | null
}

interface Agent {
  id: string
  name: string
  email: string
}

interface LeadHistoryEntry {
  id: string
  lead_id: string
  new_status: string | null
  old_status: string | null
  changed_by: string | null
  created_at: string
}

export default function LeadDistributionPage() {
  const supabase = useMemo(() => createClient(), [])

  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)
  const [autoDistributing, setAutoDistributing] = useState(false)

  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([])
  const [history, setHistory] = useState<LeadHistoryEntry[]>([])

  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([])

  const [isAssignOpen, setIsAssignOpen] = useState(false)
  const [assignAgent, setAssignAgent] = useState('')
  const [assignCount, setAssignCount] = useState(1)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)

    const [{ data: leadsData }, { data: agentsData }, { data: historyData }] = await Promise.all([
      supabase
        .from('leads')
        .select('id, business_name, name, phone, city, sector, status, notes, created_at, assigned_to')
        .order('created_at', { ascending: false }),
      supabase
        .from('users')
        .select('id, name, email')
        .eq('role', 'agent')
        .order('name', { ascending: true }),
      supabase
        .from('lead_history')
        .select('id, lead_id, new_status, old_status, changed_by, created_at')
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    setLeads(leadsData ?? [])
    setAgents(agentsData ?? [])
    setHistory(historyData ?? [])
    setLoading(false)
  }

  const unassignedLeads = useMemo(() => {
    return leads
      .filter((lead) => !lead.assigned_to)
  }, [leads])

  const totalUnassigned = useMemo(() => leads.filter((lead) => !lead.assigned_to).length, [leads])
  const totalAssigned = leads.length - totalUnassigned
  const activeAgents = agents.length
  const lastAssignment = history.length ? formatDate(history[0].created_at) : '—'

  const toggleLeadSelection = (leadId: string) => {
    setSelectedLeadIds((prev) =>
      prev.includes(leadId) ? prev.filter((id) => id !== leadId) : [...prev, leadId]
    )
  }

  const openAssignModal = (leadIds?: string[]) => {
    const ids = leadIds?.length ? leadIds : selectedLeadIds
    if (!ids.length) {
      toast.error('Selecciona al menos un lead para asignar.')
      return
    }
    setAssignCount(ids.length)
    setIsAssignOpen(true)
  }

  const closeAssignModal = () => {
    setIsAssignOpen(false)
    setAssignAgent('')
    setAssignCount(1)
  }

  const handleAssignLeads = async () => {
    const idsToAssign = selectedLeadIds.length
      ? selectedLeadIds
      : unassignedLeads.slice(0, assignCount).map((lead) => lead.id)

    if (!assignAgent) {
      toast.error('Selecciona un comercial para asignar.')
      return
    }

    if (!idsToAssign.length) {
      toast.error('No hay leads seleccionados o disponibles según el filtro.')
      return
    }

    setAssigning(true)
    try {
      const responses = await Promise.all(
        idsToAssign.map(async (leadId) => {
          const res = await fetch('/api/leads/assign', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ lead_id: leadId, assigned_to: assignAgent }),
          })

          if (!res.ok) {
            const payload = await res.json()
            throw new Error(payload?.message || 'No se pudo asignar el lead.')
          }
        })
      )

      toast.success(`${idsToAssign.length} leads asignados correctamente ✅`)
      setSelectedLeadIds([])
      closeAssignModal()
      await fetchData()
    } catch (error) {
      console.error('Asignación manual error', error)
      toast.error('Hubo un problema al asignar los leads.')
    } finally {
      setAssigning(false)
    }
  }

  const handleAutoDistribution = async () => {
    if (!agents.length) {
      toast.error('No hay comerciales activos para asignar.')
      return
    }

    if (!leads.some((lead) => !lead.assigned_to)) {
      toast('No hay leads pendientes para repartir.')
      return
    }

    setAutoDistributing(true)

    try {
      const response = await fetch('/api/leads/distribute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const payload = await response.json()

      if (!response.ok || !payload.success) {
        throw new Error(payload?.error || 'No se pudo completar el reparto automático.')
      }

      const detailText = payload.details
        ?.map((item: { agent: string; assigned_count: number }) => `${item.assigned_count} → ${item.agent}`)
        .join(', ')

      toast.success(
        `Reparto automático completado 🎉 Total: ${payload.total_distributed} ${detailText ? `(${detailText})` : ''}`
      )
      setSelectedLeadIds([])
      await fetchData()
    } catch (error) {
      console.error('Reparto automático error', error)
      toast.error('No se pudo completar el reparto automático.')
    } finally {
      setAutoDistributing(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <Toaster position="top-right" />

      <div className="space-y-1">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span role="img" aria-label="Outbox">
            📤
          </span>
          Reparto de Leads
        </h1>
        <p className="text-gray-600">
          Administra y asigna los leads generados a cada comercial.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Leads sin asignar" value={totalUnassigned} icon={<Send className="w-6 h-6" />} />
        <StatCard title="Leads asignados" value={totalAssigned} icon={<User className="w-6 h-6" />} />
        <StatCard title="Comerciales activos" value={activeAgents} icon={<User className="w-6 h-6" />} />
        <StatCard title="Último reparto" value={lastAssignment} icon={<Shuffle className="w-6 h-6" />} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl p-4 shadow-lg">
        <div className="flex flex-col">
          <span className="text-sm text-gray-500">Leads pendientes</span>
          <span className="text-lg font-semibold text-gray-800">
            {unassignedLeads.length} sin asignar
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => openAssignModal()}
            className="px-4 py-2 rounded-lg bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition flex items-center gap-2"
            disabled={!unassignedLeads.length}
          >
            <Send className="w-4 h-4" /> Asignar manual
          </button>
          <button
            onClick={handleAutoDistribution}
            className="px-4 py-2 rounded-lg bg-white/60 text-brand-600 shadow flex items-center gap-2 border border-brand-200 hover:bg-white/80 transition"
            disabled={autoDistributing || !unassignedLeads.length}
          >
            <Shuffle className="w-4 h-4" />
            {autoDistributing ? 'Repartiendo...' : 'Reparto automático'}
          </button>
        </div>
      </div>

      <section className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <header className="px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Leads pendientes</h2>
            <p className="text-sm text-gray-500">Selecciona los leads sin asignar para repartirlos entre los comerciales.</p>
          </div>
          <span className="text-sm text-gray-500">
            {unassignedLeads.length} leads disponibles
          </span>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/40 text-left text-sm uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">
                  <input
                    type="checkbox"
                    checked={
                      unassignedLeads.length > 0 && selectedLeadIds.length === unassignedLeads.length
                    }
                    onChange={(event) => {
                      if (event.target.checked) {
                        setSelectedLeadIds(unassignedLeads.map((lead) => lead.id))
                      } else {
                        setSelectedLeadIds([])
                      }
                    }}
                    className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                  />
                </th>
                <th className="px-6 py-3">Negocio</th>
                <th className="px-6 py-3">Contacto</th>
                <th className="px-6 py-3">Ciudad</th>
                <th className="px-6 py-3">Sector</th>
                <th className="px-6 py-3">Estado</th>
                <th className="px-6 py-3">Creado</th>
                <th className="px-6 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20 backdrop-blur">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    Cargando leads...
                  </td>
                </tr>
              ) : unassignedLeads.length ? (
                unassignedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedLeadIds.includes(lead.id)}
                        onChange={() => toggleLeadSelection(lead.id)}
                        className="rounded border-gray-300 text-brand-500 focus:ring-brand-500"
                      />
                    </td>
                    <td className="px-6 py-4 font-medium text-gray-800">
                      {lead.business_name ?? lead.name ?? '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{lead.name ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.city ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">{lead.sector ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-600">
                      {lead.status ? lead.status : '—'}
                    </td>
                    <td className="px-6 py-4 text-gray-600">{formatDate(lead.created_at)}</td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedLeadIds([lead.id])
                          openAssignModal([lead.id])
                        }}
                        className="px-3 py-1.5 text-sm rounded-lg bg-brand-500 text-white shadow hover:bg-brand-600 transition inline-flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" /> Asignar
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-10 text-center text-gray-500">
                    No hay leads sin asignar según los filtros actuales.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white/30 backdrop-blur-lg border border-white/20 rounded-2xl shadow-xl overflow-hidden">
        <header className="px-6 py-4">
          <h2 className="text-xl font-semibold">Historial de asignaciones</h2>
          <p className="text-sm text-gray-500">Últimos movimientos registrados en los leads.</p>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-white/40 text-left text-sm uppercase tracking-wide">
              <tr>
                <th className="px-6 py-3">Fecha</th>
                <th className="px-6 py-3">Lead</th>
                <th className="px-6 py-3">Estado nuevo</th>
                <th className="px-6 py-3">Estado anterior</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/20">
              {history.length ? (
                history.map((entry) => (
                  <tr key={entry.id} className="hover:bg-white/40 transition-colors">
                    <td className="px-6 py-4 text-gray-600">{formatDate(entry.created_at)}</td>
                    <td className="px-6 py-4 text-gray-700">{entry.lead_id}</td>
                    <td className="px-6 py-4 text-gray-700 font-medium">{entry.new_status ?? '—'}</td>
                    <td className="px-6 py-4 text-gray-500">{entry.old_status ?? '—'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                    No hay movimientos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {isAssignOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white/90 backdrop-blur-xl border border-white/40 rounded-3xl shadow-2xl w-full max-w-lg p-6 space-y-4">
            <div>
              <h3 className="text-2xl font-semibold">Asignar leads</h3>
              <p className="text-sm text-gray-600">
                Selecciona el comercial y la cantidad de leads que quieres asignar.
              </p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Comercial</label>
              <select
                value={assignAgent}
                onChange={(event) => setAssignAgent(event.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">Selecciona un comercial</option>
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name} ({agent.email})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">Cantidad de leads</label>
              <input
                type="number"
                min={1}
                max={unassignedLeads.length}
                value={assignCount}
                onChange={(event) => setAssignCount(Number(event.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-white/70 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-500">
                Leads seleccionados: {selectedLeadIds.length || assignCount}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={closeAssignModal}
                className="px-4 py-2 rounded-lg bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleAssignLeads}
                disabled={assigning}
                className="px-4 py-2 rounded-lg bg-brand-500 text-white shadow-lg hover:bg-brand-600 transition"
              >
                {assigning ? 'Asignando...' : 'Asignar leads'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string
  value: string | number
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white/40 backdrop-blur-lg border border-white/20 rounded-2xl shadow-lg p-5 flex items-center justify-between">
      <div>
        <p className="text-sm text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-800">{value}</p>
      </div>
      <div className="p-3 rounded-full bg-white/60 text-brand-600 shadow-inner">
        {icon}
      </div>
    </div>
  )
}

