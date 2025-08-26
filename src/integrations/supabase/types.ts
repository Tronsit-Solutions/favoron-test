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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_profile_access_log: {
        Row: {
          access_type: string
          accessed_at: string | null
          accessed_profile_id: string
          admin_user_id: string
          id: string
          reason: string | null
          session_info: Json | null
        }
        Insert: {
          access_type: string
          accessed_at?: string | null
          accessed_profile_id: string
          admin_user_id: string
          id?: string
          reason?: string | null
          session_info?: Json | null
        }
        Update: {
          access_type?: string
          accessed_at?: string | null
          accessed_profile_id?: string
          admin_user_id?: string
          id?: string
          reason?: string | null
          session_info?: Json | null
        }
        Relationships: []
      }
      client_errors: {
        Row: {
          browser: Json | null
          context: Json | null
          created_at: string
          fingerprint: string | null
          id: string
          message: string
          name: string | null
          referrer: string | null
          route: string | null
          session_id: string | null
          severity: string | null
          stack: string | null
          type: string | null
          url: string | null
          user_id: string | null
        }
        Insert: {
          browser?: Json | null
          context?: Json | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          message: string
          name?: string | null
          referrer?: string | null
          route?: string | null
          session_id?: string | null
          severity?: string | null
          stack?: string | null
          type?: string | null
          url?: string | null
          user_id?: string | null
        }
        Update: {
          browser?: Json | null
          context?: Json | null
          created_at?: string
          fingerprint?: string | null
          id?: string
          message?: string
          name?: string | null
          referrer?: string | null
          route?: string | null
          session_id?: string | null
          severity?: string | null
          stack?: string | null
          type?: string | null
          url?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_errors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      favoron_bank_accounts: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string
          bank_name: string
          created_at: string
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type?: string
          bank_name: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string
          bank_name?: string
          created_at?: string
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
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
            referencedRelation: "package_products_view"
            referencedColumns: ["package_id"]
          },
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
          {
            foreignKeyName: "fk_package_messages_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          additional_notes: string | null
          admin_actions_log: Json | null
          admin_assigned_tip: number | null
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
          matched_assignment_expires_at: string | null
          matched_trip_dates: Json | null
          matched_trip_id: string | null
          office_delivery: Json | null
          package_destination: string
          payment_receipt: Json | null
          products_data: Json | null
          purchase_confirmation: Json | null
          purchase_origin: string
          quote: Json | null
          quote_expires_at: string | null
          rejection_reason: string | null
          status: string
          tracking_info: Json | null
          traveler_address: Json | null
          traveler_confirmation: Json | null
          updated_at: string
          user_id: string
          wants_requote: boolean | null
        }
        Insert: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          admin_assigned_tip?: number | null
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
          matched_assignment_expires_at?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination: string
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin: string
          quote?: Json | null
          quote_expires_at?: string | null
          rejection_reason?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          updated_at?: string
          user_id: string
          wants_requote?: boolean | null
        }
        Update: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          admin_assigned_tip?: number | null
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
          matched_assignment_expires_at?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination?: string
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin?: string
          quote?: Json | null
          quote_expires_at?: string | null
          rejection_reason?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          updated_at?: string
          user_id?: string
          wants_requote?: boolean | null
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
          {
            foreignKeyName: "packages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
          historical_packages: Json | null
          id: string
          notes: string | null
          receipt_filename: string | null
          receipt_url: string | null
          status: string
          traveler_id: string
          trip_id: string
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
          historical_packages?: Json | null
          id?: string
          notes?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          traveler_id: string
          trip_id: string
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
          historical_packages?: Json | null
          id?: string
          notes?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          traveler_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_payment_order_traveler"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_payment_order_traveler"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
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
          country_code: string | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          email_notification_preferences: Json | null
          email_notifications: boolean | null
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
          country_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
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
          country_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
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
      trip_payment_accumulator: {
        Row: {
          accumulated_amount: number
          all_packages_delivered: boolean | null
          created_at: string
          delivered_packages_count: number
          id: string
          payment_order_created: boolean
          total_packages_count: number
          traveler_id: string
          trip_id: string
          updated_at: string
        }
        Insert: {
          accumulated_amount?: number
          all_packages_delivered?: boolean | null
          created_at?: string
          delivered_packages_count?: number
          id?: string
          payment_order_created?: boolean
          total_packages_count?: number
          traveler_id: string
          trip_id: string
          updated_at?: string
        }
        Update: {
          accumulated_amount?: number
          all_packages_delivered?: boolean | null
          created_at?: string
          delivered_packages_count?: number
          id?: string
          payment_order_created?: boolean
          total_packages_count?: number
          traveler_id?: string
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_payment_accumulator_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_payment_accumulator_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_payment_accumulator_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
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
      package_products_view: {
        Row: {
          admin_assigned_tip: number | null
          created_at: string | null
          estimated_price: number | null
          item_description: string | null
          item_link: string | null
          line_total: number | null
          package_destination: string | null
          package_id: string | null
          product_index: number | null
          purchase_origin: string | null
          quantity: number | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "packages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "packages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          first_name: string | null
          id: string | null
          last_name: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_confirm_office_delivery: {
        Args: { _admin_id: string; _package_id: string }
        Returns: undefined
      }
      admin_view_all_users: {
        Args: { access_reason?: string }
        Returns: {
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          bank_swift_code: string
          country_code: string
          created_at: string
          document_number: string
          document_type: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone_number: string
          trust_level: string
          user_role: string
          username: string
        }[]
      }
      admin_view_profile_banking: {
        Args: { access_reason: string; target_user_id: string }
        Returns: {
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          bank_swift_code: string
          id: string
        }[]
      }
      admin_view_profile_basic: {
        Args: { access_reason?: string; target_user_id: string }
        Returns: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          trust_level: string
          username: string
        }[]
      }
      admin_view_profile_sensitive: {
        Args: { access_reason: string; target_user_id: string }
        Returns: {
          country_code: string
          document_number: string
          document_type: string
          id: string
          phone_number: string
        }[]
      }
      archive_old_data: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      check_all_packages_delivered: {
        Args: { _trip_id: string }
        Returns: boolean
      }
      complete_past_trips_without_packages: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_notification: {
        Args: {
          _action_url?: string
          _message: string
          _metadata?: Json
          _priority?: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      create_notification_with_direct_email: {
        Args: {
          _action_url?: string
          _message: string
          _metadata?: Json
          _priority?: string
          _title: string
          _type?: string
          _user_id: string
        }
        Returns: string
      }
      create_payment_order_with_snapshot: {
        Args: {
          _amount: number
          _bank_account_holder: string
          _bank_account_number: string
          _bank_account_type: string
          _bank_name: string
          _traveler_id: string
          _trip_id: string
        }
        Returns: string
      }
      expire_old_quotes: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_unresponded_assignments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_database_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          index_size: string
          row_count: number
          table_name: string
          table_size: string
        }[]
      }
      get_favoron_bank_info: {
        Args: { _package_id: string }
        Returns: {
          account_holder: string
          account_number: string
          account_type: string
          bank_name: string
        }[]
      }
      get_monthly_reports: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_public_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_packages_completed: number
          total_tips_distributed: number
          total_trips: number
          total_users: number
        }[]
      }
      get_public_trips: {
        Args: Record<PropertyKey, never>
        Returns: {
          arrival_date: string
          departure_date: string
          from_city: string
          id: string
          status: string
          to_city: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_admin_action: {
        Args: {
          _action_description: string
          _action_type: string
          _additional_data?: Json
          _admin_id: string
          _package_id: string
        }
        Returns: undefined
      }
      send_assignment_warnings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      traveler_reject_assignment: {
        Args: {
          _additional_comments?: string
          _package_id: string
          _rejection_reason?: string
          _wants_requote?: boolean
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
