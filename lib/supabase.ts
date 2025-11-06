import { createClient } from '@supabase/supabase-js'

// 🔗 Variables desde tu archivo .env
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("❌ Faltan variables de entorno de Supabase. Verifica tu archivo .env")
}

// 🚀 Cliente principal (solo público, suficiente para login y dashboard)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
