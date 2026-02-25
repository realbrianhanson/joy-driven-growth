export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          clicked_count: number | null
          completed_at: string | null
          completed_count: number | null
          created_at: string
          delivered_count: number | null
          form_id: string | null
          id: string
          message_template: string | null
          name: string
          opened_count: number | null
          recipients: Json | null
          scheduled_at: string | null
          sent_count: number | null
          status: Database["public"]["Enums"]["campaign_status"] | null
          total_recipients: number | null
          type: Database["public"]["Enums"]["campaign_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          clicked_count?: number | null
          completed_at?: string | null
          completed_count?: number | null
          created_at?: string
          delivered_count?: number | null
          form_id?: string | null
          id?: string
          message_template?: string | null
          name: string
          opened_count?: number | null
          recipients?: Json | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          total_recipients?: number | null
          type?: Database["public"]["Enums"]["campaign_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          clicked_count?: number | null
          completed_at?: string | null
          completed_count?: number | null
          created_at?: string
          delivered_count?: number | null
          form_id?: string | null
          id?: string
          message_template?: string | null
          name?: string
          opened_count?: number | null
          recipients?: Json | null
          scheduled_at?: string | null
          sent_count?: number | null
          status?: Database["public"]["Enums"]["campaign_status"] | null
          total_recipients?: number | null
          type?: Database["public"]["Enums"]["campaign_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      forms: {
        Row: {
          collect_audio: boolean | null
          collect_text: boolean | null
          collect_video: boolean | null
          created_at: string
          custom_questions: Json | null
          id: string
          incentive_enabled: boolean | null
          incentive_type: string | null
          incentive_value: string | null
          is_published: boolean | null
          logo_url: string | null
          name: string
          primary_color: string | null
          require_photo: boolean | null
          require_rating: boolean | null
          slug: string
          submission_count: number | null
          thank_you_message: string | null
          thank_you_title: string | null
          updated_at: string
          user_id: string
          welcome_message: string | null
          welcome_title: string | null
        }
        Insert: {
          collect_audio?: boolean | null
          collect_text?: boolean | null
          collect_video?: boolean | null
          created_at?: string
          custom_questions?: Json | null
          id?: string
          incentive_enabled?: boolean | null
          incentive_type?: string | null
          incentive_value?: string | null
          is_published?: boolean | null
          logo_url?: string | null
          name: string
          primary_color?: string | null
          require_photo?: boolean | null
          require_rating?: boolean | null
          slug: string
          submission_count?: number | null
          thank_you_message?: string | null
          thank_you_title?: string | null
          updated_at?: string
          user_id: string
          welcome_message?: string | null
          welcome_title?: string | null
        }
        Update: {
          collect_audio?: boolean | null
          collect_text?: boolean | null
          collect_video?: boolean | null
          created_at?: string
          custom_questions?: Json | null
          id?: string
          incentive_enabled?: boolean | null
          incentive_type?: string | null
          incentive_value?: string | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string
          primary_color?: string | null
          require_photo?: boolean | null
          require_rating?: boolean | null
          slug?: string
          submission_count?: number | null
          thank_you_message?: string | null
          thank_you_title?: string | null
          updated_at?: string
          user_id?: string
          welcome_message?: string | null
          welcome_title?: string | null
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          metadata: Json | null
          testimonial_ids: string[]
          type: Database["public"]["Enums"]["content_type"]
          user_id: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          testimonial_ids: string[]
          type: Database["public"]["Enums"]["content_type"]
          user_id: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          metadata?: Json | null
          testimonial_ids?: string[]
          type?: Database["public"]["Enums"]["content_type"]
          user_id?: string
          video_url?: string | null
        }
        Relationships: []
      }
      integrations: {
        Row: {
          access_token: string | null
          created_at: string
          id: string
          is_connected: boolean | null
          last_synced_at: string | null
          provider: string
          refresh_token: string | null
          settings: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider: string
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          created_at?: string
          id?: string
          is_connected?: boolean | null
          last_synced_at?: string | null
          provider?: string
          refresh_token?: string | null
          settings?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_logo: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          industry: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          industry?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          company_logo?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          industry?: string | null
          timezone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      revenue_events: {
        Row: {
          amount: number
          attributed_at: string
          created_at: string
          currency: string | null
          customer_email: string | null
          id: string
          metadata: Json | null
          source: string | null
          stripe_payment_id: string | null
          testimonial_id: string | null
          user_id: string
          widget_id: string | null
        }
        Insert: {
          amount: number
          attributed_at?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          stripe_payment_id?: string | null
          testimonial_id?: string | null
          user_id: string
          widget_id?: string | null
        }
        Update: {
          amount?: number
          attributed_at?: string
          created_at?: string
          currency?: string | null
          customer_email?: string | null
          id?: string
          metadata?: Json | null
          source?: string | null
          stripe_payment_id?: string | null
          testimonial_id?: string | null
          user_id?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "revenue_events_testimonial_id_fkey"
            columns: ["testimonial_id"]
            isOneToOne: false
            referencedRelation: "testimonials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "revenue_events_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      testimonials: {
        Row: {
          ai_summary: string | null
          approved_at: string | null
          audio_url: string | null
          author_avatar: string | null
          author_company: string | null
          author_email: string | null
          author_name: string
          author_title: string | null
          collected_at: string | null
          content: string | null
          created_at: string
          custom_fields: Json | null
          form_id: string | null
          id: string
          is_featured: boolean | null
          rating: number | null
          revenue_attributed: number | null
          sentiment: Database["public"]["Enums"]["sentiment"] | null
          source: string | null
          source_url: string | null
          status: Database["public"]["Enums"]["testimonial_status"] | null
          tags: string[] | null
          thumbnail_url: string | null
          type: Database["public"]["Enums"]["testimonial_type"] | null
          updated_at: string
          user_id: string
          video_url: string | null
        }
        Insert: {
          ai_summary?: string | null
          approved_at?: string | null
          audio_url?: string | null
          author_avatar?: string | null
          author_company?: string | null
          author_email?: string | null
          author_name: string
          author_title?: string | null
          collected_at?: string | null
          content?: string | null
          created_at?: string
          custom_fields?: Json | null
          form_id?: string | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          revenue_attributed?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          source?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["testimonial_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["testimonial_type"] | null
          updated_at?: string
          user_id: string
          video_url?: string | null
        }
        Update: {
          ai_summary?: string | null
          approved_at?: string | null
          audio_url?: string | null
          author_avatar?: string | null
          author_company?: string | null
          author_email?: string | null
          author_name?: string
          author_title?: string | null
          collected_at?: string | null
          content?: string | null
          created_at?: string
          custom_fields?: Json | null
          form_id?: string | null
          id?: string
          is_featured?: boolean | null
          rating?: number | null
          revenue_attributed?: number | null
          sentiment?: Database["public"]["Enums"]["sentiment"] | null
          source?: string | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["testimonial_status"] | null
          tags?: string[] | null
          thumbnail_url?: string | null
          type?: Database["public"]["Enums"]["testimonial_type"] | null
          updated_at?: string
          user_id?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "testimonials_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "forms"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      walls: {
        Row: {
          accent_color: string | null
          background_color: string | null
          columns: number | null
          created_at: string
          custom_domain: string | null
          header_subtitle: string | null
          header_title: string | null
          id: string
          is_published: boolean | null
          layout: string | null
          logo_url: string | null
          name: string
          slug: string
          testimonial_ids: string[] | null
          updated_at: string
          user_id: string
          views: number | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          columns?: number | null
          created_at?: string
          custom_domain?: string | null
          header_subtitle?: string | null
          header_title?: string | null
          id?: string
          is_published?: boolean | null
          layout?: string | null
          logo_url?: string | null
          name: string
          slug: string
          testimonial_ids?: string[] | null
          updated_at?: string
          user_id: string
          views?: number | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          columns?: number | null
          created_at?: string
          custom_domain?: string | null
          header_subtitle?: string | null
          header_title?: string | null
          id?: string
          is_published?: boolean | null
          layout?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          testimonial_ids?: string[] | null
          updated_at?: string
          user_id?: string
          views?: number | null
        }
        Relationships: []
      }
      widgets: {
        Row: {
          auto_rotate: boolean | null
          clicks: number | null
          conversions: number | null
          created_at: string
          custom_css: string | null
          embed_code: string | null
          id: string
          impressions: number | null
          is_active: boolean | null
          name: string
          revenue_attributed: number | null
          settings: Json | null
          show_date: boolean | null
          show_rating: boolean | null
          testimonial_ids: string[] | null
          theme: string | null
          type: Database["public"]["Enums"]["widget_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_rotate?: boolean | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          custom_css?: string | null
          embed_code?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name: string
          revenue_attributed?: number | null
          settings?: Json | null
          show_date?: boolean | null
          show_rating?: boolean | null
          testimonial_ids?: string[] | null
          theme?: string | null
          type?: Database["public"]["Enums"]["widget_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_rotate?: boolean | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string
          custom_css?: string | null
          embed_code?: string | null
          id?: string
          impressions?: number | null
          is_active?: boolean | null
          name?: string
          revenue_attributed?: number | null
          settings?: Json | null
          show_date?: boolean | null
          show_rating?: boolean | null
          testimonial_ids?: string[] | null
          theme?: string | null
          type?: Database["public"]["Enums"]["widget_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_form_submissions: {
        Args: { form_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "member" | "viewer"
      campaign_status: "draft" | "scheduled" | "active" | "completed" | "paused"
      campaign_type: "sms" | "email"
      content_type:
        | "twitter_thread"
        | "linkedin_post"
        | "instagram_carousel"
        | "email_snippet"
        | "case_study"
        | "quote_graphic"
        | "video_highlight"
        | "ai_avatar"
      sentiment: "positive" | "neutral" | "negative"
      testimonial_status: "pending" | "approved" | "rejected"
      testimonial_type: "text" | "video" | "audio"
      widget_type: "carousel" | "grid" | "single" | "popup" | "fomo" | "inline"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "member", "viewer"],
      campaign_status: ["draft", "scheduled", "active", "completed", "paused"],
      campaign_type: ["sms", "email"],
      content_type: [
        "twitter_thread",
        "linkedin_post",
        "instagram_carousel",
        "email_snippet",
        "case_study",
        "quote_graphic",
        "video_highlight",
        "ai_avatar",
      ],
      sentiment: ["positive", "neutral", "negative"],
      testimonial_status: ["pending", "approved", "rejected"],
      testimonial_type: ["text", "video", "audio"],
      widget_type: ["carousel", "grid", "single", "popup", "fomo", "inline"],
    },
  },
} as const
