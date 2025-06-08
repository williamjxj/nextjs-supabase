#!/bin/bash

# Seed Subscription Plans Script
# This script seeds the subscription plans in the Supabase database with enhanced pricing tiers

set -e

echo "🌱 Seeding subscription plans with new pricing structure..."

# Load environment variables from .env.local if it exists
if [ -f "../.env.local" ]; then
    export $(cat ../.env.local | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}')
fi

# Check if required environment variables are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: Required environment variables are not set"
    echo "Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local"
    exit 1
fi

# Function to create subscription plan
create_plan() {
    local name="$1"
    local type="$2"
    local description="$3"
    local price="$4"
    local interval="$5"
    local stripe_price_id="$6"
    local features="$7"
    
    echo "📦 Creating $name $interval plan..."
    
    curl -X POST "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/subscription_plans" \
    -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
    -H "Content-Type: application/json" \
    -H "Prefer: return=minimal" \
    -d "{
      \"name\": \"$name\",
      \"type\": \"$type\",
      \"description\": \"$description\",
      \"price\": $price,
      \"currency\": \"usd\",
      \"interval\": \"$interval\",
      \"stripe_price_id\": \"$stripe_price_id\",
      \"features\": $features,
      \"is_active\": true
    }" > /dev/null
    
    echo "✅ Created $name $interval plan"
}

# Delete existing plans first
echo "🗑️  Clearing existing plans..."
curl -X DELETE "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/subscription_plans?select=*" \
-H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
-H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" > /dev/null

# Create Starter Plans
create_plan "Starter" "starter_monthly" "Perfect for individuals getting started" 9.99 "month" \
    "${NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID:-price_starter_monthly}" \
    '["10 image uploads per month", "Basic license options", "Standard support", "1 GB storage"]'

create_plan "Starter" "starter_yearly" "Perfect for individuals getting started" 99.99 "year" \
    "${NEXT_PUBLIC_STRIPE_STARTER_YEARLY_PRICE_ID:-price_starter_yearly}" \
    '["10 image uploads per month", "Basic license options", "Standard support", "1 GB storage", "Save 17% with annual billing"]'

# Create Pro Plans
create_plan "Pro" "pro_monthly" "For professionals and growing businesses" 19.99 "month" \
    "${NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID:-price_pro_monthly}" \
    '["50 image uploads per month", "All license options", "Priority support", "10 GB storage", "Advanced analytics", "API access"]'

create_plan "Pro" "pro_yearly" "For professionals and growing businesses" 199.99 "year" \
    "${NEXT_PUBLIC_STRIPE_PRO_YEARLY_PRICE_ID:-price_pro_yearly}" \
    '["50 image uploads per month", "All license options", "Priority support", "10 GB storage", "Advanced analytics", "API access", "Save 17% with annual billing"]'

# Create Enterprise Plans
create_plan "Enterprise" "enterprise_monthly" "For large teams and enterprises" 49.99 "month" \
    "${NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID:-price_enterprise_monthly}" \
    '["Unlimited image uploads", "All license options", "24/7 priority support", "100 GB storage", "Advanced analytics", "API access", "Custom integrations", "Dedicated account manager"]'

create_plan "Enterprise" "enterprise_yearly" "For large teams and enterprises" 499.99 "year" \
    "${NEXT_PUBLIC_STRIPE_ENTERPRISE_YEARLY_PRICE_ID:-price_enterprise_yearly}" \
    '["Unlimited image uploads", "All license options", "24/7 priority support", "100 GB storage", "Advanced analytics", "API access", "Custom integrations", "Dedicated account manager", "Save 17% with annual billing"]'

echo ""
echo "🎉 Subscription plans seeded successfully!"
echo ""
echo "📋 Summary:"
echo "  ✅ Starter Monthly ($9.99/month)"
echo "  ✅ Starter Yearly ($99.99/year)"
echo "  ✅ Pro Monthly ($19.99/month)"
echo "  ✅ Pro Yearly ($199.99/year)"
echo "  ✅ Enterprise Monthly ($49.99/month)"
echo "  ✅ Enterprise Yearly ($499.99/year)"
echo ""
echo "🔗 Next steps:"
echo "  1. Create corresponding products and prices in your Stripe Dashboard"
echo "  2. Update the price IDs in your .env.local file"
echo "  3. Set up webhook endpoints in Stripe Dashboard"
echo "  4. Test the subscription flow"
