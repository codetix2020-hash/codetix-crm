'use client'

interface HeaderProps {
  user: {
    name: string
    role: string
  } | null
}

export default function Header({ user }: HeaderProps) {
  return (
    <header className="h-20 bg-white/30 backdrop-blur-lg border-b border-white/20 flex items-center justify-end px-6">
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">{user?.name}</p>
          <p className="text-sm text-gray-500 capitalize">{user?.role}</p>
        </div>
        <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
          {user?.name?.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  )
}
