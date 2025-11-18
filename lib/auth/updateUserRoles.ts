import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

import type { UserRole } from './getServerUserRole'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase service configuration. Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.')
}

const ADMIN_EMAIL = 'codetix2020@gmail.com'

const serviceClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

const resolveDesiredRole = (user: User): UserRole => {
  const email = user.email?.toLowerCase() ?? ''
  return email === ADMIN_EMAIL ? 'admin' : 'agent'
}

type SyncDetail = {
  userId: string
  email: string | null
  finalRole: UserRole
  updatedInAuth: boolean
  updatedInPublic: boolean
  error?: string
}

export async function updateUserRoles() {
  const { data, error } = await serviceClient.auth.admin.listUsers()

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  const users = data?.users ?? []

  const details: SyncDetail[] = []
  let updatedCount = 0
  let errorsCount = 0

  for (const user of users) {
    const desiredRole = resolveDesiredRole(user)
    const detail: SyncDetail = {
      userId: user.id,
      email: user.email ?? null,
      finalRole: desiredRole,
      updatedInAuth: false,
      updatedInPublic: false,
    }

    try {
      const currentMetadataRole = (user.user_metadata as Record<string, unknown> | null)?.role ?? null

      const { data: publicRow, error: publicFetchError } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (publicFetchError) {
        throw new Error(`Failed to fetch public.users role: ${publicFetchError.message}`)
      }

      const currentPublicRole = publicRow?.role ?? null

      console.log('[SYNC ROLES] BEFORE', {
        email: user.email,
        metadataRole: currentMetadataRole,
        publicRole: currentPublicRole,
        desiredRole,
      })

      const newMetadata = { ...(user.user_metadata ?? {}), role: desiredRole }
      const { error: metadataError } = await serviceClient.auth.admin.updateUserById(user.id, {
        user_metadata: newMetadata,
      })

      if (metadataError) {
        throw new Error(`Failed to update auth metadata: ${metadataError.message}`)
      }
      detail.updatedInAuth = true

      const { error: publicUpdateError } = await serviceClient
        .from('users')
        .update({ role: desiredRole })
        .eq('id', user.id)

      if (publicUpdateError) {
        throw new Error(`Failed to update public.users: ${publicUpdateError.message}`)
      }
      detail.updatedInPublic = true

      const { data: refreshedAuth, error: refreshedAuthError } = await serviceClient.auth.admin.getUserById(user.id)
      const finalMetadataRole =
        refreshedAuthError || !refreshedAuth.user
          ? null
          : ((refreshedAuth.user.user_metadata as Record<string, unknown> | null)?.role ?? null)

      const { data: refreshedPublic, error: refreshedPublicError } = await serviceClient
        .from('users')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      const finalPublicRole = refreshedPublicError ? null : refreshedPublic?.role ?? null

      console.log('[SYNC ROLES] AFTER', {
        email: user.email,
        metadataRole: finalMetadataRole,
        publicRole: finalPublicRole,
        desiredRole,
      })

      updatedCount += 1
    } catch (syncError) {
      const message =
        syncError instanceof Error ? syncError.message : typeof syncError === 'string' ? syncError : 'Unknown error'
      detail.error = message
      errorsCount += 1
      console.error('[SYNC ROLES] ERROR', { email: user.email, message })
    } finally {
      details.push(detail)
    }
  }

  return {
    totalUsers: users.length,
    updatedCount,
    errorsCount,
    details,
  }
}
