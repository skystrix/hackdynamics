export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          applied_at: string | null
          candidate_id: string
          cover_letter: string | null
          id: string
          job_id: string
          resume_url: string
          status: string
          updated_at: string | null
        }
        Insert: {
          applied_at?: string | null
          candidate_id: string
          cover_letter?: string | null
          id?: string
          job_id: string
          resume_url: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          applied_at?: string | null
          candidate_id?: string
          cover_letter?: string | null
          id?: string
          job_id?: string
          resume_url?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      candidate_feedback: {
        Row: {
          application_id: string
          author_id: string
          comment: string
          created_at: string | null
          id: string
          rating: number
          stage: string
        }
        Insert: {
          application_id: string
          author_id: string
          comment: string
          created_at?: string | null
          id?: string
          rating: number
          stage: string
        }
        Update: {
          application_id?: string
          author_id?: string
          comment?: string
          created_at?: string | null
          id?: string
          rating?: number
          stage?: string
        }
        Relationships: [
          {
            foreignKeyName: "candidate_feedback_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      interview_slots: {
        Row: {
          candidate_id: string
          created_at: string | null
          end_time: string
          id: string
          job_id: string
          location: string | null
          meeting_url: string | null
          notes: string | null
          recruiter_id: string
          start_time: string
          status: string
          updated_at: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string | null
          end_time: string
          id?: string
          job_id: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          recruiter_id: string
          start_time: string
          status?: string
          updated_at?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string | null
          end_time?: string
          id?: string
          job_id?: string
          location?: string | null
          meeting_url?: string | null
          notes?: string | null
          recruiter_id?: string
          start_time?: string
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interview_slots_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_analytics: {
        Row: {
          applications: number | null
          avg_time_on_page: number | null
          conversion_rate: number | null
          id: string
          job_id: string
          source_breakdown: Json | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          applications?: number | null
          avg_time_on_page?: number | null
          conversion_rate?: number | null
          id?: string
          job_id: string
          source_breakdown?: Json | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          applications?: number | null
          avg_time_on_page?: number | null
          conversion_rate?: number | null
          id?: string
          job_id?: string
          source_breakdown?: Json | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "job_analytics_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          application_count: number | null
          benefits: string[] | null
          company: string
          created_at: string | null
          deadline: string | null
          description: string
          id: string
          is_active: boolean | null
          location: string
          logo: string | null
          posted_at: string | null
          recruiter_id: string
          requirements: string[] | null
          salary: string | null
          skills: string[]
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          application_count?: number | null
          benefits?: string[] | null
          company: string
          created_at?: string | null
          deadline?: string | null
          description: string
          id?: string
          is_active?: boolean | null
          location: string
          logo?: string | null
          posted_at?: string | null
          recruiter_id: string
          requirements?: string[] | null
          salary?: string | null
          skills: string[]
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          application_count?: number | null
          benefits?: string[] | null
          company?: string
          created_at?: string | null
          deadline?: string | null
          description?: string
          id?: string
          is_active?: boolean | null
          location?: string
          logo?: string | null
          posted_at?: string | null
          recruiter_id?: string
          requirements?: string[] | null
          salary?: string | null
          skills?: string[]
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          attachment_type: string | null
          attachment_url: string | null
          content: string
          id: string
          is_read: boolean | null
          job_id: string | null
          receiver_id: string
          sender_id: string
          timestamp: string | null
        }
        Insert: {
          attachment_type?: string | null
          attachment_url?: string | null
          content: string
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          receiver_id: string
          sender_id: string
          timestamp?: string | null
        }
        Update: {
          attachment_type?: string | null
          attachment_url?: string | null
          content?: string
          id?: string
          is_read?: boolean | null
          job_id?: string | null
          receiver_id?: string
          sender_id?: string
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string | null
          first_name: string | null
          id: string
          last_name: string | null
          location: string | null
          role: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          location?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          location?: string | null
          role?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
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
  public: {
    Enums: {},
  },
} as const
