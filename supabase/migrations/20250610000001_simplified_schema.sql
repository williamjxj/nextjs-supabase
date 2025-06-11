-- Simplified schema migration based on docs/project.md requirements
-- This migration simplifies the database by removing complex Vercel tables
-- and using auth.users as the single source of truth

-- Drop complex Vercel tables we don't need
DROP TABLE IF EXISTS public.subscription_invoices CASCADE;
DROP TABLE IF EXISTS public.image_downloads CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.prices CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Recreate simplified subscriptions table
DROP TABLE IF EXISTS public.subscriptions CASCADE;
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('standard', 'premium', 'commercial')),
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired')),
  billing_interval TEXT NOT NULL DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'yearly')),
  stripe_subscription_id TEXT UNIQUE,
  current_period_start TIMESTAMPTZ DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure images table references auth.users correctly
-- (This should already exist but we'll make sure)
ALTER TABLE public.images 
  DROP CONSTRAINT IF EXISTS images_user_id_fkey,
  ADD CONSTRAINT images_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure purchases table references auth.users correctly
ALTER TABLE public.purchases 
  DROP CONSTRAINT IF EXISTS purchases_user_id_fkey,
  ADD CONSTRAINT purchases_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add subscription features tracking (simplified)
ALTER TABLE public.subscriptions 
  ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Update subscriptions with predefined features
UPDATE public.subscriptions 
SET features = CASE 
  WHEN plan_type = 'standard' THEN 
    '["Access to standard quality images", "Basic usage rights", "Download up to 50 images/month", "Email support"]'::jsonb
  WHEN plan_type = 'premium' THEN 
    '["Access to premium quality images", "Extended usage rights", "Download up to 200 images/month", "Priority email support", "Advanced filters and search"]'::jsonb
  WHEN plan_type = 'commercial' THEN 
    '["Access to all images", "Full commercial usage rights", "Unlimited downloads", "Priority phone support", "Early access to new features", "Custom licensing options"]'::jsonb
  ELSE '[]'::jsonb
END;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
  ON public.subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for subscriptions
CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE public.subscriptions IS 'User subscription table - contains only actual user subscriptions';
COMMENT ON COLUMN public.subscriptions.user_id IS 'References auth.users.id - must be a real user';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: standard, premium, or commercial';
COMMENT ON COLUMN public.subscriptions.features IS 'JSON array of features included in this subscription';
