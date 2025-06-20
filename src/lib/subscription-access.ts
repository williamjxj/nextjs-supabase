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
  try {
    const access = await checkSubscriptionAccess()

    if (!access.canViewGallery) {
      return false
    }

    // For free users, check if they've exceeded their view limit
    if (access.accessLevel === 'free' && access.imagesViewable !== undefined) {
      // This would require tracking image views in the database
      // For now, we'll allow all images to be viewed but could implement view tracking
      console.log(`Free user accessing image ${imageId}`)
      return true
    }

    return true
  } catch (error) {
    console.error('Error checking image access:', error)
    return false // Fail closed for security
  }
}

// Enhanced image access result interface
export interface ImageAccessResult {
  canDownload: boolean
  canView: boolean
  reason?: string
  requiresPayment?: boolean
  accessType: 'free' | 'subscription' | 'purchased' | 'blocked'
  downloadsRemaining?: number
  subscriptionTier?: string
}

export async function canDownloadImage(
  imageId: string
): Promise<ImageAccessResult> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        canDownload: false,
        canView: true, // Allow viewing without auth
        reason: 'Please log in to download images',
        requiresPayment: false,
        accessType: 'blocked',
      }
    }

    // Check if user has purchased this specific image
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('image_id', imageId)
      .eq('payment_status', 'completed')
      .single()

    if (purchase) {
      return {
        canDownload: true,
        canView: true,
        accessType: 'purchased',
        reason: 'Image purchased',
      }
    }

    // Get subscription access
    const access = await checkSubscriptionAccess()

    if (!access.hasActiveSubscription) {
      return {
        canDownload: false,
        canView: true,
        reason: 'Purchase required or subscribe for unlimited access',
        requiresPayment: true,
        accessType: 'free',
      }
    }

    // Check subscription download limits
    if (
      access.downloadsRemaining !== undefined &&
      access.downloadsRemaining > 0
    ) {
      // Count downloads this month using year/month columns
      const currentDate = new Date()
      const currentYear = currentDate.getFullYear()
      const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11

      const { data: downloads, error } = await supabase
        .from('image_downloads')
        .select('id')
        .eq('user_id', user.id)
        .eq('download_year', currentYear)
        .eq('download_month', currentMonth)

      if (error) {
        console.error('Error checking download count:', error)
        return {
          canDownload: false,
          canView: true,
          reason: 'Error checking download limits',
          requiresPayment: false,
          accessType: 'blocked',
        }
      }

      const downloadCount = downloads?.length || 0
      const remaining = access.downloadsRemaining - downloadCount

      if (remaining <= 0) {
        return {
          canDownload: false,
          canView: true,
          reason: 'Monthly download limit reached',
          requiresPayment: false,
          accessType: 'subscription',
          downloadsRemaining: 0,
          subscriptionTier: access.subscriptionType || undefined,
        }
      }

      return {
        canDownload: true,
        canView: true,
        accessType: 'subscription',
        downloadsRemaining: remaining,
        subscriptionTier: access.subscriptionType || undefined,
      }
    }

    // Unlimited subscription
    return {
      canDownload: true,
      canView: true,
      accessType: 'subscription',
      subscriptionTier: access.subscriptionType || undefined,
    }
  } catch (error) {
    console.error('Error checking image download access:', error)
    return {
      canDownload: false,
      canView: true,
      reason: 'Error checking access permissions',
      requiresPayment: false,
      accessType: 'blocked',
    }
  }
}

export async function recordImageDownload(
  imageId: string,
  downloadType: 'subscription' | 'purchase' | 'free' = 'subscription'
): Promise<void> {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (user) {
      const { error } = await supabase.from('image_downloads').insert({
        user_id: user.id,
        image_id: imageId,
        download_type: downloadType,
        downloaded_at: new Date().toISOString(),
      })

      if (error) {
        console.error('Error recording image download:', error)
        throw error
      }

      console.log(`Image download recorded: ${imageId} for user ${user.id}`)
    }
  } catch (error) {
    console.error('Failed to record image download:', error)
    // Don't throw here to avoid breaking the download flow
  }
}

// Helper function to get user's download statistics
export async function getUserDownloadStats(userId: string): Promise<{
  thisMonth: number
  allTime: number
  lastDownload?: string
}> {
  try {
    const supabase = await createClient()

    // Get this month's downloads using year/month columns
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11

    const { data: monthlyDownloads, error: monthlyError } = await supabase
      .from('image_downloads')
      .select('id')
      .eq('user_id', userId)
      .eq('download_year', currentYear)
      .eq('download_month', currentMonth)

    if (monthlyError) {
      console.error('Error fetching monthly downloads:', monthlyError)
    }

    // Get all-time downloads
    const { data: allDownloads, error: allError } = await supabase
      .from('image_downloads')
      .select('downloaded_at')
      .eq('user_id', userId)
      .order('downloaded_at', { ascending: false })

    if (allError) {
      console.error('Error fetching all downloads:', allError)
    }

    return {
      thisMonth: monthlyDownloads?.length || 0,
      allTime: allDownloads?.length || 0,
      lastDownload: allDownloads?.[0]?.downloaded_at,
    }
  } catch (error) {
    console.error('Error getting download stats:', error)
    return {
      thisMonth: 0,
      allTime: 0,
    }
  }
}
