'use client'

import React from 'react'
import { AuthProvider } from '@/hooks/use-auth'
import { ToastProvider } from '@/components/ui/toast'
import { Layout } from '@/components/layout/layout'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { SubscriptionProvider } from './subscription-provider'
import { ThemeProvider } from '@/contexts/theme-context'

interface ProvidersProps {
  children: React.ReactNode
}

export const Providers = ({ children }: ProvidersProps) => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SubscriptionProvider>
            <ToastProvider>
              <Layout>{children}</Layout>
            </ToastProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}
