'use client'

import { useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeadCard } from './LeadCard'
import { LeadFilters } from './LeadFilters'
import { LeadForm } from './LeadForm'
import { PlusCircle } from 'lucide-react'
import { motion } from 'framer-motion'
import type { UserRole } from '@/lib/auth/getServerUserRole'
import type { Lead, LeadStatus } from '@/types/lead'
import { toCanonicalStatus } from '@/types/lead'

type FilterValue = 'Todos' | LeadStatus

const normalizeLead = (lead: Lead): Lead => ({
  ...lead,
  status: toCanonicalStatus(lead.status),
  sector: lead.sector ?? null,
  assigned_to: lead.assigned_to ?? null,
  notes: lead.notes ?? null,
  created_at: lead.created_at
    ? new Date(lead.created_at).toISOString()
    : new Date().toISOString(),
})

const serializeLead = (
  leadData: Partial<Lead>,
  {
    isAdmin,
    currentUserId,
  }: { isAdmin: boolean; currentUserId: string }
) => ({
  business_name: leadData.business_name ?? null,
  name: leadData.name ?? null,
  phone: leadData.phone ?? null,
  city: leadData.city ?? null,
  sector: leadData.sector ?? null,
  status: toCanonicalStatus(leadData.status ?? 'Nuevo'),
  assigned_to: isAdmin ? leadData.assigned_to ?? null : currentUserId,
  notes: leadData.notes ?? null,
})

type LeadsClientProps = {
  initialLeads: Lead[]
  role: UserRole
  currentUserId: string
}

export default function LeadsClient({ initialLeads, role, currentUserId }: LeadsClientProps) {
  const supabase = createClient()
  const isAdmin = role === 'admin'

  const [leads, setLeads] = useState<Lead[]>(initialLeads.map(normalizeLead))
  const [statusFilter, setStatusFilter] = useState<FilterValue>('Todos')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)
  const [isLoading, setLoading] = useState(false)

  const refreshLeads = async () => {
    setLoading(true)
    let query = supabase
      .from('leads')
      .select('id, business_name, name, phone, city, sector, status, notes, created_at, assigned_to')
      .order('created_at', { ascending: false })

    if (!isAdmin) {
      query = query.eq('assigned_to', currentUserId)
    }

    const { data, error } = await query

    if (error) {
      console.error('[LEADS DASHBOARD] refresh error', error)
      setLoading(false)
      return
    }

    setLeads((data ?? []).map(normalizeLead))
    setLoading(false)
  }

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    const payload = serializeLead(leadData, { isAdmin, currentUserId })

    if (leadToEdit) {
      const { error } = await supabase
        .from('leads')
        .update(payload)
        .eq('id', leadToEdit.id)

      if (error) {
        console.error('[LEADS DASHBOARD] update error', error)
        return
      }
    } else {
      const { error } = await supabase
        .from('leads')
        .insert(payload)

      if (error) {
        console.error('[LEADS DASHBOARD] insert error', error)
        return
      }
    }

    await refreshLeads()
    setLeadToEdit(null)
    setIsFormOpen(false)
  }

  const handleDeleteLead = async (leadId: string) => {
    const confirmation = window.confirm('¿Estás seguro de que quieres eliminar este lead?')
    if (!confirmation) return

    const { error } = await supabase.from('leads').delete().eq('id', leadId)

    if (error) {
      console.error('[LEADS DASHBOARD] delete error', error)
      return
    }

    setLeads((prev) => prev.filter((lead) => lead.id !== leadId))
  }

  const openFormForEdit = (lead: Lead) => {
    if (!isAdmin && lead.assigned_to !== currentUserId) {
      console.warn('[CLIENT][Leads] intento de editar lead sin permisos', lead.id)
      return
    }
    setLeadToEdit(lead)
    setIsFormOpen(true)
  }

  const openFormForCreate = () => {
    setLeadToEdit(null)
    setIsFormOpen(true)
  }

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'Todos') return leads
    return leads.filter((lead) => lead.status === statusFilter)
  }, [leads, statusFilter])

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Gestión de Leads</h1>
        <button
          onClick={openFormForCreate}
          className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700"
        >
          <PlusCircle size={20} className="mr-2" />
          Nuevo Lead
        </button>
      </div>

      <LeadFilters
        activeStatus={statusFilter}
        onStatusChange={(status) => setStatusFilter((status ?? 'Todos') as FilterValue)}
      />

      {isLoading ? (
        <p className="mt-6">Cargando leads...</p>
      ) : (
        <motion.div
          className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } },
          }}
        >
          {filteredLeads.map((lead) => {
            const canManage = isAdmin || lead.assigned_to === currentUserId
            return (
              <LeadCard
                key={lead.id}
                lead={lead}
                canManage={canManage}
                onEdit={openFormForEdit}
                onDelete={handleDeleteLead}
              />
            )
          })}
        </motion.div>
      )}

      <LeadForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSaveLead}
        leadToEdit={leadToEdit}
      />
    </div>
  )
}
