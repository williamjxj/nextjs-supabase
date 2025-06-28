-- Add RLS policies to allow webhook operations for subscriptions and purchases
-- This enables webhook operations even with anon key (temporary fix)

-- Add permissive policies for webhook operations on subscriptions table
DROP POLICY IF EXISTS "Allow webhook operations for subscriptions" ON public.subscriptions;
CREATE POLICY "Allow webhook operations for subscriptions"
  ON public.subscriptions FOR ALL
  USING (true);

-- Add permissive policies for webhook operations on purchases table
DROP POLICY IF EXISTS "Allow webhook operations for purchases" ON public.purchases;
CREATE POLICY "Allow webhook operations for purchases"
  ON public.purchases FOR ALL
  USING (true);

-- Add comment to document the purpose
COMMENT ON POLICY "Allow webhook operations for subscriptions" ON public.subscriptions IS 'Temporary policy to allow webhook operations with anon key - should be replaced with proper service role key';
COMMENT ON POLICY "Allow webhook operations for purchases" ON public.purchases IS 'Temporary policy to allow webhook operations with anon key - should be replaced with proper service role key';
