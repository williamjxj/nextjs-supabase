import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a server-side Supabase client that works in both
 * App Router and Pages Router contexts
 */
const createServerSupabaseClient = async () => {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

// Helper to get server session
const getServerSession = async () => {
  const supabase = await createServerSupabaseClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

export { createServerSupabaseClient, getServerSession }
