'use client'

import { useEffect, useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LeadCard, Lead } from './LeadCard'
import { LeadFilters } from './LeadFilters'
import { LeadForm } from './LeadForm'
import { PlusCircle } from 'lucide-react'
import { motion } from 'framer-motion'

// Definimos los tipos para los agentes
type Agent = {
  id: string;
  name: string;
  email: string;
};


export default function LeadsPage() {
  const supabase = createClient()
  const [leads, setLeads] = useState<Lead[]>([])
  const [agents, setAgents] = useState<Agent[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [leadToEdit, setLeadToEdit] = useState<Lead | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)

      // Obtener sesión y rol del usuario
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profile } = await supabase
          .from('users')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setUserRole(profile?.role || null);

        // Fetch de leads basado en rol
        let query = supabase.from('leads').select(`
          id, name, phone, email, city, status, created_at,
          assignments ( agents ( id, users ( name, email ) ) )
        `)

        if (profile?.role === 'agent') {
            query = query.in('id', 
                await supabase.from('assignments').select('lead_id').eq('agent_id', session.user.id).then(({data}) => data?.map(a => a.lead_id) || [])
            )
        }
        
        const { data: leadsData, error } = await query;
        if (leadsData) setLeads(leadsData as unknown as Lead[]);


        // Si es admin, traer todos los agentes
        if (profile?.role === 'admin') {
            const { data: agentsData } = await supabase
              .from('agents')
              .select('id, users ( name, email )')

            if (agentsData) {
              const formatted = agentsData.map((agent: any) => ({
                id: agent.id,
                name: agent.users?.[0]?.name ?? agent.users?.name ?? 'Sin nombre',
                email: agent.users?.[0]?.email ?? agent.users?.email ?? 'Sin correo',
              }))
              setAgents(formatted)
            }
        }
      }
      
      setLoading(false)
    }
    fetchData()
  }, [supabase])

  const handleSaveLead = async (leadData: Partial<Lead>) => {
    if (leadToEdit) {
      // Lógica de actualización
      const { data, error } = await supabase
        .from('leads')
        .update({ ...leadData, id: undefined }) // supabase no quiere el id en el update
        .eq('id', leadToEdit.id)
        .select()
        .single();
      if (data) {
        setLeads(leads.map(l => l.id === data.id ? { ...l, ...data } : l))
      }
    } else {
      // Lógica de creación
      const { data, error } = await supabase
        .from('leads')
        .insert(leadData)
        .select()
        .single();
      if (data) {
        // Asignación simple al primer agente si es admin (lógica a mejorar)
        if (userRole === 'admin' && agents.length > 0) {
            await supabase.from('assignments').insert({ lead_id: data.id, agent_id: agents[0].id });
        }
        // Recargar leads para ver la nueva asignación
        const { data: refreshedLeads } = await supabase.from('leads').select(`*, assignments ( agents ( users ( name ) ) )`);
        if (refreshedLeads) setLeads(refreshedLeads as unknown as Lead[]);
      }
    }
    setLeadToEdit(null)
    setIsFormOpen(false)
  }

  const handleDeleteLead = async (leadId: string) => {
    if(confirm('¿Estás seguro de que quieres eliminar este lead?')) {
        await supabase.from('leads').delete().eq('id', leadId)
        setLeads(leads.filter(l => l.id !== leadId))
    }
  }

  const openFormForEdit = (lead: Lead) => {
    setLeadToEdit(lead)
    setIsFormOpen(true)
  }
  
  const openFormForCreate = () => {
    setLeadToEdit(null)
    setIsFormOpen(true)
  }

  const filteredLeads = useMemo(() => {
    if (statusFilter === 'ALL') return leads
    return leads.filter(lead => lead.status === statusFilter)
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
      
      <LeadFilters activeStatus={statusFilter} onStatusChange={setStatusFilter} />

      {loading ? (
        <p className="mt-6">Cargando leads...</p>
      ) : (
        <motion.div 
          className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.05 } }
          }}
        >
          {filteredLeads.map(lead => (
            <LeadCard key={lead.id} lead={lead} onEdit={openFormForEdit} onDelete={handleDeleteLead} />
          ))}
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
