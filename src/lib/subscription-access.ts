import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/actions/subscription-simplified'

// User access types to distinguish different user categories
export type UserAccessType =
  | 'free' // No subscription, no purchases
  | 'subscription' // Has active subscription
  | 'purchaser' // Has made individual image purchases
  | 'mixed' // Has both subscription and purchases

export interface UserPurchaseSummary {
  totalPurchases: number
  totalSpent: number
  uniqueImages: number
  hasRecentPurchases: boolean
}

export interface SubscriptionAccess {
  hasActiveSubscription: boolean
  subscriptionType: string | null
  downloadsRemaining?: number
  imagesViewable?: number
  canDownload: boolean
  canViewGallery: boolean
  accessLevel: 'free' | 'basic' | 'pro' | 'enterprise'
  isTrialing?: boolean
  subscriptionExpiresAt?: string | null
  features?: string[]
  usage?: Record<string, any>
  userType: UserAccessType
  purchaseSummary?: UserPurchaseSummary
}

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

    // Get user's subscription
    const subscription = await getSubscription()

    // Get user's purchase history
    const { data: purchases } = await supabase
      .from('purchases')
      .select('*')
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
            new Date(p.purchased_at).getTime() >
            Date.now() - 30 * 24 * 60 * 60 * 1000 // Last 30 days
        ) || false,
    }

    // Determine user type
    const hasActiveSubscription =
      subscription && ['active', 'trialing'].includes(subscription.status)
    const hasPurchases = purchaseSummary.totalPurchases > 0

    let userType: UserAccessType = 'free'
    if (hasActiveSubscription && hasPurchases) {
      userType = 'mixed'
    } else if (hasActiveSubscription) {
      userType = 'subscription'
    } else if (hasPurchases) {
      userType = 'purchaser'
    }

    if (!hasActiveSubscription) {
      // Free tier or purchaser access
      return {
        hasActiveSubscription: false,
        subscriptionType: null,
        imagesViewable: 10, // Free users can view 10 images
        downloadsRemaining: 0,
        canDownload: false,
        canViewGallery: true,
        accessLevel: 'free',
        isTrialing: false,
        features: [],
        usage: {},
        userType,
        purchaseSummary,
      }
    }

    // Enhanced subscription access
    const planType = subscription.plan_type
    const isTrialing = subscription.status === 'active' // For now, treat active as the valid status
    let accessLevel: SubscriptionAccess['accessLevel'] = 'basic'
    const imagesViewable = undefined // Unlimited
    let downloadsRemaining = undefined // Unlimited

    if (planType === 'standard') {
      accessLevel = 'basic'
      downloadsRemaining = 50 // Basic: 50 downloads per month
    } else if (planType === 'premium') {
      accessLevel = 'pro'
      downloadsRemaining = 200 // Pro: 200 downloads per month
    } else if (planType === 'commercial') {
      accessLevel = 'enterprise'
      // Enterprise: unlimited
    }

    return {
      hasActiveSubscription: true,
      subscriptionType: planType,
      imagesViewable,
      downloadsRemaining,
      canDownload: true,
      canViewGallery: true,
      accessLevel,
      isTrialing: false, // Based on status
      subscriptionExpiresAt: subscription.current_period_end || null,
      features: subscription.features || [],
      usage: {}, // Usage tracking to be implemented
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

export async function canAccessImage(imageId: string): Promise<boolean> {
  const access = await checkSubscriptionAccess()

  if (!access.canViewGallery) {
    return false
  }

  // For free users, check if they've exceeded their view limit
  if (access.accessLevel === 'free' && access.imagesViewable !== undefined) {
    // This would require tracking image views in the database
    // For now, we'll allow all images to be viewed
    return true
  }

  return true
}

export async function canDownloadImage(imageId: string): Promise<boolean> {
  const access = await checkSubscriptionAccess()

  if (!access.canDownload) {
    return false
  }

  // For limited plans, check download count
  if (access.downloadsRemaining !== undefined) {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      // Count downloads this month
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: downloads, error } = await (await supabase)
        .from('image_downloads')
        .select('id')
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())

      if (error) {
        console.error('Error checking download count:', error)
        return false
      }

      const downloadCount = downloads?.length || 0
      return downloadCount < access.downloadsRemaining
    }
  }

  return true
}

export async function recordImageDownload(imageId: string): Promise<void> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { error } = await (await supabase).from('image_downloads').insert({
      user_id: user.id,
      image_id: imageId,
      downloaded_at: new Date().toISOString(),
    })

    if (error) {
      console.error('Error recording image download:', error)
    }
  }
}
