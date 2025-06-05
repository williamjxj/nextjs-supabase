#!/bin/bash

# Get Supabase Storage Script
# This script retrieves information about Supabase storage buckets and objects

set -e

# Load environment variables from .env.local
if [ -f .env.local ]; then
    set -a  # automatically export all variables
    source <(grep -v '^#' .env.local | grep -v '^$')
    set +a  # stop automatically exporting
else
    echo "Error: .env.local file not found!"
    exit 1
fi

echo "📦 Getting Supabase Storage Information..."
echo "Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "S3 Storage URL: $SUPABASE_S3_STORAGE_URL"
echo ""

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl."
    exit 1
fi

# Check if jq is available for JSON formatting
if command -v jq &> /dev/null; then
    JSON_FORMATTER="jq ."
else
    echo "ℹ️  jq not found. Install jq for better JSON formatting."
    JSON_FORMATTER="cat"
fi

# Function to make API calls
api_call() {
    local endpoint="$1"
    local description="$2"
    local method="${3:-GET}"
    
    echo "🔍 $description"
    echo "----------------------------------------"
    
    curl -s \
        -X "$method" \
        -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
        -H "Content-Type: application/json" \
        "$NEXT_PUBLIC_SUPABASE_URL/storage/v1$endpoint" | $JSON_FORMATTER || echo "❌ Failed to call API"
    echo ""
}

# Get all buckets
api_call "/bucket" "Storage Buckets"

# Get objects in images bucket (if it exists)
api_call "/object/list/images" "Objects in 'images' bucket" "POST" -d '{"limit": 20, "offset": 0}'

# Get bucket details for images bucket
api_call "/bucket/images" "Images Bucket Details"

# Database query for storage information
echo "🗄️  Storage Information from Database"
echo "----------------------------------------"

if command -v psql &> /dev/null; then
    # Query storage.objects table
    psql "$DB_URL" -c "
        SELECT 
            name,
            bucket_id,
            ROUND(metadata->>'size'::numeric / 1024 / 1024, 2) as size_mb,
            metadata->>'mimetype' as mime_type,
            created_at
        FROM storage.objects 
        ORDER BY created_at DESC 
        LIMIT 10;
    " || echo "❌ Could not query storage.objects table"
    
    echo ""
    
    # Query storage.buckets table
    psql "$DB_URL" -c "
        SELECT 
            id,
            name,
            public,
            file_size_limit,
            allowed_mime_types,
            created_at
        FROM storage.buckets;
    " || echo "❌ Could not query storage.buckets table"
else
    echo "❌ psql not available for database queries"
fi

echo ""
echo "✅ Storage information retrieval completed!"
