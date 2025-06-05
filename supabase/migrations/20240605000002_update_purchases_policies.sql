-- Update RLS policies for purchases table to allow public access to completed purchases

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.purchases;

-- Create new public policies
CREATE POLICY "Public can view completed purchases" ON public.purchases
  FOR SELECT USING (payment_status = 'completed');

CREATE POLICY "Public can insert purchases" ON public.purchases
  FOR INSERT WITH CHECK (true);

-- Allow updates for payment status changes (for webhooks)
CREATE POLICY "Public can update payment status" ON public.purchases
  FOR UPDATE USING (true) WITH CHECK (true);
