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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      centrals: {
        Row: {
          ac_power_ok: boolean | null
          battery_ok: boolean | null
          created_at: string
          id: string
          ip_address: string | null
          last_communication: string | null
          location: string | null
          model: string | null
          name: string
          online: boolean | null
          serial_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ac_power_ok?: boolean | null
          battery_ok?: boolean | null
          created_at?: string
          id?: string
          ip_address?: string | null
          last_communication?: string | null
          location?: string | null
          model?: string | null
          name: string
          online?: boolean | null
          serial_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ac_power_ok?: boolean | null
          battery_ok?: boolean | null
          created_at?: string
          id?: string
          ip_address?: string | null
          last_communication?: string | null
          location?: string | null
          model?: string | null
          name?: string
          online?: boolean | null
          serial_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      events: {
        Row: {
          central_id: string | null
          created_at: string
          description: string
          id: string
          timestamp: string
          type: string
          zone: string | null
        }
        Insert: {
          central_id?: string | null
          created_at?: string
          description: string
          id?: string
          timestamp?: string
          type: string
          zone?: string | null
        }
        Update: {
          central_id?: string | null
          created_at?: string
          description?: string
          id?: string
          timestamp?: string
          type?: string
          zone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
      intercom_requests: {
        Row: {
          camera_url: string | null
          central_id: string
          created_at: string
          id: string
          image_snapshot: string | null
          responded_at: string | null
          responded_by: string | null
          status: string
        }
        Insert: {
          camera_url?: string | null
          central_id: string
          created_at?: string
          id?: string
          image_snapshot?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Update: {
          camera_url?: string | null
          central_id?: string
          created_at?: string
          id?: string
          image_snapshot?: string | null
          responded_at?: string | null
          responded_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "intercom_requests_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
      people: {
        Row: {
          central_id: string
          company_name: string | null
          created_at: string
          document_number: string | null
          document_type: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          status: Database["public"]["Enums"]["person_status"]
          type: Database["public"]["Enums"]["person_type"]
          updated_at: string
        }
        Insert: {
          central_id: string
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          type: Database["public"]["Enums"]["person_type"]
          updated_at?: string
        }
        Update: {
          central_id?: string
          company_name?: string | null
          created_at?: string
          document_number?: string | null
          document_type?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          status?: Database["public"]["Enums"]["person_status"]
          type?: Database["public"]["Enums"]["person_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "people_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry: {
        Row: {
          central_id: string
          created_at: string
          current: number | null
          humidity: number | null
          id: string
          power: number | null
          temperature: number | null
          timestamp: string
        }
        Insert: {
          central_id: string
          created_at?: string
          current?: number | null
          humidity?: number | null
          id?: string
          power?: number | null
          temperature?: number | null
          timestamp?: string
        }
        Update: {
          central_id?: string
          created_at?: string
          current?: number | null
          humidity?: number | null
          id?: string
          power?: number | null
          temperature?: number | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
      telemetry_thresholds: {
        Row: {
          central_id: string
          created_at: string
          enabled: boolean
          id: string
          max_value: number | null
          metric: string
          min_value: number | null
          updated_at: string
        }
        Insert: {
          central_id: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_value?: number | null
          metric: string
          min_value?: number | null
          updated_at?: string
        }
        Update: {
          central_id?: string
          created_at?: string
          enabled?: boolean
          id?: string
          max_value?: number | null
          metric?: string
          min_value?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "telemetry_thresholds_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
      zones: {
        Row: {
          central_id: string
          created_at: string
          id: string
          location: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          central_id: string
          created_at?: string
          id?: string
          location: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          central_id?: string
          created_at?: string
          id?: string
          location?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "zones_central_id_fkey"
            columns: ["central_id"]
            isOneToOne: false
            referencedRelation: "centrals"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      person_status: "allowed" | "blocked"
      person_type: "resident" | "visitor" | "service_provider"
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
      person_status: ["allowed", "blocked"],
      person_type: ["resident", "visitor", "service_provider"],
    },
  },
} as const
