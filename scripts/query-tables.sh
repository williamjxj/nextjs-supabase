#!/bin/bash

# Query Supabase Tables Script
# This script loads environment variables and queries all tables in the Supabase database

set -e

# Load environment variables from .env.local
load_env() {
    if [ -f ../.env.local ]; then
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ $line =~ ^[[:space:]]*# ]] && continue
            [[ -z $line ]] && continue
            # Export the variable
            export "$line"
        done < ../.env.local
    else
        echo "Error: .env.local file not found!"
        exit 1
    fi
}

load_env

echo "🔍 Querying Supabase Tables..."
echo "Database URL: $DATABASE_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# Function to run SQL queries
run_query() {
    local query="$1"
    local description="$2"
    
    echo "📊 $description"
    echo "----------------------------------------"
    psql "$DATABASE_URL" -c "$query" || echo "❌ Failed to execute query"
    echo ""
}

# List all tables
run_query "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" "Available Tables"

# Query images table
run_query "SELECT id, filename, original_name, storage_path, created_at FROM images ORDER BY created_at DESC LIMIT 10;" "Recent Images (Last 10)"

# Query purchases table
run_query "SELECT id, user_id, image_id, amount_paid, payment_method, payment_status, paypal_payment_id, stripe_session_id, created_at FROM purchases ORDER BY created_at DESC LIMIT 10;" "Recent Purchases (Last 10)"

# Get table counts
run_query "SELECT 'images' as table_name, COUNT(*) as count FROM images UNION ALL SELECT 'purchases' as table_name, COUNT(*) as count FROM purchases;" "Table Counts"

# Get user statistics (if auth.users is accessible)
run_query "SELECT COUNT(*) as total_users FROM auth.users;" "Total Users" || echo "ℹ️  Could not access auth.users table"

echo "✅ Query completed successfully!"
