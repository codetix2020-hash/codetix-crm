'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { MoreVertical, Edit, Trash2, Building } from 'lucide-react'
import { getStatusColor } from '@/lib/utils'

export type Lead = {
  id: string
  name: string
  phone: string
  email: string
  city: string
  status: 'NEW' | 'CONTACTED' | 'DEMO' | 'WON' | 'LOST'
  created_at: string
  assignments: { agents: { users: { name: string } } }[]
}

interface LeadCardProps {
  lead: Lead
  onEdit: (lead: Lead) => void
  onDelete: (leadId: string) => void
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, onEdit, onDelete }) => {
  const [menuOpen, setMenuOpen] = useState(false)
  const agentName = lead.assignments[0]?.agents?.users?.name || 'No asignado'

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div 
      variants={cardVariants}
      className="bg-white/60 backdrop-blur-md p-5 rounded-2xl shadow-lg relative border border-white/40 transition hover:bg-white/70 hover:-translate-y-1"
    >
      <div className="flex justify-between items-start">
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center border border-white/50">
                <Building className="w-6 h-6 text-brand-500"/>
            </div>
            <div>
              <h3 className="font-bold text-lg text-gray-800">{lead.name}</h3>
              <p className="text-sm text-gray-500">{lead.phone} | {lead.email}</p>
            </div>
        </div>
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded-full hover:bg-white/50"
        >
          <MoreVertical size={20} />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        <div>
            <p className="text-gray-400">Ciudad</p>
            <p className="text-gray-700 font-medium">{lead.city}</p>
        </div>
        <div>
            <p className="text-gray-400">Agente</p>
            <p className="text-gray-700 font-medium">{agentName}</p>
        </div>
        <div className="text-right">
            <p className="text-gray-400">Estado</p>
            <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(
              lead.status
            )}`}
          >
            {lead.status}
          </span>
        </div>
      </div>

      {menuOpen && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.1 }}
          className="absolute right-6 top-12 bg-white shadow-lg rounded-md border border-gray-200 z-10 w-32"
        >
          <button
            onClick={() => {
              onEdit(lead)
              setMenuOpen(false)
            }}
            className="flex items-center w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            <Edit size={14} className="mr-2" /> Editar
          </button>
          <button
            onClick={() => {
              onDelete(lead.id)
              setMenuOpen(false)
            }}
            className="flex items-center w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} className="mr-2" /> Eliminar
          </button>
        </motion.div>
      )}
    </motion.div>
  )
}
