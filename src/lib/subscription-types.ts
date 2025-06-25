// Shared types for subscription access functionality

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

// Enhanced image access result interface (client-side specific)
export interface ImageAccessResult {
  canDownload: boolean
  canView: boolean
  reason?: string
  requiresPayment?: boolean
  accessType: 'free' | 'subscription' | 'purchased' | 'blocked'
  downloadsRemaining?: number
  subscriptionTier?: string
}
