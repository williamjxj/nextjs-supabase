// Database type definitions for the NextJS Supabase Gallery application
// These types correspond to the database schema defined in migrations

export interface Database {
  public: {
    Tables: {
      images: {
        Row: {
          id: string
          user_id: string
          filename: string
          original_name: string
          storage_path: string
          storage_url: string
          file_size: number
          mime_type: string
          width: number | null
          height: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          filename: string
          original_name: string
          storage_path: string
          storage_url: string
          file_size: number
          mime_type: string
          width?: number | null
          height?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          filename?: string
          original_name?: string
          storage_path?: string
          storage_url?: string
          file_size?: number
          mime_type?: string
          width?: number | null
          height?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      purchases: {
        Row: {
          id: string
          user_id: string
          image_id: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          paypal_order_id: string | null
          license_type: string
          amount: number
          currency: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          image_id: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          paypal_order_id?: string | null
          license_type: string
          amount: number
          currency: string
          status: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          image_id?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          paypal_order_id?: string | null
          license_type?: string
          amount?: number
          currency?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      subscription_plans: {
        Row: {
          id: string
          name: string
          type: string
          description: string | null
          price: number
          currency: string
          interval: string
          stripe_price_id: string | null
          features: any[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          description?: string | null
          price: number
          currency?: string
          interval?: string
          stripe_price_id?: string | null
          features?: any[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          description?: string | null
          price?: number
          currency?: string
          interval?: string
          stripe_price_id?: string | null
          features?: any[]
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          canceled_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          canceled_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      subscription_invoices: {
        Row: {
          id: string
          subscription_id: string
          user_id: string
          stripe_invoice_id: string | null
          stripe_payment_intent_id: string | null
          amount_paid: number
          currency: string
          invoice_period_start: string | null
          invoice_period_end: string | null
          status: string
          payment_method: string | null
          receipt_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          subscription_id: string
          user_id: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_paid: number
          currency?: string
          invoice_period_start?: string | null
          invoice_period_end?: string | null
          status: string
          payment_method?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          subscription_id?: string
          user_id?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent_id?: string | null
          amount_paid?: number
          currency?: string
          invoice_period_start?: string | null
          invoice_period_end?: string | null
          status?: string
          payment_method?: string | null
          receipt_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          user_id: string
          stripe_customer_id: string
          email: string | null
          name: string | null
          phone: string | null
          address: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          stripe_customer_id: string
          email?: string | null
          name?: string | null
          phone?: string | null
          address?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          stripe_customer_id?: string
          email?: string | null
          name?: string | null
          phone?: string | null
          address?: any | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types for easier usage
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

// Specific table type aliases
export type Image = Tables<'images'>
export type Purchase = Tables<'purchases'>
export type SubscriptionPlan = Tables<'subscription_plans'>
export type Subscription = Tables<'subscriptions'>
export type SubscriptionInvoice = Tables<'subscription_invoices'>
export type Customer = Tables<'customers'>

// Insert type aliases
export type ImageInsert = Inserts<'images'>
export type PurchaseInsert = Inserts<'purchases'>
export type SubscriptionPlanInsert = Inserts<'subscription_plans'>
export type SubscriptionInsert = Inserts<'subscriptions'>
export type SubscriptionInvoiceInsert = Inserts<'subscription_invoices'>
export type CustomerInsert = Inserts<'customers'>

// Update type aliases
export type ImageUpdate = Updates<'images'>
export type PurchaseUpdate = Updates<'purchases'>
export type SubscriptionPlanUpdate = Updates<'subscription_plans'>
export type SubscriptionUpdate = Updates<'subscriptions'>
export type SubscriptionInvoiceUpdate = Updates<'subscription_invoices'>
export type CustomerUpdate = Updates<'customers'>

// Extended types with relationships
export interface SubscriptionWithPlan extends Subscription {
  subscription_plans: SubscriptionPlan
}

export interface SubscriptionInvoiceWithSubscription extends SubscriptionInvoice {
  subscriptions: SubscriptionWithPlan
}

export interface CustomerWithSubscriptions extends Customer {
  subscriptions: SubscriptionWithPlan[]
}
