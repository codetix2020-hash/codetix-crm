'use client'

import { useEffect, useState } from 'react'
import { formatNumber, getStatusLabel } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [allLeads, setAllLeads] = useState<any[]>([])
  const [agents, setAgents] = useState<any[]>([])
  const [stats, setStats] = useState({
    total_leads: 0,
    leads_today: 0,
    active_agents: 0,
    avg_conversion: 0
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    
    // Cargar todos los leads (últimos 100)
    const leadsRes = await fetch('/api/admin/leads?limit=100')
    if (leadsRes.ok) {
      const leadsData = await leadsRes.json()
      setAllLeads(leadsData.leads || [])
    }

    // Cargar agentes
    const agentsRes = await fetch('/api/admin/agents')
    if (agentsRes.ok) {
      const agentsData = await agentsRes.json()
      setAgents(agentsData.agents || [])
    }

    // Cargar estadísticas
    const statsRes = await fetch('/api/admin/stats')
    if (statsRes.ok) {
      const statsData = await statsRes.json()
      setStats(statsData)
    }

    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-lg"></div>
          <div className="h-64 bg-gray-200 rounded-lg"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Administración</h1>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Total Leads</div>
          <div className="text-3xl font-bold text-gray-900">
            {formatNumber(stats.total_leads)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Histórico</div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Leads Hoy</div>
          <div className="text-3xl font-bold text-blue-600">
            {formatNumber(stats.leads_today)}
          </div>
          <div className="text-xs text-gray-500 mt-1">Últimas 24h</div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Agentes Activos</div>
          <div className="text-3xl font-bold text-green-600">
            {formatNumber(stats.active_agents)}
          </div>
          <div className="text-xs text-gray-500 mt-1">En operación</div>
        </div>

        <div className="card">
          <div className="text-sm text-gray-600 mb-1">Conversión Promedio</div>
          <div className="text-3xl font-bold text-purple-600">
            {stats.avg_conversion}%
          </div>
          <div className="text-xs text-gray-500 mt-1">Últimos 30 días</div>
        </div>
      </div>

      {/* Agents Overview */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Agentes</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads Activos</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Capacidad</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {agents.map((agent) => (
                <tr key={agent.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{agent.name}</div>
                    <div className="text-sm text-gray-500">{agent.email}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{agent.zone}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{agent.active_leads}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{agent.capacity}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      agent.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {agent.active ? '✓ Activo' : '○ Inactivo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Recent Leads */}
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Leads Recientes</h2>
          <button
            onClick={loadData}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            🔄 Actualizar
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Zona</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignado a</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuente</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {allLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{lead.name}</div>
                    <div className="text-sm text-gray-500">{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.zone}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{lead.agent_name || 'Sin asignar'}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={lead.status} showEmoji={false} />
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{lead.source || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(lead.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
