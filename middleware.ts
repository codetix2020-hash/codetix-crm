import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Solo verificar rutas protegidas de admin
  if (pathname.startsWith('/dashboard/distribucion')) {
    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // Si no es admin, redirigir al dashboard principal
    if (userProfile?.role !== 'admin') {
      console.warn('[MIDDLEWARE] Non-admin user attempted to access /dashboard/distribucion:', user.email)
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*'],
}
