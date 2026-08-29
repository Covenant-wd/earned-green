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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          body: string
          course_id: string | null
          created_at: string
          created_by: string | null
          id: string
          is_published: boolean
          published_at: string
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          course_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          is_published?: boolean
          published_at?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_submissions: {
        Row: {
          assignment_id: string
          content: string | null
          created_at: string
          feedback: string | null
          file_url: string | null
          graded_at: string | null
          graded_by: string | null
          id: string
          score: number | null
          status: string
          submitted_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assignment_id: string
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assignment_id?: string
          content?: string | null
          created_at?: string
          feedback?: string | null
          file_url?: string | null
          graded_at?: string | null
          graded_by?: string | null
          id?: string
          score?: number | null
          status?: string
          submitted_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignment_submissions_assignment_id_fkey"
            columns: ["assignment_id"]
            isOneToOne: false
            referencedRelation: "assignments"
            referencedColumns: ["id"]
          },
        ]
      }
      assignments: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          instructions: string | null
          is_published: boolean
          lesson_id: string | null
          max_score: number
          submission_type: string
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id?: string | null
          max_score?: number
          submission_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          instructions?: string | null
          is_published?: boolean
          lesson_id?: string | null
          max_score?: number
          submission_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "assignments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignments_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          created_at: string
          duration_seconds: number
          id: string
          joined_at: string | null
          left_at: string | null
          session_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          duration_seconds?: number
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          duration_seconds?: number
          id?: string
          joined_at?: string | null
          left_at?: string | null
          session_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      course_instructors: {
        Row: {
          course_id: string
          created_at: string
          id: string
          is_lead: boolean
          teacher_id: string
          title: string | null
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          is_lead?: boolean
          teacher_id: string
          title?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          is_lead?: boolean
          teacher_id?: string
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_instructors_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          duration_weeks: number | null
          id: string
          is_published: boolean
          learning_objectives: string[]
          level: string
          slug: string
          sort_order: number
          subtitle: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[]
          level?: string
          slug: string
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration_weeks?: number | null
          id?: string
          is_published?: boolean
          learning_objectives?: string[]
          level?: string
          slug?: string
          sort_order?: number
          subtitle?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          access_expires_at: string | null
          course_id: string
          created_at: string
          enrolled_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_expires_at?: string | null
          course_id: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_expires_at?: string | null
          course_id?: string
          created_at?: string
          enrolled_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          course_id: string
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watched_recording: boolean
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          course_id: string
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_recording?: boolean
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          course_id?: string
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_recording?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
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
          description: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean
          is_published: boolean
          module_id: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          module_id: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean
          is_published?: boolean
          module_id?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_sessions: {
        Row: {
          chat_locked: boolean
          course_id: string
          created_at: string
          description: string | null
          duration_minutes: number
          ended_at: string | null
          id: string
          lesson_id: string | null
          module_id: string | null
          provider: string
          recording_enabled: boolean
          room_name: string | null
          started_at: string | null
          starts_at: string
          status: string
          teacher_id: string | null
          timezone: string
          title: string
          updated_at: string
        }
        Insert: {
          chat_locked?: boolean
          course_id: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          provider?: string
          recording_enabled?: boolean
          room_name?: string | null
          started_at?: string | null
          starts_at: string
          status?: string
          teacher_id?: string | null
          timezone?: string
          title: string
          updated_at?: string
        }
        Update: {
          chat_locked?: boolean
          course_id?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string | null
          provider?: string
          recording_enabled?: boolean
          room_name?: string | null
          started_at?: string | null
          starts_at?: string
          status?: string
          teacher_id?: string | null
          timezone?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "live_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_sessions_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      modules: {
        Row: {
          course_id: string
          created_at: string
          description: string | null
          id: string
          is_published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
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
          id: string
          link: string | null
          message: string
          metadata: Json
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          link?: string | null
          message: string
          metadata?: Json
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          link?: string | null
          message?: string
          metadata?: Json
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_plans: {
        Row: {
          access_days: number | null
          billing_interval: string
          course_id: string
          created_at: string
          currency: string
          description: string | null
          id: string
          interval_count: number
          is_active: boolean
          is_archived: boolean
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          access_days?: number | null
          billing_interval?: string
          course_id: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval_count?: number
          is_active?: boolean
          is_archived?: boolean
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          access_days?: number | null
          billing_interval?: string
          course_id?: string
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          interval_count?: number
          is_active?: boolean
          is_archived?: boolean
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_plans_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json
          paid_at: string | null
          plan_id: string | null
          provider: string
          provider_ref: string
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_id?: string | null
          provider?: string
          provider_ref: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_id?: string | null
          provider?: string
          provider_ref?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          timezone: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          timezone?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      recordings: {
        Row: {
          course_id: string
          created_at: string
          duration_seconds: number | null
          external_url: string | null
          id: string
          is_available: boolean
          lesson_id: string | null
          session_id: string | null
          status: string
          storage_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          course_id: string
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          is_available?: boolean
          lesson_id?: string | null
          session_id?: string | null
          status?: string
          storage_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          duration_seconds?: number | null
          external_url?: string | null
          id?: string
          is_available?: boolean
          lesson_id?: string | null
          session_id?: string | null
          status?: string
          storage_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "recordings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          content: string | null
          course_id: string
          created_at: string
          created_by: string | null
          id: string
          is_public: boolean
          lesson_id: string | null
          session_id: string | null
          sort_order: number
          storage_path: string | null
          title: string
          type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          content?: string | null
          course_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          lesson_id?: string | null
          session_id?: string | null
          sort_order?: number
          storage_path?: string | null
          title: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          content?: string | null
          course_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_public?: boolean
          lesson_id?: string | null
          session_id?: string | null
          sort_order?: number
          storage_path?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resources_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      session_messages: {
        Row: {
          created_at: string
          id: string
          message: string
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "live_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          course_id: string
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_id: string | null
          provider: string | null
          provider_ref: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean
          course_id: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          course_id?: string
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_id?: string | null
          provider?: string | null
          provider_ref?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "payment_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      system_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
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
      has_course_access: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
      teaches_course: {
        Args: { _course_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "teacher" | "student"
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
      app_role: ["admin", "teacher", "student"],
    },
  },
} as const
