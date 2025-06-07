#!/bin/bash

# Seed Subscription Plans Script
# This script seeds the subscription plans in the Supabase database

set -e

echo "🌱 Seeding subscription plans..."

# Check if the server is running
if ! curl -s http://localhost:3000 > /dev/null; then
    echo "❌ Next.js server is not running. Please start it with 'npm run dev' first."
    exit 1
fi

# Run the migration
echo "📤 Calling migration API..."
response=$(curl -s -X POST http://localhost:3000/api/migrate)

# Check if the response contains success
if echo "$response" | grep -q '"success":true'; then
    echo "✅ Subscription plans seeded successfully!"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
else
    echo "❌ Failed to seed subscription plans:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    exit 1
fi
