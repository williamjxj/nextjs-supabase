/**
 * Enhanced Error Handling Utilities
 * Provides consistent error handling across the application
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  code: string
  message: string
  details?: any
  statusCode: number
}

export class ApplicationError extends Error {
  public statusCode: number
  public code: string
  public details?: any

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message)
    this.name = 'ApplicationError'
    this.statusCode = statusCode
    this.code = code || 'INTERNAL_ERROR'
    this.details = details
  }
}

export class AuthenticationError extends ApplicationError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTH_REQUIRED')
  }
}

export class ValidationError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details)
  }
}

export class PaymentError extends ApplicationError {
  constructor(message: string, provider?: string, details?: any) {
    super(message, 402, 'PAYMENT_ERROR', { provider, ...details })
  }
}

export class SubscriptionError extends ApplicationError {
  constructor(message: string, details?: any) {
    super(message, 403, 'SUBSCRIPTION_ERROR', details)
  }
}

/**
 * Standard error response format
 */
export function createErrorResponse(
  error: ApplicationError | Error,
  request?: Request
): NextResponse {
  // Log error for debugging
  console.error('API Error:', {
    message: error.message,
    stack: error.stack,
    url: request?.url,
    method: request?.method,
    timestamp: new Date().toISOString(),
  })

  if (error instanceof ApplicationError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        timestamp: new Date().toISOString(),
      },
      { status: error.statusCode }
    )
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        details:
          process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  )
}

/**
 * Async error handler wrapper for API routes
 */
export function withErrorHandling<T extends any[], R>(
  handler: (...args: T) => Promise<R>
) {
  return async (...args: T): Promise<R | NextResponse> => {
    try {
      return await handler(...args)
    } catch (error) {
      if (error instanceof ApplicationError) {
        return createErrorResponse(error, args[0] as Request)
      }

      console.error('Unhandled API error:', error)
      return createErrorResponse(
        new ApplicationError('Internal server error'),
        args[0] as Request
      )
    }
  }
}

/**
 * Payment provider error mapping
 */
export function mapPaymentError(error: any, provider: string): PaymentError {
  let message = 'Payment processing failed'
  let details = error

  switch (provider) {
    case 'stripe':
      if (error.type === 'StripeCardError') {
        message = error.message || 'Card payment failed'
      } else if (error.type === 'StripeInvalidRequestError') {
        message = 'Invalid payment request'
      }
      break

    case 'paypal':
      if (error.name === 'VALIDATION_ERROR') {
        message = 'PayPal validation failed'
      } else if (error.name === 'INSTRUMENT_DECLINED') {
        message = 'Payment method declined'
      }
      break

    case 'crypto':
      if (error.code === 'charge_expired') {
        message = 'Crypto payment expired'
      } else if (error.code === 'charge_underpaid') {
        message = 'Insufficient payment amount'
      }
      break
  }

  return new PaymentError(message, provider, details)
}

/**
 * Database error mapping
 */
export function mapDatabaseError(error: any): ApplicationError {
  // Supabase/PostgreSQL error mapping
  if (error.code === '23505') {
    return new ValidationError('Duplicate entry', {
      constraint: error.constraint,
    })
  }

  if (error.code === '23503') {
    return new ValidationError('Referenced record not found', {
      constraint: error.constraint,
    })
  }

  if (error.code === '42501') {
    return new AuthenticationError('Insufficient permissions')
  }

  return new ApplicationError(
    'Database operation failed',
    500,
    'DATABASE_ERROR',
    error
  )
}

/**
 * Error logging utility
 */
export function logError(error: Error, context?: Record<string, any>): void {
  const errorLog = {
    message: error.message,
    stack: error.stack,
    name: error.name,
    context,
    timestamp: new Date().toISOString(),
  }

  if (process.env.NODE_ENV === 'development') {
    console.error('🚨 Error Log:', errorLog)
  } else {
    // In production, you might want to send to an external service
    console.error(JSON.stringify(errorLog))
  }
}

/**
 * Subscription validation utility
 */
export function validateSubscriptionAccess(
  userSubscription: any,
  requiredTier?: string
): void {
  if (!userSubscription || userSubscription.status !== 'active') {
    throw new SubscriptionError('Active subscription required')
  }

  if (requiredTier && userSubscription.plan_type !== requiredTier) {
    throw new SubscriptionError(`${requiredTier} subscription required`, {
      current: userSubscription.plan_type,
      required: requiredTier,
    })
  }
}

/**
 * Input validation utility
 */
export function validateRequired(
  data: Record<string, any>,
  fields: string[]
): void {
  const missing = fields.filter(field => !data[field])

  if (missing.length > 0) {
    throw new ValidationError(
      `Missing required fields: ${missing.join(', ')}`,
      { missing }
    )
  }
}

/**
 * Rate limiting error
 */
export class RateLimitError extends ApplicationError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED')
  }
}
