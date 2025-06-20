-- Simplify subscription system by removing unused table
-- Keep image_downloads for basic tracking but remove complex subscription_usage

-- Drop subscription_usage table as it's not being used in the simplified approach
DROP TABLE IF EXISTS public.subscription_usage;

-- Add comment to document the simplified approach
COMMENT ON TABLE public.image_downloads IS 'Simple download tracking for subscription usage statistics';
COMMENT ON TABLE public.subscriptions IS 'Active subscription = unlimited access to all gallery images';
COMMENT ON TABLE public.purchases IS 'Individual image purchases for non-subscribers';

-- Create a simple view for subscription status (optional, for easier queries)
CREATE OR REPLACE VIEW public.user_subscription_status AS
SELECT 
  u.id as user_id,
  u.email,
  s.id as subscription_id,
  s.plan_type,
  s.status,
  s.current_period_end,
  CASE 
    WHEN s.status = 'active' AND s.current_period_end > NOW() THEN true
    ELSE false
  END as has_active_subscription
FROM auth.users u
LEFT JOIN public.subscriptions s ON u.id = s.user_id;

-- Grant access to the view
GRANT SELECT ON public.user_subscription_status TO authenticated;
GRANT SELECT ON public.user_subscription_status TO anon;
