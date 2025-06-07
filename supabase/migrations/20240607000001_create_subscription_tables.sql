-- Create subscription plans table to store available subscription tiers
CREATE TABLE IF NOT EXISTS public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL UNIQUE, -- 'standard', 'premium', 'commercial'
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  interval TEXT NOT NULL DEFAULT 'month', -- 'month', 'year'
  stripe_price_id TEXT UNIQUE,
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_plans_type ON public.subscription_plans(type);
CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON public.subscription_plans(is_active);

-- Create subscriptions table to track active/historical user subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'past_due', 'canceled', 'incomplete', 'trialing'
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT FALSE,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON public.subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_subscription_id ON public.subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);

-- Create subscription invoices table to track payment history
CREATE TABLE IF NOT EXISTS public.subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_invoice_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  amount_paid DECIMAL(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  invoice_period_start TIMESTAMPTZ,
  invoice_period_end TIMESTAMPTZ,
  status TEXT NOT NULL, -- 'paid', 'open', 'uncollectible', 'void'
  payment_method TEXT,
  receipt_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON public.subscription_invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_user_id ON public.subscription_invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_status ON public.subscription_invoices(status);

-- Enable RLS (Row Level Security)
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;

-- Create policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans" 
  ON public.subscription_plans FOR SELECT 
  USING (is_active = TRUE);

-- Create policies for subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.subscriptions FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" 
  ON public.subscriptions FOR ALL 
  USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');

-- Create policies for subscription_invoices
CREATE POLICY "Users can view their own subscription invoices" 
  ON public.subscription_invoices FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscription invoices" 
  ON public.subscription_invoices FOR ALL 
  USING (auth.jwt() ? 'role' AND auth.jwt()->>'role' = 'service_role');

-- Create triggers to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables
CREATE TRIGGER update_subscription_plans_updated_at 
  BEFORE UPDATE ON public.subscription_plans 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON public.subscriptions 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_subscription_invoices_updated_at 
  BEFORE UPDATE ON public.subscription_invoices 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
