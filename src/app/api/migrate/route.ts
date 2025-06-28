import { createServiceRoleClient } from '@/lib/supabase/server'
import { SUBSCRIPTION_PLANS } from '@/lib/subscription-config'
import { NextResponse } from 'next/server'

// This API route will create subscription tables and seed the plans
export async function POST() {
  try {
    const supabase = createServiceRoleClient()

    // Starting migration

    // Helper function to get features for each plan type
    function getFeatures(type: string): string[] {
      const featuresMap: Record<string, string[]> = {
        standard: [
          'Access to standard quality images',
          'Basic usage rights',
          'Download up to 50 images/month',
          'Email support',
        ],
        premium: [
          'Access to premium quality images',
          'Extended usage rights',
          'Download up to 200 images/month',
          'Priority email support',
          'Advanced filters and search',
        ],
        commercial: [
          'Access to all images',
          'Full commercial usage rights',
          'Unlimited downloads',
          'Priority phone support',
          'Early access to new features',
          'Custom licensing options',
        ],
      }
      return featuresMap[type] || []
    }

    // First, try to seed the subscription plans directly
    // If the table doesn't exist, we'll get an error and create it manually
    const plans = Object.entries(SUBSCRIPTION_PLANS).map(([type, config]) => ({
      type,
      name: config.name,
      description: config.description,
      price: config.priceMonthly, // Use monthly price
      currency: 'usd',
      interval: 'month',
      stripe_price_id: null, // We handle Stripe IDs separately
      is_active: true,
      features: config.features,
    }))

    // Attempting to seed plans

    // Try to insert plans - this will fail if table doesn't exist
    const { data, error: seedError } = await supabase
      .from('subscription_plans')
      .upsert(plans, {
        onConflict: 'type',
        ignoreDuplicates: false,
      })

    if (seedError) {
      console.error(
        'Error seeding subscription plans (table might not exist):',
        seedError
      )

      // If it's a "relation does not exist" error, we need to create the tables manually
      if (seedError.code === '42P01') {
        return NextResponse.json(
          {
            error: 'subscription_plans table does not exist',
            message:
              'Please run the database migration first. You can either run `supabase db push` if you have the CLI set up, or manually create the tables in your Supabase dashboard.',
            sqlToRun: `
-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL UNIQUE,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month',
  stripe_price_id TEXT UNIQUE,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON public.subscription_plans(type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY "Anyone can view active subscription plans" 
  ON public.subscription_plans FOR SELECT 
  USING (is_active = TRUE);
          `,
            plans: plans,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to seed subscription plans', details: seedError },
        { status: 500 }
      )
    }

    // Plans seeded successfully

    return NextResponse.json({
      success: true,
      message: 'Subscription plans seeded successfully',
      plansSeeded: plans.length,
      data: data,
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
