import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'

export async function POST() {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      )
    }

    const supabase = createServiceRoleClient()

    console.log('🔄 Starting payment provider migration...')

    // Check if columns already exist
    const { data: columns, error: columnError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_name', 'subscriptions')
      .eq('table_schema', 'public')
      .in('column_name', ['payment_provider', 'paypal_subscription_id'])

    if (columnError) {
      console.error('Error checking columns:', columnError)
    } else {
      console.log('Existing columns:', columns)
    }

    // Add payment_provider column if it doesn't exist
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'subscriptions' 
              AND column_name = 'payment_provider'
              AND table_schema = 'public'
            ) THEN
              ALTER TABLE public.subscriptions 
              ADD COLUMN payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal', 'crypto'));
            END IF;
          END $$;
        `,
      })
      console.log('✅ Added payment_provider column')
    } catch (error) {
      console.log('⚠️ payment_provider column might already exist:', error)
    }

    // Add paypal_subscription_id column if it doesn't exist
    try {
      await supabase.rpc('exec_sql', {
        sql: `
          DO $$ 
          BEGIN
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name = 'subscriptions' 
              AND column_name = 'paypal_subscription_id'
              AND table_schema = 'public'
            ) THEN
              ALTER TABLE public.subscriptions 
              ADD COLUMN paypal_subscription_id TEXT UNIQUE;
            END IF;
          END $$;
        `,
      })
      console.log('✅ Added paypal_subscription_id column')
    } catch (error) {
      console.log(
        '⚠️ paypal_subscription_id column might already exist:',
        error
      )
    }

    // Update existing records
    try {
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ payment_provider: 'stripe' })
        .not('stripe_subscription_id', 'is', null)
        .is('payment_provider', null)

      if (updateError) {
        console.log('⚠️ Error updating existing records:', updateError)
      } else {
        console.log(
          '✅ Updated existing records with payment_provider = stripe'
        )
      }
    } catch (error) {
      console.log('⚠️ Error updating existing records:', error)
    }

    return NextResponse.json({
      success: true,
      message: 'Payment provider migration completed',
      steps: [
        'Added payment_provider column with check constraint',
        'Added paypal_subscription_id column with unique constraint',
        'Updated existing records to use stripe as payment provider',
      ],
    })
  } catch (error) {
    console.error('Migration error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}
