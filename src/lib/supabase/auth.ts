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
  console.log('Auth service signUp called with:', { email, fullName })

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
      },
    },
  })

  console.log('Supabase signUp response:', { data, error })

  if (error) {
    console.error('Supabase signUp error:', error)
    throw error
  }
  return data
}

export const signOut = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
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
