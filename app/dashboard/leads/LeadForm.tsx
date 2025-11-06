'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Lead } from './LeadCard'

interface LeadFormProps {
  isOpen: boolean
  onClose: () => void
  onSave: (lead: Partial<Lead>) => void
  leadToEdit?: Lead | null
}

const initialLeadState: Partial<Lead> = {
  name: '',
  email: '',
  phone: '',
  city: '',
  status: 'NEW',
}

export const LeadForm: React.FC<LeadFormProps> = ({ isOpen, onClose, onSave, leadToEdit }) => {
  const [lead, setLead] = useState(initialLeadState)

  useEffect(() => {
    if (leadToEdit) {
      setLead(leadToEdit)
    } else {
      setLead(initialLeadState)
    }
  }, [leadToEdit, isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setLead(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(lead)
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-800">{leadToEdit ? 'Editar Lead' : 'Nuevo Lead'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input name="name" value={lead.name} onChange={handleChange} placeholder="Nombre completo" className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500" required />
              <input name="email" type="email" value={lead.email} onChange={handleChange} placeholder="Email" className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500" />
              <input name="phone" value={lead.phone} onChange={handleChange} placeholder="Teléfono" className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500" />
              <input name="city" value={lead.city} onChange={handleChange} placeholder="Ciudad" className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500" />
              <select name="status" value={lead.status} onChange={handleChange} className="w-full border p-3 rounded-lg bg-gray-50 focus:ring-2 focus:ring-brand-500">
                <option value="NEW">NEW</option>
                <option value="CONTACTED">CONTACTED</option>
                <option value="DEMO">DEMO</option>
                <option value="WON">WON</option>
                <option value="LOST">LOST</option>
              </select>
              <div className="flex justify-end space-x-4 pt-4">
                <button type="button" onClick={onClose} className="px-5 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">Cancelar</button>
                <button type="submit" className="px-5 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-500 transition-colors shadow-lg shadow-brand-500/20">Guardar</button>
              </div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
