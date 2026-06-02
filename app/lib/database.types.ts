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
          bazi_reading_unlocked_at: string | null;
          tieu_van_reading_expires_at: string | null;
          la_so_recompute_status: "pending" | "ready" | "failed" | null;
          birth_edit_count: number;
          birth_edit_window_start: string | null;
          timezone: string;
          birth_data_locked_at: string | null;
          onboarding_completed_at: string | null;
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
          bazi_reading_unlocked_at?: string | null;
          tieu_van_reading_expires_at?: string | null;
          la_so_recompute_status?: "pending" | "ready" | "failed" | null;
          birth_edit_count?: number;
          birth_edit_window_start?: string | null;
          timezone?: string;
          birth_data_locked_at?: string | null;
          onboarding_completed_at?: string | null;
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
          bazi_reading_unlocked_at?: string | null;
          tieu_van_reading_expires_at?: string | null;
          la_so_recompute_status?: "pending" | "ready" | "failed" | null;
          birth_edit_count?: number;
          birth_edit_window_start?: string | null;
          timezone?: string;
          birth_data_locked_at?: string | null;
          onboarding_completed_at?: string | null;
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
      day_luan_ask_idempotency: {
        Row: {
          id: string;
          thread_id: string;
          idempotency_key: string;
          question: string;
          answer: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
      day_luan_threads: {
        Row: {
          id: string;
          user_id: string;
          day_iso: string;
          birth_revision: string;
          luan_context: Json;
          anchor_reading: string;
          messages: Json;
          follow_up_count: number;
          created_at: string;
          updated_at: string;
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
          expires_at: string | null;
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
      bazi_reading_deliveries: {
        Row: {
          id: string;
          user_id: string;
          flow_year: number;
          birth_revision: string;
          content_version: string;
          sections: Json;
          la_so_display: Json | null;
          luu_nien_facts: Json | null;
          phong_thuy_facts: Json | null;
          year_can_chi: string;
          generated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flow_year: number;
          birth_revision: string;
          content_version: string;
          sections: Json;
          la_so_display?: Json | null;
          luu_nien_facts?: Json | null;
          phong_thuy_facts?: Json | null;
          year_can_chi?: string;
          generated_at?: string;
          updated_at?: string;
        };
        Update: {
          birth_revision?: string;
          content_version?: string;
          sections?: Json;
          la_so_display?: Json | null;
          luu_nien_facts?: Json | null;
          phong_thuy_facts?: Json | null;
          year_can_chi?: string;
          generated_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      van_trinh_nam_deliveries: {
        Row: {
          id: string;
          user_id: string;
          flow_year: number;
          birth_revision: string;
          content_version: string;
          engine_version: string;
          luan_context: Json;
          sections: Json;
          year_can_chi: string;
          generated_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          flow_year: number;
          birth_revision: string;
          content_version: string;
          engine_version?: string;
          luan_context: Json;
          sections: Json;
          year_can_chi?: string;
          generated_at?: string;
          updated_at?: string;
        };
        Update: {
          birth_revision?: string;
          content_version?: string;
          engine_version?: string;
          luan_context?: Json;
          sections?: Json;
          year_can_chi?: string;
          generated_at?: string;
          updated_at?: string;
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
      saved_picks: {
        Row: {
          id: string;
          user_id: string;
          saved_at: string;
          source_endpoint: string;
          payload: Json;
          label: string | null;
          day_iso: string | null;
          score: number | null;
          intent: string | null;
          note: string | null;
          source: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          saved_at?: string;
          source_endpoint: string;
          payload: Json;
          label?: string | null;
          day_iso?: string | null;
          score?: number | null;
          intent?: string | null;
          note?: string | null;
          source?: string | null;
        };
        Update: {
          source_endpoint?: string;
          payload?: Json;
          label?: string | null;
          day_iso?: string | null;
          score?: number | null;
          intent?: string | null;
          note?: string | null;
          source?: string | null;
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
