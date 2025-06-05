-- Add paypal_order_id column to support PayPal order tracking
-- This allows us to store both the order ID and capture ID for PayPal transactions

-- Add paypal_order_id column
ALTER TABLE public.purchases ADD COLUMN IF NOT EXISTS paypal_order_id TEXT;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_purchases_paypal_order_id 
ON public.purchases(paypal_order_id) WHERE paypal_order_id IS NOT NULL;
