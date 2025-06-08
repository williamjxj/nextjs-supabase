#!/bin/bash

# Load environment variables from .env.local if it exists
if [ -f "../.env.local" ]; then
    export $(cat ../.env.local | grep -v '#' | sed 's/\r$//' | awk '/=/ {print $1}')
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
    -d "{
        \"name\": \"$name\",
        \"type\": \"$type\",
        \"description\": \"$description\",
        \"price\": $price,
        \"interval\": \"$interval\",
        \"stripe_price_id\": \"$stripe_price_id\",
        \"features\": $features
    }" > /dev/null
    
    echo "✅ Created $name $interval plan"
}

# Create the missing monthly plans
create_plan "Starter" "starter_monthly" "Perfect for individuals getting started" 9.99 "month" \
    "${NEXT_PUBLIC_STRIPE_STARTER_MONTHLY_PRICE_ID:-price_starter_monthly}" \
    '["10 image uploads per month", "Basic license options", "Standard support", "1 GB storage"]'

create_plan "Pro" "pro_monthly" "For professionals and growing businesses" 19.99 "month" \
    "${NEXT_PUBLIC_STRIPE_PRO_MONTHLY_PRICE_ID:-price_pro_monthly}" \
    '["50 image uploads per month", "All license options", "Priority support", "10 GB storage", "Advanced analytics", "API access"]'

create_plan "Enterprise" "enterprise_monthly" "For large teams and enterprises" 49.99 "month" \
    "${NEXT_PUBLIC_STRIPE_ENTERPRISE_MONTHLY_PRICE_ID:-price_enterprise_monthly}" \
    '["Unlimited image uploads", "All license options", "24/7 priority support", "100 GB storage", "Advanced analytics", "API access", "Custom integrations", "Dedicated account manager"]'

echo "✅ Added missing monthly plans!"
