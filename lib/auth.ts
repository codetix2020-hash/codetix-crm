import { createClient } from '@/lib/supabase/server'
import type { User } from '@supabase/supabase-js'

export type AppUserRole = 'admin' | 'agent'

type ServerAuthContext = {
  supabase: ReturnType<typeof createClient>
  user: User | null
  role: AppUserRole
}

const normalizeRole = (value: unknown): AppUserRole => {
  if (typeof value === 'string' && value.toLowerCase() === 'admin') {
    return 'admin'
  }
  return 'agent'
}

export async function getServerAuth(): Promise<ServerAuthContext> {
  const supabase = createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    console.error('[AUTH] Supabase getUser error:', error)
  }

  const role = normalizeRole(user?.user_metadata?.role)
  return { supabase, user: user ?? null, role }
}

export async function getServerUserRole(): Promise<AppUserRole> {
  const { role } = await getServerAuth()
  return role
}


