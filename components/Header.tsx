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
    : (name?.trim()?.charAt(0)?.toUpperCase() ||
       email?.trim()?.charAt(0)?.toUpperCase() ||
       '?')

  // Tooltip text
  const tooltipText = name || email || 'Usuario'

  // Debug: loguear si falta información
  if (displayLabel === '?') {
    console.warn('[HEADER] Missing name/email for user:', { name, email, role })
  }

  return (
    <header className="h-20 bg-white/30 backdrop-blur-lg border-b border-white/20 flex items-center justify-end px-6">
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">{name || email}</p>
          <p className="text-sm text-gray-500 capitalize">{role}</p>
        </div>
        <div className="relative group">
          <div
            title={tooltipText}
            className={`w-12 h-12 flex items-center justify-center rounded-full font-semibold text-white shadow-lg cursor-pointer ${
              role === 'admin'
                ? 'bg-gradient-to-r from-amber-500 to-orange-600'
                : 'bg-gradient-to-r from-violet-500 to-purple-600'
            }`}
          >
            {role === 'admin' ? (
              <div className="flex flex-col items-center justify-center">
                <Crown className="w-4 h-4 mb-0.5" />
                <span className="text-[8px] font-bold">{displayLabel}</span>
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
