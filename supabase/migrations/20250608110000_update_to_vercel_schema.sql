-- Migration to update existing Vercel tables to match the complete nextjs-subscription-payments schema
-- This migration extends the existing customers table and ensures all tables match Vercel patterns

-- First, drop the old subscription tables that we want to replace
DROP TABLE IF EXISTS public.subscription_invoices CASCADE;
DROP TABLE IF EXISTS public.subscriptions CASCADE;
DROP TABLE IF EXISTS public.subscription_plans CASCADE;

-- Update customers table to match Vercel schema
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS full_name text,
ADD COLUMN IF NOT EXISTS avatar_url text,
ADD COLUMN IF NOT EXISTS billing_address jsonb,
ADD COLUMN IF NOT EXISTS payment_method jsonb;

-- Make sure stripe_customer_id is unique
DROP INDEX IF EXISTS customers_stripe_customer_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS customers_stripe_customer_id_key ON public.customers(stripe_customer_id);

-- Enable RLS and add policies for customers
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Can only view own customer data." ON public.customers;
CREATE POLICY "Can only view own customer data." ON public.customers FOR SELECT USING (auth.uid() = id);

-- Update products table structure to match Vercel schema
ALTER TABLE public.products 
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS name text,
ADD COLUMN IF NOT EXISTS description text,
ADD COLUMN IF NOT EXISTS image text,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Enable RLS and add policies for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access." ON public.products;
CREATE POLICY "Allow public read-only access." ON public.products FOR SELECT USING (true);

-- Recreate pricing types if they don't exist
DO $$ 
BEGIN
    CREATE TYPE pricing_type AS ENUM ('one_time', 'recurring');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    CREATE TYPE pricing_plan_interval AS ENUM ('day', 'week', 'month', 'year');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Update prices table structure to match Vercel schema
ALTER TABLE public.prices 
ADD COLUMN IF NOT EXISTS product_id text REFERENCES public.products(id),
ADD COLUMN IF NOT EXISTS active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS currency text DEFAULT 'usd',
ADD COLUMN IF NOT EXISTS type pricing_type DEFAULT 'recurring',
ADD COLUMN IF NOT EXISTS unit_amount bigint,
ADD COLUMN IF NOT EXISTS interval pricing_plan_interval,
ADD COLUMN IF NOT EXISTS interval_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS trial_period_days integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Enable RLS and add policies for prices
ALTER TABLE public.prices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read-only access." ON public.prices;
CREATE POLICY "Allow public read-only access." ON public.prices FOR SELECT USING (true);

-- Create subscription_status type
DO $$ 
BEGIN
    CREATE TYPE subscription_status AS ENUM ('trialing', 'active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'unpaid', 'paused');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Recreate subscriptions table with Vercel schema
DROP TABLE IF EXISTS public.subscriptions CASCADE;
CREATE TABLE public.subscriptions (
  -- Subscription ID from Stripe, e.g. sub_1234.
  id text PRIMARY KEY,
  -- The ID of the user associated with the subscription.
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  -- The subscription's status.
  status subscription_status,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb,
  -- The ID of the price that this subscription is subscribing to.
  price_id text REFERENCES public.prices(id),
  -- Quantity multiplied by the unit amount of the price creates the amount of the subscription. 
  quantity integer,
  -- If true the subscription has been canceled by the user and will be deleted at the end of the billing period.
  cancel_at_period_end boolean,
  -- Time at which the subscription was created.
  created timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- Start of the current period that the subscription has been invoiced for.
  current_period_start timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- End of the current period that the subscription has been invoiced for. At the end of this period, a new invoice will be created.
  current_period_end timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  -- If the subscription has ended, the date the subscription ended.
  ended_at timestamp with time zone,
  -- A date in the future at which the subscription will automatically get canceled.
  cancel_at timestamp with time zone,
  -- If the subscription has been canceled, the date of that cancellation.
  canceled_at timestamp with time zone,
  -- If the subscription has a trial, the beginning of that trial.
  trial_start timestamp with time zone,
  -- If the subscription has a trial, the end of that trial.
  trial_end timestamp with time zone
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Can only view own subscription data." ON public.subscriptions FOR SELECT USING (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON public.subscriptions(status);

-- Create a users table for storing additional user information (Vercel pattern)
CREATE TABLE IF NOT EXISTS public.users (
  -- UUID from auth.users
  id uuid REFERENCES auth.users NOT NULL PRIMARY KEY,
  -- The user's full name.
  full_name text,
  -- The user's avatar image URL.
  avatar_url text,
  -- The user's billing address, stored in JSON format.
  billing_address jsonb,
  -- Stores your customer's payment instruments.
  payment_method jsonb,
  -- Set of key-value pairs, used to store additional information about the object in a structured format.
  metadata jsonb
);

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Can view own user data." ON public.users;
DROP POLICY IF EXISTS "Can update own user data." ON public.users;
CREATE POLICY "Can view own user data." ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Can update own user data." ON public.users FOR UPDATE USING (auth.uid() = id);

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Realtime (only add if not already in publication)
DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.prices;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.subscriptions;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
