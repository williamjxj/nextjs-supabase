'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkoutWithStripe } from '@/lib/actions/subscription';
import supabase from '@/lib/supabase/client';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import type { Tables } from '@/types/types_db';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;

interface ProductWithPrices extends Product {
  prices: Price[];
}

export default function PricingPage() {
  const [priceIdLoading, setPriceIdLoading] = useState<string>();
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // Load products and prices on component mount
  useEffect(() => {
    const loadProducts = async () => {
      console.log('Starting to load products...');
      
      try {
        // First, try a simple products query
        const { data: simpleProducts, error: simpleError } = await supabase
          .from('products')
          .select('*')
          .eq('active', true);

        console.log('Simple products query result:', simpleProducts, simpleError);

        // Then try the complex query
        const { data: products, error } = await supabase
          .from('products')
          .select('*, prices(*)')
          .eq('active', true)
          .eq('prices.active', true)
          .order('metadata->index')
          .order('unit_amount', { referencedTable: 'prices' });

        console.log('Complex products query result:', products, error);

        if (error) {
          console.error('Error loading products:', error);
        } else {
          console.log('Products loaded successfully:', products);
          setProducts(products || []);
        }
      } catch (err) {
        console.error('Exception during product loading:', err);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/auth/signin');
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
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto"></div>
          <p className="mt-2 text-white">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-base font-semibold leading-7 text-pink-400">
            Pricing
          </h1>
          <p className="mt-2 text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Choose the perfect plan for&nbsp;you
          </p>
        </div>
        
        <p className="mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-gray-300">
          Get unlimited access to our premium gallery with subscription plans designed to fit your needs.
        </p>

        <div className="mt-16 grid gap-8 lg:grid-cols-3 lg:gap-6">
          {products.length === 0 && !loading && (
            <div className="col-span-3 text-center text-gray-300">
              <p>No pricing plans available at the moment.</p>
            </div>
          )}
          {products.map((product) => {
            console.log('Rendering product:', product);
            const price = product.prices?.[0];
            if (!price) return null;

            const priceString = new Intl.NumberFormat('en-US', {
              style: 'currency',
              currency: price.currency!,
              minimumFractionDigits: 0
            }).format((price?.unit_amount || 0) / 100);

            return (
              <div
                key={product.id}
                className={cn(
                  'relative rounded-2xl border border-gray-700 bg-gray-800 p-8 shadow-lg',
                  product.name === 'Pro' && 'border-pink-500'
                )}
              >
                {product.name === 'Pro' && (
                  <div className="absolute -top-5 left-0 right-0 mx-auto w-32 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 px-3 py-2 text-center text-sm font-medium text-white">
                    Most Popular
                  </div>
                )}
                
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">
                    {product.name}
                  </h3>
                </div>
                
                {product.description && (
                  <p className="mt-4 text-sm text-gray-300">
                    {product.description}
                  </p>
                )}
                
                <p className="mt-6 flex items-baseline gap-x-1">
                  <span className="text-4xl font-bold tracking-tight text-white">
                    {priceString}
                  </span>
                  {price.interval && (
                    <span className="text-sm font-semibold leading-6 text-gray-300">
                      /{price.interval}
                    </span>
                  )}
                </p>

                <ul className="mt-8 space-y-3 text-sm text-gray-300">
                  {getFeatures(product.name || '').map((feature) => (
                    <li key={feature} className="flex gap-x-3">
                      <Check className="h-6 w-5 flex-none text-pink-400" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleStripeCheckout(price)}
                  disabled={!!priceIdLoading}
                  className={cn(
                    'mt-8 block w-full rounded-md px-3 py-2 text-center text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2',
                    product.name === 'Premium Plan'
                      ? 'bg-pink-500 text-white shadow-sm hover:bg-pink-400 focus-visible:outline-pink-500'
                      : 'bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white',
                    priceIdLoading === price.id && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {priceIdLoading === price.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Get started'
                  )}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-16 text-center">
          <p className="text-sm text-gray-400">
            All plans include 7-day free trial. Cancel anytime.
          </p>
        </div>
      </div>
    </div>
  );
}

function getFeatures(productName?: string): string[] {
  switch (productName?.toLowerCase()) {
    case 'standard plan':
      return [
        '100 image uploads per month',
        '1GB storage',
        'Standard support',
        'Basic editing tools',
        'Personal use license'
      ];
    case 'premium plan':
      return [
        '1,000 image uploads per month',
        '10GB storage',
        'Priority support',
        'Advanced editing tools',
        'Commercial use license',
        'Bulk operations',
        'Analytics dashboard'
      ];
    case 'commercial plan':
      return [
        'Unlimited image uploads',
        '100GB storage',
        '24/7 priority support',
        'All editing features',
        'Full commercial license',
        'API access',
        'Custom integrations',
        'Advanced analytics'
      ];
    default:
      return [
        'Basic features included',
        'Standard support',
        'Personal use license'
      ];
  }
}
