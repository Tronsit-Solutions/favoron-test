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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          metadata: Json | null
          priority: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          metadata?: Json | null
          priority?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      package_messages: {
        Row: {
          content: string | null
          created_at: string
          file_name: string | null
          file_type: string | null
          file_url: string | null
          id: string
          message_type: string
          package_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type: string
          package_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string | null
          created_at?: string
          file_name?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          message_type?: string
          package_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_package_messages_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_package_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          additional_notes: string | null
          admin_actions_log: Json | null
          confirmed_delivery_address: Json | null
          created_at: string
          delivery_deadline: string
          delivery_method: string | null
          estimated_price: number | null
          id: string
          incident_flag: boolean | null
          internal_notes: string | null
          item_description: string
          item_link: string | null
          matched_trip_dates: Json | null
          matched_trip_id: string | null
          office_delivery: Json | null
          package_destination: string
          payment_receipt: Json | null
          products_data: Json | null
          purchase_confirmation: Json | null
          purchase_origin: string
          quote: Json | null
          status: string
          tracking_info: Json | null
          traveler_address: Json | null
          traveler_confirmation: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          confirmed_delivery_address?: Json | null
          created_at?: string
          delivery_deadline: string
          delivery_method?: string | null
          estimated_price?: number | null
          id?: string
          incident_flag?: boolean | null
          internal_notes?: string | null
          item_description: string
          item_link?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination: string
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin: string
          quote?: Json | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          confirmed_delivery_address?: Json | null
          created_at?: string
          delivery_deadline?: string
          delivery_method?: string | null
          estimated_price?: number | null
          id?: string
          incident_flag?: boolean | null
          internal_notes?: string | null
          item_description?: string
          item_link?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination?: string
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin?: string
          quote?: Json | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_packages_matched_trip"
            columns: ["matched_trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_orders: {
        Row: {
          amount: number
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          completed_at: string | null
          created_at: string
          id: string
          notes: string | null
          package_id: string
          receipt_filename: string | null
          receipt_url: string | null
          status: string
          traveler_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id: string
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          traveler_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_holder?: string
          bank_account_number?: string
          bank_account_type?: string
          bank_name?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          traveler_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_order_package"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payment_order_traveler"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_name: string | null
          bank_swift_code: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      trips: {
        Row: {
          arrival_date: string
          available_space: number | null
          created_at: string
          delivery_date: string
          delivery_method: string | null
          departure_date: string
          first_day_packages: string
          from_city: string
          from_country: string | null
          id: string
          last_day_packages: string
          messenger_pickup_info: Json | null
          package_receiving_address: Json
          status: string
          to_city: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arrival_date: string
          available_space?: number | null
          created_at?: string
          delivery_date: string
          delivery_method?: string | null
          departure_date: string
          first_day_packages: string
          from_city: string
          from_country?: string | null
          id?: string
          last_day_packages: string
          messenger_pickup_info?: Json | null
          package_receiving_address: Json
          status?: string
          to_city: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arrival_date?: string
          available_space?: number | null
          created_at?: string
          delivery_date?: string
          delivery_method?: string | null
          departure_date?: string
          first_day_packages?: string
          from_city?: string
          from_country?: string | null
          id?: string
          last_day_packages?: string
          messenger_pickup_info?: Json | null
          package_receiving_address?: Json
          status?: string
          to_city?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string | null
          assigned_by: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string | null
          assigned_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      archive_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          _user_id: string
          _title: string
          _message: string
          _type?: string
          _priority?: string
          _action_url?: string
          _metadata?: Json
        }
        Returns: string
      }
      get_database_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          table_name: string
          row_count: number
          table_size: string
          index_size: string
        }[]
      }
      get_monthly_reports: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          period_year: number
          period_month: number
          month_name: string
          total_packages: number
          total_trips: number
          successful_matches: number
          completed_deliveries: number
          pending_requests: number
          total_revenue: number
          traveler_tips: number
          favoron_revenue: number
          average_ticket: number
          gmv_total: number
          packages_by_status: Json
          trips_by_status: Json
          top_destinations: Json
          top_origins: Json
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _package_id: string
          _admin_id: string
          _action_type: string
          _action_description: string
          _additional_data?: Json
        }
        Returns: undefined
      }
    }
    Enums: {
      trust_level: "basic" | "earned" | "verified"
      user_role: "admin" | "user"
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
      trust_level: ["basic", "earned", "verified"],
      user_role: ["admin", "user"],
    },
  },
} as const
