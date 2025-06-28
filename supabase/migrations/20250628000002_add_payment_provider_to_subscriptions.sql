-- Add payment provider field to subscriptions table
-- This helps distinguish between Stripe, PayPal, and other payment methods

-- Add payment_provider column
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS payment_provider TEXT DEFAULT 'stripe' CHECK (payment_provider IN ('stripe', 'paypal', 'crypto'));

-- Add PayPal subscription ID column
ALTER TABLE public.subscriptions 
ADD COLUMN IF NOT EXISTS paypal_subscription_id TEXT UNIQUE;

-- Create index for PayPal subscription ID
CREATE INDEX IF NOT EXISTS idx_subscriptions_paypal_id ON public.subscriptions(paypal_subscription_id);

-- Update existing records to have payment_provider = 'stripe' where stripe_subscription_id exists
UPDATE public.subscriptions 
SET payment_provider = 'stripe' 
WHERE stripe_subscription_id IS NOT NULL AND payment_provider IS NULL;

-- Add comment to document the purpose
COMMENT ON COLUMN public.subscriptions.payment_provider IS 'Payment provider used for this subscription: stripe, paypal, or crypto';
COMMENT ON COLUMN public.subscriptions.paypal_subscription_id IS 'PayPal subscription ID for PayPal subscriptions';
