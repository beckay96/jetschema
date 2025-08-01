export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      chat_messages: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message_text: string
          project_id: string
          reply_to_message_id: string | null
          tagged_fields: Json | null
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message_text: string
          project_id: string
          reply_to_message_id?: string | null
          tagged_fields?: Json | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message_text?: string
          project_id?: string
          reply_to_message_id?: string | null
          tagged_fields?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "database_projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      database_functions: {
        Row: {
          author_id: string
          created_at: string
          cron_schedule: string | null
          description: string | null
          edge_function_name: string | null
          function_body: string | null
          function_type: string
          id: string
          is_cron_enabled: boolean | null
          is_edge_function: boolean | null
          name: string
          parameters: Json | null
          project_id: string
          return_type: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          cron_schedule?: string | null
          description?: string | null
          edge_function_name?: string | null
          function_body?: string | null
          function_type: string
          id?: string
          is_cron_enabled?: boolean | null
          is_edge_function?: boolean | null
          name: string
          parameters?: Json | null
          project_id: string
          return_type?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          cron_schedule?: string | null
          description?: string | null
          edge_function_name?: string | null
          function_body?: string | null
          function_type?: string
          id?: string
          is_cron_enabled?: boolean | null
          is_edge_function?: boolean | null
          name?: string
          parameters?: Json | null
          project_id?: string
          return_type?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      database_indexes: {
        Row: {
          author_id: string
          columns: string[]
          created_at: string
          description: string | null
          id: string
          index_type: string
          is_partial: boolean
          is_unique: boolean
          name: string
          project_id: string
          table_name: string
          updated_at: string
          where_clause: string | null
        }
        Insert: {
          author_id: string
          columns: string[]
          created_at?: string
          description?: string | null
          id?: string
          index_type?: string
          is_partial?: boolean
          is_unique?: boolean
          name: string
          project_id: string
          table_name: string
          updated_at?: string
          where_clause?: string | null
        }
        Update: {
          author_id?: string
          columns?: string[]
          created_at?: string
          description?: string | null
          id?: string
          index_type?: string
          is_partial?: boolean
          is_unique?: boolean
          name?: string
          project_id?: string
          table_name?: string
          updated_at?: string
          where_clause?: string | null
        }
        Relationships: []
      }
      database_policies: {
        Row: {
          author_id: string
          command: string
          created_at: string
          description: string | null
          id: string
          is_permissive: boolean
          name: string
          project_id: string
          role: string | null
          table_name: string
          updated_at: string
          using_expression: string | null
          with_check_expression: string | null
        }
        Insert: {
          author_id: string
          command: string
          created_at?: string
          description?: string | null
          id?: string
          is_permissive?: boolean
          name: string
          project_id: string
          role?: string | null
          table_name: string
          updated_at?: string
          using_expression?: string | null
          with_check_expression?: string | null
        }
        Update: {
          author_id?: string
          command?: string
          created_at?: string
          description?: string | null
          id?: string
          is_permissive?: boolean
          name?: string
          project_id?: string
          role?: string | null
          table_name?: string
          updated_at?: string
          using_expression?: string | null
          with_check_expression?: string | null
        }
        Relationships: []
      }
      database_projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_public: boolean
          name: string
          project_data: Json
          team_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name: string
          project_data?: Json
          team_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_public?: boolean
          name?: string
          project_data?: Json
          team_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "database_projects_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      database_triggers: {
        Row: {
          author_id: string
          conditions: string | null
          created_at: string
          function_id: string | null
          id: string
          is_active: boolean | null
          name: string
          project_id: string
          table_name: string
          trigger_event: string
          trigger_timing: string
          updated_at: string
        }
        Insert: {
          author_id: string
          conditions?: string | null
          created_at?: string
          function_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          project_id: string
          table_name: string
          trigger_event: string
          trigger_timing: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          conditions?: string | null
          created_at?: string
          function_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          project_id?: string
          table_name?: string
          trigger_event?: string
          trigger_timing?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "database_triggers_function_id_fkey"
            columns: ["function_id"]
            isOneToOne: false
            referencedRelation: "database_functions"
            referencedColumns: ["id"]
          },
        ]
      }
      database_validations: {
        Row: {
          affected_element_id: string | null
          affected_element_name: string | null
          affected_element_type: string | null
          created_at: string
          id: string
          message: string
          project_id: string
          suggestion: string | null
          updated_at: string
          validation_type: string
        }
        Insert: {
          affected_element_id?: string | null
          affected_element_name?: string | null
          affected_element_type?: string | null
          created_at?: string
          id?: string
          message: string
          project_id: string
          suggestion?: string | null
          updated_at?: string
          validation_type: string
        }
        Update: {
          affected_element_id?: string | null
          affected_element_name?: string | null
          affected_element_type?: string | null
          created_at?: string
          id?: string
          message?: string
          project_id?: string
          suggestion?: string | null
          updated_at?: string
          validation_type?: string
        }
        Relationships: []
      }
      field_comments: {
        Row: {
          author_id: string
          comment_text: string
          created_at: string
          field_name: string
          id: string
          is_completed: boolean
          is_read: boolean
          project_id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          author_id: string
          comment_text: string
          created_at?: string
          field_name: string
          id?: string
          is_completed?: boolean
          is_read?: boolean
          project_id: string
          table_name: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          comment_text?: string
          created_at?: string
          field_name?: string
          id?: string
          is_completed?: boolean
          is_read?: boolean
          project_id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "field_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "database_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          id: string
          invited_by: string | null
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          invited_by?: string | null
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_edit_project: {
        Args: { project_uuid: string; user_uuid: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { team_uuid: string; user_uuid: string }
        Returns: boolean
      }
    }
    Enums: {
      team_role: "owner" | "admin" | "editor" | "viewer"
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
      team_role: ["owner", "admin", "editor", "viewer"],
    },
  },
} as const
