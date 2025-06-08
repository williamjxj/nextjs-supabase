# Subscription Implementation Setup Guide

This guide covers the complete setup process for implementing the subscription-based SaaS platform based on Vercel's nextjs-subscription-payments template.

## 🎯 Overview

The implementation transforms your current pay-per-image model into a comprehensive subscription-based SaaS platform with:

- **3-tier pricing structure**: Starter ($9.99), Pro ($19.99), Enterprise ($49.99)
- **Monthly and annual billing** options with 17% annual discount
- **Feature-based access control** with usage limits
- **Comprehensive admin utilities** for subscription management
- **Enhanced webhook handling** for all subscription lifecycle events
- **Customer portal** for self-service billing management

## 📁 Files Created/Modified

### New Files Created:
- `/src/types/database.ts` - Database type definitions
- `/src/lib/stripe/admin.ts` - Enhanced Stripe admin utilities
- `/src/lib/stripe/server.ts` - Server-side Stripe configuration  
- `/src/lib/stripe/client.ts` - Client-side Stripe utilities
- `/src/utils/supabase/admin.ts` - Supabase admin utilities
- `/src/app/api/stripe/checkout/subscription/route.ts` - Subscription checkout API
- `/src/app/api/stripe/customer-portal/route.ts` - Customer portal API
- `/supabase/migrations/20250608000001_create_customers_table.sql` - Customers table migration

### Modified Files:
- `/src/app/api/stripe/webhook/route.ts` - Enhanced webhook handler
- `/.env.example` - Added subscription environment variables
- `/scripts/seed-plans.sh` - Enhanced seeding script

## 🚀 Setup Steps

### 1. Environment Variables

Copy the variables from `.env.example` to your `.env.local` file:

```bash
# Supabase Configuration (existing)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe Configuration (existing)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# NEW: Stripe Price IDs for Subscription Plans
NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID=price_...

# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Database Migration

Apply the database migration to create the customers table:

```bash
# If using Supabase locally
npx supabase db push

# If using remote Supabase, run the SQL file manually in your Supabase dashboard:
# Copy the contents of supabase/migrations/20250608000001_create_customers_table.sql
# and execute it in the SQL editor
```

### 3. Stripe Dashboard Setup

#### Create Products and Prices:

1. Go to **Stripe Dashboard > Products**
2. Create 3 products:
   - **Starter**: "Perfect for individuals getting started"
   - **Pro**: "For professionals and growing businesses"  
   - **Enterprise**: "For large teams and enterprises"

3. For each product, create 2 recurring prices:
   - **Monthly**: $9.99, $19.99, $49.99 respectively
   - **Yearly**: $99.99, $199.99, $499.99 respectively (17% discount)

4. Copy the **Price IDs** (start with `price_`) to your `.env.local` file

#### Set up Webhook Endpoint:

1. Go to **Stripe Dashboard > Webhooks**
2. Add endpoint: `your_domain/api/stripe/webhook`
3. Select these events:
   - `checkout.session.completed`
   - `customer.created`
   - `customer.updated`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
   - `payment_intent.payment_failed`
4. Copy the webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Seed Subscription Plans

Run the seeding script to populate your database with the pricing plans:

```bash
# Make sure your environment variables are set in .env.local
chmod +x scripts/seed-plans.sh
./scripts/seed-plans.sh
```

This will create 6 subscription plans (3 tiers × 2 billing intervals) in your database.

### 5. Test the Implementation

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test subscription checkout**:
   - Navigate to `/membership` (when implemented)
   - Try creating a subscription with test Stripe cards
   - Verify webhook events are processed correctly

3. **Test customer portal**:
   - Create a subscription first
   - Access customer portal to manage billing
   - Test subscription updates and cancellations

## 🏗️ Architecture Overview

### Stripe Utilities Structure:
```
/src/lib/stripe/
├── admin.ts     # Server-side admin operations
├── server.ts    # Enhanced server configuration
└── client.ts    # Client-side operations
```

### Supabase Utilities:
```
/src/utils/supabase/
└── admin.ts     # Admin operations with service role
```

### API Endpoints:
```
/src/app/api/stripe/
├── webhook/route.ts              # Enhanced webhook handler
├── checkout/subscription/route.ts # Subscription checkout
└── customer-portal/route.ts      # Customer portal access
```

### Database Schema:
- `customers` - Links Stripe customers to users
- `subscription_plans` - Pricing tiers and features
- `subscriptions` - Active/historical subscriptions
- `subscription_invoices` - Payment history

## 🔧 Next Steps

### Immediate (Required):
1. ✅ Database types file created
2. ✅ Customers table migration created
3. ✅ Webhook handler enhanced
4. ✅ Environment variables documented
5. ⏳ Apply database migrations
6. ⏳ Set up Stripe products and prices
7. ⏳ Configure webhook endpoints

### Phase 2 (UI Components):
- Create subscription management UI components
- Build pricing page with tier comparison
- Implement subscription status indicators
- Add billing history interface
- Create usage tracking displays

### Phase 3 (Access Control):
- Implement gallery access control by subscription tier
- Add feature gating for image uploads
- Create usage limit enforcement
- Build admin dashboard for analytics

### Phase 4 (Migration Strategy):
- Plan migration of existing pay-per-image users
- Create graceful transition flow
- Implement backward compatibility
- Data migration scripts

## 🐛 Troubleshooting

### Common Issues:

1. **Webhook not receiving events**:
   - Check webhook URL is accessible
   - Verify webhook secret matches
   - Check selected events in Stripe dashboard

2. **Database connection errors**:
   - Ensure service role key is correct
   - Verify Supabase URL format
   - Check RLS policies are properly configured

3. **Stripe price ID errors**:
   - Ensure you're using Price IDs, not Product IDs
   - Verify IDs start with `price_`
   - Check environment variables are loaded

4. **TypeScript errors**:
   - Run `npm run type-check` to verify types
   - Ensure database types are generated correctly
   - Check import paths are correct

## 📊 Feature Comparison

| Feature | Starter | Pro | Enterprise |
|---------|---------|-----|------------|
| Monthly Uploads | 10 | 50 | Unlimited |
| Storage | 1 GB | 10 GB | 100 GB |
| License Options | Basic | All | All |
| Support | Standard | Priority | 24/7 Priority |
| Analytics | ❌ | ✅ | ✅ |
| API Access | ❌ | ✅ | ✅ |
| Custom Integrations | ❌ | ❌ | ✅ |
| Account Manager | ❌ | ❌ | ✅ |

## 🔗 Resources

- [Vercel Subscription Payments Template](https://vercel.com/templates/next.js/nextjs-subscription-payments)
- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
