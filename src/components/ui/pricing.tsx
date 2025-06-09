'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { checkoutWithStripe } from '@/lib/actions/subscription';
import { useProducts } from '@/hooks/use-products';
import { Check, Crown } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Tables } from '@/types/types_db';

type Price = Tables<'prices'>;

interface PricingProps {
  className?: string;
  showTitle?: boolean;
  variant?: 'default' | 'compact';
}

export default function Pricing({ 
  className, 
  showTitle = true,
  variant = 'default'
}: PricingProps) {
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const { products, loading, error } = useProducts();
  const router = useRouter();

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }
      await checkoutWithStripe({ price });
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setPriceIdLoading(undefined);
    }
  };

  if (loading) {
    return (
      <div className={cn("text-center py-8", className)}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading pricing plans...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <p className="text-gray-600">No pricing plans available at this time.</p>
      </div>
    );
  }

  return (
    <div className={cn("", className)}>
      {showTitle && (
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Choose Your Plan
          </h2>
          <p className="text-gray-300 max-w-2xl mx-auto">
            Get unlimited access to our premium gallery with subscription plans designed to fit your needs.
          </p>
        </div>
      )}

      <div className={cn(
        "grid gap-6",
        variant === 'compact' ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 md:grid-cols-3"
      )}>
        {products.map((product) => {
          const price = product.prices?.[0];
          if (!price) return null;

          const priceString = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: price.currency!,
            minimumFractionDigits: 0
          }).format((price?.unit_amount || 0) / 100);

          const isPopular = product.name === 'Pro';

          return (
            <div
              key={product.id}
              className={cn(
                'relative rounded-lg border bg-white overflow-hidden shadow-lg hover:shadow-xl transition-shadow',
                isPopular 
                  ? 'border-pink-500 ring-2 ring-pink-500/20' 
                  : 'border-gray-200'
              )}
            >
              {isPopular && (
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                  <div className="flex items-center gap-1 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs font-medium px-3 py-1 rounded-full">
                    <Crown className="w-3 h-3" />
                    Most Popular
                  </div>
                </div>
              )}

              <div className="p-6">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {product.name}
                  </h3>
                  
                  {product.description && (
                    <p className="text-sm text-gray-600 mb-4">
                      {product.description}
                    </p>
                  )}

                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {priceString}
                    </span>
                    {price.interval && (
                      <span className="text-gray-600">
                        /{price.interval}
                      </span>
                    )}
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {getFeatures(product.name || '').map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleStripeCheckout(price)}
                  disabled={!!priceIdLoading}
                  className={cn(
                    'w-full py-3 px-4 rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2',
                    isPopular
                      ? 'bg-pink-500 hover:bg-pink-600 text-white focus:ring-pink-500'
                      : 'bg-gray-900 hover:bg-gray-800 text-white focus:ring-gray-500',
                    priceIdLoading === price.id && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {priceIdLoading === price.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Get Started'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-8">
        <p className="text-sm text-gray-500">
          All plans include 7-day free trial • Cancel anytime • No setup fees
        </p>
      </div>
    </div>
  );
}

function getFeatures(productName?: string): string[] {
  switch (productName?.toLowerCase()) {
    case 'starter':
      return [
        '100 image uploads per month',
        '1GB storage',
        'Standard support',
        'Basic editing tools',
        'Personal use license'
      ];
    case 'pro':
      return [
        '1,000 image uploads per month',
        '10GB storage',
        'Priority support',
        'Advanced editing tools',
        'Commercial use license',
        'Bulk operations',
        'Analytics dashboard'
      ];
    case 'enterprise':
      return [
        'Unlimited image uploads',
        '100GB storage',
        '24/7 priority support',
        'All editing features',
        'Full commercial license',
        'API access',
        'Custom integrations',
        'Dedicated account manager'
      ];
    default:
      return [
        'Basic features included',
        'Standard support',
        'Personal use license'
      ];
  }
}
