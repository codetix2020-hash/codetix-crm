'use client'

import { Crown } from 'lucide-react'

interface HeaderProps {
  user: {
    name: string
    role: string
    email: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  const role = user?.role
  const name = user?.name
  const email = user?.email

  // Calcular el displayLabel según el rol
  const displayLabel = role === 'admin'
    ? 'ADMIN'
    : (name?.charAt(0)?.toUpperCase() ?? email?.charAt(0)?.toUpperCase() ?? '?')

  // Tooltip text
  const tooltipText = name || email || 'Usuario'

  return (
    <header className="h-20 bg-white/30 backdrop-blur-lg border-b border-white/20 flex items-center justify-end px-6">
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">{name || email}</p>
          <p className="text-sm text-gray-500 capitalize">{role}</p>
        </div>
        <div className="relative group">
          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-violet-500 rounded-full flex items-center justify-center text-white font-bold shadow-lg cursor-pointer">
            {role === 'admin' ? (
              <div className="flex flex-col items-center justify-center">
                <Crown className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-semibold">{displayLabel}</span>
              </div>
            ) : (
              <span className="text-lg">{displayLabel}</span>
            )}
          </div>
          {/* Tooltip */}
          <div className="absolute invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 -bottom-10 right-0 whitespace-nowrap shadow-lg z-50">
            {tooltipText}
            <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
          </div>
        </div>
      </div>
    </header>
  )
}
