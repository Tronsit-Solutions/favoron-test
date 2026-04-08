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
      app_settings: {
        Row: {
          description: string | null
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Update: {
          description?: string | null
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      boost_code_usage: {
        Row: {
          boost_amount: number
          boost_code_id: string
          id: string
          traveler_id: string
          trip_id: string
          used_at: string | null
        }
        Insert: {
          boost_amount: number
          boost_code_id: string
          id?: string
          traveler_id: string
          trip_id: string
          used_at?: string | null
        }
        Update: {
          boost_amount?: number
          boost_code_id?: string
          id?: string
          traveler_id?: string
          trip_id?: string
          used_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "boost_code_usage_boost_code_id_fkey"
            columns: ["boost_code_id"]
            isOneToOne: false
            referencedRelation: "boost_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_code_usage_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "boost_code_usage_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      boost_codes: {
        Row: {
          boost_type: string
          boost_value: number
          code: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_boost_amount: number | null
          max_uses: number | null
          single_use_per_user: boolean | null
          updated_at: string
        }
        Insert: {
          boost_type?: string
          boost_value: number
          code: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_boost_amount?: number | null
          max_uses?: number | null
          single_use_per_user?: boolean | null
          updated_at?: string
        }
        Update: {
          boost_type?: string
          boost_value?: number
          code?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_boost_amount?: number | null
          max_uses?: number | null
          single_use_per_user?: boolean | null
          updated_at?: string
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
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customer_experience_calls: {
        Row: {
          call_date: string | null
          call_status: string
          call_time: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          package_id: string
          rating: number | null
          scheduled_date: string | null
          target_user_id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          call_date?: string | null
          call_status?: string
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          package_id: string
          rating?: number | null
          scheduled_date?: string | null
          target_user_id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          call_date?: string | null
          call_status?: string
          call_time?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          package_id?: string
          rating?: number | null
          scheduled_date?: string | null
          target_user_id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_experience_calls_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_experience_calls_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_experience_calls_target_user_id_fkey"
            columns: ["target_user_id"]
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
      delivery_points: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          city: string
          country: string
          created_at: string | null
          email: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          name: string
          phone_number: string | null
          postal_code: string | null
          schedule: string | null
          state_province: string | null
          updated_at: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          city: string
          country: string
          created_at?: string | null
          email?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name: string
          phone_number?: string | null
          postal_code?: string | null
          schedule?: string | null
          state_province?: string | null
          updated_at?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          city?: string
          country?: string
          created_at?: string | null
          email?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          name?: string
          phone_number?: string | null
          postal_code?: string | null
          schedule?: string | null
          state_province?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      discount_code_usage: {
        Row: {
          discount_amount: number
          discount_code_id: string
          id: string
          package_id: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          discount_amount: number
          discount_code_id: string
          id?: string
          package_id: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          discount_amount?: number
          discount_code_id?: string
          id?: string
          package_id?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "discount_code_usage_discount_code_id_fkey"
            columns: ["discount_code_id"]
            isOneToOne: false
            referencedRelation: "discount_codes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usage_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discount_code_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      discount_codes: {
        Row: {
          code: string
          created_at: string | null
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_discount_amount: number | null
          max_uses: number | null
          min_order_amount: number | null
          single_use_per_user: boolean | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          description?: string | null
          discount_type: string
          discount_value: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          single_use_per_user?: boolean | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_discount_amount?: number | null
          max_uses?: number | null
          min_order_amount?: number | null
          single_use_per_user?: boolean | null
          updated_at?: string | null
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
          cancellation_penalty_amount: number | null
          city: string | null
          company_name: string | null
          country: string | null
          created_at: string
          delivery_fee_guatemala_city: number | null
          delivery_fee_guatemala_department: number | null
          delivery_fee_outside_city: number | null
          email: string | null
          id: string
          is_active: boolean
          phone_number: string | null
          postal_code: string | null
          prime_delivery_discount: number | null
          prime_membership_price: number | null
          prime_penalty_exempt: boolean | null
          service_fee_rate_prime: number | null
          service_fee_rate_standard: number | null
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
          cancellation_penalty_amount?: number | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          delivery_fee_guatemala_city?: number | null
          delivery_fee_guatemala_department?: number | null
          delivery_fee_outside_city?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          postal_code?: string | null
          prime_delivery_discount?: number | null
          prime_membership_price?: number | null
          prime_penalty_exempt?: boolean | null
          service_fee_rate_prime?: number | null
          service_fee_rate_standard?: number | null
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
          cancellation_penalty_amount?: number | null
          city?: string | null
          company_name?: string | null
          country?: string | null
          created_at?: string
          delivery_fee_guatemala_city?: number | null
          delivery_fee_guatemala_department?: number | null
          delivery_fee_outside_city?: number | null
          email?: string | null
          id?: string
          is_active?: boolean
          phone_number?: string | null
          postal_code?: string | null
          prime_delivery_discount?: number | null
          prime_membership_price?: number | null
          prime_penalty_exempt?: boolean | null
          service_fee_rate_prime?: number | null
          service_fee_rate_standard?: number | null
          state_department?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      incident_costs: {
        Row: {
          amount: number
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          month: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          month: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          month?: string
        }
        Relationships: []
      }
      job_applications: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          interest_type: string
          message: string | null
          phone: string | null
          resume_filename: string | null
          resume_url: string | null
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          interest_type?: string
          message?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          interest_type?: string
          message?: string | null
          phone?: string | null
          resume_filename?: string | null
          resume_url?: string | null
          status?: string
          updated_at?: string
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
      marketing_investments: {
        Row: {
          channel: string
          created_at: string | null
          created_by: string | null
          id: string
          investment: number
          month: string
          notes: string | null
          target_audience: string
          updated_at: string | null
        }
        Insert: {
          channel: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          investment?: number
          month: string
          notes?: string | null
          target_audience?: string
          updated_at?: string | null
        }
        Update: {
          channel?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          investment?: number
          month?: string
          notes?: string | null
          target_audience?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_investments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
      package_assignments: {
        Row: {
          admin_assigned_tip: number | null
          created_at: string
          dismissed_by_traveler: boolean
          expires_at: string | null
          id: string
          matched_trip_dates: Json | null
          package_id: string
          products_data: Json | null
          quote: Json | null
          quote_expires_at: string | null
          status: string
          traveler_address: Json | null
          trip_id: string
          updated_at: string
        }
        Insert: {
          admin_assigned_tip?: number | null
          created_at?: string
          dismissed_by_traveler?: boolean
          expires_at?: string | null
          id?: string
          matched_trip_dates?: Json | null
          package_id: string
          products_data?: Json | null
          quote?: Json | null
          quote_expires_at?: string | null
          status?: string
          traveler_address?: Json | null
          trip_id: string
          updated_at?: string
        }
        Update: {
          admin_assigned_tip?: number | null
          created_at?: string
          dismissed_by_traveler?: boolean
          expires_at?: string | null
          id?: string
          matched_trip_dates?: Json | null
          package_id?: string
          products_data?: Json | null
          quote?: Json | null
          quote_expires_at?: string | null
          status?: string
          traveler_address?: Json | null
          trip_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "package_assignments_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "package_assignments_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
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
          feedback_completed: boolean
          id: string
          incident_flag: boolean | null
          incident_history: Json
          incident_status: string | null
          internal_notes: string | null
          item_description: string
          item_link: string | null
          label_number: number | null
          matched_assignment_expires_at: string | null
          matched_trip_dates: Json | null
          matched_trip_id: string | null
          office_delivery: Json | null
          package_destination: string
          package_destination_country: string | null
          payment_method: string | null
          payment_receipt: Json | null
          products_data: Json | null
          purchase_confirmation: Json | null
          purchase_origin: string
          quote: Json | null
          quote_expires_at: string | null
          quote_rejection: Json | null
          recurrente_checkout_id: string | null
          recurrente_payment_id: string | null
          referral_credit_applied: number | null
          rejection_reason: string | null
          shopper_name_override: string | null
          status: string
          tracking_info: Json | null
          traveler_address: Json | null
          traveler_confirmation: Json | null
          traveler_dismissal: Json | null
          traveler_dismissed_at: string | null
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
          feedback_completed?: boolean
          id?: string
          incident_flag?: boolean | null
          incident_history?: Json
          incident_status?: string | null
          internal_notes?: string | null
          item_description: string
          item_link?: string | null
          label_number?: number | null
          matched_assignment_expires_at?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination: string
          package_destination_country?: string | null
          payment_method?: string | null
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin: string
          quote?: Json | null
          quote_expires_at?: string | null
          quote_rejection?: Json | null
          recurrente_checkout_id?: string | null
          recurrente_payment_id?: string | null
          referral_credit_applied?: number | null
          rejection_reason?: string | null
          shopper_name_override?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          traveler_dismissal?: Json | null
          traveler_dismissed_at?: string | null
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
          feedback_completed?: boolean
          id?: string
          incident_flag?: boolean | null
          incident_history?: Json
          incident_status?: string | null
          internal_notes?: string | null
          item_description?: string
          item_link?: string | null
          label_number?: number | null
          matched_assignment_expires_at?: string | null
          matched_trip_dates?: Json | null
          matched_trip_id?: string | null
          office_delivery?: Json | null
          package_destination?: string
          package_destination_country?: string | null
          payment_method?: string | null
          payment_receipt?: Json | null
          products_data?: Json | null
          purchase_confirmation?: Json | null
          purchase_origin?: string
          quote?: Json | null
          quote_expires_at?: string | null
          quote_rejection?: Json | null
          recurrente_checkout_id?: string | null
          recurrente_payment_id?: string | null
          referral_credit_applied?: number | null
          rejection_reason?: string | null
          shopper_name_override?: string | null
          status?: string
          tracking_info?: Json | null
          traveler_address?: Json | null
          traveler_confirmation?: Json | null
          traveler_dismissal?: Json | null
          traveler_dismissed_at?: string | null
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
      platform_reviews: {
        Row: {
          communication_quality: string
          consent_to_publish: boolean
          created_at: string
          id: string
          package_id: string
          process_was_clear: boolean
          rating: number
          review_text: string | null
          shopper_id: string
          would_recommend: boolean
          would_use_again: string
        }
        Insert: {
          communication_quality: string
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          package_id: string
          process_was_clear: boolean
          rating: number
          review_text?: string | null
          shopper_id: string
          would_recommend: boolean
          would_use_again: string
        }
        Update: {
          communication_quality?: string
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          package_id?: string
          process_was_clear?: boolean
          rating?: number
          review_text?: string | null
          shopper_id?: string
          would_recommend?: boolean
          would_use_again?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_reviews_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "platform_reviews_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_stats_snapshot: {
        Row: {
          id: string
          total_packages_completed: number
          total_tips_distributed: number
          total_trips: number
          total_users: number
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          id?: string
          total_packages_completed?: number
          total_tips_distributed?: number
          total_trips?: number
          total_users?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          id?: string
          total_packages_completed?: number
          total_tips_distributed?: number
          total_trips?: number
          total_users?: number
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
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
          ab_test_group: string | null
          acquisition_source: string | null
          acquisition_source_answered_at: string | null
          avatar_url: string | null
          ban_reason: string | null
          banned_at: string | null
          banned_by: string | null
          banned_until: string | null
          country_code: string | null
          created_at: string | null
          document_number: string | null
          document_type: string | null
          email: string | null
          email_notification_preferences: Json | null
          email_notifications: boolean | null
          first_name: string | null
          id: string
          is_banned: boolean | null
          last_name: string | null
          phone_number: string | null
          prime_expires_at: string | null
          referral_code: string | null
          referrer_name: string | null
          saved_addresses: Json | null
          traveler_avg_rating: number | null
          traveler_ontime_rate: number | null
          traveler_total_ratings: number | null
          trust_level: Database["public"]["Enums"]["trust_level"] | null
          ui_preferences: Json | null
          updated_at: string | null
          username: string | null
          whatsapp_notification_preferences: Json | null
          whatsapp_notifications: boolean | null
        }
        Insert: {
          ab_test_group?: string | null
          acquisition_source?: string | null
          acquisition_source_answered_at?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          country_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
          first_name?: string | null
          id: string
          is_banned?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          prime_expires_at?: string | null
          referral_code?: string | null
          referrer_name?: string | null
          saved_addresses?: Json | null
          traveler_avg_rating?: number | null
          traveler_ontime_rate?: number | null
          traveler_total_ratings?: number | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          ui_preferences?: Json | null
          updated_at?: string | null
          username?: string | null
          whatsapp_notification_preferences?: Json | null
          whatsapp_notifications?: boolean | null
        }
        Update: {
          ab_test_group?: string | null
          acquisition_source?: string | null
          acquisition_source_answered_at?: string | null
          avatar_url?: string | null
          ban_reason?: string | null
          banned_at?: string | null
          banned_by?: string | null
          banned_until?: string | null
          country_code?: string | null
          created_at?: string | null
          document_number?: string | null
          document_type?: string | null
          email?: string | null
          email_notification_preferences?: Json | null
          email_notifications?: boolean | null
          first_name?: string | null
          id?: string
          is_banned?: boolean | null
          last_name?: string | null
          phone_number?: string | null
          prime_expires_at?: string | null
          referral_code?: string | null
          referrer_name?: string | null
          saved_addresses?: Json | null
          traveler_avg_rating?: number | null
          traveler_ontime_rate?: number | null
          traveler_total_ratings?: number | null
          trust_level?: Database["public"]["Enums"]["trust_level"] | null
          ui_preferences?: Json | null
          updated_at?: string | null
          username?: string | null
          whatsapp_notification_preferences?: Json | null
          whatsapp_notifications?: boolean | null
        }
        Relationships: []
      }
      referrals: {
        Row: {
          completed_at: string | null
          created_at: string
          id: string
          referred_id: string
          referred_reward_amount: number | null
          referred_reward_used: boolean | null
          referrer_id: string
          reward_amount: number
          reward_used: boolean | null
          status: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id: string
          referred_reward_amount?: number | null
          referred_reward_used?: boolean | null
          referrer_id: string
          reward_amount?: number
          reward_used?: boolean | null
          status?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          id?: string
          referred_id?: string
          referred_reward_amount?: number | null
          referred_reward_used?: boolean | null
          referrer_id?: string
          reward_amount?: number
          reward_used?: boolean | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      refund_orders: {
        Row: {
          amount: number
          bank_account_holder: string
          bank_account_number: string
          bank_account_type: string
          bank_name: string
          cancelled_products: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string
          id: string
          notes: string | null
          package_id: string
          reason: string
          receipt_filename: string | null
          receipt_url: string | null
          refund_method: string | null
          shopper_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          bank_account_holder: string
          bank_account_number: string
          bank_account_type?: string
          bank_name: string
          cancelled_products?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id: string
          reason?: string
          receipt_filename?: string | null
          receipt_url?: string | null
          refund_method?: string | null
          shopper_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          bank_account_holder?: string
          bank_account_number?: string
          bank_account_type?: string
          bank_name?: string
          cancelled_products?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          id?: string
          notes?: string | null
          package_id?: string
          reason?: string
          receipt_filename?: string | null
          receipt_url?: string | null
          refund_method?: string | null
          shopper_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_orders_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_orders_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refund_orders_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          id: string
          permission_key: string
          role_id: string
        }
        Insert: {
          id?: string
          permission_key: string
          role_id: string
        }
        Update: {
          id?: string
          permission_key?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_ratings: {
        Row: {
          comment: string | null
          created_at: string
          delivered_on_time: boolean
          id: string
          package_id: string
          product_condition: string
          rating: number
          shopper_id: string
          traveler_confirmed: boolean
          traveler_id: string
          trip_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          delivered_on_time?: boolean
          id?: string
          package_id: string
          product_condition: string
          rating: number
          shopper_id: string
          traveler_confirmed?: boolean
          traveler_id: string
          trip_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          delivered_on_time?: boolean
          id?: string
          package_id?: string
          product_condition?: string
          rating?: number
          shopper_id?: string
          traveler_confirmed?: boolean
          traveler_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_ratings_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_ratings_shopper_id_fkey"
            columns: ["shopper_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_ratings_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_ratings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      traveler_surveys: {
        Row: {
          consent_to_publish: boolean
          created_at: string
          id: string
          process_difficulty: string
          rating: number
          review_text: string | null
          tip_satisfaction: string
          traveler_id: string
          trip_id: string
          would_recommend: boolean
          would_register_again: string
        }
        Insert: {
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          process_difficulty: string
          rating: number
          review_text?: string | null
          tip_satisfaction: string
          traveler_id: string
          trip_id: string
          would_recommend: boolean
          would_register_again: string
        }
        Update: {
          consent_to_publish?: boolean
          created_at?: string
          id?: string
          process_difficulty?: string
          rating?: number
          review_text?: string | null
          tip_satisfaction?: string
          traveler_id?: string
          trip_id?: string
          would_recommend?: boolean
          would_register_again?: string
        }
        Relationships: [
          {
            foreignKeyName: "traveler_surveys_traveler_id_fkey"
            columns: ["traveler_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "traveler_surveys_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_payment_accumulator: {
        Row: {
          accumulated_amount: number
          all_packages_delivered: boolean | null
          boost_amount: number
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
          boost_amount?: number
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
          boost_amount?: number
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
            isOneToOne: true
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
          boost_code: string | null
          client_request_id: string | null
          created_at: string
          delivery_date: string
          delivery_method: string | null
          delivery_point_id: string | null
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
          to_country: string | null
          traveler_feedback_completed: boolean
          trip_history_log: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_rejection?: Json | null
          arrival_date: string
          available_space?: number | null
          boost_code?: string | null
          client_request_id?: string | null
          created_at?: string
          delivery_date: string
          delivery_method?: string | null
          delivery_point_id?: string | null
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
          to_country?: string | null
          traveler_feedback_completed?: boolean
          trip_history_log?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_rejection?: Json | null
          arrival_date?: string
          available_space?: number | null
          boost_code?: string | null
          client_request_id?: string | null
          created_at?: string
          delivery_date?: string
          delivery_method?: string | null
          delivery_point_id?: string | null
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
          to_country?: string | null
          traveler_feedback_completed?: boolean
          trip_history_log?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_delivery_point_id_fkey"
            columns: ["delivery_point_id"]
            isOneToOne: false
            referencedRelation: "delivery_points"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trips_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_custom_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          custom_role_id: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          custom_role_id: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          custom_role_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
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
      whatsapp_notification_logs: {
        Row: {
          created_at: string | null
          delivered_at: string | null
          delivery_error_code: string | null
          delivery_status: string | null
          error_code: number | null
          error_message: string | null
          id: string
          phone_number: string
          response_data: Json | null
          skip_reason: string | null
          status: string
          template_id: string
          template_variables: Json | null
          twilio_sid: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_error_code?: string | null
          delivery_status?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          phone_number: string
          response_data?: Json | null
          skip_reason?: string | null
          status?: string
          template_id: string
          template_variables?: Json | null
          twilio_sid?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          created_at?: string | null
          delivered_at?: string | null
          delivery_error_code?: string | null
          delivery_status?: string | null
          error_code?: number | null
          error_message?: string | null
          id?: string
          phone_number?: string
          response_data?: Json | null
          skip_reason?: string | null
          status?: string
          template_id?: string
          template_variables?: Json | null
          twilio_sid?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_quote: { Args: { _package_id: string }; Returns: undefined }
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
      admin_update_trust_level: {
        Args: {
          _target_user_id: string
          _trust_level: Database["public"]["Enums"]["trust_level"]
        }
        Returns: undefined
      }
      admin_view_all_users:
        | {
            Args: { _access_reason?: string }
            Returns: {
              avatar_url: string
              ban_reason: string
              bank_account_holder: string
              bank_account_number: string
              bank_account_type: string
              bank_name: string
              bank_swift_code: string
              banned_at: string
              banned_by: string
              banned_until: string
              country_code: string
              created_at: string
              document_number: string
              document_type: string
              email: string
              first_name: string
              id: string
              is_banned: boolean
              last_name: string
              phone_number: string
              trust_level: string
              user_role: string
              username: string
            }[]
          }
        | {
            Args: { _access_reason?: string; _row_limit?: number }
            Returns: {
              avatar_url: string
              ban_reason: string
              bank_account_holder: string
              bank_account_number: string
              bank_account_type: string
              bank_name: string
              bank_swift_code: string
              banned_at: string
              banned_by: string
              banned_until: string
              country_code: string
              created_at: string
              document_number: string
              document_type: string
              email: string
              first_name: string
              id: string
              is_banned: boolean
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
      archive_old_data: { Args: never; Returns: undefined }
      assign_package_to_travelers: {
        Args: {
          _admin_tip: number
          _package_id: string
          _products_data?: Json
          _trip_ids: string[]
        }
        Returns: Json
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
      audit_payment_order_admin_access: {
        Args: { _access_type: string; _order_id: string }
        Returns: undefined
      }
      check_all_packages_delivered: {
        Args: { _trip_id: string }
        Returns: boolean
      }
      complete_past_trips_without_packages: { Args: never; Returns: undefined }
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
      create_refund_order_safe: {
        Args: {
          p_amount: number
          p_bank_account_holder: string
          p_bank_account_number: string
          p_bank_account_type: string
          p_bank_name: string
          p_cancelled_products: Json
          p_package_id: string
          p_reason: string
          p_shopper_id: string
        }
        Returns: string
      }
      expire_approved_deadlines: { Args: never; Returns: Json }
      expire_old_quotes: { Args: never; Returns: undefined }
      expire_prime_memberships: { Args: never; Returns: undefined }
      expire_trips_without_paid_packages: { Args: never; Returns: Json }
      expire_unresponded_assignments: { Args: never; Returns: undefined }
      get_admin_trips_with_user: {
        Args: never
        Returns: {
          arrival_date: string
          available_space: number
          boost_code: string
          created_at: string
          delivery_date: string
          delivery_method: string
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
          to_country: string
          updated_at: string
          user_display_name: string
          user_id: string
          username: string
        }[]
      }
      get_all_operations_data: {
        Args: never
        Returns: {
          confirmed_delivery_address: Json
          created_at: string
          delivery_method: string
          estimated_price: number
          id: string
          incident_flag: boolean
          incident_history: Json
          incident_status: string
          item_description: string
          label_number: number
          matched_trip_id: string
          package_destination: string
          products_summary: Json
          purchase_origin: string
          shopper_first_name: string
          shopper_last_name: string
          status: string
          traveler_country_code: string
          traveler_first_name: string
          traveler_last_name: string
          traveler_phone: string
          trip_arrival_date: string
          trip_delivery_date: string
          trip_from_city: string
          trip_status: string
          trip_to_city: string
          trip_user_id: string
          user_id: string
        }[]
      }
      get_cached_public_stats: {
        Args: never
        Returns: {
          total_packages_completed: number
          total_tips_distributed: number
          total_trips: number
          total_users: number
          updated_at: string
        }[]
      }
      get_database_stats: {
        Args: never
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
      get_monthly_package_stats: {
        Args: never
        Returns: {
          cancelled_count: number
          completed_count: number
          completed_product_count: number
          delivery_fee: number
          gmv: number
          month: string
          pending_count: number
          service_fee: number
          total_count: number
        }[]
      }
      get_monthly_reports: {
        Args: { end_date?: string; start_date?: string }
        Returns: Json
      }
      get_monthly_trip_stats: {
        Args: never
        Returns: {
          approved_count: number
          completed_count: number
          month: string
          total_count: number
        }[]
      }
      get_monthly_user_counts: {
        Args: never
        Returns: {
          month: string
          user_count: number
        }[]
      }
      get_my_referrals: {
        Args: never
        Returns: {
          completed_at: string
          created_at: string
          id: string
          referred_id: string
          referred_name: string
          reward_amount: number
          reward_used: boolean
          status: string
        }[]
      }
      get_my_referred_reward: {
        Args: never
        Returns: {
          referrer_name: string
          reward_amount: number
          reward_used: boolean
        }[]
      }
      get_next_label_number: { Args: never; Returns: number }
      get_operations_packages: {
        Args: { p_statuses: string[] }
        Returns: {
          created_at: string
          delivery_method: string
          estimated_price: number
          id: string
          item_description: string
          label_number: number
          matched_trip_id: string
          package_destination: string
          products_summary: Json
          purchase_origin: string
          status: string
          user_id: string
        }[]
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
        Args: never
        Returns: {
          total_packages_completed: number
          total_tips_distributed: number
          total_trips: number
          total_users: number
        }[]
      }
      get_public_trips: {
        Args: never
        Returns: {
          arrival_date: string
          from_city: string
          id: string
          status: string
          to_city: string
        }[]
      }
      get_traveler_stats_batch: {
        Args: { p_user_ids: string[] }
        Returns: {
          assignments_cancelled: number
          assignments_no_response: number
          assignments_pending: number
          assignments_responded: number
          completed_trips: number
          delivered_packages: number
          user_id: string
        }[]
      }
      get_trip_with_traveler_info: {
        Args: { trip_id: string }
        Returns: {
          arrival_date: string
          delivery_date: string
          from_city: string
          id: string
          to_city: string
          traveler_name: string
          user_id: string
        }[]
      }
      has_operations_role: { Args: { _user_id: string }; Returns: boolean }
      has_permission: {
        Args: { _permission: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_banned: { Args: { _user_id: string }; Returns: boolean }
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
      log_ban_action: {
        Args: {
          _action: string
          _admin_id: string
          _duration: string
          _reason: string
          _target_user_id: string
        }
        Returns: undefined
      }
      mark_referral_credit_used: {
        Args: { p_amount: number; p_package_id: string; p_user_id: string }
        Returns: undefined
      }
      mask_account_number: {
        Args: { _account_number: string }
        Returns: string
      }
      profile_update_allowed: {
        Args: {
          _row: Database["public"]["Tables"]["profiles"]["Row"]
          _user_id: string
        }
        Returns: boolean
      }
      refresh_platform_stats: { Args: never; Returns: undefined }
      register_referral: {
        Args: { p_referral_code: string; p_referred_id: string }
        Returns: boolean
      }
      search_operations_packages: {
        Args: { search_term: string }
        Returns: {
          created_at: string
          delivery_deadline: string
          estimated_price: number
          from_city: string
          item_description: string
          label_number: number
          matched_trip_id: string
          package_id: string
          package_status: string
          products_data: Json
          shopper_first_name: string
          shopper_last_name: string
          to_city: string
          traveler_first_name: string
          traveler_last_name: string
          trip_arrival_date: string
          trip_delivery_date: string
          trip_status: string
        }[]
      }
      send_assignment_warnings: { Args: never; Returns: undefined }
      send_quote_reminders: { Args: never; Returns: undefined }
      shopper_accept_assignment: {
        Args: { _assignment_id: string; _package_id: string }
        Returns: undefined
      }
      submit_acquisition_survey: {
        Args: { _referrer_name?: string; _source: string }
        Returns: undefined
      }
      traveler_dismiss_package: {
        Args: { _package_id: string }
        Returns: undefined
      }
      traveler_has_active_assignment: {
        Args: { _package_id: string; _user_id: string }
        Returns: boolean
      }
      traveler_reject_assignment: {
        Args: {
          _additional_comments?: string
          _package_id: string
          _rejection_reason?: string
        }
        Returns: undefined
      }
      traveler_reject_assignment_v2: {
        Args: {
          _additional_comments?: string
          _assignment_id: string
          _rejection_reason?: string
        }
        Returns: undefined
      }
      user_has_package_on_trip: {
        Args: { trip_id: string; user_id: string }
        Returns: boolean
      }
      validate_banking_info: {
        Args: {
          _account_holder: string
          _account_number: string
          _bank_name: string
        }
        Returns: boolean
      }
      validate_boost_code: {
        Args: { _code: string; _traveler_id: string; _trip_id: string }
        Returns: Json
      }
      validate_discount_code: {
        Args: { _code: string; _order_amount: number; _user_id: string }
        Returns: Json
      }
      validate_payment_order_data: {
        Args: { _amount: number; _traveler_id: string; _trip_id: string }
        Returns: boolean
      }
      verify_admin_access: { Args: never; Returns: boolean }
      verify_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      trust_level: "basic" | "confiable" | "prime"
      user_role: "admin" | "user" | "operations"
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
      user_role: ["admin", "user", "operations"],
    },
  },
} as const
