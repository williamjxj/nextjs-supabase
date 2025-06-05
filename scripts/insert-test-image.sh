#!/bin/bash

# Insert Test Image Script
# This script loads environment variables and inserts a test record into the images table.

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

echo "🎯 Inserting test record into Supabase images table..."
echo "Database URL: $DB_URL"
echo ""

# Check if psql is available
if ! command -v psql &> /dev/null; then
    echo "❌ psql is not installed. Please install PostgreSQL client tools."
    exit 1
fi

# SQL query to insert the test record
SQL_QUERY="INSERT INTO images (filename, original_name, storage_path, storage_url, file_size, mime_type) VALUES ('test-image-123', 'test-image-123', '/dev/null', 'http://localhost/dev/null', 0, 'image/jpeg');"

# Run the SQL query
psql "$DB_URL" -c "$SQL_QUERY" || echo "❌ Failed to insert test record"

echo ""
echo "✅ Test record insertion attempt completed."
echo "Run ./scripts/query-tables.sh to verify."
