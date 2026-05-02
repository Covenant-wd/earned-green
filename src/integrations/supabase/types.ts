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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      admin_settings: {
        Row: {
          admin_wallet_address: string | null
          flutterwave_enabled: boolean
          id: string
          minipay_number: string | null
          payment_instructions: string | null
          referral_bonus_percent: number
          registration_fee: number
          usdt_to_kes_rate: number
          usdt_to_ngn_rate: number
        }
        Insert: {
          admin_wallet_address?: string | null
          flutterwave_enabled?: boolean
          id?: string
          minipay_number?: string | null
          payment_instructions?: string | null
          referral_bonus_percent?: number
          registration_fee?: number
          usdt_to_kes_rate?: number
          usdt_to_ngn_rate?: number
        }
        Update: {
          admin_wallet_address?: string | null
          flutterwave_enabled?: boolean
          id?: string
          minipay_number?: string | null
          payment_instructions?: string | null
          referral_bonus_percent?: number
          registration_fee?: number
          usdt_to_kes_rate?: number
          usdt_to_ngn_rate?: number
        }
        Relationships: []
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          id: string
          is_published: boolean
          sort_order: number | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_preferences: {
        Row: {
          broadcasts_enabled: boolean
          transactional_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          broadcasts_enabled?: boolean
          transactional_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          broadcasts_enabled?: boolean
          transactional_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      guides: {
        Row: {
          category: string | null
          content: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          content?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          is_published: boolean
          sort_order: number | null
          title: string
          updated_at: string
          video_url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          title: string
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          is_published?: boolean
          sort_order?: number | null
          title?: string
          updated_at?: string
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          email_sent: boolean
          email_status: string | null
          id: string
          link: string | null
          message: string
          metadata: Json | null
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_sent?: boolean
          email_status?: string | null
          id?: string
          link?: string | null
          message: string
          metadata?: Json | null
          read?: boolean
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_sent?: boolean
          email_status?: string | null
          id?: string
          link?: string | null
          message?: string
          metadata?: Json | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_intents: {
        Row: {
          completed_at: string | null
          created_at: string
          exchange_rate: number
          fiat_amount: number
          fiat_currency: string
          flw_tx_id: string | null
          id: string
          metadata: Json
          payment_link: string | null
          purpose: string
          status: string
          tx_ref: string
          updated_at: string
          usdt_amount: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          exchange_rate: number
          fiat_amount: number
          fiat_currency: string
          flw_tx_id?: string | null
          id?: string
          metadata?: Json
          payment_link?: string | null
          purpose: string
          status?: string
          tx_ref: string
          updated_at?: string
          usdt_amount: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          exchange_rate?: number
          fiat_amount?: number
          fiat_currency?: string
          flw_tx_id?: string | null
          id?: string
          metadata?: Json
          payment_link?: string | null
          purpose?: string
          status?: string
          tx_ref?: string
          updated_at?: string
          usdt_amount?: number
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          middle_name: string | null
          minipay_number: string | null
          payment_proof_url: string | null
          referral_code: string
          referred_by_id: string | null
          registration_status: string
          state: string | null
          updated_at: string
          usdt_balance: number
          user_id: string
          username: string
          wallet_address: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          minipay_number?: string | null
          payment_proof_url?: string | null
          referral_code: string
          referred_by_id?: string | null
          registration_status?: string
          state?: string | null
          updated_at?: string
          usdt_balance?: number
          user_id: string
          username: string
          wallet_address?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          middle_name?: string | null
          minipay_number?: string | null
          payment_proof_url?: string | null
          referral_code?: string
          referred_by_id?: string | null
          registration_status?: string
          state?: string | null
          updated_at?: string
          usdt_balance?: number
          user_id?: string
          username?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_referred_by_id_fkey"
            columns: ["referred_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_used_at: string
          p256dh: string
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_used_at?: string
          p256dh: string
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_used_at?: string
          p256dh?: string
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      task_completions: {
        Row: {
          id: string
          proof_url: string | null
          reviewed_at: string | null
          status: string
          submitted_at: string
          task_id: string
          user_id: string
        }
        Insert: {
          id?: string
          proof_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          task_id: string
          user_id: string
        }
        Update: {
          id?: string
          proof_url?: string | null
          reviewed_at?: string | null
          status?: string
          submitted_at?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_completions_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          external_completions: number
          id: string
          is_active: boolean
          link: string | null
          max_completions: number | null
          platform: string | null
          reward_amount: number
          status: string
          title: string
          type: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          external_completions?: number
          id?: string
          is_active?: boolean
          link?: string | null
          max_completions?: number | null
          platform?: string | null
          reward_amount?: number
          status?: string
          title: string
          type?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          external_completions?: number
          id?: string
          is_active?: boolean
          link?: string | null
          max_completions?: number | null
          platform?: string | null
          reward_amount?: number
          status?: string
          title?: string
          type?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          created_at: string
          id: string
          status: string
          tx_hash: string | null
          type: string
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          status?: string
          tx_hash?: string | null
          type: string
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          status?: string
          tx_hash?: string | null
          type?: string
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_task_completion: {
        Args: { _completion_id: string }
        Returns: Json
      }
      approve_user_registration: {
        Args: { _profile_id: string }
        Returns: Json
      }
      approve_withdrawal: {
        Args: { _transaction_id: string; _tx_hash: string }
        Returns: Json
      }
      generate_referral_code: { Args: never; Returns: string }
      get_user_downlines: {
        Args: { _profile_id: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          registration_status: string
          username: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      reject_task_completion: {
        Args: { _completion_id: string }
        Returns: Json
      }
      reject_user_registration: { Args: { _profile_id: string }; Returns: Json }
      reject_withdrawal: { Args: { _transaction_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
