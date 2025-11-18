interface HeaderProps {
  user: {
    name: string | null
    email: string | null
    role: 'admin' | 'agent'
  }
}

export default function Header({ user }: HeaderProps) {
  const displayName = user.name ?? user.email ?? 'Usuario'
  const initial = (user.name ?? user.email ?? '?').charAt(0).toUpperCase()

  return (
    <header className="h-20 bg-white/30 backdrop-blur-lg border-b border-white/20 flex items-center justify-end px-6">
      <div className="flex items-center">
        <div className="text-right mr-4">
          <p className="font-semibold text-gray-800">{displayName}</p>
          <p className="text-sm text-gray-500 capitalize">{user.role}</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold shadow-lg">
          {initial}
        </div>
      </div>
    </header>
  )
}
