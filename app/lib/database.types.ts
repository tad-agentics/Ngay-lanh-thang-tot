/** Regenerate with `supabase gen types typescript --project-id <ref>` after schema changes. */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          display_name: string | null;
          ngay_sinh: string | null;
          gio_sinh: string | null;
          gioi_tinh: "nam" | "nu" | null;
          la_so: Json | null;
          credits_balance: number;
          referral_code: string;
          referred_by: string | null;
          subscription_expires_at: string | null;
          birth_data_locked_at: string | null;
          onboarding_completed_at: string | null;
          push_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          display_name?: string | null;
          ngay_sinh?: string | null;
          gio_sinh?: string | null;
          gioi_tinh?: "nam" | "nu" | null;
          la_so?: Json | null;
          credits_balance?: number;
          referral_code?: string;
          referred_by?: string | null;
          subscription_expires_at?: string | null;
          birth_data_locked_at?: string | null;
          onboarding_completed_at?: string | null;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          display_name?: string | null;
          ngay_sinh?: string | null;
          gio_sinh?: string | null;
          gioi_tinh?: "nam" | "nu" | null;
          la_so?: Json | null;
          credits_balance?: number;
          referral_code?: string;
          referred_by?: string | null;
          subscription_expires_at?: string | null;
          birth_data_locked_at?: string | null;
          onboarding_completed_at?: string | null;
          push_enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      feature_credit_costs: {
        Row: {
          feature_key: string;
          credit_cost: number;
          is_free: boolean;
          updated_at: string;
        };
        Insert: {
          feature_key: string;
          credit_cost?: number;
          is_free?: boolean;
          updated_at?: string;
        };
        Update: {
          credit_cost?: number;
          is_free?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      app_config: {
        Row: {
          config_key: string;
          value: string;
          updated_at: string;
        };
        Insert: {
          config_key: string;
          value: string;
          updated_at?: string;
        };
        Update: {
          value?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      credit_ledger: {
        Row: {
          id: string;
          user_id: string;
          delta: number;
          balance_after: number;
          reason: string;
          feature_key: string | null;
          idempotency_key: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      payment_orders: {
        Row: {
          id: string;
          user_id: string;
          provider: string;
          provider_order_code: string | null;
          status: string;
          package_sku: string;
          credits_to_add: number | null;
          subscription_months: number | null;
          amount_vnd: number | null;
          checkout_url: string | null;
          raw_request: Json | null;
          raw_webhook: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          provider: string;
          event_id: string;
          processed_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      share_tokens: {
        Row: {
          id: string;
          token: string;
          user_id: string | null;
          result_type: string;
          payload: Json;
          expires_at: string | null;
          created_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      push_subscriptions: {
        Row: {
          id: string;
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          user_id: string;
          endpoint: string;
          p256dh: string;
          auth: string;
          user_agent?: string | null;
        };
        Update: {
          p256dh?: string;
          auth?: string;
          user_agent?: string | null;
        };
        Relationships: [];
      };
      tieu_van_unlocks: {
        Row: {
          id: string;
          user_id: string;
          year_month: string;
          identity_key: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          user_id: string;
          year_month: string;
          identity_key: string;
          payload: Json;
          id?: string;
          created_at?: string;
        };
        Update: {
          payload?: Json;
          created_at?: string;
        };
        Relationships: [];
      };
      reading_cache: {
        Row: {
          cache_key: string;
          reading: string;
          created_at: string;
          expires_at: string;
        };
        Insert: {
          cache_key: string;
          reading: string;
          created_at?: string;
          expires_at: string;
        };
        Update: {
          reading?: string;
          created_at?: string;
          expires_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      apply_referral_pair: {
        Args: { p_referee_id: string; p_referrer_id: string };
        Returns: undefined;
      };
    };
    Enums: Record<string, never>;
  };
}
