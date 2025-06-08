'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase/client';
import type { Tables } from '@/types/types_db';

type Product = Tables<'products'>;
type Price = Tables<'prices'>;

interface ProductWithPrices extends Product {
  prices: Price[];
}

// Global state to prevent multiple API calls
let globalProducts: ProductWithPrices[] | null = null;
let globalLoading = false;
let globalError: string | null = null;
const subscribers = new Set<() => void>();

/**
 * Shared hook for fetching products and prices
 * This prevents duplicate API calls across components
 */
export function useProducts() {
  const [products, setProducts] = useState<ProductWithPrices[]>(globalProducts || []);
  const [loading, setLoading] = useState(globalProducts === null);
  const [error, setError] = useState<string | null>(globalError);

  useEffect(() => {
    const updateState = () => {
      setProducts(globalProducts || []);
      setLoading(globalLoading);
      setError(globalError);
    };

    // Subscribe to global state changes
    subscribers.add(updateState);

    // Fetch data if not already available
    if (globalProducts === null && !globalLoading) {
      fetchProducts();
    }

    return () => {
      subscribers.delete(updateState);
    };
  }, []);

  const fetchProducts = async () => {
    if (globalLoading) return; // Prevent concurrent requests

    globalLoading = true;
    notifySubscribers();

    try {
      const { data, error } = await supabase
        .from('products')
        .select('*, prices(*)')
        .eq('active', true)
        .eq('prices.active', true)
        .order('metadata->index')
        .order('unit_amount', { referencedTable: 'prices' });

      if (error) {
        globalError = error.message;
        console.error('Error fetching products:', error);
      } else {
        globalProducts = data || [];
        globalError = null;
      }
    } catch (err) {
      globalError = err instanceof Error ? err.message : 'An error occurred';
      console.error('Error fetching products:', err);
    } finally {
      globalLoading = false;
      notifySubscribers();
    }
  };

  const refetch = () => {
    globalProducts = null;
    globalError = null;
    fetchProducts();
  };

  return { products, loading, error, refetch };
}

function notifySubscribers() {
  subscribers.forEach(callback => callback());
}
