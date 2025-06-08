'use client';

import { useState } from 'react';
import { checkoutWithStripe } from '@/lib/actions/subscription';
import { createClient } from '@/utils/supabase/client';
import type { Tables } from '@/types/types_db';

type Price = Tables<'prices'>;
type ProductWithPrices = Tables<'products'> & {
  prices: Price[];
};

interface Props {
  user: any;
}

export default function SubscriptionForm({ user }: Props) {
  const [products, setProducts] = useState<ProductWithPrices[]>([]);
  const [loading, setLoading] = useState(true);
  const [priceIdLoading, setPriceIdLoading] = useState<string>();

  const supabase = createClient();

  // Load products and prices
  useState(() => {
    const loadProducts = async () => {
      const { data: products, error } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true)
        .order('metadata->index')
        .order('unit_amount', { referencedTable: 'prices' });

      if (error) {
        console.error('Error loading products:', error);
      } else {
        setProducts(products || []);
      }
      setLoading(false);
    };

    loadProducts();
  });

  const handleStripeCheckout = async (price: Price) => {
    setPriceIdLoading(price.id);
    try {
      await checkoutWithStripe({ price });
    } catch (error) {
      console.error('Error creating checkout session:', error);
    } finally {
      setPriceIdLoading(undefined);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading subscription plans...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">No subscription plans available at this time.</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-bold text-center mb-8 text-white">
        Choose Your Plan
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => {
          const price = product?.prices?.[0];
          if (!price) return null;

          const priceString = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: price.currency!,
            minimumFractionDigits: 0
          }).format((price?.unit_amount || 0) / 100);

          return (
            <div
              key={product.id}
              className="bg-white rounded-lg shadow-lg overflow-hidden"
            >
              <div className="p-6">
                <h4 className="text-xl font-semibold mb-2">{product.name}</h4>
                {product.description && (
                  <p className="text-gray-600 mb-4">{product.description}</p>
                )}
                <div className="mb-6">
                  <span className="text-3xl font-bold">{priceString}</span>
                  {price.interval && (
                    <span className="text-gray-600">/{price.interval}</span>
                  )}
                </div>
                <button
                  onClick={() => handleStripeCheckout(price)}
                  disabled={!!priceIdLoading}
                  className="w-full bg-pink-500 hover:bg-pink-600 disabled:bg-gray-400 text-white py-3 px-4 rounded-md font-medium transition-colors"
                >
                  {priceIdLoading === price.id ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    'Subscribe'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
