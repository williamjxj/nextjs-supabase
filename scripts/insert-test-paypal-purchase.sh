#!/bin/bash

# Insert Test PayPal Purchase Script
# This script loads environment variables and inserts a test PayPal purchase record.

set -e

# Load environment variables from .env.local
load_env() {
    if [ -f .env.local ]; then
        while IFS= read -r line; do
            # Skip comments and empty lines
            [[ $line =~ ^[[:space:]]*# ]] && continue
            [[ -z $line ]] && continue
            # Export the variable
            export "$line"
        done < .env.local
    else
        echo "Error: .env.local file not found!"
        exit 1
    fi
}

load_env

echo "🎯 Inserting test PayPal purchase record..."
echo "Database URL: $DB_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# First, get the image ID for our test image
IMAGE_ID_QUERY="SELECT id FROM images WHERE filename like 'test-image-123%' LIMIT 1;"
IMAGE_ID=$(psql "$DB_URL" -t -c "$IMAGE_ID_QUERY" | xargs)

if [ -z "$IMAGE_ID" ]; then
    echo "❌ Test image not found. Please run ./scripts/insert-test-image.sh first."
    exit 1
fi

echo "📷 Found test image with ID: $IMAGE_ID"

# SQL query to insert the test PayPal purchase record
SQL_QUERY="INSERT INTO purchases (image_id, license_type, amount_paid, currency, paypal_payment_id, payment_method, payment_status) VALUES ('$IMAGE_ID', 'standard', 1000, 'usd', '6BA52688CL321614B', 'paypal', 'completed');"

# Run the SQL query
psql "$DB_URL" -c "$SQL_QUERY" || echo "❌ Failed to insert test PayPal purchase record"

echo ""
echo "✅ Test PayPal purchase record insertion completed."
echo "PayPal Payment ID: 6BA52688CL321614B"
echo "Run ./scripts/query-tables.sh to verify."
