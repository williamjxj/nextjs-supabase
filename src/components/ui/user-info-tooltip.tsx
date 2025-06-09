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
}

interface UserInfoTooltipProps {
  children: React.ReactElement
  placement?: 'top' | 'bottom' | 'left' | 'right'
  className?: string
}

export const UserInfoTooltip = ({ 
  children, 
  placement = 'bottom',
  className 
}: UserInfoTooltipProps) => {
  const { user, loading } = useAuth()
  const [userInfo, setUserInfo] = useState<UserInfoData | null>(null)

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!user || loading) return

      try {
        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // Extract JWT claims if available
        let jwtClaims = null
        if (session?.access_token) {
          try {
            // Decode JWT payload (basic decode, not verification)
            const payload = JSON.parse(atob(session.access_token.split('.')[1]))
            jwtClaims = payload
          } catch (e) {
            console.warn('Could not decode JWT:', e)
          }
        }

        // Calculate session expiry
        const sessionExpiry = session?.expires_at 
          ? new Date(session.expires_at * 1000).toLocaleString()
          : 'Unknown'

        // Get subscription info
        const subscriptionInfo = user.subscription 
          ? `${user.subscription.status} - ${user.subscription.prices?.products?.name || 'Unknown Plan'}`
          : 'No active subscription'

        // Get basic cookie info (we can't access httpOnly cookies from client)
        const cookieInfo = document.cookie 
          ? `${document.cookie.split(';').length} cookies set`
          : 'No accessible cookies'

        setUserInfo({
          user,
          session,
          sessionExpiry,
          subscriptionInfo,
          cookieInfo,
          jwtClaims
        })
      } catch (error) {
        console.error('Error fetching user info:', error)
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
    <div className="max-w-sm p-3 space-y-3">
      <div className="text-center border-b border-gray-200/60 dark:border-gray-600/60 pb-3">
        <h3 className="font-medium text-base text-gray-800 dark:text-gray-100">
          Account Information
        </h3>
      </div>
      
      <div className="space-y-3 text-sm">
        {/* Basic User Info */}
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">User ID:</span>
          <div className="font-mono text-xs text-gray-500 dark:text-gray-400 break-all mt-1">
            {userInfo.user.id}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Email:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {userInfo.user.email || 'N/A'}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Created:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(userInfo.user.created_at)}
          </div>
        </div>

        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Last Sign In:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {formatDate(userInfo.user.last_sign_in_at)}
          </div>
        </div>

        {/* Session Info */}
        <div className="border-t border-gray-200/60 dark:border-gray-600/60 pt-3">
          <span className="font-medium text-gray-600 dark:text-gray-300">Session Expires:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {userInfo.sessionExpiry}
          </div>
        </div>

        {/* Subscription Info */}
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Subscription:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {userInfo.subscriptionInfo}
          </div>
        </div>

        {/* JWT Claims */}
        {userInfo.jwtClaims && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-300">JWT Role:</span>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              {userInfo.jwtClaims.role || 'authenticated'}
            </div>
          </div>
        )}

        {/* App Metadata */}
        {userInfo.user.app_metadata && Object.keys(userInfo.user.app_metadata).length > 0 && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-300">App Metadata:</span>
            <div className="text-gray-500 dark:text-gray-400 font-mono text-xs mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              {JSON.stringify(userInfo.user.app_metadata, null, 2)}
            </div>
          </div>
        )}

        {/* User Metadata */}
        {userInfo.user.user_metadata && Object.keys(userInfo.user.user_metadata).length > 0 && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-300">User Metadata:</span>
            <div className="text-gray-500 dark:text-gray-400 font-mono text-xs mt-1 bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg">
              {JSON.stringify(userInfo.user.user_metadata, null, 2)}
            </div>
          </div>
        )}

        {/* Cookie Info */}
        <div className="border-t border-gray-200/60 dark:border-gray-600/60 pt-3">
          <span className="font-medium text-gray-600 dark:text-gray-300">Browser Cookies:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {userInfo.cookieInfo}
          </div>
        </div>

        {/* Email Verification Status */}
        <div>
          <span className="font-medium text-gray-600 dark:text-gray-300">Email Verified:</span>
          <div className="text-gray-500 dark:text-gray-400 mt-1">
            {userInfo.user.email_confirmed_at ? '✓ Verified' : '✗ Unverified'}
          </div>
        </div>

        {/* Phone Verification Status */}
        {userInfo.user.phone && (
          <div>
            <span className="font-medium text-gray-600 dark:text-gray-300">Phone:</span>
            <div className="text-gray-500 dark:text-gray-400 mt-1">
              {userInfo.user.phone} {userInfo.user.phone_confirmed_at ? '(✓)' : '(✗)'}
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
      trigger="hover"
      className={className}
      contentClassName="max-w-md"
    >
      {children}
    </Tooltip>
  )
}

export default UserInfoTooltip
