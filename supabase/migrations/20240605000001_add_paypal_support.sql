-- Add PayPal support to purchases table
-- Make stripe_session_id nullable and add paypal_payment_id

-- First, make stripe_session_id nullable
ALTER TABLE public.purchases ALTER COLUMN stripe_session_id DROP NOT NULL;

-- Add paypal_payment_id column
ALTER TABLE public.purchases ADD COLUMN paypal_payment_id TEXT;

-- Add payment_method column to distinguish between stripe and paypal
ALTER TABLE public.purchases ADD COLUMN payment_method TEXT NOT NULL DEFAULT 'stripe';

-- Create unique constraint for paypal_payment_id (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_paypal_payment_id 
ON public.purchases(paypal_payment_id) WHERE paypal_payment_id IS NOT NULL;

-- Update existing records to have payment_method = 'stripe'
UPDATE public.purchases SET payment_method = 'stripe' WHERE stripe_session_id IS NOT NULL;

-- Add a check constraint to ensure either stripe_session_id or paypal_payment_id is provided
ALTER TABLE public.purchases ADD CONSTRAINT purchases_payment_id_check 
CHECK (
  (stripe_session_id IS NOT NULL AND payment_method = 'stripe') OR 
  (paypal_payment_id IS NOT NULL AND payment_method = 'paypal')
);
