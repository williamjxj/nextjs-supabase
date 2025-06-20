# 🔧 Manual Migration Steps

The automatic migration failed because the `exec_sql` function doesn't exist. Here's how to fix it:

## Step 1: Create the exec_sql Function

Go to your **Supabase Dashboard** → **SQL Editor** and run this first:

```sql
CREATE OR REPLACE FUNCTION exec_sql(sql text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
END;
$$;
```

## Step 2: Create the Missing Tables

After creating the function above, run this SQL in the same SQL Editor:

```sql
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

COMMENT ON TABLE public.image_downloads IS 'Tracking table for image downloads with subscription limits';
COMMENT ON TABLE public.subscription_usage IS 'Monthly usage tracking for subscription limits';
```

## Step 3: Verify the Migration

After running the SQL above, test that everything works:

```bash
node scripts/test-subscription-integration.js
```

## Step 4: Alternative - Use the Full Schema File

If you prefer, you can also run the complete schema file in Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy the contents of `supabase/migrations/init_gallery_schema.sql`
3. Paste and run it in the SQL Editor

This will create all tables and policies with the `DROP IF EXISTS` statements to handle conflicts.

## Troubleshooting

### If you get "relation already exists" errors:

The SQL includes `CREATE TABLE IF NOT EXISTS` and `DROP POLICY IF EXISTS` statements, so it should handle existing objects gracefully.

### If you get foreign key constraint errors:

Make sure your `auth.users` table exists and has the proper structure. The tables reference `auth.users(id)`.

### If you get permission errors:

Make sure you're running the SQL as a database admin or with sufficient privileges.

## Next Steps

Once the migration is complete:

1. ✅ Run integration tests: `node scripts/test-subscription-integration.js`
2. ✅ Update your components to use the new unified system
3. ✅ Test subscription and payment workflows
4. ✅ Deploy to production

Your subscription system will then be fully functional with proper download tracking and usage limits!
