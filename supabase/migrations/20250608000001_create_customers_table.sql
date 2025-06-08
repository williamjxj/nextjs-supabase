-- Create customers table to store Stripe customer information
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT NOT NULL UNIQUE,
  email TEXT,
  name TEXT,
  phone TEXT,
  address JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create unique index for user_id to ensure one customer per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_user_id ON public.customers(user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_customers_stripe_customer_id ON public.customers(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_email ON public.customers(email);

-- Enable RLS (Row Level Security)
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;

-- Create policies for customers table
CREATE POLICY "Users can view their own customer record" 
  ON public.customers FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all customers" 
  ON public.customers FOR ALL 
  USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_customers_updated_at 
  BEFORE UPDATE ON public.customers 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
