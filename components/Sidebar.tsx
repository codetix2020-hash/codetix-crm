'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Users, LogOut, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

const sidebarItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/dashboard/leads', icon: Users, label: 'Leads' },
  { href: '/dashboard/distribucion', icon: Send, label: 'Reparto' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <aside className="w-64 bg-white/30 backdrop-blur-lg flex-shrink-0 border-r border-white/20 flex flex-col">
      <div className="h-20 flex items-center justify-center border-b border-white/20">
        <h1 className="text-2xl font-bold text-brand-700">CodeTix CRM</h1>
      </div>
      <nav className="flex-1 px-4 py-6 space-y-2">
        {sidebarItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center px-4 py-3 rounded-lg transition-colors ${
              pathname === item.href
                ? 'bg-brand-500 text-white shadow-lg'
                : 'text-gray-700 hover:bg-white/40'
            }`}
          >
            <item.icon className="w-6 h-6 mr-4" />
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="px-4 py-6 border-t border-white/20">
        <button 
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 rounded-lg hover:bg-white/40"
        >
          <LogOut className="w-6 h-6 mr-4" />
          <span className="font-medium">Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  )
}
