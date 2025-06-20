# Subscription System Documentation

## Overview

This document describes the comprehensive subscription and payment system implemented for the Next.js Supabase Gallery app. The system supports dual access models: individual image purchases and subscription-based unlimited access.

## Architecture

### Database Schema

#### Core Tables

1. **subscriptions** - User subscription records

   - `user_id` - References auth.users
   - `plan_type` - 'standard', 'premium', 'commercial'
   - `status` - 'active', 'cancelled', 'expired'
   - `billing_interval` - 'monthly', 'yearly'
   - `stripe_subscription_id` - External Stripe subscription ID
   - `current_period_start/end` - Subscription period
   - `features` - JSON array of plan features

2. **purchases** - Individual image purchase records

   - `image_id` - References images table
   - `user_id` - References auth.users (nullable for anonymous)
   - `amount_paid` - Amount in cents
   - `payment_method` - 'stripe', 'paypal'
   - `payment_status` - 'pending', 'completed', 'failed'

3. **image_downloads** - Download tracking for limits

   - `user_id` - References auth.users
   - `image_id` - References images
   - `download_type` - 'subscription', 'purchase', 'free'
   - `downloaded_at` - Timestamp

4. **subscription_usage** - Monthly usage tracking
   - `user_id` - References auth.users
   - `subscription_id` - References subscriptions
   - `downloads_used/limit` - Download tracking
   - `usage_period_start/end` - Period boundaries

### Access Control Logic

The system implements a hierarchical access model:

1. **Subscription Access** - Users with active subscriptions

   - Standard: 50 downloads/month
   - Premium: 200 downloads/month
   - Commercial: Unlimited downloads

2. **Purchase Access** - Users who bought specific images

   - Permanent access to purchased images
   - No download limits for owned images

3. **Free Access** - Non-subscribers
   - Can view images (with watermarks/previews)
   - Cannot download without purchase/subscription

## Components

### Unified Image Card (`UnifiedImageCard`)

A comprehensive image card component that:

- Shows real-time access status
- Displays subscription/purchase information
- Handles download/purchase actions
- Supports multiple view modes (grid, list, masonry)

```tsx
<UnifiedImageCard
  image={image}
  onView={handleView}
  onDownload={handleDownload}
  onCheckout={handleCheckout}
  viewMode='grid'
  showActions={true}
  showAccessInfo={true}
/>
```

### Subscription Dashboard (`SubscriptionDashboard`)

A complete subscription management interface:

- Current plan status and details
- Usage statistics and limits
- Billing information
- Plan upgrade/downgrade options

### Gallery with Subscription (`GalleryWithSubscription`)

Enhanced gallery component with subscription awareness:

- Multiple view modes
- Real-time access checking
- Integrated purchase/download flows

## Payment Integration

### Unified Payment Service (`PaymentService`)

Centralized service for handling payments across providers:

```typescript
// Create subscription
const result = await paymentService.createSubscription({
  userId: 'user-id',
  userEmail: 'user@example.com',
  planType: 'premium',
  billingInterval: 'monthly',
  paymentProvider: 'stripe',
  externalSubscriptionId: 'stripe-sub-id',
})

// Create purchase
const result = await paymentService.createPurchase({
  userId: 'user-id',
  imageId: 'image-id',
  licenseType: 'standard',
  amount: 999, // $9.99 in cents
  currency: 'usd',
  paymentProvider: 'stripe',
  externalPaymentId: 'stripe-session-id',
})
```

### Webhook Handlers

Both Stripe and PayPal webhooks use the unified payment service:

- **Stripe Webhook** (`/api/stripe/webhook`)

  - Handles subscription lifecycle events
  - Processes one-time payments
  - Updates subscription status

- **PayPal Webhook** (`/api/paypal/webhook`)
  - Handles PayPal subscription events
  - Processes PayPal payments
  - Maintains status synchronization

## Access Control

### Subscription Access Logic (`subscription-access.ts`)

Core functions for access control:

```typescript
// Check if user can download specific image
const access = await canDownloadImage(imageId)
// Returns: { canDownload, canView, reason, accessType, downloadsRemaining }

// Record download for usage tracking
await recordImageDownload(imageId, 'subscription')

// Get user's download statistics
const stats = await getUserDownloadStats(userId)
// Returns: { thisMonth, allTime, lastDownload }
```

### Enhanced Image Access Result

```typescript
interface ImageAccessResult {
  canDownload: boolean
  canView: boolean
  reason?: string
  requiresPayment?: boolean
  accessType: 'free' | 'subscription' | 'purchased' | 'blocked'
  downloadsRemaining?: number
  subscriptionTier?: string
}
```

## API Endpoints

### Subscription Management

- `GET /api/subscription` - Get user's current subscription
- `POST /api/stripe/checkout/subscription` - Create Stripe subscription checkout
- `POST /api/paypal/subscription` - Create PayPal subscription

### Image Access

- `GET /api/gallery/image-access?imageId=xxx` - Check image access permissions
- `POST /api/stripe/checkout` - Create image purchase checkout

### Webhooks

- `POST /api/stripe/webhook` - Stripe webhook handler
- `POST /api/paypal/webhook` - PayPal webhook handler

## Testing

### Integration Tests

Run the comprehensive integration test:

```bash
node scripts/test-subscription-integration.js
```

Tests include:

- Database schema validation
- Subscription creation/management
- Purchase record creation
- Download tracking
- Access permission checking
- Usage limit enforcement

### Migration Script

Apply database changes:

```bash
node scripts/apply-subscription-migration.js
```

## Configuration

### Environment Variables

Required environment variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
STRIPE_STANDARD_MONTHLY_PRICE_ID=price_xxx
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_xxx
STRIPE_COMMERCIAL_MONTHLY_PRICE_ID=price_xxx

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-secret
```

### Subscription Plans

Plans are configured in `src/lib/subscription-config.ts`:

```typescript
export const SUBSCRIPTION_PLANS = {
  standard: {
    name: 'Standard Plan',
    priceMonthly: 9.99,
    priceYearly: 99.99,
    features: ['50 downloads/month', 'Basic support'],
  },
  premium: {
    name: 'Premium Plan',
    priceMonthly: 19.99,
    priceYearly: 199.99,
    features: ['200 downloads/month', 'Priority support'],
  },
  commercial: {
    name: 'Commercial Plan',
    priceMonthly: 39.99,
    priceYearly: 399.99,
    features: ['Unlimited downloads', 'Commercial license'],
  },
}
```

## Security Considerations

1. **Row Level Security (RLS)** - All tables have RLS policies
2. **User Isolation** - Users can only access their own data
3. **Webhook Verification** - All webhooks verify signatures
4. **Service Role Key** - Used only for admin operations
5. **Client-side Validation** - Never trust client-side access checks

## Troubleshooting

### Common Issues

1. **Subscription not showing as active**

   - Check webhook delivery in Stripe/PayPal dashboard
   - Verify webhook endpoint is accessible
   - Check database for subscription record

2. **Download limits not working**

   - Ensure `image_downloads` table exists
   - Check RLS policies are correctly set
   - Verify download tracking is recording

3. **Payment webhook failures**
   - Check webhook signature verification
   - Verify environment variables are set
   - Check Supabase service role permissions

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=subscription:*
```

This will log detailed information about subscription operations.
