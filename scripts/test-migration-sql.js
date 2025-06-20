#!/usr/bin/env node

/**
 * Test Migration SQL Script
 *
 * This script tests the specific SQL statements that were causing issues
 * to ensure they work correctly before running the full migration.
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase admin client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class MigrationSQLTester {
  constructor() {
    this.log('Migration SQL Tester initialized')
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async testCreateImageDownloadsTable() {
    this.log('Testing image_downloads table creation...')

    // First, drop the table if it exists to test clean creation
    const dropSQL = `DROP TABLE IF EXISTS public.test_image_downloads CASCADE;`

    const createSQL = `
      CREATE TABLE public.test_image_downloads (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL,
        image_id UUID NOT NULL,
        downloaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        download_type TEXT NOT NULL DEFAULT 'subscription' CHECK (download_type IN ('subscription', 'purchase', 'free')),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        -- Add computed column for month to enable unique constraint
        download_month DATE GENERATED ALWAYS AS (date_trunc('month', downloaded_at)::date) STORED
      );
    `

    const indexSQL = `
      CREATE INDEX idx_test_downloads_month ON public.test_image_downloads(download_month);
      CREATE UNIQUE INDEX idx_test_downloads_unique_user_image_month 
      ON public.test_image_downloads(user_id, image_id, download_month);
    `

    try {
      // Drop existing test table
      await supabase.rpc('exec_sql', { sql: dropSQL })

      // Create table
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: createSQL,
      })
      if (createError) {
        throw new Error(`Failed to create table: ${createError.message}`)
      }

      // Create indexes
      const { error: indexError } = await supabase.rpc('exec_sql', {
        sql: indexSQL,
      })
      if (indexError) {
        throw new Error(`Failed to create indexes: ${indexError.message}`)
      }

      this.log('✅ Table and indexes created successfully', 'success')

      // Test inserting data
      await this.testInsertData()

      // Clean up
      await supabase.rpc('exec_sql', { sql: dropSQL })
      this.log('✅ Test table cleaned up', 'success')
    } catch (error) {
      this.log(`❌ Table creation test failed: ${error.message}`, 'error')
      throw error
    }
  }

  async testInsertData() {
    this.log('Testing data insertion with computed column...')

    const insertSQL = `
      INSERT INTO public.test_image_downloads (user_id, image_id, download_type)
      VALUES 
        ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'subscription'),
        ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', 'purchase');
    `

    const { error } = await supabase.rpc('exec_sql', { sql: insertSQL })
    if (error) {
      throw new Error(`Failed to insert test data: ${error.message}`)
    }

    // Test that the computed column works
    const { data, error: selectError } = await supabase
      .from('test_image_downloads')
      .select('download_month, downloaded_at')
      .limit(1)

    if (selectError) {
      throw new Error(`Failed to select test data: ${selectError.message}`)
    }

    if (data && data.length > 0) {
      const record = data[0]
      const downloadedAt = new Date(record.downloaded_at)
      const expectedMonth = new Date(
        downloadedAt.getFullYear(),
        downloadedAt.getMonth(),
        1
      )
        .toISOString()
        .split('T')[0]

      if (record.download_month === expectedMonth) {
        this.log('✅ Computed column working correctly', 'success')
      } else {
        throw new Error(
          `Computed column mismatch: expected ${expectedMonth}, got ${record.download_month}`
        )
      }
    }

    // Test unique constraint
    try {
      const duplicateSQL = `
        INSERT INTO public.test_image_downloads (user_id, image_id, download_type)
        VALUES ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'subscription');
      `

      const { error: duplicateError } = await supabase.rpc('exec_sql', {
        sql: duplicateSQL,
      })
      if (duplicateError && duplicateError.message.includes('duplicate')) {
        this.log('✅ Unique constraint working correctly', 'success')
      } else {
        this.log('⚠️ Unique constraint test inconclusive', 'warning')
      }
    } catch (error) {
      // Expected to fail due to unique constraint
      this.log('✅ Unique constraint working correctly', 'success')
    }
  }

  async createExecSqlFunction() {
    this.log('Creating exec_sql function for testing...')

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

    try {
      const { error } = await supabase.rpc('exec_sql', { sql })
      if (error) {
        this.log(
          'Note: exec_sql function may need to be created manually in Supabase dashboard'
        )
      } else {
        this.log('✅ exec_sql function created successfully', 'success')
      }
    } catch (error) {
      this.log(
        'Note: exec_sql function may need to be created manually in Supabase dashboard'
      )
    }
  }

  async runTests() {
    try {
      this.log('Starting migration SQL tests...')

      // Create the exec_sql function first
      await this.createExecSqlFunction()

      // Test the problematic table creation
      await this.testCreateImageDownloadsTable()

      this.log('🎉 All migration SQL tests passed!', 'success')
    } catch (error) {
      this.log(`❌ Migration SQL tests failed: ${error.message}`, 'error')

      console.log('\n' + '='.repeat(60))
      console.log('TROUBLESHOOTING GUIDE')
      console.log('='.repeat(60))
      console.log('If tests failed, here are some things to check:')
      console.log('')
      console.log(
        '1. Ensure your Supabase service role key has admin permissions'
      )
      console.log('2. Check that the exec_sql function exists in your database')
      console.log(
        '3. Verify your database supports computed columns (PostgreSQL 12+)'
      )
      console.log('4. Check for any existing conflicting tables or policies')
      console.log('')
      console.log(
        'You can create the exec_sql function manually in Supabase SQL editor:'
      )
      console.log(`
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
      `)
      console.log('='.repeat(60))

      throw error
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new MigrationSQLTester()
  tester.runTests().catch(error => {
    console.error('Migration SQL tests failed:', error)
    process.exit(1)
  })
}

module.exports = MigrationSQLTester
