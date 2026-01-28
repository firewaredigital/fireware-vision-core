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
      accounts: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          annual_revenue: number | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          email: string | null
          employee_count: number | null
          id: string
          industry: string | null
          name: string
          organization_id: string
          owner_id: string | null
          parent_account_id: string | null
          phone: string | null
          source: string | null
          tags: string[] | null
          territory_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          annual_revenue?: number | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          name: string
          organization_id: string
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          territory_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          annual_revenue?: number | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          email?: string | null
          employee_count?: number | null
          id?: string
          industry?: string | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          parent_account_id?: string | null
          phone?: string | null
          source?: string | null
          tags?: string[] | null
          territory_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "accounts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_parent_account_id_fkey"
            columns: ["parent_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "accounts_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      activities: {
        Row: {
          account_id: string | null
          call_result: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          duration_minutes: number | null
          id: string
          lead_id: string | null
          meeting_location: string | null
          opportunity_id: string | null
          organization_id: string
          outcome: string | null
          owner_id: string
          priority: string | null
          status: string | null
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          call_result?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          meeting_location?: string | null
          opportunity_id?: string | null
          organization_id: string
          outcome?: string | null
          owner_id: string
          priority?: string | null
          status?: string | null
          subject: string
          type: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          call_result?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string | null
          meeting_location?: string | null
          opportunity_id?: string | null
          organization_id?: string
          outcome?: string | null
          owner_id?: string
          priority?: string | null
          status?: string | null
          subject?: string
          type?: Database["public"]["Enums"]["activity_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      approval_requests: {
        Row: {
          approval_level: number | null
          approval_type: Database["public"]["Enums"]["approval_type"]
          assigned_to: string | null
          created_at: string
          decision_at: string | null
          decision_by: string | null
          decision_notes: string | null
          description: string | null
          entity_id: string
          entity_name: string | null
          entity_type: string
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          expires_at: string | null
          id: string
          max_approval_level: number | null
          metadata: Json | null
          organization_id: string
          original_value: Json | null
          reason: string | null
          requested_by: string
          requested_value: Json | null
          status: Database["public"]["Enums"]["approval_request_status"]
          title: string
          updated_at: string
        }
        Insert: {
          approval_level?: number | null
          approval_type: Database["public"]["Enums"]["approval_type"]
          assigned_to?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          description?: string | null
          entity_id: string
          entity_name?: string | null
          entity_type: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          id?: string
          max_approval_level?: number | null
          metadata?: Json | null
          organization_id: string
          original_value?: Json | null
          reason?: string | null
          requested_by: string
          requested_value?: Json | null
          status?: Database["public"]["Enums"]["approval_request_status"]
          title: string
          updated_at?: string
        }
        Update: {
          approval_level?: number | null
          approval_type?: Database["public"]["Enums"]["approval_type"]
          assigned_to?: string | null
          created_at?: string
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          description?: string | null
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          expires_at?: string | null
          id?: string
          max_approval_level?: number | null
          metadata?: Json | null
          organization_id?: string
          original_value?: Json | null
          reason?: string | null
          requested_by?: string
          requested_value?: Json | null
          status?: Database["public"]["Enums"]["approval_request_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "approval_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "approval_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      assignment_log: {
        Row: {
          assigned_from: string | null
          assigned_to: string
          assignment_method: string
          created_at: string
          entity_id: string
          entity_name: string | null
          entity_type: string
          id: string
          metadata: Json | null
          organization_id: string
          reason: string | null
          routing_rule_id: string | null
        }
        Insert: {
          assigned_from?: string | null
          assigned_to: string
          assignment_method?: string
          created_at?: string
          entity_id: string
          entity_name?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          organization_id: string
          reason?: string | null
          routing_rule_id?: string | null
        }
        Update: {
          assigned_from?: string | null
          assigned_to?: string
          assignment_method?: string
          created_at?: string
          entity_id?: string
          entity_name?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          organization_id?: string
          reason?: string | null
          routing_rule_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "assignment_log_assigned_from_fkey"
            columns: ["assigned_from"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_log_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "assignment_log_routing_rule_id_fkey"
            columns: ["routing_rule_id"]
            isOneToOne: false
            referencedRelation: "routing_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      attachments: {
        Row: {
          access_level: string | null
          account_id: string | null
          category: string | null
          contact_id: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          is_latest: boolean | null
          is_public: boolean | null
          lead_id: string | null
          mime_type: string | null
          opportunity_id: string | null
          organization_id: string
          parent_attachment_id: string | null
          quote_id: string | null
          tags: string[] | null
          updated_at: string
          uploaded_by: string
          version: number | null
        }
        Insert: {
          access_level?: string | null
          account_id?: string | null
          category?: string | null
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_latest?: boolean | null
          is_public?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          opportunity_id?: string | null
          organization_id: string
          parent_attachment_id?: string | null
          quote_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by: string
          version?: number | null
        }
        Update: {
          access_level?: string | null
          account_id?: string | null
          category?: string | null
          contact_id?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          is_latest?: boolean | null
          is_public?: boolean | null
          lead_id?: string | null
          mime_type?: string | null
          opportunity_id?: string | null
          organization_id?: string
          parent_attachment_id?: string | null
          quote_id?: string | null
          tags?: string[] | null
          updated_at?: string
          uploaded_by?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "attachments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_parent_attachment_id_fkey"
            columns: ["parent_attachment_id"]
            isOneToOne: false
            referencedRelation: "attachments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attachments_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_name: string | null
          entity_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          new_values: Json | null
          old_values: Json | null
          organization_id: string
          session_id: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_name?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          new_values?: Json | null
          old_values?: Json | null
          organization_id?: string
          session_id?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_enrollments: {
        Row: {
          cadence_id: string
          completed_at: string | null
          contact_id: string | null
          created_at: string
          current_step: number | null
          enrolled_at: string
          enrolled_by: string
          id: string
          lead_id: string | null
          next_step_due: string | null
          organization_id: string
          paused_at: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          cadence_id: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          enrolled_by: string
          id?: string
          lead_id?: string | null
          next_step_due?: string | null
          organization_id: string
          paused_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          cadence_id?: string
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number | null
          enrolled_at?: string
          enrolled_by?: string
          id?: string
          lead_id?: string | null
          next_step_due?: string | null
          organization_id?: string
          paused_at?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_enrollments_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadence_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cadence_steps: {
        Row: {
          body: string | null
          cadence_id: string
          created_at: string
          delay_days: number | null
          id: string
          step_number: number
          subject: string | null
          type: Database["public"]["Enums"]["cadence_step_type"]
          updated_at: string
        }
        Insert: {
          body?: string | null
          cadence_id: string
          created_at?: string
          delay_days?: number | null
          id?: string
          step_number: number
          subject?: string | null
          type: Database["public"]["Enums"]["cadence_step_type"]
          updated_at?: string
        }
        Update: {
          body?: string | null
          cadence_id?: string
          created_at?: string
          delay_days?: number | null
          id?: string
          step_number?: number
          subject?: string | null
          type?: Database["public"]["Enums"]["cadence_step_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadence_steps_cadence_id_fkey"
            columns: ["cadence_id"]
            isOneToOne: false
            referencedRelation: "cadences"
            referencedColumns: ["id"]
          },
        ]
      }
      cadences: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          owner_id: string | null
          total_steps: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          owner_id?: string | null
          total_steps?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          total_steps?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cadences_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cadences_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          account_id: string | null
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          created_at: string
          custom_fields: Json | null
          department: string | null
          description: string | null
          do_not_call: boolean | null
          do_not_email: boolean | null
          email: string | null
          first_name: string
          id: string
          job_title: string | null
          last_name: string
          mobile: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["contact_role"] | null
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          custom_fields?: Json | null
          department?: string | null
          description?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email?: string | null
          first_name: string
          id?: string
          job_title?: string | null
          last_name: string
          mobile?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          created_at?: string
          custom_fields?: Json | null
          department?: string | null
          description?: string | null
          do_not_call?: boolean | null
          do_not_email?: boolean | null
          email?: string | null
          first_name?: string
          id?: string
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["contact_role"] | null
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "contacts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          account_id: string
          auto_renewal: boolean | null
          billing_frequency: string | null
          contact_id: string | null
          contract_number: string
          created_at: string
          custom_fields: Json | null
          description: string | null
          end_date: string | null
          id: string
          name: string
          opportunity_id: string | null
          organization_id: string
          owner_id: string | null
          parent_contract_id: string | null
          payment_terms: string | null
          quote_id: string | null
          recurring_value: number | null
          renewal_notice_days: number | null
          renewal_reminder_sent: boolean | null
          sent_date: string | null
          signed_date: string | null
          special_conditions: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["contract_status"]
          tags: string[] | null
          terms_and_conditions: string | null
          total_value: number | null
          updated_at: string
          version: number | null
        }
        Insert: {
          account_id: string
          auto_renewal?: boolean | null
          billing_frequency?: string | null
          contact_id?: string | null
          contract_number: string
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name: string
          opportunity_id?: string | null
          organization_id: string
          owner_id?: string | null
          parent_contract_id?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          recurring_value?: number | null
          renewal_notice_days?: number | null
          renewal_reminder_sent?: boolean | null
          sent_date?: string | null
          signed_date?: string | null
          special_conditions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[] | null
          terms_and_conditions?: string | null
          total_value?: number | null
          updated_at?: string
          version?: number | null
        }
        Update: {
          account_id?: string
          auto_renewal?: boolean | null
          billing_frequency?: string | null
          contact_id?: string | null
          contract_number?: string
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          end_date?: string | null
          id?: string
          name?: string
          opportunity_id?: string | null
          organization_id?: string
          owner_id?: string | null
          parent_contract_id?: string | null
          payment_terms?: string | null
          quote_id?: string | null
          recurring_value?: number | null
          renewal_notice_days?: number | null
          renewal_reminder_sent?: boolean | null
          sent_date?: string | null
          signed_date?: string | null
          special_conditions?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["contract_status"]
          tags?: string[] | null
          terms_and_conditions?: string | null
          total_value?: number | null
          updated_at?: string
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_parent_contract_id_fkey"
            columns: ["parent_contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      forecasts: {
        Row: {
          best_case_amount: number | null
          closed_amount: number | null
          commit_amount: number | null
          created_at: string
          id: string
          notes: string | null
          organization_id: string
          owner_id: string
          period_end: string
          period_start: string
          period_type: string
          pipeline_amount: number | null
          target_amount: number | null
          updated_at: string
        }
        Insert: {
          best_case_amount?: number | null
          closed_amount?: number | null
          commit_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id: string
          owner_id: string
          period_end: string
          period_start: string
          period_type?: string
          pipeline_amount?: number | null
          target_amount?: number | null
          updated_at?: string
        }
        Update: {
          best_case_amount?: number | null
          closed_amount?: number | null
          commit_amount?: number | null
          created_at?: string
          id?: string
          notes?: string | null
          organization_id?: string
          owner_id?: string
          period_end?: string
          period_start?: string
          period_type?: string
          pipeline_amount?: number | null
          target_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecasts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forecasts_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_sources_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_state: string | null
          address_street: string | null
          company: string | null
          converted_account_id: string | null
          converted_at: string | null
          converted_contact_id: string | null
          converted_opportunity_id: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          email: string | null
          first_name: string
          id: string
          industry: string | null
          job_title: string | null
          last_name: string
          mobile: string | null
          organization_id: string
          owner_id: string | null
          phone: string | null
          rating: string | null
          score: number | null
          source: string | null
          status: Database["public"]["Enums"]["lead_status"]
          tags: string[] | null
          territory_id: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          company?: string | null
          converted_account_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          email?: string | null
          first_name: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name: string
          mobile?: string | null
          organization_id: string
          owner_id?: string | null
          phone?: string | null
          rating?: string | null
          score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          territory_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_state?: string | null
          address_street?: string | null
          company?: string | null
          converted_account_id?: string | null
          converted_at?: string | null
          converted_contact_id?: string | null
          converted_opportunity_id?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          email?: string | null
          first_name?: string
          id?: string
          industry?: string | null
          job_title?: string | null
          last_name?: string
          mobile?: string | null
          organization_id?: string
          owner_id?: string | null
          phone?: string | null
          rating?: string | null
          score?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["lead_status"]
          tags?: string[] | null
          territory_id?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_leads_converted_opportunity"
            columns: ["converted_opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_account_id_fkey"
            columns: ["converted_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_converted_contact_id_fkey"
            columns: ["converted_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          account_id: string | null
          contact_id: string | null
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          lead_id: string | null
          opportunity_id: string | null
          organization_id: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          contact_id?: string | null
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          lead_id?: string | null
          opportunity_id?: string | null
          organization_id: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          contact_id?: string | null
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          lead_id?: string | null
          opportunity_id?: string | null
          organization_id?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          entity_id: string | null
          entity_type: string | null
          expires_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string | null
          metadata: Json | null
          organization_id: string
          priority: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          read_at?: string | null
          title: string
          type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          expires_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string | null
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          account_id: string
          amount: number | null
          close_date: string | null
          competitor: string | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          expected_revenue: number | null
          forecast_category:
            | Database["public"]["Enums"]["forecast_category"]
            | null
          id: string
          loss_reason: string | null
          name: string
          next_step: string | null
          organization_id: string
          owner_id: string | null
          probability: number | null
          source: string | null
          stage: Database["public"]["Enums"]["opportunity_stage"]
          stage_id: string | null
          tags: string[] | null
          territory_id: string | null
          type: string | null
          updated_at: string
          win_reason: string | null
        }
        Insert: {
          account_id: string
          amount?: number | null
          close_date?: string | null
          competitor?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_revenue?: number | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_category"]
            | null
          id?: string
          loss_reason?: string | null
          name: string
          next_step?: string | null
          organization_id: string
          owner_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_id?: string | null
          tags?: string[] | null
          territory_id?: string | null
          type?: string | null
          updated_at?: string
          win_reason?: string | null
        }
        Update: {
          account_id?: string
          amount?: number | null
          close_date?: string | null
          competitor?: string | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          expected_revenue?: number | null
          forecast_category?:
            | Database["public"]["Enums"]["forecast_category"]
            | null
          id?: string
          loss_reason?: string | null
          name?: string
          next_step?: string | null
          organization_id?: string
          owner_id?: string | null
          probability?: number | null
          source?: string | null
          stage?: Database["public"]["Enums"]["opportunity_stage"]
          stage_id?: string | null
          tags?: string[] | null
          territory_id?: string | null
          type?: string | null
          updated_at?: string
          win_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunities_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_stage_id_fkey"
            columns: ["stage_id"]
            isOneToOne: false
            referencedRelation: "opportunity_stages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunities_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_contacts: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          is_primary: boolean | null
          opportunity_id: string
          role: Database["public"]["Enums"]["contact_role"] | null
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          opportunity_id: string
          role?: Database["public"]["Enums"]["contact_role"] | null
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          is_primary?: boolean | null
          opportunity_id?: string
          role?: Database["public"]["Enums"]["contact_role"] | null
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_contacts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_contacts_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_stages: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_closed: boolean
          is_won: boolean
          name: string
          organization_id: string
          probability: number
          required_fields: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_closed?: boolean
          is_won?: boolean
          name: string
          organization_id: string
          probability?: number
          required_fields?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_closed?: boolean
          is_won?: boolean
          name?: string
          organization_id?: string
          probability?: number
          required_fields?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_stages_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          domain: string | null
          id: string
          logo_url: string | null
          name: string
          settings: Json | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name: string
          settings?: Json | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          domain?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          settings?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      price_list_items: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          min_quantity: number | null
          price_list_id: string
          product_id: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          min_quantity?: number | null
          price_list_id: string
          product_id: string
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          min_quantity?: number | null
          price_list_id?: string
          product_id?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "price_list_items_price_list_id_fkey"
            columns: ["price_list_id"]
            isOneToOne: false
            referencedRelation: "price_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_list_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      price_lists: {
        Row: {
          created_at: string
          description: string | null
          end_date: string | null
          id: string
          is_default: boolean | null
          name: string
          organization_id: string
          start_date: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          organization_id: string
          start_date?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          end_date?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          organization_id?: string
          start_date?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_lists_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string | null
          cost: number | null
          created_at: string
          custom_fields: Json | null
          description: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          sku: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          cost?: number | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          cost?: number | null
          created_at?: string
          custom_fields?: Json | null
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string | null
          id: string
          is_active: boolean
          job_title: string | null
          last_name: string | null
          organization_id: string | null
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          settings: Json | null
          team_id: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name?: string | null
          id: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json | null
          team_id?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string | null
          id?: string
          is_active?: boolean
          job_title?: string | null
          last_name?: string | null
          organization_id?: string | null
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          settings?: Json | null
          team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string
          description: string | null
          discount_amount: number | null
          discount_percent: number | null
          id: string
          name: string
          product_id: string | null
          quantity: number
          quote_id: string
          sort_order: number | null
          total: number
          unit_price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          product_id?: string | null
          quantity?: number
          quote_id: string
          sort_order?: number | null
          total: number
          unit_price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          product_id?: string | null
          quantity?: number
          quote_id?: string
          sort_order?: number | null
          total?: number
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quote_items_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      quotes: {
        Row: {
          account_id: string
          approved_at: string | null
          approved_by: string | null
          contact_id: string | null
          created_at: string
          discount_amount: number | null
          discount_percent: number | null
          id: string
          name: string
          notes: string | null
          opportunity_id: string | null
          organization_id: string
          owner_id: string | null
          parent_quote_id: string | null
          quote_number: string
          status: Database["public"]["Enums"]["quote_status"]
          subtotal: number | null
          tax_amount: number | null
          tax_percent: number | null
          terms: string | null
          total: number | null
          updated_at: string
          valid_until: string | null
          version: number | null
        }
        Insert: {
          account_id: string
          approved_at?: string | null
          approved_by?: string | null
          contact_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name: string
          notes?: string | null
          opportunity_id?: string | null
          organization_id: string
          owner_id?: string | null
          parent_quote_id?: string | null
          quote_number: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number | null
          tax_amount?: number | null
          tax_percent?: number | null
          terms?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number | null
        }
        Update: {
          account_id?: string
          approved_at?: string | null
          approved_by?: string | null
          contact_id?: string | null
          created_at?: string
          discount_amount?: number | null
          discount_percent?: number | null
          id?: string
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          organization_id?: string
          owner_id?: string | null
          parent_quote_id?: string | null
          quote_number?: string
          status?: Database["public"]["Enums"]["quote_status"]
          subtotal?: number | null
          tax_amount?: number | null
          tax_percent?: number | null
          terms?: string | null
          total?: number | null
          updated_at?: string
          valid_until?: string | null
          version?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_parent_quote_id_fkey"
            columns: ["parent_quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      routing_rules: {
        Row: {
          actions: Json | null
          active_days: string[] | null
          active_end_time: string | null
          active_start_time: string | null
          assignment_index: number | null
          conditions: Json | null
          created_at: string
          description: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          last_assigned_user_id: string | null
          metadata: Json | null
          name: string
          organization_id: string
          priority: number | null
          rule_type: Database["public"]["Enums"]["routing_rule_type"]
          target_team_id: string | null
          target_territory_id: string | null
          target_user_ids: string[] | null
          updated_at: string
        }
        Insert: {
          actions?: Json | null
          active_days?: string[] | null
          active_end_time?: string | null
          active_start_time?: string | null
          assignment_index?: number | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_assigned_user_id?: string | null
          metadata?: Json | null
          name: string
          organization_id: string
          priority?: number | null
          rule_type?: Database["public"]["Enums"]["routing_rule_type"]
          target_team_id?: string | null
          target_territory_id?: string | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          actions?: Json | null
          active_days?: string[] | null
          active_end_time?: string | null
          active_start_time?: string | null
          assignment_index?: number | null
          conditions?: Json | null
          created_at?: string
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          last_assigned_user_id?: string | null
          metadata?: Json | null
          name?: string
          organization_id?: string
          priority?: number | null
          rule_type?: Database["public"]["Enums"]["routing_rule_type"]
          target_team_id?: string | null
          target_territory_id?: string | null
          target_user_ids?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "routing_rules_last_assigned_user_id_fkey"
            columns: ["last_assigned_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_rules_target_team_id_fkey"
            columns: ["target_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routing_rules_target_territory_id_fkey"
            columns: ["target_territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          parent_team_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          parent_team_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          parent_team_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teams_parent_team_id_fkey"
            columns: ["parent_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      territories: {
        Row: {
          created_at: string
          criteria: Json | null
          description: string | null
          id: string
          name: string
          organization_id: string
          owner_id: string | null
          parent_territory_id: string | null
          region: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          name: string
          organization_id: string
          owner_id?: string | null
          parent_territory_id?: string | null
          region?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          criteria?: Json | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          owner_id?: string | null
          parent_territory_id?: string | null
          region?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "territories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territories_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "territories_parent_territory_id_fkey"
            columns: ["parent_territory_id"]
            isOneToOne: false
            referencedRelation: "territories"
            referencedColumns: ["id"]
          },
        ]
      }
      timeline_events: {
        Row: {
          account_id: string | null
          activity_id: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id: string
          lead_id: string | null
          metadata: Json | null
          opportunity_id: string | null
          organization_id: string
          quote_id: string | null
          title: string
        }
        Insert: {
          account_id?: string | null
          activity_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opportunity_id?: string | null
          organization_id: string
          quote_id?: string | null
          title: string
        }
        Update: {
          account_id?: string | null
          activity_id?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          event_type?: Database["public"]["Enums"]["timeline_event_type"]
          id?: string
          lead_id?: string | null
          metadata?: Json | null
          opportunity_id?: string | null
          organization_id?: string
          quote_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "timeline_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timeline_events_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
      win_loss_reasons: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          organization_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          organization_id: string
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          organization_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "win_loss_reasons_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_contract_number: { Args: { org_id: string }; Returns: string }
      get_stale_opportunities_count: {
        Args: { org_id: string; threshold_days?: number }
        Returns: number
      }
      get_user_org_id: { Args: never; Returns: string }
      get_user_team_id: { Args: never; Returns: string }
      has_role: {
        Args: { role_name: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_deal_stale: {
        Args: { opp_id: string; threshold_days?: number }
        Returns: boolean
      }
      is_manager_of_team: { Args: { team_id_param: string }; Returns: boolean }
      is_member_of_org: { Args: { org_id: string }; Returns: boolean }
      log_audit_event: {
        Args: {
          p_action: string
          p_changes?: Json
          p_entity_id?: string
          p_entity_name?: string
          p_entity_type: string
          p_metadata?: Json
          p_new_values?: Json
          p_old_values?: Json
          p_organization_id: string
        }
        Returns: string
      }
    }
    Enums: {
      activity_type: "call" | "email" | "meeting" | "task" | "note"
      approval_request_status:
        | "pending"
        | "approved"
        | "rejected"
        | "cancelled"
        | "escalated"
      approval_type:
        | "discount"
        | "special_terms"
        | "contract"
        | "price_override"
        | "credit_limit"
        | "exception"
      cadence_step_type: "email" | "call" | "linkedin" | "task"
      contact_role:
        | "decision_maker"
        | "technical"
        | "financial"
        | "influencer"
        | "end_user"
        | "other"
      contract_status:
        | "draft"
        | "pending_approval"
        | "sent"
        | "negotiating"
        | "signed"
        | "active"
        | "expired"
        | "terminated"
        | "renewed"
      forecast_category: "commit" | "best_case" | "pipeline" | "omitted"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
      opportunity_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "expired"
      routing_rule_type:
        | "round_robin"
        | "territory"
        | "segment"
        | "load_balance"
        | "skill_based"
        | "priority"
      timeline_event_type:
        | "lead_created"
        | "lead_converted"
        | "opportunity_created"
        | "opportunity_stage_changed"
        | "opportunity_won"
        | "opportunity_lost"
        | "quote_created"
        | "quote_sent"
        | "activity_completed"
        | "note_added"
        | "contact_added"
        | "account_created"
      user_role: "user" | "manager" | "admin"
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
      activity_type: ["call", "email", "meeting", "task", "note"],
      approval_request_status: [
        "pending",
        "approved",
        "rejected",
        "cancelled",
        "escalated",
      ],
      approval_type: [
        "discount",
        "special_terms",
        "contract",
        "price_override",
        "credit_limit",
        "exception",
      ],
      cadence_step_type: ["email", "call", "linkedin", "task"],
      contact_role: [
        "decision_maker",
        "technical",
        "financial",
        "influencer",
        "end_user",
        "other",
      ],
      contract_status: [
        "draft",
        "pending_approval",
        "sent",
        "negotiating",
        "signed",
        "active",
        "expired",
        "terminated",
        "renewed",
      ],
      forecast_category: ["commit", "best_case", "pipeline", "omitted"],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
      ],
      opportunity_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      quote_status: ["draft", "sent", "accepted", "rejected", "expired"],
      routing_rule_type: [
        "round_robin",
        "territory",
        "segment",
        "load_balance",
        "skill_based",
        "priority",
      ],
      timeline_event_type: [
        "lead_created",
        "lead_converted",
        "opportunity_created",
        "opportunity_stage_changed",
        "opportunity_won",
        "opportunity_lost",
        "quote_created",
        "quote_sent",
        "activity_completed",
        "note_added",
        "contact_added",
        "account_created",
      ],
      user_role: ["user", "manager", "admin"],
    },
  },
} as const
