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

-- Create storage policies for public access
CREATE POLICY "Public can upload images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'images');

CREATE POLICY "Public can view images" ON storage.objects
  FOR SELECT USING (bucket_id = 'images');

CREATE POLICY "Public can update images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'images');

CREATE POLICY "Public can delete images" ON storage.objects
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

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create trigger for profiles updated_at
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

-- Create public RLS policies for images
CREATE POLICY "Public can insert images" ON public.images
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can view images" ON public.images
  FOR SELECT USING (true);

CREATE POLICY "Public can update images" ON public.images
  FOR UPDATE USING (true);

CREATE POLICY "Public can delete images" ON public.images
  FOR DELETE USING (true);

-- Create trigger for images updated_at
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

-- Create public RLS policies for purchases
CREATE POLICY "Public can view completed purchases" ON public.purchases
  FOR SELECT USING (payment_status = 'completed');

CREATE POLICY "Public can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can update payment status" ON public.purchases
  FOR UPDATE USING (true) WITH CHECK (true);

-- Create trigger for purchases updated_at
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

-- Create RLS policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own subscriptions" 
  ON public.subscriptions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.subscriptions FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create trigger for subscriptions updated_at
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
-- 8. COMMENTS AND DOCUMENTATION
-- ===================================================

COMMENT ON TABLE public.profiles IS 'User profile information for both email and social auth users';
COMMENT ON TABLE public.images IS 'Image storage metadata with public access';
COMMENT ON TABLE public.purchases IS 'Image purchase transactions supporting Stripe and PayPal';
COMMENT ON TABLE public.subscriptions IS 'User subscription plans with features';

COMMENT ON COLUMN public.subscriptions.user_id IS 'References auth.users.id - must be a real user';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: standard, premium, or commercial';
COMMENT ON COLUMN public.subscriptions.features IS 'JSON array of features included in this subscription';
