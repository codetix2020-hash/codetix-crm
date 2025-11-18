'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { StatsCards } from '@/components/StatsCards'
import { motion } from 'framer-motion'

type Stats = {
  total: number
  new: number
  won: number
  lost: number
  conversionRate: number
}

const initialStats: Stats = {
  total: 0,
  new: 0,
  won: 0,
  lost: 0,
  conversionRate: 0,
}

const mapStatus = (status: unknown): keyof Omit<Stats, 'total' | 'conversionRate'> | null => {
  if (typeof status !== 'string') return null
  const key = status.toLowerCase()
  if (key === 'nuevo') return 'new'
  if (key === 'contactado' || key === 'en_progreso' || key === 'progreso') return 'new'
  if (key === 'cerrado' || key === 'ganado') return 'won'
  if (key === 'rechazado' || key === 'perdido') return 'lost'
  return null
}

export default function DashboardPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>(initialStats)
  const [role, setRole] = useState<'admin' | 'agent'>('agent')

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      const resolvedRole =
        typeof user?.user_metadata?.role === 'string' &&
        user.user_metadata.role.toLowerCase() === 'admin'
          ? 'admin'
          : 'agent'

      setRole(resolvedRole)

      let query = supabase.from('leads').select('status, assigned_to')
      if (resolvedRole !== 'admin' && user) {
        query = query.eq('assigned_to', user.id)
      }

      const { data, error } = await query

      if (error) {
        console.error('[DASHBOARD] error cargando stats', error)
        setStats(initialStats)
        setLoading(false)
        return
      }

      const counters = data?.reduce(
        (acc, lead) => {
          acc.total += 1
          const mapped = mapStatus(lead.status)
          if (mapped) acc[mapped] += 1
          return acc
        },
        { total: 0, new: 0, won: 0, lost: 0 }
      ) ?? { total: 0, new: 0, won: 0, lost: 0 }

      const conversionRate =
        counters.total > 0 ? Number(((counters.won / counters.total) * 100).toFixed(2)) : 0

      setStats({
        total: counters.total,
        new: counters.new,
        won: counters.won,
        lost: counters.lost,
        conversionRate,
      })
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  if (loading) return <div className="p-6">Cargando estadísticas...</div>

  const roleDescription = useMemo(
    () =>
      role === 'admin'
        ? 'Resumen general del rendimiento de todos los leads.'
        : 'Resumen del rendimiento de tus leads asignados.',
    [role]
  )

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">{roleDescription}</p>
      </div>
      <StatsCards stats={stats} />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Gestionar Leads</h2>
            <p className="text-gray-600">
              {role === 'admin'
                ? 'Accede para ver, crear, editar y asignar leads en el equipo.'
                : 'Accede para administrar tus leads asignados.'}
            </p>
          </div>
          <Link href="/dashboard/leads">
            <span className="flex items-center bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors">
              Ir a Leads <ArrowRight size={20} className="ml-2" />
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  )
}
