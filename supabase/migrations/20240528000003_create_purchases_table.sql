-- Create purchases table to track image purchases
CREATE TABLE IF NOT EXISTS public.purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  license_type TEXT NOT NULL DEFAULT 'standard',
  amount_paid INTEGER NOT NULL, -- Amount in cents
  currency TEXT NOT NULL DEFAULT 'usd',
  stripe_session_id TEXT UNIQUE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_image_id ON public.purchases(image_id);
CREATE INDEX IF NOT EXISTS idx_purchases_stripe_session_id ON public.purchases(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_purchases_purchased_at ON public.purchases(purchased_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" ON public.purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purchases_updated_at 
  BEFORE UPDATE ON public.purchases 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
