#!/bin/bash

# Reset/Sync Supabase Tables Script
# This script resets the database and runs migrations to sync with the latest schema

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

echo "🔄 Resetting and Syncing Supabase Tables..."
echo ""

# Check if supabase CLI is available
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Please install it first:"
    echo "   npm install -g supabase"
    exit 1
fi

# Function to confirm action
confirm_action() {
    local action="$1"
    echo "⚠️  WARNING: This will $action"
    read -p "Are you sure you want to continue? (y/N): " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Operation cancelled."
        exit 1
    fi
}

# Show current migration status
echo "📊 Current Migration Status:"
echo "----------------------------------------"
supabase migration list || echo "❌ Could not list migrations"
echo ""

# Reset option
if [ "$1" = "--reset" ] || [ "$1" = "-r" ]; then
    confirm_action "RESET the entire database (all data will be lost)"
    
    echo "🔄 Resetting Supabase database..."
    supabase db reset || {
        echo "❌ Failed to reset database"
        exit 1
    }
    
    echo "✅ Database reset completed!"
    
elif [ "$1" = "--migrate" ] || [ "$1" = "-m" ]; then
    echo "📦 Running pending migrations..."
    supabase migration up || {
        echo "❌ Failed to run migrations"
        exit 1
    }
    
    echo "✅ Migrations completed!"
    
else
    echo "🔧 Supabase Reset/Sync Options:"
    echo ""
    echo "1. Reset Database (⚠️  DESTRUCTIVE - all data will be lost)"
    echo "2. Run Pending Migrations"
    echo "3. Check Migration Status"
    echo "4. Generate New Migration"
    echo "5. Cancel"
    echo ""
    
    read -p "Select an option (1-5): " choice
    
    case $choice in
        1)
            confirm_action "RESET the entire database (all data will be lost)"
            echo "🔄 Resetting Supabase database..."
            supabase db reset
            echo "✅ Database reset completed!"
            ;;
        2)
            echo "📦 Running pending migrations..."
            supabase migration up
            echo "✅ Migrations completed!"
            ;;
        3)
            echo "📊 Migration Status:"
            supabase migration list
            ;;
        4)
            read -p "Enter migration name: " migration_name
            if [ -n "$migration_name" ]; then
                echo "📝 Generating new migration: $migration_name"
                supabase migration new "$migration_name"
                echo "✅ Migration file created!"
            else
                echo "❌ Migration name cannot be empty"
            fi
            ;;
        5)
            echo "❌ Operation cancelled."
            exit 0
            ;;
        *)
            echo "❌ Invalid option selected."
            exit 1
            ;;
    esac
fi

# Show final status
echo ""
echo "📊 Final Migration Status:"
echo "----------------------------------------"
supabase migration list || echo "❌ Could not list migrations"

echo ""
echo "📋 Database Tables:"
echo "----------------------------------------"
if command -v psql &> /dev/null; then
    psql "$DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" || echo "❌ Could not list tables"
else
    echo "❌ psql not available for table listing"
fi

echo ""
echo "✅ Reset/Sync operation completed!"
