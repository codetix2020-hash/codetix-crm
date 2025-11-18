declare module '@supabase/ssr' {
  import type { SupabaseClient } from '@supabase/supabase-js'

  export function createMiddlewareClient<Database = any, SchemaName extends string & keyof Database = 'public' & keyof Database>(context: {
    req: unknown
    res: unknown
  }): SupabaseClient<Database, SchemaName>
}






