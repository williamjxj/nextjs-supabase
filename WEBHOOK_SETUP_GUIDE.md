# 🔧 Stripe Webhook Setup Guide

## 🔍 Current Issue Analysis

Your subscription checkout is completing successfully, but the subscription record isn't being created in the database because **Stripe webhooks are not reaching your local development server**.

### Logs Show:

- ✅ Stripe checkout session created successfully
- ✅ User redirected to success page
- ❌ No webhook events received
- ❌ No subscription record created in database

## 🛠️ Solution Options

### Option 1: Use Stripe CLI (Recommended for Development)

#### Step 1: Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

#### Step 2: Login to Stripe

```bash
stripe login
```

#### Step 3: Forward Webhooks to Local Server

```bash
# Forward webhooks to your local development server
stripe listen --forward-to localhost:3000/api/stripe/webhook

# This will output a webhook signing secret like:
# whsec_1234567890abcdef...
```

#### Step 4: Update Environment Variable

```bash
# Update .env file with the new webhook secret from Step 3
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

#### Step 5: Restart Development Server

```bash
npm run dev
```

### Option 2: Manual Webhook Simulation (Quick Test)

#### Test Webhook Functionality

1. Go to: http://localhost:3000/webhook-test
2. Click "Simulate Webhook"
3. This manually creates a subscription record
4. Check if subscription appears in account page

### Option 3: Use ngrok (Alternative)

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Or download from: https://ngrok.com/download
```

#### Step 2: Expose Local Server

```bash
ngrok http 3000
```

#### Step 3: Configure Stripe Dashboard

1. Go to: https://dashboard.stripe.com/test/webhooks
2. Click "Add endpoint"
3. Use ngrok URL: `https://abc123.ngrok.io/api/stripe/webhook`
4. Select events: `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`

## 🧪 Testing Steps

### 1. Test Manual Webhook Simulation

```bash
# Visit the test page
open http://localhost:3000/webhook-test

# Or test via API
curl -X POST http://localhost:3000/api/stripe/manual-webhook-test \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "your-user-id",
    "userEmail": "your-email@example.com",
    "planType": "premium",
    "billingInterval": "monthly"
  }'
```

### 2. Test Real Stripe Webhook

```bash
# After setting up Stripe CLI forwarding
$ stripe trigger checkout.session.completed
```

### 3. Verify Subscription Creation

1. Check account page: http://localhost:3000/account/subscriptions
2. Should show active subscription
3. Gallery should show unlimited access

## 🔍 Debugging Commands

### Check Webhook Events

```bash
# List recent webhook events
$ stripe events list --limit 10

# Get specific event details
$ stripe events retrieve evt_1234567890
```

### Check Webhook Endpoints

```bash
# List configured webhook endpoints
$ stripe webhook_endpoints list
```

### Test Webhook Endpoint

```bash
# Test if webhook endpoint is accessible
curl -X POST http://localhost:3000/api/stripe/webhook \
  -H "Content-Type: application/json" \
  -d '{"test": "webhook"}'
```

## 🎯 Expected Results

### After Webhook Setup:

1. ✅ Stripe checkout completes
2. ✅ Webhook fires automatically
3. ✅ Subscription record created in database
4. ✅ Account page shows active subscription
5. ✅ Gallery shows unlimited access

### Webhook Events to Monitor:

- `checkout.session.completed` - Creates subscription record
- `customer.subscription.created` - Confirms subscription
- `customer.subscription.updated` - Updates subscription status
- `invoice.payment_succeeded` - Confirms payment
- `customer.subscription.deleted` - Handles cancellation

## 🚨 Common Issues

### Issue 1: Webhook Secret Mismatch

```bash
# Error: "Invalid signature"
# Solution: Update STRIPE_WEBHOOK_SECRET with correct value from Stripe CLI
```

### Issue 2: Webhook Not Reachable

```bash
# Error: No webhook events received
# Solution: Use Stripe CLI forwarding or ngrok
```

### Issue 3: Service Role Key Issue

```bash
# Error: "Failed to create subscription record"
# Solution: Fix service role key in .env file
```

## 🔧 Quick Fix Commands

### Start Webhook Forwarding

```bash
# Terminal 1: Start development server
npm run dev

# Terminal 2: Forward webhooks
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

### Test Subscription Creation

```bash
# Manual test
curl -X POST http://localhost:3000/api/stripe/manual-webhook-test \
  -H "Content-Type: application/json" \
  -d '{"userId":"test","userEmail":"test@example.com"}'
```

## 🎉 Success Indicators

When everything is working correctly:

1. Stripe CLI shows webhook events being forwarded
2. Server logs show webhook processing
3. Database contains subscription records
4. Account page displays active subscription
5. Gallery shows unlimited access for subscribers
