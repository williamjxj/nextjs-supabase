-- Add service role policy for subscription_plans table
CREATE POLICY "Service role can manage subscription plans" 
  ON public.subscription_plans FOR ALL 
  USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');
