import { NextResponse } from 'next/server'
import { getSubscriptionPlans, getSubscriptionPlanByType } from '@/lib/supabase/subscriptions'

export async function GET() {
  try {
    console.log('Testing subscription plan lookup...')
    
    // Test getting all plans
    const allPlans = await getSubscriptionPlans()
    console.log('All plans:', allPlans)
    
    // Test getting specific plan
    const standardPlan = await getSubscriptionPlanByType('standard')
    console.log('Standard plan:', standardPlan)
    
    return NextResponse.json({
      success: true,
      allPlans,
      standardPlan
    })
  } catch (error) {
    console.error('Error testing plans:', error)
    return NextResponse.json({ error: 'Failed to test plans', details: error }, { status: 500 })
  }
}
