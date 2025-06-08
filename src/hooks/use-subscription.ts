import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useProducts } from '@/hooks/use-products'
import type { Tables } from '@/types/types_db'

// Vercel-compatible types following nextjs-subscription-payments
type Subscription = Tables<'subscriptions'> & {
  prices?: Tables<'prices'> & {
    products?: Tables<'products'>
  }
}

type Product = Tables<'products'> & {
  prices?: Tables<'prices'>[]
}

type Price = Tables<'prices'>

export function useSubscription() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Use the centralized product fetching to prevent duplicate API calls
  const { products } = useProducts()

  useEffect(() => {
    async function fetchUserSubscription() {
      try {
        setLoading(true)

        // Get current user
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session?.user) {
          setSubscription(null)
          setLoading(false)
          return
        }

        // Get user subscription with Vercel schema
        const { data: userSubscriptions, error: subscriptionError } =
          await supabase
            .from('subscriptions')
            .select(
              `
              *,
              prices (
                *,
                products (*)
              )
            `
            )
            .eq('user_id', session.user.id)
            .in('status', ['active', 'trialing', 'past_due'])
            .order('created', { ascending: false })
            .limit(1)

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError)
          setError('Failed to load subscription')
        } else {
          setSubscription(userSubscriptions?.[0] || null)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error in useSubscription hook:', err)
        setError('An unexpected error occurred')
        setLoading(false)
      }
    }

    fetchUserSubscription()
  }, [])

  const cancelSubscription = async () => {
    if (!subscription?.id)
      return { success: false, error: 'No active subscription' }

    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to access customer portal')
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url
      }

      return { success: true }
    } catch (err) {
      console.error('Error accessing customer portal:', err)
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to cancel subscription',
      }
    }
  }

  const isActive = 
    !!subscription && 
    ['active', 'trialing'].includes(subscription.status || '')

  const isPastDue = 
    !!subscription && 
    subscription.status === 'past_due'

  const isCanceled = 
    !!subscription && 
    ['canceled', 'incomplete_expired', 'unpaid'].includes(subscription.status || '')

  const isTrialing = 
    !!subscription && 
    subscription.status === 'trialing'

  const currentPeriodEnd = subscription?.current_period_end 
    ? new Date(subscription.current_period_end) 
    : null

  const isExpired = 
    !subscription || 
    isCanceled ||
    (currentPeriodEnd && currentPeriodEnd < new Date())

  const isGracePeriod = 
    !!subscription && 
    isPastDue && 
    currentPeriodEnd && 
    currentPeriodEnd > new Date()

  return {
    loading,
    subscription,
    products,
    error,
    isActive,
    isPastDue,
    isCanceled,
    isTrialing,
    isExpired,
    isGracePeriod,
    currentPeriodEnd,
    cancelSubscription,
  }
}
