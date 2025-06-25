import { NextResponse } from 'next/server'
import { checkSubscriptionAccess } from '@/lib/subscription-access'

export async function GET() {
  try {
    const accessInfo = await checkSubscriptionAccess()
    return NextResponse.json(accessInfo)
  } catch (error) {
    console.error('Error checking subscription access:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
