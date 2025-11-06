'use client'
import {
  Users,
  Activity,
  CheckCircle,
  XCircle,
  TrendingUp,
} from 'lucide-react'
import { motion } from 'framer-motion'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: string
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div
    className={`p-6 rounded-2xl bg-white/60 backdrop-blur-md border border-white/40 shadow-lg transition hover:bg-white/70 hover:-translate-y-1`}
  >
    <div className="flex justify-between items-start">
      <div>
        <p className="text-sm text-gray-600">{title}</p>
        <p className={`text-3xl font-bold ${color}`}>{value}</p>
      </div>
      <div className="p-3 bg-white/50 rounded-full">
        {icon}
      </div>
    </div>
  </div>
)

interface StatsCardsProps {
  stats: {
    total: number
    new: number
    won: number
    lost: number
    conversionRate: number
  }
}

export const StatsCards: React.FC<StatsCardsProps> = ({ stats }) => {
  const { total, won, lost, conversionRate } = stats

  const containerVariants = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6"
    >
      <motion.div variants={itemVariants}>
        <StatCard
          title="Total Leads"
          value={total}
          icon={<Users className="h-7 w-7 text-brand-600" />}
          color="text-brand-700"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Leads Ganados"
          value={won}
          icon={<CheckCircle className="h-7 w-7 text-green-600" />}
          color="text-green-800"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Leads Perdidos"
          value={lost}
          icon={<XCircle className="h-7 w-7 text-red-600" />}
          color="text-red-800"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
          title="Tasa de Conversión"
          value={`${conversionRate}%`}
          icon={<TrendingUp className="h-7 w-7 text-amber-600" />}
          color="text-amber-800"
        />
      </motion.div>
      <motion.div variants={itemVariants}>
        <StatCard
            title="Activos"
            value={total - (won + lost)}
            icon={<Activity className="h-7 w-7 text-sky-600" />}
            color="text-sky-800"
        />
      </motion.div>
    </motion.div>
  )
}
