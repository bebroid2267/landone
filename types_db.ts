import { Session } from '@supabase/supabase-js'

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'customers_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      images: {
        Row: {
          id: string
          short_id: string
          user_id: string | null
          prompt: string
          negative_prompt: string | null
          image_url: string
          thumbnail_url: string | null
          width: number
          height: number
          model: string
          model_style: string
          steps: number
          seed: number | null
          cfg_scale: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          format: 'jpeg' | 'png' | 'webp'
          created_at: string
          updated_at: string
          metadata: Json | null
          cost: number | null
          user_cost: number | null
        }
        Insert: {
          id?: string
          short_id: string
          user_id?: string | null
          prompt: string
          negative_prompt?: string | null
          image_url: string
          thumbnail_url?: string | null
          width: number
          height: number
          model: string
          model_style: string
          steps: number
          seed?: number | null
          cfg_scale: number
          status: 'pending' | 'processing' | 'completed' | 'failed'
          format: 'jpeg' | 'png' | 'webp'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          cost?: number | null
          user_cost?: number | null
        }
        Update: {
          id?: string
          short_id?: string
          user_id?: string | null
          prompt?: string
          negative_prompt?: string | null
          image_url?: string
          thumbnail_url?: string | null
          width?: number
          height?: number
          model?: string
          model_style?: string
          steps?: number
          seed?: number | null
          cfg_scale?: number
          status?: 'pending' | 'processing' | 'completed' | 'failed'
          format?: 'jpeg' | 'png' | 'webp'
          created_at?: string
          updated_at?: string
          metadata?: Json | null
          cost?: number | null
          user_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'images_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      songs: {
        Row: {
          id: string
          user_id: string | null
          title: string | null
          prompt: string | null
          negative_prompt: string | null
          song_url: string | null
          preview_url: string | null
          duration: number | null
          tempo: number | null
          model: string | null
          genre: Database['public']['Enums']['genre_type'] | null
          mood: string | null
          lyrics: string | null
          instruments: string[] | null
          vocals: boolean | null
          status: string | null
          created_at: string | null
          updated_at: string | null
          metadata: Json | null
          short_id: string
          format: Database['public']['Enums']['audio_format'] | null
          model_style: string | null
          cost: number | null
          user_cost: number | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title?: string | null
          prompt?: string | null
          negative_prompt?: string | null
          song_url?: string | null
          preview_url?: string | null
          duration?: number | null
          tempo?: number | null
          model?: string | null
          genre?: Database['public']['Enums']['genre_type'] | null
          mood?: string | null
          lyrics?: string | null
          instruments?: string[] | null
          vocals?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
          short_id: string
          format?: Database['public']['Enums']['audio_format'] | null
          model_style?: string | null
          cost?: number | null
          user_cost?: number | null
        }
        Update: {
          id?: string
          user_id?: string | null
          title?: string | null
          prompt?: string | null
          negative_prompt?: string | null
          song_url?: string | null
          preview_url?: string | null
          duration?: number | null
          tempo?: number | null
          model?: string | null
          genre?: Database['public']['Enums']['genre_type'] | null
          mood?: string | null
          lyrics?: string | null
          instruments?: string[] | null
          vocals?: boolean | null
          status?: string | null
          created_at?: string | null
          updated_at?: string | null
          metadata?: Json | null
          short_id?: string
          format?: Database['public']['Enums']['audio_format'] | null
          model_style?: string | null
          cost?: number | null
          user_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'songs_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      presentations: {
        Row: {
          id: string
          user_id: string | null
          presentation_name: string
          presentation_data: string
          gpt_token: string | null
          last_modified: Date
          created_at: Date
          preview: string
          keywords: string[]
        }
        Insert: {
          id?: string
          user_id?: string | null
          presentation_name?: string
          presentation_data?: string
          gpt_token?: string | null
          last_modified?: Date
          created_at?: Date
          preview?: string
          keywords?: string[]
        }
        Update: {
          id?: string
          user_id?: string | null
          presentation_name?: string
          presentation_data?: string
          gpt_token?: string | null
          last_modified?: Date
          created_at?: Date
          preview?: string
          keywords?: string[]
        }
        Relationships: [
          {
            foreignKeyName: 'presentations_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      one_time_token_gpt: {
        Row: {
          id: string
          code: string
          token_type: Session['token_type']
          access_token: Session['access_token']
          refresh_token: Session['refresh_token']
          expires_in: Session['expires_in']
          created_at: string | Date
        }
        Insert: Partial<{
          id: string
          code: string
          token_type: Session['token_type']
          access_token: Session['access_token']
          refresh_token: Session['refresh_token']
          expires_in: Session['expires_in']
          created_at: string | Date
        }>
        Update: Partial<{
          id: string
          code: string
          token_type: Session['token_type']
          access_token: Session['access_token']
          refresh_token: Session['refresh_token']
          expires_in: Session['expires_in']
          created_at: string | Date
        }>
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database['public']['Enums']['pricing_plan_interval'] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database['public']['Enums']['pricing_type'] | null
          unit_amount: number | null
          product?: Database['public']['Tables']['products']['Row']
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database['public']['Enums']['pricing_type'] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database['public']['Enums']['pricing_plan_interval'] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database['public']['Enums']['pricing_type'] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: 'prices_product_id_fkey'
            columns: ['product_id']
            referencedRelation: 'products'
            referencedColumns: ['id']
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
          prices?: Database['public']['Tables']['prices']['Row'][]
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database['public']['Enums']['subscription_status'] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
          price?: Database['public']['Tables']['prices']['Row']
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database['public']['Enums']['subscription_status'] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database['public']['Enums']['subscription_status'] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'subscriptions_price_id_fkey'
            columns: ['price_id']
            referencedRelation: 'prices'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'subscriptions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      users: {
        Row: {
          email: string
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          consent_status: Database['public']['Enums']['consent_status']
          presentation_count: number
          payment_method: Json | null
          user_request: string | null
          gpt_id: string | null
        }
        Insert: {
          email?: string
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          consent_status?: Database['public']['Enums']['consent_status']
          presentation_count?: number
          payment_method?: Json | null
          user_request?: string | null
          gpt_id?: string | null
        }
        Update: {
          email?: string
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          consent_status?: Database['public']['Enums']['consent_status']
          presentation_count?: number
          payment_method?: Json | null
          user_request?: string | null
          gpt_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'users_id_fkey'
            columns: ['id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      user_tokens: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          tokens_remaining: number
          tokens_used: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          tokens_remaining?: number
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          tokens_remaining?: number
          tokens_used?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'user_tokens_user_id_fkey'
            columns: ['user_id']
            isOneToOne: false
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'user_tokens_subscription_id_fkey'
            columns: ['subscription_id']
            isOneToOne: false
            referencedRelation: 'subscriptions'
            referencedColumns: ['id']
          },
        ]
      }
      deleted_images: {
        Row: {
          id: string
          original_image_id: string
          user_id: string | null
          short_id: string
          prompt: string
          negative_prompt: string | null
          image_url: string
          thumbnail_url: string | null
          width: number
          height: number
          model: string
          model_style: string
          steps: number
          seed: number | null
          cfg_scale: number
          status: string
          format: string
          cost: number | null
          user_cost: number | null
          created_at: string
          deleted_at: string
          restore_available_until: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          original_image_id: string
          user_id?: string | null
          short_id: string
          prompt: string
          negative_prompt?: string | null
          image_url: string
          thumbnail_url?: string | null
          width: number
          height: number
          model: string
          model_style: string
          steps: number
          seed?: number | null
          cfg_scale: number
          status: string
          format: string
          cost?: number | null
          user_cost?: number | null
          created_at: string
          deleted_at: string
          restore_available_until: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          original_image_id?: string
          user_id?: string | null
          short_id?: string
          prompt?: string
          negative_prompt?: string | null
          image_url?: string
          thumbnail_url?: string | null
          width?: number
          height?: number
          model?: string
          model_style?: string
          steps?: number
          seed?: number | null
          cfg_scale?: number
          status?: string
          format?: string
          cost?: number | null
          user_cost?: number | null
          created_at?: string
          deleted_at?: string
          restore_available_until?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'deleted_images_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      deleted_subscriptions: {
        Row: {
          id: string
          original_subscription_id: string
          user_id: string
          status: Database['public']['Enums']['subscription_status'] | null
          price_id: string | null
          quantity: number | null
          cancel_at_period_end: boolean | null
          created: string
          current_period_start: string
          current_period_end: string
          ended_at: string | null
          cancel_at: string | null
          canceled_at: string | null
          trial_start: string | null
          trial_end: string | null
          deleted_at: string
          metadata: Json | null
        }
        Insert: {
          id?: string
          original_subscription_id: string
          user_id: string
          status?: Database['public']['Enums']['subscription_status'] | null
          price_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created: string
          current_period_start: string
          current_period_end: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          deleted_at: string
          metadata?: Json | null
        }
        Update: {
          id?: string
          original_subscription_id?: string
          user_id?: string
          status?: Database['public']['Enums']['subscription_status'] | null
          price_id?: string | null
          quantity?: number | null
          cancel_at_period_end?: boolean | null
          created?: string
          current_period_start?: string
          current_period_end?: string
          ended_at?: string | null
          cancel_at?: string | null
          canceled_at?: string | null
          trial_start?: string | null
          trial_end?: string | null
          deleted_at?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: 'deleted_subscriptions_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      google_ads_tokens: {
        Row: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_token?: string
          refresh_token?: string
          expires_at?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'google_ads_tokens_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      google_ads_accounts: {
        Row: {
          id: string
          user_id: string
          account_id: string
          account_name: string | null
          currency_code: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          account_name?: string | null
          currency_code?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          account_name?: string | null
          currency_code?: string | null
          timezone?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'google_ads_accounts_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      google_ads_reports_cache: {
        Row: {
          id: string
          user_id: string
          account_id: string
          time_range: string
          campaign_id: string | null
          report_content: string
          cache_key: string
          created_at: string
          updated_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          user_id: string
          account_id: string
          time_range: string
          campaign_id?: string | null
          report_content: string
          cache_key: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          account_id?: string
          time_range?: string
          campaign_id?: string | null
          report_content?: string
          cache_key?: string
          created_at?: string
          updated_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'google_ads_reports_cache_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
      report_usage: {
        Row: {
          id: string
          user_id: string
          report_type: string
          account_id: string | null
          time_range: string | null
          campaign_id: string | null
          generated_at: string
          week_start: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          report_type?: string
          account_id?: string | null
          time_range?: string | null
          campaign_id?: string | null
          generated_at?: string
          week_start: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          report_type?: string
          account_id?: string | null
          time_range?: string | null
          campaign_id?: string | null
          generated_at?: string
          week_start?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'report_usage_user_id_fkey'
            columns: ['user_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: {
      v_gpt_callback: {
        Row: {
          id: number
          create_at: Date
          gpt_id: string
          gpt: string | null
        }

        Relationships: []
      }
    }

    Functions: {
      get_google_ads_tokens: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          user_id: string
          access_token: string
          refresh_token: string
          expires_at: string
          created_at: string
          updated_at: string
        }[]
      }
      update_google_ads_tokens: {
        Args: {
          p_user_id: string
          p_access_token: string
          p_refresh_token: string
          p_expires_at: string
        }
        Returns: void
      }
      insert_google_ads_tokens: {
        Args: {
          p_user_id: string
          p_access_token: string
          p_refresh_token: string
          p_expires_at: string
        }
        Returns: void
      }
      delete_google_ads_accounts: {
        Args: { p_user_id: string }
        Returns: void
      }
      insert_google_ads_account: {
        Args: {
          p_user_id: string
          p_account_id: string
          p_account_name: string | null
        }
        Returns: void
      }
      get_google_ads_accounts: {
        Args: { p_user_id: string }
        Returns: {
          id: string
          user_id: string
          account_id: string
          account_name: string | null
          currency_code: string | null
          timezone: string | null
          created_at: string
          updated_at: string
        }[]
      }
    }
    Enums: {
      consent_status: 'not_specified' | 'consented' | 'declined'
      pricing_plan_interval: 'day' | 'week' | 'month' | 'year'
      pricing_type: 'one_time' | 'recurring'
      subscription_status:
        | 'trialing'
        | 'active'
        | 'canceled'
        | 'incomplete'
        | 'incomplete_expired'
        | 'past_due'
        | 'unpaid'
        | 'paused'
      audio_format: 'mp3' | 'wav' | 'ogg' | 'flac'
      genre_type:
        | 'pop'
        | 'rock'
        | 'electronic'
        | 'hip_hop'
        | 'jazz'
        | 'classical'
        | 'folk'
        | 'ambient'
        | 'other'
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
