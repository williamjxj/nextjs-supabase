import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

// GET /api/images/[id]/access - Check if user can download a specific image
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params
  const supabase = await createClient()

  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        canDownload: false,
        canView: true, // Allow viewing without auth
        reason: 'Please log in to download images',
        requiresPayment: false,
        accessType: 'blocked',
      })
    }

    // Check for active subscription first (simplified approach)
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single()

    if (subscription) {
      // Active subscription = unlimited access to all images
      return NextResponse.json({
        canDownload: true,
        canView: true,
        accessType: 'subscription',
        reason: 'Subscription access',
        subscriptionTier: subscription.plan_type,
      })
    }

    // Check if user has purchased this specific image
    const { data: purchase } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', user.id)
      .eq('image_id', resolvedParams.id)
      .eq('payment_status', 'completed')
      .single()

    if (purchase) {
      return NextResponse.json({
        canDownload: true,
        canView: true,
        accessType: 'purchased',
        reason: 'Image purchased',
      })
    }

    // No subscription and no purchase
    return NextResponse.json({
      canDownload: false,
      canView: true,
      reason: 'Purchase required or subscribe for unlimited access',
      requiresPayment: true,
      accessType: 'free',
    })
  } catch (error) {
    console.error('Error checking image download access:', error)
    return NextResponse.json(
      {
        canDownload: false,
        canView: true,
        reason: 'Error checking access permissions',
        requiresPayment: false,
        accessType: 'blocked',
      },
      { status: 500 }
    )
  }
}
