# 🧪 Subscription Testing Guide

## Prerequisites
- Development server running on http://localhost:3000
- Subscriptions table cleared (✅ Done)
- Both Stripe and PayPal test credentials configured

## 🎯 Test Plan: Complete Web UI Subscription Flow

### Test 1: PayPal Subscription Flow

#### Steps:
1. **Navigate to Membership Page**
   ```
   http://localhost:3000/membership
   ```

2. **Select a Plan**
   - Choose any plan (Standard, Premium, or Commercial)
   - Select billing interval (Monthly or Yearly)

3. **Choose PayPal Payment**
   - Click on PayPal option
   - Should store plan details in localStorage
   - Should redirect to PayPal sandbox

4. **Complete PayPal Flow**
   - Use PayPal sandbox credentials
   - Complete the subscription approval
   - Should redirect back to `/account?success=true&payment=paypal&subscription_id=XXX`

5. **Verify Auto-Activation**
   - PayPalSubscriptionHandler should detect the success
   - Should call `/api/paypal/activate-subscription`
   - Should show success toast
   - Should redirect to clean `/account` page

6. **Verify Database**
   ```bash
   node test-subscriptions.js
   ```
   - Should show 1 subscription
   - Plan type should match selected plan
   - Status should be 'active'

### Test 2: Stripe Subscription Flow

#### Steps:
1. **Clear Previous Test Data**
   ```bash
   node clear-subscriptions.js
   ```

2. **Navigate to Membership Page**
   ```
   http://localhost:3000/membership
   ```

3. **Select a Plan**
   - Choose any plan (Standard, Premium, or Commercial)
   - Select billing interval (Monthly or Yearly)

4. **Choose Stripe Payment**
   - Click on Stripe option
   - Should redirect to Stripe Checkout

5. **Complete Stripe Flow**
   - Use Stripe test card: 4242 4242 4242 4242
   - Any future expiry date
   - Any CVC
   - Complete the payment
   - Should redirect back to `/account?success=true`

6. **Verify Webhook Processing**
   - StripeSubscriptionHandler should detect success
   - Stripe webhook should create subscription
   - Should show success toast

7. **Verify Database**
   ```bash
   node test-subscriptions.js
   ```
   - Should show 1 subscription
   - Plan type should match selected plan
   - Status should be 'active'
   - stripe_subscription_id should be populated

## 🔍 Expected Outcomes

### PayPal Success:
- ✅ Subscription in database with PayPal details
- ✅ stripe_subscription_id = null
- ✅ status = 'active'
- ✅ correct plan_type and billing_interval

### Stripe Success:
- ✅ Subscription in database with Stripe details
- ✅ stripe_subscription_id populated
- ✅ status = 'active'
- ✅ correct plan_type and billing_interval

## 🐛 Troubleshooting

### If PayPal fails:
1. Check browser console for localStorage data
2. Check server logs for activation API calls
3. Verify PayPal sandbox credentials

### If Stripe fails:
1. Check webhook endpoint is accessible
2. Verify Stripe webhook secret
3. Check server logs for webhook events

### If database is empty:
1. Check webhook configuration
2. Verify API endpoints are working
3. Check Supabase connection

## 🎯 Quick Verification Commands

```bash
# Check current subscriptions
node test-subscriptions.js

# Clear all subscriptions
node clear-subscriptions.js

# Test PayPal activation manually
curl -X POST http://localhost:3000/api/paypal/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{"subscriptionId":"test_sub","userId":"test_user","planType":"premium","billingInterval":"monthly"}'
```

## Expected Database Structure

```json
{
  "id": "uuid",
  "user_id": "user-uuid",
  "plan_type": "premium",
  "price_monthly": 19.99,
  "price_yearly": 199.99,
  "status": "active",
  "billing_interval": "monthly",
  "stripe_subscription_id": "sub_xxx" // or null for PayPal,
  "current_period_start": "2025-06-13T...",
  "current_period_end": "2025-07-13T...",
  "features": ["feature1", "feature2"],
  "created_at": "2025-06-13T...",
  "updated_at": "2025-06-13T..."
}
```
