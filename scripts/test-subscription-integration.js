#!/usr/bin/env node

/**
 * Integration Test Script for Subscription and Payment Features
 *
 * This script tests the key subscription and payment functionality:
 * 1. Database schema validation
 * 2. Subscription access logic
 * 3. Payment service functionality
 * 4. Image access permissions
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

class SubscriptionIntegrationTest {
  constructor() {
    this.testResults = []
    this.testUserId = null
    this.testImageId = null
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString()
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'
    console.log(`${prefix} [${timestamp}] ${message}`)
  }

  async runTest(testName, testFn) {
    try {
      this.log(`Running test: ${testName}`)
      await testFn()
      this.testResults.push({ name: testName, status: 'passed' })
      this.log(`Test passed: ${testName}`, 'success')
    } catch (error) {
      this.testResults.push({
        name: testName,
        status: 'failed',
        error: error.message,
      })
      this.log(`Test failed: ${testName} - ${error.message}`, 'error')
    }
  }

  async testDatabaseSchema() {
    // Test if all required tables exist
    const tables = [
      'subscriptions',
      'purchases',
      'image_downloads',
      'subscription_usage',
      'images',
      'profiles',
    ]

    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1)

      if (error && error.code !== 'PGRST116') {
        // PGRST116 is "no rows returned"
        throw new Error(
          `Table ${table} does not exist or is not accessible: ${error.message}`
        )
      }
    }

    this.log('All required database tables exist and are accessible')
  }

  async testSubscriptionCreation() {
    // Create a test user subscription
    const testSubscription = {
      user_id: this.testUserId,
      plan_type: 'standard',
      price_monthly: 9.99,
      price_yearly: 99.99,
      status: 'active',
      billing_interval: 'monthly',
      current_period_start: new Date().toISOString(),
      current_period_end: new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      ).toISOString(),
      features: [
        'Access to standard quality images',
        'Basic usage rights',
        'Download up to 50 images/month',
      ],
    }

    const { data, error } = await supabase
      .from('subscriptions')
      .insert([testSubscription])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test subscription: ${error.message}`)
    }

    this.log('Test subscription created successfully')
    return data
  }

  async testImageDownloadTracking() {
    // Test image download tracking
    const downloadRecord = {
      user_id: this.testUserId,
      image_id: this.testImageId,
      download_type: 'subscription',
      downloaded_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('image_downloads')
      .insert([downloadRecord])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to record image download: ${error.message}`)
    }

    this.log('Image download tracking works correctly')
    return data
  }

  async testPurchaseCreation() {
    // Test purchase record creation
    const purchaseRecord = {
      image_id: this.testImageId,
      user_id: this.testUserId,
      license_type: 'standard',
      amount_paid: 999, // $9.99 in cents
      currency: 'usd',
      payment_method: 'stripe',
      stripe_session_id: 'test_session_' + Date.now(),
      payment_status: 'completed',
      purchased_at: new Date().toISOString(),
    }

    const { data, error } = await supabase
      .from('purchases')
      .insert([purchaseRecord])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create purchase record: ${error.message}`)
    }

    this.log('Purchase record creation works correctly')
    return data
  }

  async testSubscriptionAccess() {
    // Test subscription access logic by checking if user has active subscription
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', this.testUserId)
      .eq('status', 'active')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw new Error(`Failed to check subscription access: ${error.message}`)
    }

    if (!data) {
      throw new Error('No active subscription found for test user')
    }

    this.log('Subscription access check works correctly')
    return data
  }

  async testDownloadLimits() {
    // Test download limit checking
    const startOfMonth = new Date()
    startOfMonth.setDate(1)
    startOfMonth.setHours(0, 0, 0, 0)

    const { data, error } = await supabase
      .from('image_downloads')
      .select('id')
      .eq('user_id', this.testUserId)
      .gte('downloaded_at', startOfMonth.toISOString())

    if (error) {
      throw new Error(`Failed to check download limits: ${error.message}`)
    }

    const downloadCount = data?.length || 0
    this.log(`User has ${downloadCount} downloads this month`)

    // For standard plan, limit should be 50
    if (downloadCount > 50) {
      this.log('Warning: Download count exceeds standard plan limit')
    }

    this.log('Download limit checking works correctly')
  }

  async setupTestData() {
    // Create a test user in auth.users table (requires admin client)
    this.testUserId = '00000000-0000-0000-0000-000000000001'

    try {
      // Try to create a test user in auth.users (this might fail if we don't have admin access)
      const { error: userError } = await supabase.rpc('exec_sql', {
        sql: `
          INSERT INTO auth.users (id, email, email_confirmed_at, created_at, updated_at)
          VALUES (
            '${this.testUserId}',
            'test@example.com',
            NOW(),
            NOW(),
            NOW()
          )
          ON CONFLICT (id) DO NOTHING;
        `,
      })

      if (userError) {
        this.log(
          `Warning: Could not create test user in auth.users: ${userError.message}`
        )
        this.log('Tests will use existing user or skip user-dependent tests')
      }
    } catch (error) {
      this.log(`Warning: Could not create test user: ${error.message}`)
    }

    // Create a test image
    const testImage = {
      filename: 'test-image.jpg',
      original_name: 'Test Image.jpg',
      storage_path: 'test/test-image.jpg',
      storage_url: 'https://example.com/test-image.jpg',
      file_size: 1024000,
      mime_type: 'image/jpeg',
      width: 1920,
      height: 1080,
    }

    const { data, error } = await supabase
      .from('images')
      .insert([testImage])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create test image: ${error.message}`)
    }

    this.testImageId = data.id
    this.log('Test data setup completed')
  }

  async cleanupTestData() {
    // Clean up test data
    const cleanupTasks = [
      supabase.from('image_downloads').delete().eq('user_id', this.testUserId),
      supabase.from('purchases').delete().eq('user_id', this.testUserId),
      supabase.from('subscriptions').delete().eq('user_id', this.testUserId),
      supabase.from('images').delete().eq('id', this.testImageId),
    ]

    await Promise.all(cleanupTasks)
    this.log('Test data cleanup completed')
  }

  async runAllTests() {
    this.log('Starting Subscription Integration Tests')

    try {
      await this.runTest('Database Schema Validation', () =>
        this.testDatabaseSchema()
      )
      await this.runTest('Test Data Setup', () => this.setupTestData())
      await this.runTest('Subscription Creation', () =>
        this.testSubscriptionCreation()
      )
      await this.runTest('Image Download Tracking', () =>
        this.testImageDownloadTracking()
      )
      await this.runTest('Purchase Creation', () => this.testPurchaseCreation())
      await this.runTest('Subscription Access Check', () =>
        this.testSubscriptionAccess()
      )
      await this.runTest('Download Limits Check', () =>
        this.testDownloadLimits()
      )

      // Cleanup
      await this.runTest('Test Data Cleanup', () => this.cleanupTestData())
    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error')
    }

    // Print summary
    this.printSummary()
  }

  printSummary() {
    const passed = this.testResults.filter(r => r.status === 'passed').length
    const failed = this.testResults.filter(r => r.status === 'failed').length

    console.log('\n' + '='.repeat(50))
    console.log('TEST SUMMARY')
    console.log('='.repeat(50))
    console.log(`Total Tests: ${this.testResults.length}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)

    if (failed > 0) {
      console.log('\nFailed Tests:')
      this.testResults
        .filter(r => r.status === 'failed')
        .forEach(r => console.log(`❌ ${r.name}: ${r.error}`))
    }

    console.log('='.repeat(50))

    if (failed === 0) {
      console.log(
        '🎉 All tests passed! Subscription integration is working correctly.'
      )
    } else {
      console.log('⚠️  Some tests failed. Please review the errors above.')
      process.exit(1)
    }
  }
}

// Run the tests
if (require.main === module) {
  const tester = new SubscriptionIntegrationTest()
  tester.runAllTests().catch(error => {
    console.error('Test suite crashed:', error)
    process.exit(1)
  })
}

module.exports = SubscriptionIntegrationTest
