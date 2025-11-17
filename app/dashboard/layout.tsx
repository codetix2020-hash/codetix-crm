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

  const { data: userProfile } = await supabase
    .from('users')
    .select('name, role')
    .eq('id', user.id)
    .single()

  // Construir el objeto de usuario con email de auth
  const userWithEmail = userProfile ? {
    ...userProfile,
    email: user.email || ''
  } : null

  return (
    <div className="flex h-screen">
      <Sidebar role={userProfile?.role} />
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
