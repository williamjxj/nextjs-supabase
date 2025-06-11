export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      images: {
        Row: {
          created_at: string | null
          file_size: number
          filename: string
          height: number | null
          id: string
          is_featured: boolean | null
          mime_type: string
          original_name: string
          price_cents: number | null
          quality_level: string | null
          storage_path: string
          storage_url: string
          tags: Json | null
          tier: string | null
          updated_at: string | null
          user_id: string | null
          width: number | null
        }
        Insert: {
          created_at?: string | null
          file_size: number
          filename: string
          height?: number | null
          id?: string
          is_featured?: boolean | null
          mime_type: string
          original_name: string
          price_cents?: number | null
          quality_level?: string | null
          storage_path: string
          storage_url: string
          tags?: Json | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Update: {
          created_at?: string | null
          file_size?: number
          filename?: string
          height?: number | null
          id?: string
          is_featured?: boolean | null
          mime_type?: string
          original_name?: string
          price_cents?: number | null
          quality_level?: string | null
          storage_path?: string
          storage_url?: string
          tags?: Json | null
          tier?: string | null
          updated_at?: string | null
          user_id?: string | null
          width?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchases: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          id: string
          image_id: string
          license_type: string
          payment_method: string
          payment_status: string
          paypal_order_id: string | null
          paypal_payment_id: string | null
          purchased_at: string
          stripe_session_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount_paid: number
          created_at?: string
          currency?: string
          id?: string
          image_id: string
          license_type?: string
          payment_method?: string
          payment_status?: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          purchased_at?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          image_id?: string
          license_type?: string
          payment_method?: string
          payment_status?: string
          paypal_order_id?: string | null
          paypal_payment_id?: string | null
          purchased_at?: string
          stripe_session_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchases_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_interval: string
          created_at: string | null
          current_period_end: string
          current_period_start: string | null
          features: Json | null
          id: string
          plan_type: string
          price_monthly: number
          price_yearly: number
          status: string
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_interval?: string
          created_at?: string | null
          current_period_end: string
          current_period_start?: string | null
          features?: Json | null
          id?: string
          plan_type: string
          price_monthly: number
          price_yearly: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_interval?: string
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string | null
          features?: Json | null
          id?: string
          plan_type?: string
          price_monthly?: number
          price_yearly?: number
          status?: string
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_downloads: {
        Row: {
          created_at: string | null
          download_type: string
          downloaded_at: string | null
          file_size: number | null
          id: string
          image_id: string
          purchase_id: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          download_type: string
          downloaded_at?: string | null
          file_size?: number | null
          id?: string
          image_id: string
          purchase_id?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          download_type?: string
          downloaded_at?: string | null
          file_size?: number | null
          id?: string
          image_id?: string
          purchase_id?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_downloads_image_id_fkey"
            columns: ["image_id"]
            isOneToOne: false
            referencedRelation: "images"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_downloads_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_downloads_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_user_image_access: {
        Args: { p_user_id: string; p_image_id: string }
        Returns: {
          has_access: boolean
          access_type: string
          subscription_plan: string
          download_count: number
          monthly_limit: number
        }[]
      }
      get_user_gallery_access: {
        Args: { p_user_id: string }
        Returns: {
          subscription_plan: string
          subscription_status: string
          monthly_downloads: number
          monthly_limit: number
          purchased_images_count: number
          access_tiers: string[]
        }[]
      }
      record_download: {
        Args: { p_user_id: string; p_image_id: string; p_file_size?: number }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

