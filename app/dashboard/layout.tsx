import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const { data: userProfile, error: profileError } = await supabase
    .from('users')
    .select('name, role, email')
    .eq('id', user.id)
    .single()

  // Log para debugging
  if (profileError) {
    console.error('[LAYOUT] Error fetching user profile:', profileError)
  }

  if (!userProfile) {
    console.warn('[LAYOUT] No user profile found for user:', user.id)
  }

  // Construir el objeto de usuario con email de auth y profile
  const userWithEmail = userProfile ? {
    name: userProfile.name || '',
    role: userProfile.role || 'agent',
    email: userProfile.email || user.email || ''
  } : {
    name: '',
    role: 'agent',
    email: user.email || ''
  }

  // Log para verificar datos
  console.log('[LAYOUT] User data:', {
    id: user.id,
    email: userWithEmail.email,
    name: userWithEmail.name,
    role: userWithEmail.role
  })

  return (
    <div className="flex h-screen">
      <Sidebar role={userWithEmail.role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={userWithEmail} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
