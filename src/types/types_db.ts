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

// Specific type exports for current simplified schema
export type Subscription = Tables<'subscriptions'>;
export type Image = Tables<'images'>;
export type Purchase = Tables<'purchases'>;
export type Profile = Tables<'profiles'>;
export type UserDownload = Tables<'user_downloads'>;
