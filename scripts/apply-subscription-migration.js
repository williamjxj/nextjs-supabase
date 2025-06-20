#!/usr/bin/env node

/**
 * Apply Subscription Migration Script
 *
 * This script applies the new subscription-related database changes:
 * 1. Creates image_downloads table
 * 2. Creates subscription_usage table
 * 3. Adds necessary indexes
 * 4. Sets up RLS policies
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class MigrationRunner {
  constructor() {
    this.log('Subscription Migration Runner initialized')
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async checkTableExists(tableName) {
    try {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .limit(1)

      if (error) {
        // Check specific error codes that indicate table doesn't exist
        if (
          error.code === 'PGRST106' ||
          error.message.includes('does not exist') ||
          (error.message.includes('relation') &&
            error.message.includes('does not exist'))
        ) {
          return false
        }
        // For other errors, log them but assume table exists
        this.log(`Warning: Error checking table ${tableName}: ${error.message}`)
        return false // Be conservative and try to create it
      }

      return true
    } catch (error) {
      this.log(`Error checking table ${tableName}: ${error.message}`)
      return false
    }
  }

  async createImageDownloadsTable() {
    this.log('Creating image_downloads table...')

    const sql = `
      -- Create image downloads tracking table for subscription limits
      CREATE TABLE IF NOT EXISTS public.image_downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
        downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        download_type TEXT NOT NULL DEFAULT 'subscription' CHECK (download_type IN ('subscription', 'purchase', 'free')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        -- Add separate columns for year and month to enable unique constraint
        download_year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW()),
        download_month INTEGER NOT NULL DEFAULT EXTRACT(MONTH FROM NOW())
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_image_downloads_user_id ON public.image_downloads(user_id);
      CREATE INDEX IF NOT EXISTS idx_image_downloads_image_id ON public.image_downloads(image_id);
      CREATE INDEX IF NOT EXISTS idx_image_downloads_date ON public.image_downloads(downloaded_at);
      CREATE INDEX IF NOT EXISTS idx_image_downloads_month ON public.image_downloads(download_year, download_month);

      -- Create unique constraint to prevent duplicate downloads in same month using year/month columns
      CREATE UNIQUE INDEX IF NOT EXISTS idx_image_downloads_unique_user_image_month
      ON public.image_downloads(user_id, image_id, download_year, download_month);

      -- Create trigger function to automatically set year/month from downloaded_at
      CREATE OR REPLACE FUNCTION set_download_year_month()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.download_year := EXTRACT(YEAR FROM NEW.downloaded_at);
        NEW.download_month := EXTRACT(MONTH FROM NEW.downloaded_at);
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      -- Create trigger to automatically populate year/month columns
      DROP TRIGGER IF EXISTS trigger_set_download_year_month ON public.image_downloads;
      CREATE TRIGGER trigger_set_download_year_month
        BEFORE INSERT OR UPDATE ON public.image_downloads
        FOR EACH ROW EXECUTE FUNCTION set_download_year_month();

      -- Enable RLS
      ALTER TABLE public.image_downloads ENABLE ROW LEVEL SECURITY;

      -- RLS Policies for image_downloads
      DROP POLICY IF EXISTS "Users can view their own downloads" ON public.image_downloads;
      CREATE POLICY "Users can view their own downloads" ON public.image_downloads
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.image_downloads;
      CREATE POLICY "Users can insert their own downloads" ON public.image_downloads
        FOR INSERT WITH CHECK (auth.uid() = user_id);
    `

    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      throw new Error(
        `Failed to create image_downloads table: ${error.message}`
      )
    }

    this.log('image_downloads table created successfully', 'success')
  }

  async createSubscriptionUsageTable() {
    this.log('Creating subscription_usage table...')

    const sql = `
      -- Create subscription usage tracking table
      CREATE TABLE IF NOT EXISTS public.subscription_usage (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
        usage_period_start TIMESTAMPTZ NOT NULL,
        usage_period_end TIMESTAMPTZ NOT NULL,
        downloads_used INTEGER NOT NULL DEFAULT 0,
        downloads_limit INTEGER NOT NULL DEFAULT 0,
        views_used INTEGER NOT NULL DEFAULT 0,
        views_limit INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        
        -- Ensure unique constraint per user per period
        UNIQUE(user_id, subscription_id, usage_period_start)
      );

      -- Create indexes for performance
      CREATE INDEX IF NOT EXISTS idx_subscription_usage_user_id ON public.subscription_usage(user_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_usage_subscription_id ON public.subscription_usage(subscription_id);
      CREATE INDEX IF NOT EXISTS idx_subscription_usage_period ON public.subscription_usage(usage_period_start, usage_period_end);

      -- Enable RLS
      ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;

      -- RLS Policies for subscription_usage
      DROP POLICY IF EXISTS "Users can view their own usage" ON public.subscription_usage;
      CREATE POLICY "Users can view their own usage" ON public.subscription_usage
        FOR SELECT USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "Users can update their own usage" ON public.subscription_usage;
      CREATE POLICY "Users can update their own usage" ON public.subscription_usage
        FOR UPDATE USING (auth.uid() = user_id);

      DROP POLICY IF EXISTS "System can insert usage records" ON public.subscription_usage;
      CREATE POLICY "System can insert usage records" ON public.subscription_usage
        FOR INSERT WITH CHECK (true);
    `

    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      throw new Error(
        `Failed to create subscription_usage table: ${error.message}`
      )
    }

    this.log('subscription_usage table created successfully', 'success')
  }

  async addPerformanceIndexes() {
    this.log('Adding performance indexes...')

    const sql = `
      -- Additional indexes for better query performance
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
      CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);
      CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, payment_status);
      CREATE INDEX IF NOT EXISTS idx_purchases_image_user ON public.purchases(image_id, user_id);
    `

    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      throw new Error(`Failed to add performance indexes: ${error.message}`)
    }

    this.log('Performance indexes added successfully', 'success')
  }

  async createExecSqlFunction() {
    this.log('Creating exec_sql function for migrations...')

    const sql = `
      CREATE OR REPLACE FUNCTION exec_sql(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `

    const { error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      // If we can't create the function, we'll need to run SQL manually
      this.log(
        'Note: exec_sql function may need to be created manually in Supabase dashboard'
      )
    } else {
      this.log('exec_sql function created successfully', 'success')
    }
  }

  async runMigration() {
    try {
      this.log('Starting subscription migration...')

      // Check if tables already exist
      const imageDownloadsExists =
        await this.checkTableExists('image_downloads')
      const subscriptionUsageExists =
        await this.checkTableExists('subscription_usage')

      if (imageDownloadsExists && subscriptionUsageExists) {
        this.log(
          'Migration tables already exist. Skipping creation.',
          'success'
        )
        return
      }

      // Create the exec_sql function first
      await this.createExecSqlFunction()

      // Create tables
      if (!imageDownloadsExists) {
        await this.createImageDownloadsTable()
      } else {
        this.log('image_downloads table already exists, skipping...')
      }

      if (!subscriptionUsageExists) {
        await this.createSubscriptionUsageTable()
      } else {
        this.log('subscription_usage table already exists, skipping...')
      }

      // Add performance indexes
      await this.addPerformanceIndexes()

      this.log('Migration completed successfully!', 'success')
    } catch (error) {
      this.log(`Migration failed: ${error.message}`, 'error')

      // Provide manual SQL instructions
      console.log('\n' + '='.repeat(60))
      console.log('MANUAL MIGRATION INSTRUCTIONS')
      console.log('='.repeat(60))
      console.log(
        'If the automatic migration failed, please run the following SQL'
      )
      console.log('manually in your Supabase SQL editor:')
      console.log('')

      const migrationPath = path.join(
        __dirname,
        '..',
        'supabase',
        'migrations',
        'init_gallery_schema.sql'
      )
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
        // Extract just the new tables section
        const newTablesStart = migrationSQL.indexOf(
          '-- 7. IMAGE DOWNLOADS TRACKING TABLE'
        )
        if (newTablesStart !== -1) {
          const relevantSQL = migrationSQL.substring(newTablesStart)
          console.log(relevantSQL)
        }
      }

      console.log('='.repeat(60))

      throw error
    }
  }
}

// Run the migration
if (require.main === module) {
  const runner = new MigrationRunner()
  runner.runMigration().catch(error => {
    console.error('Migration failed:', error)
    process.exit(1)
  })
}

module.exports = MigrationRunner
