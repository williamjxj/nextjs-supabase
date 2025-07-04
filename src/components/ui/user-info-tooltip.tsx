'use client'

import React, { useEffect, useState } from 'react'
import { Tooltip } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/use-auth'
import { supabase } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'

interface UserInfoData {
  user: User | null
  session: Session | null
  sessionExpiry: string | null
  subscriptionInfo: string
  cookieInfo: string
  jwtClaims: any
  supabaseInfo: {
    url: string
    environment: string
    isLocal: boolean
  }
}

interface UserInfoTooltipProps {
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const UserInfoTooltip = ({
  children,
  placement = 'bottom',
  className,
}: UserInfoTooltipProps) => {
  const { user, loading } = useAuth()
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || loading) return

      try {
        // Get current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        // Extract JWT claims if available
        let jwtClaims = null
        if (session?.access_token) {
          try {
            // Decode JWT payload (basic decode, not verification)
            const payload = JSON.parse(atob(session.access_token.split('.')[1]))
            jwtClaims = payload
          } catch (e) {
            // JWT decode failed - continue without claims
          }
        }

        // Calculate session expiry
        const sessionExpiry = session?.expires_at
          ? new Date(session.expires_at * 1000).toLocaleString()
          : 'Unknown'

        // Get subscription info
        const subscriptionInfo = user.subscription
          ? `${user.subscription.status} - ${user.subscription.plan_type || 'Unknown Plan'}`
          : 'No active subscription'

        // Get basic cookie info (we can't access httpOnly cookies from client)
        const cookieInfo = document.cookie
          ? `${document.cookie.split(';').length} cookies set`
          : 'No accessible cookies'

        // Get Supabase environment info
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'Unknown'
        const isLocal =
          supabaseUrl.includes('127.0.0.1') || supabaseUrl.includes('localhost')
        const environment = isLocal
          ? 'Local Docker'
          : supabaseUrl.includes('supabase.co')
            ? 'Cloud Supabase'
            : 'Custom'

        const supabaseInfo = {
          url: supabaseUrl,
          environment,
          isLocal,
        }

        setUserInfo({
          user,
          session,
          sessionExpiry,
          subscriptionInfo,
          cookieInfo,
          jwtClaims,
          supabaseInfo,
        })
      } catch (error) {
        // Error fetching user info - continue silently
      }
    }

    fetchUserInfo()
  }, [user, loading])

  if (!userInfo || !userInfo.user) {
    return children
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleString()
  }

  const tooltipContent = (
    <div className='max-w-sm p-4 space-y-4'>
      <div className='text-center border-b border-gray-300/30 dark:border-gray-500/30 pb-3'>
        <h3 className='font-semibold text-base text-white dark:text-gray-50'>
          Account Information
        </h3>
      </div>

      {/* Supabase Environment Info - Prominent Display */}
      <div
        className={`p-3 rounded-lg border-2 ${
          userInfo.supabaseInfo.isLocal
            ? 'bg-blue-900/30 border-blue-400/50'
            : 'bg-green-900/30 border-green-400/50'
        }`}
      >
        <div className='flex items-center justify-between'>
          <span className='font-semibold text-white'>🗄️ Database:</span>
          <span
            className={`font-bold px-2 py-1 rounded text-xs ${
              userInfo.supabaseInfo.isLocal
                ? 'bg-blue-500 text-white'
                : 'bg-green-500 text-white'
            }`}
          >
            {userInfo.supabaseInfo.environment}
          </span>
        </div>
        <div className='text-xs text-gray-300 mt-1 font-mono break-all'>
          {userInfo.supabaseInfo.url}
        </div>
      </div>

      <div className='space-y-3 text-sm'>
        {/* Basic User Info */}
        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            User ID:
          </span>
          <div className='font-mono text-xs text-gray-200 dark:text-gray-300 break-all mt-1 bg-slate-800/50 dark:bg-slate-700/50 p-2 rounded-lg'>
            {userInfo.user.id}
          </div>
        </div>

        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Email:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {userInfo.user.email || 'N/A'}
          </div>
        </div>

        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Created:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {formatDate(userInfo.user.created_at)}
          </div>
        </div>

        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Last Sign In:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {formatDate(userInfo.user.last_sign_in_at)}
          </div>
        </div>

        {/* Session Info */}
        <div className='border-t border-gray-300/30 dark:border-gray-500/30 pt-3'>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Session Expires:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {userInfo.sessionExpiry}
          </div>
        </div>

        {/* Subscription Info */}
        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Subscription:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {userInfo.subscriptionInfo}
          </div>
        </div>

        {/* JWT Claims */}
        {userInfo.jwtClaims && (
          <div>
            <span className='font-semibold text-gray-100 dark:text-gray-200'>
              JWT Role:
            </span>
            <div className='text-gray-200 dark:text-gray-300 mt-1'>
              {userInfo.jwtClaims.role || 'authenticated'}
            </div>
          </div>
        )}

        {/* App Metadata */}
        {userInfo.user.app_metadata &&
          Object.keys(userInfo.user.app_metadata).length > 0 && (
            <div>
              <span className='font-semibold text-gray-100 dark:text-gray-200'>
                App Metadata:
              </span>
              <div className='text-gray-200 dark:text-gray-300 font-mono text-xs mt-1 bg-slate-800/50 dark:bg-slate-700/50 p-2 rounded-lg'>
                {JSON.stringify(userInfo.user.app_metadata, null, 2)}
              </div>
            </div>
          )}

        {/* User Metadata */}
        {userInfo.user.user_metadata &&
          Object.keys(userInfo.user.user_metadata).length > 0 && (
            <div>
              <span className='font-semibold text-gray-100 dark:text-gray-200'>
                User Metadata:
              </span>
              <div className='text-gray-200 dark:text-gray-300 font-mono text-xs mt-1 bg-slate-800/50 dark:bg-slate-700/50 p-2 rounded-lg'>
                {JSON.stringify(userInfo.user.user_metadata, null, 2)}
              </div>
            </div>
          )}

        {/* Cookie Info */}
        <div className='border-t border-gray-300/30 dark:border-gray-500/30 pt-3'>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Browser Cookies:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {userInfo.cookieInfo}
          </div>
        </div>

        {/* Email Verification Status */}
        <div>
          <span className='font-semibold text-gray-100 dark:text-gray-200'>
            Email Verified:
          </span>
          <div className='text-gray-200 dark:text-gray-300 mt-1'>
            {userInfo.user.email_confirmed_at ? '✓ Verified' : '✗ Unverified'}
          </div>
        </div>

        {/* Phone Verification Status */}
        {userInfo.user.phone && (
          <div>
            <span className='font-semibold text-gray-100 dark:text-gray-200'>
              Phone:
            </span>
            <div className='text-gray-200 dark:text-gray-300 mt-1'>
              {userInfo.user.phone}{' '}
              {userInfo.user.phone_confirmed_at ? '(✓)' : '(✗)'}
            </div>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <Tooltip
      content={tooltipContent}
      placement={placement}
      trigger='click'
      className={className}
      contentClassName='max-w-md'
      showCloseButton={true}
      persistOnHover={false}
    >
      {children}
    </Tooltip>
  )
}

export default UserInfoTooltip
