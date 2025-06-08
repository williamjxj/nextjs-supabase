// Re-export from generated types for compatibility
export type { Database } from './database_generated';
export type { Database as DatabaseGenerated } from './database_generated';

// Import the generated types
import type { Database as GeneratedDatabase } from './database_generated';

// Type aliases for easier usage (following Vercel template patterns)
export type Tables<T extends keyof GeneratedDatabase['public']['Tables']> = 
  GeneratedDatabase['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof GeneratedDatabase['public']['Tables']> = 
  GeneratedDatabase['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof GeneratedDatabase['public']['Tables']> = 
  GeneratedDatabase['public']['Tables'][T]['Update'];

export type Enums<T extends keyof GeneratedDatabase['public']['Enums']> = 
  GeneratedDatabase['public']['Enums'][T];

// Specific type exports for subscription system
export type Product = Tables<'products'>;
export type Price = Tables<'prices'>;
export type Subscription = Tables<'subscriptions'>;
export type Customer = Tables<'customers'>;
export type User = Tables<'users'>;

// Extended types for UI components (following Vercel template)
export interface ProductWithPrices extends Product {
  prices?: Price[];
}

export interface PriceWithProduct extends Price {
  products?: Product | null;
}

export interface SubscriptionWithPriceAndProduct extends Subscription {
  prices?: PriceWithProduct | null;
}
