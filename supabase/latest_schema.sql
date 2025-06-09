-- Latest Database Schema - Generated from all Supabase migrations
-- Generated on: June 9, 2025

-- ============================================================================
-- CUSTOM TYPES
-- ============================================================================

-- Create custom types for pricing
CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table (Vercel subscription pattern)
CREATE TABLE public.users (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    full_name TEXT,
    avatar_url TEXT,
    billing_address JSONB,
    payment_method JSONB,
    metadata JSONB
);

-- Customers table (Stripe integration)
CREATE TABLE public.customers (
    id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
    stripe_customer_id TEXT UNIQUE
);

-- Products table (Stripe products)
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    active BOOLEAN DEFAULT true,
    name TEXT,
    description TEXT,
    image TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Prices table (Stripe pricing)
CREATE TABLE public.prices (
    id TEXT PRIMARY KEY,
    product_id TEXT REFERENCES public.products(id),
    active BOOLEAN DEFAULT true,
    description TEXT,
    unit_amount BIGINT,
    currency TEXT CHECK (char_length(currency) = 3) DEFAULT 'usd',
    type pricing_type DEFAULT 'recurring',
    interval pricing_plan_interval,
    interval_count INTEGER DEFAULT 1,
    trial_period_days INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Subscriptions table (Stripe subscriptions)
CREATE TABLE public.subscriptions (
    id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) NOT NULL,
    status subscription_status,
    metadata JSONB,
    price_id TEXT REFERENCES public.prices(id),
    quantity INTEGER,
    cancel_at_period_end BOOLEAN,
    created TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    current_period_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    cancel_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    canceled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    trial_start TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    trial_end TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Images table (Gallery functionality)
CREATE TABLE public.images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- Required field
    filename TEXT NOT NULL,
    original_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type TEXT NOT NULL,
    width INTEGER NOT NULL, -- Required field
    height INTEGER NOT NULL, -- Required field
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table (Image purchases)
CREATE TABLE public.purchases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    license_type TEXT NOT NULL DEFAULT 'standard',
    amount_paid INTEGER NOT NULL, -- Amount in cents
    currency TEXT NOT NULL DEFAULT 'usd',
    stripe_session_id TEXT, -- nullable after migration
    paypal_payment_id TEXT,
    paypal_order_id TEXT,
    payment_method TEXT NOT NULL DEFAULT 'stripe',
    payment_status TEXT NOT NULL DEFAULT 'pending',
    purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Constraint to ensure either stripe_session_id or paypal_payment_id is provided
    CONSTRAINT purchases_payment_id_check CHECK (
        (stripe_session_id IS NOT NULL AND payment_method = 'stripe') OR 
        (paypal_payment_id IS NOT NULL AND payment_method = 'paypal')
    )
);

-- Image downloads table (Subscription tracking)
CREATE TABLE public.image_downloads (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_id UUID NOT NULL REFERENCES images(id) ON DELETE CASCADE,
    downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Users table indexes
-- (Primary key index created automatically)

-- Customers table indexes
-- (Primary key and unique constraint indexes created automatically)

-- Products table indexes
-- (Primary key index created automatically)

-- Prices table indexes
-- (Primary key index created automatically)

-- Subscriptions table indexes
-- (Primary key index created automatically)

-- Images table indexes
CREATE INDEX IF NOT EXISTS idx_images_user_id ON public.images(user_id);
CREATE INDEX IF NOT EXISTS idx_images_created_at ON public.images(created_at DESC);

-- Purchases table indexes
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_image_id ON public.purchases(image_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON public.purchases(purchased_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_paypal_payment_id ON public.purchases(paypal_payment_id) WHERE paypal_payment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_order_id ON public.purchases(paypal_order_id) WHERE paypal_order_id IS NOT NULL;

-- Image downloads table indexes
CREATE INDEX idx_image_downloads_user_id ON image_downloads(user_id);
CREATE INDEX idx_image_downloads_created_at ON image_downloads(created_at);

-- ============================================================================
-- STORAGE BUCKET
-- ============================================================================

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.image_downloads ENABLE ROW LEVEL SECURITY;

-- Users table policies
CREATE POLICY "Can view own user data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Customers table policies
-- No policies - private table managed by service

-- Products table policies
CREATE POLICY "Allow public read-only access." ON public.products FOR SELECT USING (true);

-- Prices table policies
CREATE POLICY "Allow public read-only access." ON public.prices FOR SELECT USING (true);

-- Subscriptions table policies
CREATE POLICY "Can only view own subs data." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Images table policies (authenticated users only)
CREATE POLICY "Users can insert their own images" ON public.images FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Public can view images" ON public.images FOR SELECT USING (true);
CREATE POLICY "Users can update their own images" ON public.images FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own images" ON public.images FOR DELETE USING (auth.uid() = user_id);

-- Purchases table policies (public access with restrictions)
CREATE POLICY "Public can view completed purchases" ON public.purchases FOR SELECT USING (payment_status = 'completed');
CREATE POLICY "Public can insert purchases" ON public.purchases FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update payment status" ON public.purchases FOR UPDATE USING (true) WITH CHECK (true);

-- Image downloads table policies
CREATE POLICY "Users can view own downloads" ON image_downloads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own downloads" ON image_downloads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "No updates allowed" ON image_downloads FOR UPDATE USING (false);
CREATE POLICY "No deletes allowed" ON image_downloads FOR DELETE USING (false);

-- Storage policies (public access)
CREATE POLICY "Public can upload images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'images');
CREATE POLICY "Public can view images" ON storage.objects FOR SELECT USING (bucket_id = 'images');
CREATE POLICY "Public can update images" ON storage.objects FOR UPDATE USING (bucket_id = 'images');
CREATE POLICY "Public can delete images" ON storage.objects FOR DELETE USING (bucket_id = 'images');

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, full_name, avatar_url)
    VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Triggers for updated_at columns
CREATE TRIGGER update_images_updated_at 
    BEFORE UPDATE ON public.images 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchases_updated_at 
    BEFORE UPDATE ON public.purchases 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for auto-creating user profiles
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- REALTIME SUBSCRIPTIONS
-- ============================================================================

-- Set up realtime for public tables
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.products, public.prices, public.subscriptions;
