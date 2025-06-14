import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {
  userHasSubscription,
  userHasSubscriptionType,
} from '@/lib/supabase/auth-server'

export async function middleware(req: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: req,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request: req,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // CRITICAL: This call to getUser() is essential for refreshing sessions
  // According to Supabase docs, this MUST be called in middleware
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Also get session for compatibility with existing logic
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Protected routes that require authentication
  const protectedRoutes = ['/gallery', '/upload']
  const authRoutes = ['/login', '/signup']

  // Subscription-only routes
  const subscriptionRoutes = [
    '/membership/premium',
    '/gallery/premium',
    '/account/downloads',
  ]

  // Routes requiring specific subscription tiers
  const premiumRoutes = ['/gallery/premium', '/gallery/commercial']
  const commercialRoutes = ['/gallery/commercial']

  const isProtectedRoute = protectedRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  const isAuthRoute = authRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  const isSubscriptionRoute = subscriptionRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  const isPremiumRoute = premiumRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  const isCommercialRoute = commercialRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  )

  // If user is not authenticated and trying to access protected route
  if (isProtectedRoute && !user) {
    // Allow PayPal callback URLs to pass through to show messages
    const isPayPalCallback =
      req.nextUrl.searchParams.has('paypal_cancelled') ||
      req.nextUrl.searchParams.has('paypal_error') ||
      req.nextUrl.searchParams.has('paypal_success')

    if (isPayPalCallback) {
      // Allow the request to pass through for PayPal callbacks
      // The gallery component will handle showing the appropriate message
      return supabaseResponse
    }

    return NextResponse.redirect(new URL('/login', req.url))
  }

  // If user is authenticated and trying to access auth routes
  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL('/gallery', req.url))
  }

  // For routes requiring a subscription
  if (isSubscriptionRoute && user) {
    const hasSubscription = await userHasSubscription(user.id)

    if (!hasSubscription) {
      return NextResponse.redirect(new URL('/membership', req.url))
    }
  }

  // For routes requiring premium subscription
  if (isPremiumRoute && user) {
    const hasPremium = await userHasSubscriptionType(user.id, 'premium')

    if (!hasPremium) {
      return NextResponse.redirect(new URL('/membership?tier=premium', req.url))
    }
  }

  // For routes requiring commercial subscription
  if (isCommercialRoute && user) {
    const hasCommercial = await userHasSubscriptionType(user.id, 'commercial')

    if (!hasCommercial) {
      return NextResponse.redirect(
        new URL('/membership?tier=commercial', req.url)
      )
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - auth routes (login, signup, callback)
     * - api routes that don't need auth (but include /api/upload)
     */
    '/((?!_next/static|_next/image|favicon.ico|auth/|.*\\.(?:jpg|jpeg|png|gif|svg|webp|ico|css|js)$|api/(?!upload|images)).*)',
  ],
}
