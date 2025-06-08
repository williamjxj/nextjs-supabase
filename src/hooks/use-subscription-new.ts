import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import type { Tables } from '@/types/types_db'

// Use Vercel-compatible types from the database schema
type Subscription = Tables<'subscriptions'> & {
  prices: Tables<'prices'> & {
    products: Tables<'products'>
  }
}

type Product = Tables<'products'>
type Price = Tables<'prices'>

interface SubscriptionHook {
  loading: boolean
  subscription: Subscription | null
  products: Product[]
  error: string | null
  isActive: boolean
  isGracePeriod: boolean
  isExpired: boolean
  currentPlan: Product | null
  cancelSubscription: () => Promise<void>
  reactivateSubscription: () => Promise<void>
}

export function useSubscription(): SubscriptionHook {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [error, setError] = useState<string | null>(null)

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
            .select(`
              *,
              prices (
                *,
                products (*)
              )
            `)
            .eq('user_id', session.user.id)
            .in('status', ['active', 'trialing', 'past_due'])
            .order('created', { ascending: false })
            .limit(1)

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError)
          setError(subscriptionError.message)
          setLoading(false)
          return
        }

        const activeSubscription = userSubscriptions?.[0] as Subscription | null
        setSubscription(activeSubscription)

        // Fetch all available products
        const { data: allProducts, error: productsError } = await supabase
          .from('products')
          .select('*')
          .eq('active', true)
          .order('metadata->index')

        if (productsError) {
          console.error('Error fetching products:', productsError)
        } else {
          setProducts(allProducts || [])
        }

        setLoading(false)
      } catch (err) {
        console.error('Error in fetchUserSubscription:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      }
    }

    fetchUserSubscription()

    // Listen for auth changes
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange(() => {
      fetchUserSubscription()
    })

    return () => {
      authSubscription.unsubscribe()
    }
  }, [])

  // Computed values
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'
  const isGracePeriod = subscription?.status === 'past_due'
  const isExpired = subscription?.status === 'canceled' || subscription?.status === 'incomplete_expired'
  const currentPlan = subscription?.prices?.products || null

  const cancelSubscription = async () => {
    if (!subscription?.id) return
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin + '/account' })
      })
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Error accessing customer portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to cancel subscription')
    }
  }

  const reactivateSubscription = async () => {
    if (!subscription?.id) return
    
    try {
      const response = await fetch('/api/stripe/customer-portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ returnUrl: window.location.origin + '/account' })
      })
      
      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error('Error accessing customer portal:', err)
      setError(err instanceof Error ? err.message : 'Failed to reactivate subscription')
    }
  }

  return {
    loading,
    subscription,
    products,
    error,
    isActive,
    isGracePeriod,
    isExpired,
    currentPlan,
    cancelSubscription,
    reactivateSubscription,
  }
}
