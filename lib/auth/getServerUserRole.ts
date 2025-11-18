import { createServerClient } from '@supabase/ssr'
import { cookies as nextCookies } from 'next/headers'

export type UserRole = 'admin' | 'agent'

type CookieStore = ReturnType<typeof nextCookies>

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

const normalizeRole = (raw: unknown): UserRole =>
  typeof raw === 'string' && raw.toLowerCase() === 'admin' ? 'admin' : 'agent'

const createClient = (cookieStore: CookieStore) =>
  createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value
      },
      set(name: string, value: string, options?: Parameters<CookieStore['set']>[1]) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch {
          // ignore set errors in RSC context
        }
      },
      remove(name: string, options?: Parameters<CookieStore['delete']>[1]) {
        try {
          cookieStore.delete({ name, ...options })
        } catch {
          // ignore delete errors in RSC context
        }
      },
    },
  })

export async function getServerUserRole(
  cookieStore: CookieStore = nextCookies()
): Promise<{
  user: Awaited<ReturnType<ReturnType<typeof createClient>['auth']['getUser']>>['data']['user']
  role: UserRole
  name: string | null
}> {
  const supabase = createClient(cookieStore)

  const {
    data: { user },
  } = await supabase.auth.getUser()

  let role: UserRole = 'agent'
  let name: string | null = null

  if (user) {
    const { data: profile } = await supabase
      .from('users')
      .select('role, name')
      .eq('id', user.id)
      .maybeSingle()

    const rawRole = profile?.role ?? (user.user_metadata as Record<string, unknown> | null)?.role
    role = normalizeRole(rawRole)
    name =
      profile?.name ??
      (typeof (user.user_metadata as Record<string, unknown> | null)?.name === 'string'
        ? ((user.user_metadata as Record<string, unknown>)?.name as string)
        : null) ??
      user.email ??
      null
  }

  return { user, role, name }
}
