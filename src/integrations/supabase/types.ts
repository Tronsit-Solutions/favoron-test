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
        ]
      }
      customer_photos: {
        Row: {
          consent_date: string | null
          created_at: string
          customer_consent: boolean
          customer_name: string | null
          id: string
          image_url: string
          product_description: string
          sort_order: number | null
          status: string
          updated_at: string
          uploaded_by: string | null
          usage_type: string | null
        }
        Insert: {
          consent_date?: string | null
          created_at?: string
          customer_consent?: boolean
          customer_name?: string | null
          id?: string
          image_url: string
          product_description: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string | null
        }
        Update: {
          consent_date?: string | null
          created_at?: string
          customer_consent?: boolean
          customer_name?: string | null
          id?: string
          image_url?: string
          product_description?: string
          sort_order?: number | null
          status?: string
          updated_at?: string
          uploaded_by?: string | null
          usage_type?: string | null
        }
        Relationships: []
      }
      favoron_company_information: {
        Row: {
          account_holder: string
          account_number: string
          account_type: string
          address_line_1: string | null
          address_line_2: string | null
          bank_name: string
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          phone_number: string | null
          postal_code: string | null
          state_department: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          account_holder: string
          account_number: string
          account_type?: string
          address_line_1?: string | null
          address_line_2?: string | null
          bank_name: string
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          postal_code?: string | null
          state_department?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string
          account_type?: string
          address_line_1?: string | null
          address_line_2?: string | null
          bank_name?: string
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          postal_code?: string | null
          state_department?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      label_counter: {
        Row: {
          created_at: string | null
          current_count: number
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_count?: number
          id?: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_count?: number
          id?: string
          updated_at?: string | null
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
          admin_assigned_tip: number | null
          admin_rejection: Json | null
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
          label_number: number | null
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
          quote_rejection: Json | null
          rejection_reason: string | null
          status: string
          tracking_info: Json | null
          traveler_address: Json | null
          traveler_confirmation: Json | null
          traveler_rejection: Json | null
          updated_at: string
          user_id: string
          wants_requote: boolean | null
        }
        Insert: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          admin_assigned_tip?: number | null
          admin_rejection?: Json | null
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
          label_number?: number | null
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
          quote_rejection?: Json | null
          rejection_reason?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          traveler_rejection?: Json | null
          updated_at?: string
          user_id: string
          wants_requote?: boolean | null
        }
        Update: {
          additional_notes?: string | null
          admin_actions_log?: Json | null
          admin_assigned_tip?: number | null
          admin_rejection?: Json | null
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
          label_number?: number | null
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
          quote_rejection?: Json | null
          rejection_reason?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          traveler_rejection?: Json | null
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
          payment_type: string
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
          payment_type?: string
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
          payment_type?: string
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
            foreignKeyName: "payment_orders_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      prime_memberships: {
        Row: {
          amount: number
          approved_at: string | null
          approved_by: string | null
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          created_at: string | null
          expires_at: string | null
          id: string
          notes: string | null
          receipt_filename: string | null
          receipt_url: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder: string
          bank_account_number: string
          bank_account_type?: string
          bank_name: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          approved_at?: string | null
          approved_by?: string | null
          bank_account_holder?: string
          bank_account_number?: string
          bank_account_type?: string
          bank_name?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          notes?: string | null
          receipt_filename?: string | null
          receipt_url?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prime_memberships_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prime_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          country_code: string | null
          created_at: string | null
          email: string | null
          email_notification_preferences: Json | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          prime_expires_at: string | null
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          prime_expires_at?: string | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          country_code?: string | null
          created_at?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          prime_expires_at?: string | null
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
          payment_completed_at: string | null
          payment_completed_by: string | null
          payment_order_created: boolean
          payment_receipt_filename: string | null
          payment_receipt_url: string | null
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
          payment_completed_at?: string | null
          payment_completed_by?: string | null
          payment_order_created?: boolean
          payment_receipt_filename?: string | null
          payment_receipt_url?: string | null
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
          payment_completed_at?: string | null
          payment_completed_by?: string | null
          payment_order_created?: boolean
          payment_receipt_filename?: string | null
          payment_receipt_url?: string | null
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
          admin_rejection: Json | null
          arrival_date: string
          available_space: number | null
          client_request_id: string | null
          created_at: string
          delivery_date: string
          delivery_method: string | null
          departure_date: string
          first_day_packages: string
          from_city: string
          from_country: string | null
          id: string
          last_day_packages: string
          last_mile_delivered: boolean
          messenger_pickup_info: Json | null
          package_receiving_address: Json
          rejection_reason: string | null
          status: string
          to_city: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_rejection?: Json | null
          arrival_date: string
          available_space?: number | null
          client_request_id?: string | null
          created_at?: string
          delivery_date: string
          delivery_method?: string | null
          departure_date: string
          first_day_packages: string
          from_city: string
          from_country?: string | null
          id?: string
          last_day_packages: string
          last_mile_delivered?: boolean
          messenger_pickup_info?: Json | null
          package_receiving_address: Json
          rejection_reason?: string | null
          status?: string
          to_city: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_rejection?: Json | null
          arrival_date?: string
          available_space?: number | null
          client_request_id?: string | null
          created_at?: string
          delivery_date?: string
          delivery_method?: string | null
          departure_date?: string
          first_day_packages?: string
          from_city?: string
          from_country?: string | null
          id?: string
          last_day_packages?: string
          last_mile_delivered?: boolean
          messenger_pickup_info?: Json | null
          package_receiving_address?: Json
          rejection_reason?: string | null
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
      user_financial_data: {
        Row: {
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_account_type: string | null
          bank_name: string | null
          bank_swift_code: string | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_account_type?: string | null
          bank_name?: string | null
          bank_swift_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_financial_data_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
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
      accept_quote: {
        Args: { _package_id: string }
        Returns: undefined
      }
      activate_prime_membership: {
        Args: { _user_id: string }
        Returns: undefined
      }
      admin_assign_prime_membership: {
        Args: {
          _is_paid?: boolean
          _notes?: string
          _payment_reference?: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_confirm_office_delivery: {
        Args: { _admin_id: string; _package_id: string }
        Returns: undefined
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
      audit_financial_data_access: {
        Args: {
          _access_type: string
          _data_type: string
          _masked?: boolean
          _user_id: string
        }
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
      expire_prime_memberships: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      expire_unresponded_assignments: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_admin_trips_with_user: {
        Args: Record<PropertyKey, never>
        Returns: {
          arrival_date: string
          available_space: number
          created_at: string
          delivery_date: string
          delivery_method: string
          departure_date: string
          email: string
          first_day_packages: string
          first_name: string
          from_city: string
          from_country: string
          id: string
          last_day_packages: string
          last_name: string
          messenger_pickup_info: Json
          package_receiving_address: Json
          phone_number: string
          status: string
          to_city: string
          updated_at: string
          user_display_name: string
          user_id: string
          username: string
        }[]
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
        Args: { _package_id?: string }
        Returns: {
          account_holder: string
          account_number: string
          account_type: string
          bank_name: string
        }[]
      }
      get_masked_payment_order_info: {
        Args: { order_id: string }
        Returns: {
          account_number_masked: string
          amount: number
          bank_name_masked: string
          created_at: string
          id: string
          status: string
          traveler_id: string
          trip_id: string
        }[]
      }
      get_monthly_reports: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_next_label_number: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      get_public_profile_data: {
        Args: { target_user_id?: string }
        Returns: {
          avatar_url: string
          created_at: string
          first_name: string
          id: string
          last_name: string
          username: string
        }[]
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
      log_admin_profile_access: {
        Args: {
          _access_type: string
          _accessed_profile_id: string
          _reason?: string
        }
        Returns: undefined
      }
      mask_account_number: {
        Args: { _account_number: string }
        Returns: string
      }
      send_assignment_warnings: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_quote_reminders: {
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
      validate_banking_info: {
        Args: {
          _account_holder: string
          _account_number: string
          _bank_name: string
        }
        Returns: boolean
      }
      verify_admin_access: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      verify_authenticated: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      trust_level: "basic" | "confiable" | "prime"
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
      trust_level: ["basic", "confiable", "prime"],
      user_role: ["admin", "user"],
    },
  },
} as const
