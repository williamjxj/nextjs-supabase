import { createClient } from '@/lib/supabase/server'
import { getSubscription } from '@/lib/actions/subscription-simplified'

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
      }
    }

    const subscription = await getSubscription()

    if (!subscription || !['active', 'trialing'].includes(subscription.status)) {
      // Free tier access
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
