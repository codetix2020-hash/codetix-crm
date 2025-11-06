'use client'

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { StatsCards } from "@/components/StatsCards";
import { motion } from "framer-motion";

type Stats = {
  total: number
  new: number
  won: number
  lost: number
  conversionRate: number
}

export default function DashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats>({
    total: 0,
    new: 0,
    won: 0,
    lost: 0,
    conversionRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const { data } = await supabase.rpc("get_dashboard_stats_overall");
      if (data) {
        setStats({
          total: data.total_leads,
          new: data.new,
          won: data.won,
          lost: data.lost,
          conversionRate: data.conversion_rate,
        });
      }
      setLoading(false);
    };
    fetchStats();
  }, [supabase]);

  if (loading) return <div className="p-6">Cargando estadísticas...</div>;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-gray-500">
          Resumen general del rendimiento de tus leads.
        </p>
      </div>
      <StatsCards stats={stats} />
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">Gestionar Leads</h2>
            <p className="text-gray-600">
              Accede para ver, crear, editar y asignar leads.
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
  );
}
