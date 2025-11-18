import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@supabase/ssr'

export async function middleware(req: NextRequest) {
  console.log('[MIDDLEWARE] EXECUTING --- PATH:', req.nextUrl.pathname)

  let res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })

  const {
    data: { user },
  } = await supabase.auth.getUser()

  console.log('[MIDDLEWARE] USER:', user?.email, 'ROLE RAW:', user?.user_metadata?.role)

  const pathname = req.nextUrl.pathname

  if (!user && pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  let role: 'admin' | 'agent' = 'agent'

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .maybeSingle()

    const raw = profile?.role ?? user.user_metadata?.role
    role = typeof raw === 'string' && raw.toLowerCase() === 'admin' ? 'admin' : 'agent'
  }

  console.log('[MIDDLEWARE] FINAL ROLE:', role)

  const isAdminRoute = pathname.startsWith('/dashboard/distribucion')

  if (role !== 'admin' && isAdminRoute) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return res
}

export const config = {
  matcher: ['/dashboard/:path*'],
}






