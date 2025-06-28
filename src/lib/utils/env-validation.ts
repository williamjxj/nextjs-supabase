/**
 * Environment Configuration Validation
 * Validates required environment variables for different services
 */

interface EnvironmentConfig {
  isValid: boolean
  errors: string[]
  warnings: string[]
  services: {
    supabase: boolean
    stripe: boolean
    paypal: boolean
    crypto: boolean
    email: boolean
  }
}

export function validateEnvironment(
  checkOptional: boolean = false
): EnvironmentConfig {
  const errors: string[] = []
  const warnings: string[] = []
  const services = {
    supabase: false,
    stripe: false,
    paypal: false,
    crypto: false,
    email: false,
  }

  // Required environment variables
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXTAUTH_SECRET',
    'NEXTAUTH_URL',
    'APP_URL',
  ]

  // Check required variables
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`)
    }
  }

  // Validate Supabase configuration
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    services.supabase = true
  } else {
    errors.push('Supabase configuration incomplete')
  }

  // Validate Stripe configuration
  if (
    process.env.STRIPE_SECRET_KEY &&
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ) {
    services.stripe = true
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      warnings.push(
        'Stripe webhook secret not configured - webhooks will not work'
      )
    }
  } else if (checkOptional) {
    warnings.push(
      'Stripe configuration incomplete - payment processing will be limited'
    )
  }

  // Validate PayPal configuration
  if (process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET) {
    services.paypal = true
    if (!process.env.PAYPAL_WEBHOOK_ID) {
      warnings.push('PayPal webhook ID not configured - webhooks will not work')
    }
  } else if (checkOptional) {
    warnings.push(
      'PayPal configuration incomplete - PayPal payments unavailable'
    )
  }

  // Validate Crypto configuration
  if (process.env.COINBASE_COMMERCE_API_KEY) {
    services.crypto = true
    if (!process.env.COINBASE_COMMERCE_WEBHOOK_SECRET) {
      warnings.push(
        'Coinbase Commerce webhook secret not configured - webhooks will not work'
      )
    }
  } else if (checkOptional) {
    warnings.push(
      'Crypto payment configuration incomplete - crypto payments unavailable'
    )
  }

  // Validate Email configuration (optional)
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    services.email = true
  } else if (checkOptional) {
    warnings.push(
      'Email configuration incomplete - email notifications unavailable'
    )
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    services,
  }
}

export function getEnvironmentReport(): EnvironmentConfig {
  const config = validateEnvironment(true)
  // Environment report available for debugging when needed
  return config
}

// Environment-specific configurations
export const ENV_CONFIG = {
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  apiRateLimit: {
    perMinute: parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || '100'),
    perHour: parseInt(process.env.API_RATE_LIMIT_PER_HOUR || '1000'),
  },
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'), // 10MB default
  allowedFileTypes: process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
}

// Payment provider configurations
export const PAYMENT_CONFIG = {
  stripe: {
    isEnabled: !!(
      process.env.STRIPE_SECRET_KEY &&
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
    ),
    hasWebhook: !!process.env.STRIPE_WEBHOOK_SECRET,
  },
  paypal: {
    isEnabled: !!(
      process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET
    ),
    hasWebhook: !!process.env.PAYPAL_WEBHOOK_ID,
    environment: process.env.PAYPAL_ENVIRONMENT || 'sandbox',
  },
  crypto: {
    isEnabled: !!process.env.COINBASE_COMMERCE_API_KEY,
    hasWebhook: !!process.env.COINBASE_COMMERCE_WEBHOOK_SECRET,
  },
}

// Environment check available via getEnvironmentReport() function when needed
