import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { SubscriptionType } from '@/lib/stripe'

interface Subscription {
  id: string
  user_id: string
  plan_id: string
  stripe_subscription_id: string | null
  stripe_customer_id: string | null
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'trialing'
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
  subscription_plans: {
    id: string
    name: string
    type: SubscriptionType
    description: string
    price: number
    currency: string
    interval: string
    features: string[]
  } | null
}

interface SubscriptionPlan {
  id: string
  name: string
  type: SubscriptionType
  description: string
  price: number
  currency: string
  interval: string
  stripe_price_id: string | null
  features: string[]
  is_active: boolean
}

interface SubscriptionInvoice {
  id: string
  subscription_id: string
  user_id: string
  stripe_invoice_id: string
  amount_paid: number
  currency: string
  status: string
  invoice_period_start: string | null
  invoice_period_end: string | null
  receipt_url: string | null
  created_at: string
}

export function useSubscription() {
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [plans, setPlans] = useState<SubscriptionPlan[]>([])
  const [invoices, setInvoices] = useState<SubscriptionInvoice[]>([])
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

        // Get user subscription
        const { data: userSubscriptions, error: subscriptionError } =
          await supabase
            .from('subscriptions')
            .select(
              `
            id,
            user_id,
            plan_id,
            stripe_subscription_id,
            stripe_customer_id,
            status,
            current_period_start,
            current_period_end,
            cancel_at_period_end,
            canceled_at,
            created_at,
            updated_at,
            subscription_plans!plan_id (
              id,
              name,
              type,
              description,
              price,
              currency,
              interval,
              features
            )
          `
            )
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })
            .limit(1)

        if (subscriptionError) {
          console.error('Error fetching subscription:', subscriptionError)
          setError('Failed to load subscription')
          setLoading(false)
          return
        }

        setSubscription(userSubscriptions?.[0] ? {
          ...userSubscriptions[0],
          subscription_plans: userSubscriptions[0].subscription_plans?.[0] || null
        } : null)

        // Fetch invoices if there's an active subscription
        if (userSubscriptions?.[0]) {
          const { data: invoiceData, error: invoiceError } = await supabase
            .from('subscription_invoices')
            .select('*')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false })

          if (!invoiceError) {
            setInvoices(invoiceData || [])
          }
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

  useEffect(() => {
    async function fetchSubscriptionPlans() {
      try {
        const { data, error } = await supabase
          .from('subscription_plans')
          .select('*')
          .eq('is_active', true)
          .order('price', { ascending: true })

        if (error) {
          console.error('Error fetching subscription plans:', error)
          return
        }

        setPlans(data || [])
      } catch (err) {
        console.error('Error fetching subscription plans:', err)
      }
    }

    fetchSubscriptionPlans()
  }, [])

  const cancelSubscription = async () => {
    if (!subscription?.id)
      return { success: false, error: 'No active subscription' }

    try {
      const response = await fetch('/api/stripe/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to cancel subscription')
      }

      // Update the local state
      setSubscription({
        ...subscription,
        cancel_at_period_end: true,
      })

      return { success: true }
    } catch (err) {
      console.error('Error canceling subscription:', err)
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to cancel subscription',
      }
    }
  }

  const changePlan = async (newPlanType: SubscriptionType) => {
    if (!subscription?.id)
      return { success: false, error: 'No active subscription' }

    try {
      const response = await fetch('/api/stripe/subscription/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: subscription.stripe_subscription_id,
          newPlanType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update subscription')
      }

      // We'll need to refresh the subscription data after update
      // This could be handled by redirecting to a success page or refreshing the component
      return { success: true, redirectUrl: data.redirectUrl }
    } catch (err) {
      console.error('Error updating subscription:', err)
      return {
        success: false,
        error:
          err instanceof Error ? err.message : 'Failed to update subscription',
      }
    }
  }

  const isActive =
    !!subscription &&
    subscription.status === 'active' &&
    !subscription.cancel_at_period_end

  const isGracePeriod =
    !!subscription &&
    subscription.status === 'active' &&
    subscription.cancel_at_period_end &&
    new Date(subscription.current_period_end) > new Date()

  const isExpired =
    !subscription ||
    new Date(subscription.current_period_end) < new Date() ||
    ['canceled', 'incomplete_expired'].includes(subscription.status)

  return {
    loading,
    subscription,
    plans,
    invoices,
    error,
    isActive,
    isGracePeriod,
    isExpired,
    cancelSubscription,
    changePlan,
  }
}
