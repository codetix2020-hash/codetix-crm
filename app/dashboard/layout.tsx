import { redirect } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { getServerUserRole } from '@/lib/auth/getServerUserRole'
import { cookies, headers } from 'next/headers'

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const cookieStore = cookies()
  const { user, role, name } = await getServerUserRole(cookieStore)

  if (!user) redirect('/')

  const currentPath = headers().get('x-invoke-path') ?? ''
  if (role === 'agent' && currentPath.startsWith('/dashboard/distribucion')) {
    redirect('/dashboard')
  }

  const headerUser = {
    name: name ?? null,
    email: user.email ?? null,
    role,
  }

  return (
    <div className="flex h-screen">
      <Sidebar role={role} />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={headerUser} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto">
          <div className="container mx-auto px-6 py-8">{children}</div>
        </main>
      </div>
    </div>
  )
}
