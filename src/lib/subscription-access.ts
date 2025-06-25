import { createClient } from '@/lib/supabase/server'
import type {
  UserAccessType,
  UserPurchaseSummary,
  SubscriptionAccess,
} from './subscription-types'

// Server-side function to check subscription access
export async function checkSubscriptionAccess(): Promise<SubscriptionAccess> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        hasActiveSubscription: false,
        subscriptionType: null,
        canDownload: false,
        canViewGallery: false,
        accessLevel: 'free',
        isTrialing: false,
        features: [],
        usage: {},
        userType: 'free',
      }
    }

    // Check for active subscription
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single()

    // Get purchase summary
    const { data: purchases } = await supabase
      .from('purchases')
      .select('amount_paid, image_id, purchased_at')
      .eq('user_id', user.id)
      .eq('payment_status', 'completed')

    const purchaseSummary: UserPurchaseSummary = {
      totalPurchases: purchases?.length || 0,
      totalSpent:
        purchases?.reduce((sum, p) => sum + (p.amount_paid || 0), 0) || 0,
      uniqueImages: new Set(purchases?.map(p => p.image_id) || []).size,
      hasRecentPurchases:
        purchases?.some(
          p =>
            new Date(p.purchased_at) >
            new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        ) || false,
    }

    // Determine user type
    let userType: UserAccessType = 'free'
    if (subscription && purchaseSummary.totalPurchases > 0) {
      userType = 'mixed'
    } else if (subscription) {
      userType = 'subscription'
    } else if (purchaseSummary.totalPurchases > 0) {
      userType = 'purchaser'
    }

    if (subscription) {
      // User has active subscription
      return {
        hasActiveSubscription: true,
        subscriptionType: subscription.plan_type,
        canDownload: true,
        canViewGallery: true,
        accessLevel:
          subscription.plan_type === 'commercial'
            ? 'enterprise'
            : subscription.plan_type === 'premium'
              ? 'pro'
              : 'basic',
        isTrialing: subscription.trial_end
          ? new Date(subscription.trial_end) > new Date()
          : false,
        subscriptionExpiresAt: subscription.current_period_end,
        features: getSubscriptionFeatures(subscription.plan_type),
        usage: {},
        userType,
        purchaseSummary,
      }
    }

    // No active subscription
    return {
      hasActiveSubscription: false,
      subscriptionType: null,
      canDownload: false,
      canViewGallery: true, // Can view but not download
      accessLevel: 'free',
      isTrialing: false,
      features: [],
      usage: {},
      userType,
      purchaseSummary,
    }
  } catch (error) {
    console.error('Error checking subscription access:', error)
    return {
      hasActiveSubscription: false,
      subscriptionType: null,
      canDownload: false,
      canViewGallery: false,
      accessLevel: 'free',
      isTrialing: false,
      features: [],
      usage: {},
      userType: 'free',
    }
  }
}

function getSubscriptionFeatures(planType: string): string[] {
  switch (planType) {
    case 'standard':
      return ['unlimited_downloads', 'basic_support']
    case 'premium':
      return ['unlimited_downloads', 'priority_support', 'early_access']
    case 'commercial':
      return [
        'unlimited_downloads',
        'commercial_license',
        'priority_support',
        'early_access',
      ]
    default:
      return []
  }
}
