import { supabase } from './client'
import { AuthUser } from '@/types/auth'
import { SubscriptionType } from '@/lib/stripe'
import { Provider } from '@supabase/supabase-js'

// Helper function to ensure user profile exists (optimized for speed)
export const ensureUserProfile = async (user: AuthUser): Promise<void> => {
  try {
    console.log('🔍 Starting profile upsert...')
    const profileStartTime = performance.now()

    // Extract user data from auth metadata
    const fullName =
      user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.user_metadata?.user_name ||
      user.user_metadata?.preferred_username ||
      ''

    const avatarUrl =
      user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
    const provider = user.app_metadata?.provider || 'email'

    // Use upsert instead of check + insert for better performance
    // This handles both create and update in a single operation
    const { error } = await supabase.from('profiles').upsert(
      {
        id: user.id,
        email: user.email,
        full_name: fullName,
        avatar_url: avatarUrl,
        provider: provider,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
        ignoreDuplicates: false, // Update existing records
      }
    )

    console.log(
      `🔍 Profile upsert took: ${performance.now() - profileStartTime}ms`
    )

    if (error) {
      console.warn('🔍 Profile upsert failed:', error)
      // Don't throw error - let the user continue with auth
    }
  } catch (error) {
    console.warn('🔍 Profile creation error:', error)
    // Don't throw error - let the user continue with auth
  }
}

export const signIn = async (email: string, password: string) => {
  console.log('🔍 Starting Supabase signInWithPassword...')
  const startTime = performance.now()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error

  console.log(
    `🔍 Supabase signInWithPassword took: ${performance.now() - startTime}ms`
  )

  // Ensure profile exists in background (non-blocking for faster login)
  if (data.user) {
    // Don't await - let this happen in background
    ensureUserProfile(data.user as AuthUser).catch(error => {
      console.warn('🔍 Background profile creation failed:', error)
      // Don't throw - user is already authenticated
    })
  }

  return data
}

export const signUp = async (
  email: string,
  password: string,
  fullName?: string
) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  if (error) throw error

  // Ensure profile exists after sign up
  if (data.user) {
    await ensureUserProfile(data.user as AuthUser)
  }

  return data
}

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } catch (error) {
    // If signOut fails, manually clear local storage
    if (typeof window !== 'undefined') {
      const keys = Object.keys(localStorage).filter(
        key => key.startsWith('sb-') || key.includes('supabase')
      )
      keys.forEach(key => localStorage.removeItem(key))
    }
    // Don't throw error - allow signout to complete
  }
}

export const signInWithProvider = async (provider: Provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  })
  if (error) throw error
  return data
}

export const getCurrentUser = async (): Promise<AuthUser | null> => {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user as AuthUser | null
}

export const getSession = async () => {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
}

// Check if content requires a subscription
export const contentRequiresSubscription = (contentType: string): boolean => {
  const subscriptionRequiredContent = [
    'premium-photo',
    'premium-video',
    'premium-download',
    'commercial-license',
  ]

  return subscriptionRequiredContent.includes(contentType)
}

// Check if content requires a specific subscription tier
export const contentRequiresSubscriptionTier = (
  contentType: string
): SubscriptionType | null => {
  // Map content types to required subscription tiers
  const contentTierMap: Record<string, SubscriptionType> = {
    'premium-photo': 'standard',
    'premium-video': 'standard',
    'premium-download': 'premium',
    'commercial-license': 'commercial',
  }

  return contentTierMap[contentType] || null
}
