'use client'

// Client-side subscription access functions that call API routes

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

export async function checkSubscriptionAccess(): Promise<SubscriptionAccess> {
  try {
    const response = await fetch('/api/subscription/access')
    if (!response.ok) {
      throw new Error('Failed to check subscription access')
    }
    return await response.json()
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

export async function canDownloadImage(
  imageId: string
): Promise<ImageAccessResult> {
  try {
    const response = await fetch(`/api/images/${imageId}/access`)
    if (!response.ok) {
      throw new Error('Failed to check image access')
    }
    return await response.json()
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
    const response = await fetch('/api/downloads/record', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        imageId,
        downloadType,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to record download')
    }

    console.log(`Image download recorded: ${imageId}`)
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
    const response = await fetch(`/api/downloads/stats?userId=${userId}`)
    if (!response.ok) {
      throw new Error('Failed to get download stats')
    }
    return await response.json()
  } catch (error) {
    console.error('Error getting download stats:', error)
    return {
      thisMonth: 0,
      allTime: 0,
    }
  }
}
