-- ===================================================
-- Consolidated Database Schema for NextJS Supabase Gallery
-- This replaces all previous migrations with a single init file
-- ===================================================

-- ===================================================
-- 1. UTILITY FUNCTIONS
-- ===================================================

-- Create or replace the updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ===================================================
-- 2. STORAGE SETUP
-- ===================================================

-- Create storage bucket for images (public access)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for public access (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Public can upload to images bucket" ON storage.objects;
CREATE POLICY "Public can upload to images bucket" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

DROP POLICY IF EXISTS "Public can view images bucket" ON storage.objects;
CREATE POLICY "Public can view images bucket" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public can update images bucket" ON storage.objects;
CREATE POLICY "Public can update images bucket" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

DROP POLICY IF EXISTS "Public can delete from images bucket" ON storage.objects;
CREATE POLICY "Public can delete from images bucket" ON storage.objects
  FOR DELETE USING (bucket_id = 'images');

-- ===================================================
-- 3. PROFILES TABLE
-- ===================================================

-- Create profiles table for user profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  provider TEXT DEFAULT 'email', -- 'email', 'google', 'facebook', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_provider ON public.profiles(provider);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger for profiles updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 4. IMAGES TABLE
-- ===================================================

-- Create images table with public access
CREATE TABLE IF NOT EXISTS public.images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- nullable for public access
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  mime_type TEXT NOT NULL,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for images
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);

-- Enable RLS on images
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create public RLS policies for images (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Public can insert images" ON public.images;
CREATE POLICY "Public can insert images" ON public.images
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can view images" ON public.images;
CREATE POLICY "Public can view images" ON public.images
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public can update images" ON public.images;
CREATE POLICY "Public can update images" ON public.images
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public can delete images" ON public.images;
CREATE POLICY "Public can delete images" ON public.images
  FOR DELETE USING (true);

-- Create trigger for images updated_at
DROP TRIGGER IF EXISTS update_images_updated_at ON public.images;
CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 5. PURCHASES TABLE
-- ===================================================

-- Create purchases table with support for both Stripe and PayPal
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL DEFAULT 'standard',
  amount_paid INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  payment_method TEXT NOT NULL DEFAULT 'stripe', -- 'stripe' or 'paypal'
  stripe_session_id TEXT,
  paypal_payment_id TEXT,
  paypal_order_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Ensure either stripe or paypal payment ID is provided
  CONSTRAINT purchases_payment_id_check 
  CHECK (
    (stripe_session_id IS NOT NULL AND payment_method = 'stripe') OR 
    (paypal_payment_id IS NOT NULL AND payment_method = 'paypal')
  )
);

-- Create indexes for purchases
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_image_id ON public.purchases(image_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_payment_id ON public.purchases(paypal_payment_id) WHERE paypal_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_order_id ON public.purchases(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON public.purchases(purchased_at);

-- Create unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_stripe_session_id_unique ON public.purchases(stripe_session_id) WHERE stripe_session_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_paypal_payment_id_unique ON public.purchases(paypal_payment_id) WHERE paypal_payment_id IS NOT NULL;

-- Enable RLS on purchases
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create public RLS policies for purchases (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Public can view completed purchases" ON public.purchases;
CREATE POLICY "Public can view completed purchases" ON public.purchases
  FOR SELECT USING (payment_status = 'completed');

DROP POLICY IF EXISTS "Public can insert purchases" ON public.purchases;
CREATE POLICY "Public can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public can update payment status" ON public.purchases;
CREATE POLICY "Public can update payment status" ON public.purchases
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create trigger for purchases updated_at
DROP TRIGGER IF EXISTS update_purchases_updated_at ON public.purchases;
CREATE TRIGGER update_purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 6. SUBSCRIPTIONS TABLE
-- ===================================================

-- Create simplified subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
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
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id ON public.subscriptions(stripe_subscription_id);

-- Enable RLS on subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscriptions (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can insert their own subscriptions"
  ON public.subscriptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own subscriptions" ON public.subscriptions;
CREATE POLICY "Users can update their own subscriptions"
  ON public.subscriptions FOR UPDATE
  USING (auth.uid() = user_id);

-- Create trigger for subscriptions updated_at
DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================================================
-- 7. AUTO PROFILE CREATION
-- ===================================================

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, provider)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE(NEW.raw_app_meta_data->>'provider', 'email')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call the function every time a user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===================================================
-- 7. IMAGE DOWNLOADS TRACKING TABLE
-- ===================================================

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

-- RLS Policies for image_downloads (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own downloads" ON public.image_downloads;
CREATE POLICY "Users can view their own downloads" ON public.image_downloads
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own downloads" ON public.image_downloads;
CREATE POLICY "Users can insert their own downloads" ON public.image_downloads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ===================================================
-- 8. SUBSCRIPTION USAGE TRACKING TABLE
-- ===================================================

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

-- RLS Policies for subscription_usage (drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own usage" ON public.subscription_usage;
CREATE POLICY "Users can view their own usage" ON public.subscription_usage
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON public.subscription_usage;
CREATE POLICY "Users can update their own usage" ON public.subscription_usage
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert usage records" ON public.subscription_usage;
CREATE POLICY "System can insert usage records" ON public.subscription_usage
  FOR INSERT WITH CHECK (true);

-- ===================================================
-- 9. IMPROVED INDEXES FOR PERFORMANCE
-- ===================================================

-- Additional indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON public.subscriptions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_period_end ON public.subscriptions(current_period_end);
CREATE INDEX IF NOT EXISTS idx_purchases_user_status ON public.purchases(user_id, payment_status);
CREATE INDEX IF NOT EXISTS idx_purchases_image_user ON public.purchases(image_id, user_id);

-- ===================================================
-- 10. COMMENTS AND DOCUMENTATION
-- ===================================================

COMMENT ON TABLE public.profiles IS 'User profile information for both email and social auth users';
COMMENT ON TABLE public.images IS 'Image storage metadata with public access';
COMMENT ON TABLE public.purchases IS 'Image purchase transactions supporting Stripe and PayPal';
COMMENT ON TABLE public.subscriptions IS 'User subscription plans with features';
COMMENT ON TABLE public.image_downloads IS 'Tracking table for image downloads with subscription limits';
COMMENT ON TABLE public.subscription_usage IS 'Monthly usage tracking for subscription limits';

COMMENT ON COLUMN public.subscriptions.user_id IS 'References auth.users.id - must be a real user';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: standard, premium, or commercial';
COMMENT ON COLUMN public.subscriptions.features IS 'JSON array of features included in this subscription';
