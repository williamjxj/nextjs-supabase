import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkSubscriptionAccess } from '@/lib/subscription-access'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const imageId = searchParams.get('imageId')

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          canAccess: false,
          reason: 'authentication_required',
          message: 'Please log in to access this image',
        },
        { status: 401 }
      )
    }

    // Get subscription access information
    const accessInfo = await checkSubscriptionAccess()

    // Check if user has purchased this specific image
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('image_id', imageId)
      .eq('payment_status', 'completed')
      .single()

    // Check if user can access this image
    let canAccess = false
    let accessReason = ''
    let downloadReason = ''

    if (purchase) {
      // User has purchased this specific image
      canAccess = true
      accessReason = 'individual_purchase'
    } else if (accessInfo.hasActiveSubscription) {
      // User has active subscription
      canAccess = true
      accessReason = 'subscription_access'
    } else if (accessInfo.userType === 'free') {
      // Free user - limited access
      canAccess = true // Can view but not download
      accessReason = 'free_tier'
    }

    // Determine download access
    const canDownload = purchase || accessInfo.hasActiveSubscription
    if (!canDownload) {
      if (!purchase) {
        downloadReason = 'purchase_required'
      } else if (!accessInfo.hasActiveSubscription) {
        downloadReason = 'subscription_required'
      }
    }

    return NextResponse.json({
      canAccess,
      canDownload,
      accessReason,
      downloadReason,
      userType: accessInfo.userType,
      subscriptionType: accessInfo.subscriptionType,
      hasActiveSubscription: accessInfo.hasActiveSubscription,
      hasPurchased: !!purchase,
      purchaseDetails: purchase
        ? {
            licenseType: purchase.license_type,
            purchasedAt: purchase.purchased_at,
            amountPaid: purchase.amount_paid,
          }
        : null,
    })
  } catch (error) {
    console.error('Error checking image access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
