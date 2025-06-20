import { supabase } from './client'
import { AuthUser } from '@/types/auth'
import { SubscriptionType } from '@/lib/stripe'
import { Provider } from '@supabase/supabase-js'

export const signIn = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
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
  return data
}

export const signOut = async () => {
  try {
    // Attempt the signOut with timeout for local dev
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(
        () => reject(new Error('Signout timeout after 2 seconds')),
        2000
      )
    })

    const signOutPromise = supabase.auth.signOut()

    try {
      const { error } = (await Promise.race([
        signOutPromise,
        timeoutPromise,
      ])) as any

      if (error) {
        throw error
      }
    } catch (timeoutError) {
      // If API times out, manually clear session
      if (typeof window !== 'undefined') {
        const keys = Object.keys(localStorage).filter(
          key => key.startsWith('sb-') || key.includes('supabase')
        )
        keys.forEach(key => localStorage.removeItem(key))

        // Force trigger auth state change by refreshing session
        try {
          // Add timeout to getSession as well
          const getSessionPromise = supabase.auth.getSession()
          const sessionTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('getSession timeout')), 1000)
          })

          const { data: session } = (await Promise.race([
            getSessionPromise,
            sessionTimeoutPromise,
          ])) as any

          // If getSession still returns a session, try refreshSession
          if (session) {
            const refreshPromise = supabase.auth.refreshSession()
            const refreshTimeoutPromise = new Promise((_, reject) => {
              setTimeout(
                () => reject(new Error('refreshSession timeout')),
                1000
              )
            })
            await Promise.race([refreshPromise, refreshTimeoutPromise])
          }
        } catch (refreshError) {
          // If all else fails, rely on fallback mechanisms
        }
      }
      // Don't throw timeout error since we cleared local session
    }
  } catch (error) {
    throw error
  }
}

export const signInWithProvider = async (provider: Provider) => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${window.location.origin}/auth/callback`, // Ensure this matches your Supabase dashboard config
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
