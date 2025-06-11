-- Fix the subscription table schema to avoid foreign key constraint issues
-- Remove the problematic template records and modify the approach

-- Delete any existing template records that might cause FK constraint issues
DELETE FROM public.subscriptions WHERE user_id = '00000000-0000-0000-0000-000000000000'::uuid;

-- Instead of template records in the main table, we'll create a separate view for plan definitions
-- or handle plan definitions in the application code.

-- Make sure the subscriptions table only contains real user subscriptions
COMMENT ON TABLE public.subscriptions IS 'User subscription table - contains only actual user subscriptions';
COMMENT ON COLUMN public.subscriptions.user_id IS 'References auth.users.id - must be a real user';
COMMENT ON COLUMN public.subscriptions.plan_type IS 'Type of subscription plan: standard, premium, or commercial';
COMMENT ON COLUMN public.subscriptions.features IS 'JSON array of features included in this subscription';

-- The plan definitions will be handled in the application code instead of as database records
