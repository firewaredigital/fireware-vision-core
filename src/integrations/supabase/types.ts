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
      article_feedback: {
        Row: {
          article_id: string
          created_at: string
          feedback: string | null
          id: string
          ip_address: string | null
          is_helpful: boolean
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          article_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          ip_address?: string | null
          is_helpful: boolean
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          article_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          ip_address?: string | null
          is_helpful?: boolean
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_feedback_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      article_versions: {
        Row: {
          article_id: string
          change_summary: string | null
          changed_by: string | null
          content: string
          created_at: string
          id: string
          title: string
          version: number
        }
        Insert: {
          article_id: string
          change_summary?: string | null
          changed_by?: string | null
          content: string
          created_at?: string
          id?: string
          title: string
          version: number
        }
        Update: {
          article_id?: string
          change_summary?: string | null
          changed_by?: string | null
          content?: string
          created_at?: string
          id?: string
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "article_versions_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "knowledge_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_versions_changed_by_fkey"
            columns: ["changed_by"]
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
      attribution_touchpoints: {
        Row: {
          account_id: string | null
          campaign_id: string | null
          channel: string | null
          contact_id: string | null
          conversion_date: string | null
          conversion_value: number | null
          created_at: string | null
          currency: string | null
          days_to_conversion: number | null
          id: string
          is_conversion_touch: boolean | null
          is_first_touch: boolean | null
          is_last_touch: boolean | null
          journey_id: string | null
          lead_id: string | null
          opportunity_id: string | null
          order_id: string | null
          organization_id: string
          source: string | null
          touchpoint_date: string
          touchpoint_name: string | null
          touchpoint_position: number | null
          touchpoint_type: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          account_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          contact_id?: string | null
          conversion_date?: string | null
          conversion_value?: number | null
          created_at?: string | null
          currency?: string | null
          days_to_conversion?: number | null
          id?: string
          is_conversion_touch?: boolean | null
          is_first_touch?: boolean | null
          is_last_touch?: boolean | null
          journey_id?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id: string
          source?: string | null
          touchpoint_date: string
          touchpoint_name?: string | null
          touchpoint_position?: number | null
          touchpoint_type: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          account_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          contact_id?: string | null
          conversion_date?: string | null
          conversion_value?: number | null
          created_at?: string | null
          currency?: string | null
          days_to_conversion?: number | null
          id?: string
          is_conversion_touch?: boolean | null
          is_first_touch?: boolean | null
          is_last_touch?: boolean | null
          journey_id?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id?: string
          source?: string | null
          touchpoint_date?: string
          touchpoint_name?: string | null
          touchpoint_position?: number | null
          touchpoint_type?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "attribution_touchpoints_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attribution_touchpoints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      behavioral_events: {
        Row: {
          account_id: string | null
          anonymous_id: string | null
          campaign_id: string | null
          channel: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          customer_identity_id: string | null
          device_info: Json | null
          device_type: string | null
          event_category: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["behavioral_event_type"]
          event_value: number | null
          id: string
          ip_address: string | null
          journey_id: string | null
          lead_id: string | null
          location: Json | null
          occurred_at: string
          organization_id: string
          page_path: string | null
          page_title: string | null
          page_url: string | null
          properties: Json | null
          received_at: string | null
          referrer: string | null
          referrer_domain: string | null
          session_id: string | null
          source: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string | null
        }
        Insert: {
          account_id?: string | null
          anonymous_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_identity_id?: string | null
          device_info?: Json | null
          device_type?: string | null
          event_category?: string | null
          event_name: string
          event_type: Database["public"]["Enums"]["behavioral_event_type"]
          event_value?: number | null
          id?: string
          ip_address?: string | null
          journey_id?: string | null
          lead_id?: string | null
          location?: Json | null
          occurred_at?: string
          organization_id: string
          page_path?: string | null
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          received_at?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          session_id?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Update: {
          account_id?: string | null
          anonymous_id?: string | null
          campaign_id?: string | null
          channel?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          customer_identity_id?: string | null
          device_info?: Json | null
          device_type?: string | null
          event_category?: string | null
          event_name?: string
          event_type?: Database["public"]["Enums"]["behavioral_event_type"]
          event_value?: number | null
          id?: string
          ip_address?: string | null
          journey_id?: string | null
          lead_id?: string | null
          location?: Json | null
          occurred_at?: string
          organization_id?: string
          page_path?: string | null
          page_title?: string | null
          page_url?: string | null
          properties?: Json | null
          received_at?: string | null
          referrer?: string | null
          referrer_domain?: string | null
          session_id?: string | null
          source?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "behavioral_events_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_customer_identity_id_fkey"
            columns: ["customer_identity_id"]
            isOneToOne: false
            referencedRelation: "customer_identities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "behavioral_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      campaign_links: {
        Row: {
          campaign_id: string
          click_count: number | null
          created_at: string
          id: string
          name: string | null
          original_url: string
          short_code: string
          tracking_url: string
          unique_clicks: number | null
        }
        Insert: {
          campaign_id: string
          click_count?: number | null
          created_at?: string
          id?: string
          name?: string | null
          original_url: string
          short_code: string
          tracking_url: string
          unique_clicks?: number | null
        }
        Update: {
          campaign_id?: string
          click_count?: number | null
          created_at?: string
          id?: string
          name?: string | null
          original_url?: string
          short_code?: string
          tracking_url?: string
          unique_clicks?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_links_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_members: {
        Row: {
          bounce_reason: string | null
          bounce_type: string | null
          bounced_at: string | null
          browser: string | null
          campaign_id: string
          click_count: number | null
          clicked_at: string | null
          clicked_links: Json | null
          complained_at: string | null
          contact_id: string | null
          conversion_value: number | null
          converted_at: string | null
          created_at: string
          delivered_at: string | null
          device_type: string | null
          email: string | null
          email_client: string | null
          failed_at: string | null
          failure_reason: string | null
          first_click_at: string | null
          first_open_at: string | null
          id: string
          ip_address: string | null
          last_click_at: string | null
          last_open_at: string | null
          lead_id: string | null
          location: Json | null
          metadata: Json | null
          open_count: number | null
          opened_at: string | null
          organization_id: string
          os: string | null
          phone: string | null
          sent_at: string | null
          status: Database["public"]["Enums"]["campaign_member_status"]
          unsubscribed_at: string | null
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          browser?: string | null
          campaign_id: string
          click_count?: number | null
          clicked_at?: string | null
          clicked_links?: Json | null
          complained_at?: string | null
          contact_id?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          device_type?: string | null
          email?: string | null
          email_client?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          first_click_at?: string | null
          first_open_at?: string | null
          id?: string
          ip_address?: string | null
          last_click_at?: string | null
          last_open_at?: string | null
          lead_id?: string | null
          location?: Json | null
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          organization_id: string
          os?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_member_status"]
          unsubscribed_at?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounce_type?: string | null
          bounced_at?: string | null
          browser?: string | null
          campaign_id?: string
          click_count?: number | null
          clicked_at?: string | null
          clicked_links?: Json | null
          complained_at?: string | null
          contact_id?: string | null
          conversion_value?: number | null
          converted_at?: string | null
          created_at?: string
          delivered_at?: string | null
          device_type?: string | null
          email?: string | null
          email_client?: string | null
          failed_at?: string | null
          failure_reason?: string | null
          first_click_at?: string | null
          first_open_at?: string | null
          id?: string
          ip_address?: string | null
          last_click_at?: string | null
          last_open_at?: string | null
          lead_id?: string | null
          location?: Json | null
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          organization_id?: string
          os?: string | null
          phone?: string | null
          sent_at?: string | null
          status?: Database["public"]["Enums"]["campaign_member_status"]
          unsubscribed_at?: string | null
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_members_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          ab_test_duration_hours: number | null
          ab_variants: Json | null
          ab_winner_criteria: string | null
          ab_winner_variant_id: string | null
          actual_cost: number | null
          approved_at: string | null
          approved_by: string | null
          bounce_count: number | null
          bounce_rate: number | null
          budget: number | null
          click_count: number | null
          click_rate: number | null
          complaint_count: number | null
          completed_at: string | null
          content: string | null
          content_html: string | null
          conversion_count: number | null
          conversion_rate: number | null
          conversion_value: number | null
          cost_per_send: number | null
          created_at: string
          created_by: string | null
          custom_fields: Json | null
          delivered_count: number | null
          description: string | null
          end_date: string | null
          exclusion_list: Json | null
          from_email: string | null
          from_name: string | null
          id: string
          is_ab_test: boolean | null
          name: string
          open_count: number | null
          open_rate: number | null
          organization_id: string
          owner_id: string | null
          preview_text: string | null
          reply_to: string | null
          scheduled_at: string | null
          segment_id: string | null
          sent_at: string | null
          sent_count: number | null
          start_date: string | null
          status: Database["public"]["Enums"]["campaign_status"]
          subject: string | null
          tags: string[] | null
          target_list: Json | null
          template_id: string | null
          timezone: string | null
          total_recipients: number | null
          type: Database["public"]["Enums"]["campaign_type"]
          unique_clicks: number | null
          unique_opens: number | null
          unsubscribe_count: number | null
          unsubscribe_rate: number | null
          updated_at: string
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          ab_test_duration_hours?: number | null
          ab_variants?: Json | null
          ab_winner_criteria?: string | null
          ab_winner_variant_id?: string | null
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bounce_count?: number | null
          bounce_rate?: number | null
          budget?: number | null
          click_count?: number | null
          click_rate?: number | null
          complaint_count?: number | null
          completed_at?: string | null
          content?: string | null
          content_html?: string | null
          conversion_count?: number | null
          conversion_rate?: number | null
          conversion_value?: number | null
          cost_per_send?: number | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          delivered_count?: number | null
          description?: string | null
          end_date?: string | null
          exclusion_list?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_ab_test?: boolean | null
          name: string
          open_count?: number | null
          open_rate?: number | null
          organization_id: string
          owner_id?: string | null
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          tags?: string[] | null
          target_list?: Json | null
          template_id?: string | null
          timezone?: string | null
          total_recipients?: number | null
          type: Database["public"]["Enums"]["campaign_type"]
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribe_count?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          ab_test_duration_hours?: number | null
          ab_variants?: Json | null
          ab_winner_criteria?: string | null
          ab_winner_variant_id?: string | null
          actual_cost?: number | null
          approved_at?: string | null
          approved_by?: string | null
          bounce_count?: number | null
          bounce_rate?: number | null
          budget?: number | null
          click_count?: number | null
          click_rate?: number | null
          complaint_count?: number | null
          completed_at?: string | null
          content?: string | null
          content_html?: string | null
          conversion_count?: number | null
          conversion_rate?: number | null
          conversion_value?: number | null
          cost_per_send?: number | null
          created_at?: string
          created_by?: string | null
          custom_fields?: Json | null
          delivered_count?: number | null
          description?: string | null
          end_date?: string | null
          exclusion_list?: Json | null
          from_email?: string | null
          from_name?: string | null
          id?: string
          is_ab_test?: boolean | null
          name?: string
          open_count?: number | null
          open_rate?: number | null
          organization_id?: string
          owner_id?: string | null
          preview_text?: string | null
          reply_to?: string | null
          scheduled_at?: string | null
          segment_id?: string | null
          sent_at?: string | null
          sent_count?: number | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["campaign_status"]
          subject?: string | null
          tags?: string[] | null
          target_list?: Json | null
          template_id?: string | null
          timezone?: string | null
          total_recipients?: number | null
          type?: Database["public"]["Enums"]["campaign_type"]
          unique_clicks?: number | null
          unique_opens?: number | null
          unsubscribe_count?: number | null
          unsubscribe_rate?: number | null
          updated_at?: string
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      canned_responses: {
        Row: {
          category: string | null
          content: string
          content_html: string | null
          created_at: string
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          organization_id: string
          owner_id: string | null
          shortcut: string | null
          updated_at: string
          usage_count: number
        }
        Insert: {
          category?: string | null
          content: string
          content_html?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          organization_id: string
          owner_id?: string | null
          shortcut?: string | null
          updated_at?: string
          usage_count?: number
        }
        Update: {
          category?: string | null
          content?: string
          content_html?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          organization_id?: string
          owner_id?: string | null
          shortcut?: string | null
          updated_at?: string
          usage_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "canned_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canned_responses_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          cart_id: string
          created_at: string | null
          discount_amount: number | null
          id: string
          metadata: Json | null
          name: string
          product_id: string | null
          quantity: number | null
          sku: string | null
          tax_amount: number | null
          total: number
          unit_price: number
        }
        Insert: {
          cart_id: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          name: string
          product_id?: string | null
          quantity?: number | null
          sku?: string | null
          tax_amount?: number | null
          total: number
          unit_price: number
        }
        Update: {
          cart_id?: string
          created_at?: string | null
          discount_amount?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          product_id?: string | null
          quantity?: number | null
          sku?: string | null
          tax_amount?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "cart_items_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      carts: {
        Row: {
          account_id: string | null
          contact_id: string | null
          converted_to_order_id: string | null
          coupon_code: string | null
          created_at: string | null
          discount_total: number | null
          expires_at: string | null
          id: string
          metadata: Json | null
          notes: string | null
          organization_id: string
          session_id: string | null
          shipping_total: number | null
          status: string | null
          subtotal: number | null
          tax_total: number | null
          total: number | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          contact_id?: string | null
          converted_to_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_total?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id: string
          session_id?: string | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          contact_id?: string | null
          converted_to_order_id?: string | null
          coupon_code?: string | null
          created_at?: string | null
          discount_total?: number | null
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          notes?: string | null
          organization_id?: string
          session_id?: string | null
          shipping_total?: number | null
          status?: string | null
          subtotal?: number | null
          tax_total?: number | null
          total?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "carts_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "carts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cmdb_items: {
        Row: {
          asset_id: string | null
          attributes: Json | null
          business_service: string | null
          business_unit: string | null
          category: string | null
          ci_number: string
          ci_type: Database["public"]["Enums"]["ci_type"]
          compliance_requirements: string[] | null
          cost_center: string | null
          cpu_cores: number | null
          created_at: string | null
          criticality: string | null
          data_center: string | null
          data_classification: string | null
          decommission_date: string | null
          description: string | null
          discovery_source: string | null
          display_name: string | null
          dns_name: string | null
          documentation_url: string | null
          end_of_life_date: string | null
          environment: Database["public"]["Enums"]["ci_environment"] | null
          firmware_version: string | null
          go_live_date: string | null
          hostname: string | null
          id: string
          installed_date: string | null
          ip_address: string | null
          last_discovered_at: string | null
          location: string | null
          mac_address: string | null
          managed_by: string | null
          manufacturer: string | null
          memory_gb: number | null
          model: string | null
          name: string
          operating_system: string | null
          organization_id: string
          owner_id: string | null
          rack: string | null
          runbook_url: string | null
          serial_number: string | null
          status: Database["public"]["Enums"]["ci_status"] | null
          storage_gb: number | null
          subcategory: string | null
          support_team_id: string | null
          tags: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          asset_id?: string | null
          attributes?: Json | null
          business_service?: string | null
          business_unit?: string | null
          category?: string | null
          ci_number: string
          ci_type: Database["public"]["Enums"]["ci_type"]
          compliance_requirements?: string[] | null
          cost_center?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          criticality?: string | null
          data_center?: string | null
          data_classification?: string | null
          decommission_date?: string | null
          description?: string | null
          discovery_source?: string | null
          display_name?: string | null
          dns_name?: string | null
          documentation_url?: string | null
          end_of_life_date?: string | null
          environment?: Database["public"]["Enums"]["ci_environment"] | null
          firmware_version?: string | null
          go_live_date?: string | null
          hostname?: string | null
          id?: string
          installed_date?: string | null
          ip_address?: string | null
          last_discovered_at?: string | null
          location?: string | null
          mac_address?: string | null
          managed_by?: string | null
          manufacturer?: string | null
          memory_gb?: number | null
          model?: string | null
          name: string
          operating_system?: string | null
          organization_id: string
          owner_id?: string | null
          rack?: string | null
          runbook_url?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["ci_status"] | null
          storage_gb?: number | null
          subcategory?: string | null
          support_team_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          asset_id?: string | null
          attributes?: Json | null
          business_service?: string | null
          business_unit?: string | null
          category?: string | null
          ci_number?: string
          ci_type?: Database["public"]["Enums"]["ci_type"]
          compliance_requirements?: string[] | null
          cost_center?: string | null
          cpu_cores?: number | null
          created_at?: string | null
          criticality?: string | null
          data_center?: string | null
          data_classification?: string | null
          decommission_date?: string | null
          description?: string | null
          discovery_source?: string | null
          display_name?: string | null
          dns_name?: string | null
          documentation_url?: string | null
          end_of_life_date?: string | null
          environment?: Database["public"]["Enums"]["ci_environment"] | null
          firmware_version?: string | null
          go_live_date?: string | null
          hostname?: string | null
          id?: string
          installed_date?: string | null
          ip_address?: string | null
          last_discovered_at?: string | null
          location?: string | null
          mac_address?: string | null
          managed_by?: string | null
          manufacturer?: string | null
          memory_gb?: number | null
          model?: string | null
          name?: string
          operating_system?: string | null
          organization_id?: string
          owner_id?: string | null
          rack?: string | null
          runbook_url?: string | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["ci_status"] | null
          storage_gb?: number | null
          subcategory?: string | null
          support_team_id?: string | null
          tags?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cmdb_items_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cmdb_items_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cmdb_items_support_team_id_fkey"
            columns: ["support_team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      cmdb_relationships: {
        Row: {
          created_at: string | null
          description: string | null
          discovered_by: string | null
          id: string
          is_active: boolean | null
          organization_id: string
          relationship_type: Database["public"]["Enums"]["cmdb_relationship_type"]
          source_ci_id: string
          target_ci_id: string
          updated_at: string | null
          verified: boolean | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discovered_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id: string
          relationship_type: Database["public"]["Enums"]["cmdb_relationship_type"]
          source_ci_id: string
          target_ci_id: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discovered_by?: string | null
          id?: string
          is_active?: boolean | null
          organization_id?: string
          relationship_type?: Database["public"]["Enums"]["cmdb_relationship_type"]
          source_ci_id?: string
          target_ci_id?: string
          updated_at?: string | null
          verified?: boolean | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cmdb_relationships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cmdb_relationships_source_ci_id_fkey"
            columns: ["source_ci_id"]
            isOneToOne: false
            referencedRelation: "cmdb_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cmdb_relationships_target_ci_id_fkey"
            columns: ["target_ci_id"]
            isOneToOne: false
            referencedRelation: "cmdb_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cmdb_relationships_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_log: {
        Row: {
          action: string
          channel: string | null
          consent_type: string
          contact_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          lead_id: string | null
          legal_basis: string | null
          metadata: Json | null
          new_status: string | null
          organization_id: string
          previous_status: string | null
          purpose: string | null
          source: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          channel?: string | null
          consent_type: string
          contact_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          new_status?: string | null
          organization_id: string
          previous_status?: string | null
          purpose?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          channel?: string | null
          consent_type?: string
          contact_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          legal_basis?: string | null
          metadata?: Json | null
          new_status?: string | null
          organization_id?: string
          previous_status?: string | null
          purpose?: string | null
          source?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "consent_log_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_log_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consent_log_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      csat_responses: {
        Row: {
          agent_id: string | null
          contact_id: string | null
          created_at: string
          feedback: string | null
          id: string
          ip_address: string | null
          organization_id: string
          rating_friendliness: number | null
          rating_knowledge: number | null
          rating_resolution: number | null
          rating_response_time: number | null
          respondent_email: string | null
          respondent_name: string | null
          score: number
          submitted_at: string
          survey_sent_at: string | null
          ticket_id: string
          would_recommend: boolean | null
        }
        Insert: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          ip_address?: string | null
          organization_id: string
          rating_friendliness?: number | null
          rating_knowledge?: number | null
          rating_resolution?: number | null
          rating_response_time?: number | null
          respondent_email?: string | null
          respondent_name?: string | null
          score: number
          submitted_at?: string
          survey_sent_at?: string | null
          ticket_id: string
          would_recommend?: boolean | null
        }
        Update: {
          agent_id?: string | null
          contact_id?: string | null
          created_at?: string
          feedback?: string | null
          id?: string
          ip_address?: string | null
          organization_id?: string
          rating_friendliness?: number | null
          rating_knowledge?: number | null
          rating_resolution?: number | null
          rating_response_time?: number | null
          respondent_email?: string | null
          respondent_name?: string | null
          score?: number
          submitted_at?: string
          survey_sent_at?: string | null
          ticket_id?: string
          would_recommend?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "csat_responses_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_responses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_responses_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "csat_responses_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_health_scores: {
        Row: {
          account_id: string
          alerts: Json | null
          created_at: string
          engagement_score: number | null
          factors: Json
          id: string
          last_calculated_at: string
          next_calculation_at: string | null
          notes: string | null
          nps_score: number | null
          organization_id: string
          payment_score: number | null
          previous_score: number | null
          risk_level: string | null
          score: number
          support_score: number | null
          trend: string | null
          updated_at: string
          usage_score: number | null
        }
        Insert: {
          account_id: string
          alerts?: Json | null
          created_at?: string
          engagement_score?: number | null
          factors?: Json
          id?: string
          last_calculated_at?: string
          next_calculation_at?: string | null
          notes?: string | null
          nps_score?: number | null
          organization_id: string
          payment_score?: number | null
          previous_score?: number | null
          risk_level?: string | null
          score: number
          support_score?: number | null
          trend?: string | null
          updated_at?: string
          usage_score?: number | null
        }
        Update: {
          account_id?: string
          alerts?: Json | null
          created_at?: string
          engagement_score?: number | null
          factors?: Json
          id?: string
          last_calculated_at?: string
          next_calculation_at?: string | null
          notes?: string | null
          nps_score?: number | null
          organization_id?: string
          payment_score?: number | null
          previous_score?: number | null
          risk_level?: string | null
          score?: number
          support_score?: number | null
          trend?: string | null
          updated_at?: string
          usage_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_health_scores_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_health_scores_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_identities: {
        Row: {
          churn_risk_score: number | null
          confidence_score: number | null
          consents: Json | null
          created_at: string | null
          engagement_score: number | null
          first_seen_at: string | null
          health_score: number | null
          id: string
          identifiers: Json
          last_activity_at: string | null
          last_seen_at: string | null
          linked_account_ids: string[] | null
          linked_contact_ids: string[] | null
          linked_lead_ids: string[] | null
          merge_history: Json | null
          organization_id: string
          preferences: Json | null
          primary_account_id: string | null
          primary_contact_id: string | null
          total_opportunities: number | null
          total_orders: number | null
          total_revenue: number | null
          total_tickets: number | null
          unified_profile: Json | null
          updated_at: string | null
        }
        Insert: {
          churn_risk_score?: number | null
          confidence_score?: number | null
          consents?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          first_seen_at?: string | null
          health_score?: number | null
          id?: string
          identifiers?: Json
          last_activity_at?: string | null
          last_seen_at?: string | null
          linked_account_ids?: string[] | null
          linked_contact_ids?: string[] | null
          linked_lead_ids?: string[] | null
          merge_history?: Json | null
          organization_id: string
          preferences?: Json | null
          primary_account_id?: string | null
          primary_contact_id?: string | null
          total_opportunities?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          total_tickets?: number | null
          unified_profile?: Json | null
          updated_at?: string | null
        }
        Update: {
          churn_risk_score?: number | null
          confidence_score?: number | null
          consents?: Json | null
          created_at?: string | null
          engagement_score?: number | null
          first_seen_at?: string | null
          health_score?: number | null
          id?: string
          identifiers?: Json
          last_activity_at?: string | null
          last_seen_at?: string | null
          linked_account_ids?: string[] | null
          linked_contact_ids?: string[] | null
          linked_lead_ids?: string[] | null
          merge_history?: Json | null
          organization_id?: string
          preferences?: Json | null
          primary_account_id?: string | null
          primary_contact_id?: string | null
          total_opportunities?: number | null
          total_orders?: number | null
          total_revenue?: number | null
          total_tickets?: number | null
          unified_profile?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_identities_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_primary_account_id_fkey"
            columns: ["primary_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_identities_primary_contact_id_fkey"
            columns: ["primary_contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_playbooks: {
        Row: {
          auto_enroll: boolean
          created_at: string
          description: string | null
          duration_days: number | null
          enrollment_count: number | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          owner_id: string | null
          steps: Json
          success_count: number | null
          success_criteria: Json | null
          trigger_conditions: Json | null
          type: Database["public"]["Enums"]["playbook_type"]
          updated_at: string
        }
        Insert: {
          auto_enroll?: boolean
          created_at?: string
          description?: string | null
          duration_days?: number | null
          enrollment_count?: number | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          owner_id?: string | null
          steps?: Json
          success_count?: number | null
          success_criteria?: Json | null
          trigger_conditions?: Json | null
          type: Database["public"]["Enums"]["playbook_type"]
          updated_at?: string
        }
        Update: {
          auto_enroll?: boolean
          created_at?: string
          description?: string | null
          duration_days?: number | null
          enrollment_count?: number | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          owner_id?: string | null
          steps?: Json
          success_count?: number | null
          success_criteria?: Json | null
          trigger_conditions?: Json | null
          type?: Database["public"]["Enums"]["playbook_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_playbooks_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_playbooks_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      data_retention_policies: {
        Row: {
          action: string
          conditions: Json | null
          created_at: string
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean
          last_run_at: string | null
          name: string
          next_run_at: string | null
          organization_id: string
          records_affected: number | null
          retention_days: number
          updated_at: string
        }
        Insert: {
          action: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name: string
          next_run_at?: string | null
          organization_id: string
          records_affected?: number | null
          retention_days: number
          updated_at?: string
        }
        Update: {
          action?: string
          conditions?: Json | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean
          last_run_at?: string | null
          name?: string
          next_run_at?: string | null
          organization_id?: string
          records_affected?: number | null
          retention_days?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_retention_policies_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_retention_policies_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      detected_duplicates: {
        Row: {
          created_at: string | null
          decision_at: string | null
          decision_by: string | null
          decision_notes: string | null
          entity_ids: string[]
          entity_type: string
          id: string
          match_reasons: Json
          merge_request_id: string | null
          organization_id: string
          similarity_score: number
          status: Database["public"]["Enums"]["duplicate_status"] | null
          suggested_primary_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          entity_ids: string[]
          entity_type: string
          id?: string
          match_reasons?: Json
          merge_request_id?: string | null
          organization_id: string
          similarity_score?: number
          status?: Database["public"]["Enums"]["duplicate_status"] | null
          suggested_primary_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          decision_at?: string | null
          decision_by?: string | null
          decision_notes?: string | null
          entity_ids?: string[]
          entity_type?: string
          id?: string
          match_reasons?: Json
          merge_request_id?: string | null
          organization_id?: string
          similarity_score?: number
          status?: Database["public"]["Enums"]["duplicate_status"] | null
          suggested_primary_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "detected_duplicates_decision_by_fkey"
            columns: ["decision_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detected_duplicates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      duplicate_detection_rules: {
        Row: {
          auto_merge_threshold: number | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_type: string
          id: string
          is_active: boolean | null
          match_fields: Json
          name: string
          organization_id: string
          priority: number | null
          threshold_score: number | null
          updated_at: string | null
        }
        Insert: {
          auto_merge_threshold?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type: string
          id?: string
          is_active?: boolean | null
          match_fields?: Json
          name: string
          organization_id: string
          priority?: number | null
          threshold_score?: number | null
          updated_at?: string | null
        }
        Update: {
          auto_merge_threshold?: number | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          entity_type?: string
          id?: string
          is_active?: boolean | null
          match_fields?: Json
          name?: string
          organization_id?: string
          priority?: number | null
          threshold_score?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "duplicate_detection_rules_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "duplicate_detection_rules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          avg_click_rate: number | null
          avg_open_rate: number | null
          body_html: string
          body_json: Json | null
          body_text: string | null
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_shared: boolean | null
          is_system: boolean | null
          last_used_at: string | null
          layout: string | null
          name: string
          organization_id: string
          preview_text: string | null
          subject: string
          tags: string[] | null
          thumbnail_url: string | null
          updated_at: string
          updated_by: string | null
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          body_html: string
          body_json?: Json | null
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          is_system?: boolean | null
          last_used_at?: string | null
          layout?: string | null
          name: string
          organization_id: string
          preview_text?: string | null
          subject: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          avg_click_rate?: number | null
          avg_open_rate?: number | null
          body_html?: string
          body_json?: Json | null
          body_text?: string | null
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_shared?: boolean | null
          is_system?: boolean | null
          last_used_at?: string | null
          layout?: string | null
          name?: string
          organization_id?: string
          preview_text?: string | null
          subject?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          updated_at?: string
          updated_by?: string | null
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "email_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_templates_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      form_submissions: {
        Row: {
          contact_id: string | null
          created_at: string
          data: Json
          error_message: string | null
          form_id: string
          id: string
          ip_address: string | null
          lead_id: string | null
          organization_id: string
          page_url: string | null
          processed: boolean | null
          processed_at: string | null
          referrer: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          contact_id?: string | null
          created_at?: string
          data: Json
          error_message?: string | null
          form_id: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          organization_id: string
          page_url?: string | null
          processed?: boolean | null
          processed_at?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          contact_id?: string | null
          created_at?: string
          data?: Json
          error_message?: string | null
          form_id?: string
          id?: string
          ip_address?: string | null
          lead_id?: string | null
          organization_id?: string
          page_url?: string | null
          processed?: boolean | null
          processed_at?: string | null
          referrer?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "marketing_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "form_submissions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_snapshots: {
        Row: {
          commerce_avg_order_value: number | null
          commerce_cart_abandonment_rate: number | null
          commerce_orders: number | null
          commerce_return_rate: number | null
          commerce_returns: number | null
          commerce_revenue: number | null
          created_at: string | null
          customer_lifetime_value: number | null
          customers_at_risk: number | null
          customers_churned: number | null
          customers_new: number | null
          customers_total: number | null
          id: string
          lead_to_mql_rate: number | null
          marketing_campaigns_active: number | null
          marketing_conversions: number | null
          marketing_email_clicks: number | null
          marketing_email_opens: number | null
          marketing_emails_sent: number | null
          marketing_leads: number | null
          marketing_mqls: number | null
          marketing_spend: number | null
          marketing_visitors: number | null
          mql_to_sql_rate: number | null
          opportunity_to_customer_rate: number | null
          organization_id: string
          period_type: string
          sales_avg_cycle_days: number | null
          sales_avg_deal_size: number | null
          sales_closed_value: number | null
          sales_leads_received: number | null
          sales_opportunities_created: number | null
          sales_opportunities_lost: number | null
          sales_opportunities_won: number | null
          sales_pipeline_value: number | null
          sales_sqls: number | null
          sales_win_rate: number | null
          service_avg_resolution_hours: number | null
          service_csat_score: number | null
          service_nps_score: number | null
          service_sla_compliance: number | null
          service_tickets_backlog: number | null
          service_tickets_created: number | null
          service_tickets_resolved: number | null
          snapshot_date: string
          sql_to_opportunity_rate: number | null
          visitor_to_lead_rate: number | null
        }
        Insert: {
          commerce_avg_order_value?: number | null
          commerce_cart_abandonment_rate?: number | null
          commerce_orders?: number | null
          commerce_return_rate?: number | null
          commerce_returns?: number | null
          commerce_revenue?: number | null
          created_at?: string | null
          customer_lifetime_value?: number | null
          customers_at_risk?: number | null
          customers_churned?: number | null
          customers_new?: number | null
          customers_total?: number | null
          id?: string
          lead_to_mql_rate?: number | null
          marketing_campaigns_active?: number | null
          marketing_conversions?: number | null
          marketing_email_clicks?: number | null
          marketing_email_opens?: number | null
          marketing_emails_sent?: number | null
          marketing_leads?: number | null
          marketing_mqls?: number | null
          marketing_spend?: number | null
          marketing_visitors?: number | null
          mql_to_sql_rate?: number | null
          opportunity_to_customer_rate?: number | null
          organization_id: string
          period_type: string
          sales_avg_cycle_days?: number | null
          sales_avg_deal_size?: number | null
          sales_closed_value?: number | null
          sales_leads_received?: number | null
          sales_opportunities_created?: number | null
          sales_opportunities_lost?: number | null
          sales_opportunities_won?: number | null
          sales_pipeline_value?: number | null
          sales_sqls?: number | null
          sales_win_rate?: number | null
          service_avg_resolution_hours?: number | null
          service_csat_score?: number | null
          service_nps_score?: number | null
          service_sla_compliance?: number | null
          service_tickets_backlog?: number | null
          service_tickets_created?: number | null
          service_tickets_resolved?: number | null
          snapshot_date: string
          sql_to_opportunity_rate?: number | null
          visitor_to_lead_rate?: number | null
        }
        Update: {
          commerce_avg_order_value?: number | null
          commerce_cart_abandonment_rate?: number | null
          commerce_orders?: number | null
          commerce_return_rate?: number | null
          commerce_returns?: number | null
          commerce_revenue?: number | null
          created_at?: string | null
          customer_lifetime_value?: number | null
          customers_at_risk?: number | null
          customers_churned?: number | null
          customers_new?: number | null
          customers_total?: number | null
          id?: string
          lead_to_mql_rate?: number | null
          marketing_campaigns_active?: number | null
          marketing_conversions?: number | null
          marketing_email_clicks?: number | null
          marketing_email_opens?: number | null
          marketing_emails_sent?: number | null
          marketing_leads?: number | null
          marketing_mqls?: number | null
          marketing_spend?: number | null
          marketing_visitors?: number | null
          mql_to_sql_rate?: number | null
          opportunity_to_customer_rate?: number | null
          organization_id?: string
          period_type?: string
          sales_avg_cycle_days?: number | null
          sales_avg_deal_size?: number | null
          sales_closed_value?: number | null
          sales_leads_received?: number | null
          sales_opportunities_created?: number | null
          sales_opportunities_lost?: number | null
          sales_opportunities_won?: number | null
          sales_pipeline_value?: number | null
          sales_sqls?: number | null
          sales_win_rate?: number | null
          service_avg_resolution_hours?: number | null
          service_csat_score?: number | null
          service_nps_score?: number | null
          service_sla_compliance?: number | null
          service_tickets_backlog?: number | null
          service_tickets_created?: number | null
          service_tickets_resolved?: number | null
          snapshot_date?: string
          sql_to_opportunity_rate?: number | null
          visitor_to_lead_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "funnel_snapshots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      it_assets: {
        Row: {
          asset_tag: string
          asset_type: Database["public"]["Enums"]["it_asset_type"]
          assigned_at: string | null
          assigned_to: string | null
          barcode: string | null
          category: string | null
          cmdb_item_id: string | null
          condition: Database["public"]["Enums"]["it_asset_condition"] | null
          created_at: string | null
          current_book_value: number | null
          custom_fields: Json | null
          department: string | null
          depreciation_method: string | null
          depreciation_period_months: number | null
          description: string | null
          disposal_date: string | null
          disposal_method: string | null
          disposal_notes: string | null
          disposal_value: number | null
          id: string
          invoice_number: string | null
          is_leased: boolean | null
          last_maintenance_date: string | null
          lease_contract_number: string | null
          lease_cost_monthly: number | null
          lease_end_date: string | null
          lease_start_date: string | null
          license_cost: number | null
          license_end_date: string | null
          license_key: string | null
          license_seats: number | null
          license_start_date: string | null
          license_type: string | null
          location: string | null
          maintenance_notes: string | null
          manufacturer: string | null
          model: string | null
          name: string
          next_maintenance_date: string | null
          notes: string | null
          organization_id: string
          parent_asset_id: string | null
          part_number: string | null
          purchase_cost: number | null
          purchase_date: string | null
          purchase_order_number: string | null
          qr_code: string | null
          rfid_tag: string | null
          salvage_value: number | null
          serial_number: string | null
          status: Database["public"]["Enums"]["it_asset_status"] | null
          subcategory: string | null
          subscription_cost_monthly: number | null
          subscription_id: string | null
          subscription_renewal_date: string | null
          subscription_tier: string | null
          tags: string[] | null
          updated_at: string | null
          vendor_id: string | null
          vendor_name: string | null
          warranty_contract_number: string | null
          warranty_end_date: string | null
          warranty_provider: string | null
          warranty_start_date: string | null
          warranty_type: string | null
        }
        Insert: {
          asset_tag: string
          asset_type: Database["public"]["Enums"]["it_asset_type"]
          assigned_at?: string | null
          assigned_to?: string | null
          barcode?: string | null
          category?: string | null
          cmdb_item_id?: string | null
          condition?: Database["public"]["Enums"]["it_asset_condition"] | null
          created_at?: string | null
          current_book_value?: number | null
          custom_fields?: Json | null
          department?: string | null
          depreciation_method?: string | null
          depreciation_period_months?: number | null
          description?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_notes?: string | null
          disposal_value?: number | null
          id?: string
          invoice_number?: string | null
          is_leased?: boolean | null
          last_maintenance_date?: string | null
          lease_contract_number?: string | null
          lease_cost_monthly?: number | null
          lease_end_date?: string | null
          lease_start_date?: string | null
          license_cost?: number | null
          license_end_date?: string | null
          license_key?: string | null
          license_seats?: number | null
          license_start_date?: string | null
          license_type?: string | null
          location?: string | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          next_maintenance_date?: string | null
          notes?: string | null
          organization_id: string
          parent_asset_id?: string | null
          part_number?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          purchase_order_number?: string | null
          qr_code?: string | null
          rfid_tag?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["it_asset_status"] | null
          subcategory?: string | null
          subscription_cost_monthly?: number | null
          subscription_id?: string | null
          subscription_renewal_date?: string | null
          subscription_tier?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          warranty_contract_number?: string | null
          warranty_end_date?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
          warranty_type?: string | null
        }
        Update: {
          asset_tag?: string
          asset_type?: Database["public"]["Enums"]["it_asset_type"]
          assigned_at?: string | null
          assigned_to?: string | null
          barcode?: string | null
          category?: string | null
          cmdb_item_id?: string | null
          condition?: Database["public"]["Enums"]["it_asset_condition"] | null
          created_at?: string | null
          current_book_value?: number | null
          custom_fields?: Json | null
          department?: string | null
          depreciation_method?: string | null
          depreciation_period_months?: number | null
          description?: string | null
          disposal_date?: string | null
          disposal_method?: string | null
          disposal_notes?: string | null
          disposal_value?: number | null
          id?: string
          invoice_number?: string | null
          is_leased?: boolean | null
          last_maintenance_date?: string | null
          lease_contract_number?: string | null
          lease_cost_monthly?: number | null
          lease_end_date?: string | null
          lease_start_date?: string | null
          license_cost?: number | null
          license_end_date?: string | null
          license_key?: string | null
          license_seats?: number | null
          license_start_date?: string | null
          license_type?: string | null
          location?: string | null
          maintenance_notes?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          next_maintenance_date?: string | null
          notes?: string | null
          organization_id?: string
          parent_asset_id?: string | null
          part_number?: string | null
          purchase_cost?: number | null
          purchase_date?: string | null
          purchase_order_number?: string | null
          qr_code?: string | null
          rfid_tag?: string | null
          salvage_value?: number | null
          serial_number?: string | null
          status?: Database["public"]["Enums"]["it_asset_status"] | null
          subcategory?: string | null
          subscription_cost_monthly?: number | null
          subscription_id?: string | null
          subscription_renewal_date?: string | null
          subscription_tier?: string | null
          tags?: string[] | null
          updated_at?: string | null
          vendor_id?: string | null
          vendor_name?: string | null
          warranty_contract_number?: string | null
          warranty_end_date?: string | null
          warranty_provider?: string | null
          warranty_start_date?: string | null
          warranty_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_assets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_assets_cmdb_item_id_fkey"
            columns: ["cmdb_item_id"]
            isOneToOne: false
            referencedRelation: "cmdb_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_assets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_assets_parent_asset_id_fkey"
            columns: ["parent_asset_id"]
            isOneToOne: false
            referencedRelation: "it_assets"
            referencedColumns: ["id"]
          },
        ]
      }
      it_changes: {
        Row: {
          actual_end: string | null
          actual_start: string | null
          affected_cis: string[] | null
          affected_services: string[] | null
          approval_required: boolean | null
          approval_status: string | null
          approvals: Json | null
          approved_at: string | null
          approvers: string[] | null
          assigned_to: string | null
          assignment_group_id: string | null
          business_justification: string | null
          cab_date: string | null
          cab_notes: string | null
          cab_outcome: string | null
          cab_required: boolean | null
          category: string | null
          change_manager_id: string | null
          change_number: string
          change_type: Database["public"]["Enums"]["it_change_type"] | null
          closed_at: string | null
          closed_by: string | null
          closure_code: string | null
          closure_notes: string | null
          communication_plan: string | null
          created_at: string | null
          description: string | null
          downtime_duration_minutes: number | null
          downtime_required: boolean | null
          id: string
          impact_analysis: string | null
          implementation_notes: string | null
          implementation_plan: string | null
          implementation_result: string | null
          lessons_learned: string | null
          organization_id: string
          parent_change_id: string | null
          rejected_at: string | null
          related_incidents: string[] | null
          related_problems: string[] | null
          requested_by: string | null
          requested_date: string | null
          review_date: string | null
          review_notes: string | null
          reviewed_by: string | null
          risk_level: Database["public"]["Enums"]["it_change_risk"] | null
          rollback_plan: string | null
          scheduled_end: string | null
          scheduled_start: string | null
          status: Database["public"]["Enums"]["it_change_status"] | null
          subcategory: string | null
          submitted_at: string | null
          success_rating: number | null
          test_plan: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_end?: string | null
          actual_start?: string | null
          affected_cis?: string[] | null
          affected_services?: string[] | null
          approval_required?: boolean | null
          approval_status?: string | null
          approvals?: Json | null
          approved_at?: string | null
          approvers?: string[] | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          business_justification?: string | null
          cab_date?: string | null
          cab_notes?: string | null
          cab_outcome?: string | null
          cab_required?: boolean | null
          category?: string | null
          change_manager_id?: string | null
          change_number: string
          change_type?: Database["public"]["Enums"]["it_change_type"] | null
          closed_at?: string | null
          closed_by?: string | null
          closure_code?: string | null
          closure_notes?: string | null
          communication_plan?: string | null
          created_at?: string | null
          description?: string | null
          downtime_duration_minutes?: number | null
          downtime_required?: boolean | null
          id?: string
          impact_analysis?: string | null
          implementation_notes?: string | null
          implementation_plan?: string | null
          implementation_result?: string | null
          lessons_learned?: string | null
          organization_id: string
          parent_change_id?: string | null
          rejected_at?: string | null
          related_incidents?: string[] | null
          related_problems?: string[] | null
          requested_by?: string | null
          requested_date?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["it_change_risk"] | null
          rollback_plan?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["it_change_status"] | null
          subcategory?: string | null
          submitted_at?: string | null
          success_rating?: number | null
          test_plan?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_end?: string | null
          actual_start?: string | null
          affected_cis?: string[] | null
          affected_services?: string[] | null
          approval_required?: boolean | null
          approval_status?: string | null
          approvals?: Json | null
          approved_at?: string | null
          approvers?: string[] | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          business_justification?: string | null
          cab_date?: string | null
          cab_notes?: string | null
          cab_outcome?: string | null
          cab_required?: boolean | null
          category?: string | null
          change_manager_id?: string | null
          change_number?: string
          change_type?: Database["public"]["Enums"]["it_change_type"] | null
          closed_at?: string | null
          closed_by?: string | null
          closure_code?: string | null
          closure_notes?: string | null
          communication_plan?: string | null
          created_at?: string | null
          description?: string | null
          downtime_duration_minutes?: number | null
          downtime_required?: boolean | null
          id?: string
          impact_analysis?: string | null
          implementation_notes?: string | null
          implementation_plan?: string | null
          implementation_result?: string | null
          lessons_learned?: string | null
          organization_id?: string
          parent_change_id?: string | null
          rejected_at?: string | null
          related_incidents?: string[] | null
          related_problems?: string[] | null
          requested_by?: string | null
          requested_date?: string | null
          review_date?: string | null
          review_notes?: string | null
          reviewed_by?: string | null
          risk_level?: Database["public"]["Enums"]["it_change_risk"] | null
          rollback_plan?: string | null
          scheduled_end?: string | null
          scheduled_start?: string | null
          status?: Database["public"]["Enums"]["it_change_status"] | null
          subcategory?: string | null
          submitted_at?: string | null
          success_rating?: number | null
          test_plan?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_changes_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_assignment_group_id_fkey"
            columns: ["assignment_group_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_change_manager_id_fkey"
            columns: ["change_manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_parent_change_id_fkey"
            columns: ["parent_change_id"]
            isOneToOne: false
            referencedRelation: "it_changes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_changes_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      it_incidents: {
        Row: {
          acknowledged_at: string | null
          affected_accounts: string[] | null
          affected_ci_id: string | null
          affected_service: string | null
          affected_users_count: number | null
          assigned_to: string | null
          assignment_group_id: string | null
          category: string | null
          created_at: string | null
          customer_communication: string | null
          customer_visible: boolean | null
          description: string | null
          escalation_level: number | null
          external_id: string | null
          first_response_at: string | null
          id: string
          impact: Database["public"]["Enums"]["it_impact"] | null
          incident_number: string
          organization_id: string
          parent_incident_id: string | null
          priority: Database["public"]["Enums"]["it_priority"] | null
          related_incidents: string[] | null
          related_problem_id: string | null
          reported_by: string | null
          resolution: string | null
          resolution_code: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          sla_breached: boolean | null
          sla_id: string | null
          sla_resolution_due: string | null
          sla_resolution_met: boolean | null
          sla_response_due: string | null
          sla_response_met: boolean | null
          source: string | null
          status: Database["public"]["Enums"]["it_incident_status"] | null
          subcategory: string | null
          title: string
          updated_at: string | null
          urgency: Database["public"]["Enums"]["it_urgency"] | null
          workaround: string | null
          workaround_available: boolean | null
        }
        Insert: {
          acknowledged_at?: string | null
          affected_accounts?: string[] | null
          affected_ci_id?: string | null
          affected_service?: string | null
          affected_users_count?: number | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_communication?: string | null
          customer_visible?: boolean | null
          description?: string | null
          escalation_level?: number | null
          external_id?: string | null
          first_response_at?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["it_impact"] | null
          incident_number: string
          organization_id: string
          parent_incident_id?: string | null
          priority?: Database["public"]["Enums"]["it_priority"] | null
          related_incidents?: string[] | null
          related_problem_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          sla_breached?: boolean | null
          sla_id?: string | null
          sla_resolution_due?: string | null
          sla_resolution_met?: boolean | null
          sla_response_due?: string | null
          sla_response_met?: boolean | null
          source?: string | null
          status?: Database["public"]["Enums"]["it_incident_status"] | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["it_urgency"] | null
          workaround?: string | null
          workaround_available?: boolean | null
        }
        Update: {
          acknowledged_at?: string | null
          affected_accounts?: string[] | null
          affected_ci_id?: string | null
          affected_service?: string | null
          affected_users_count?: number | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          category?: string | null
          created_at?: string | null
          customer_communication?: string | null
          customer_visible?: boolean | null
          description?: string | null
          escalation_level?: number | null
          external_id?: string | null
          first_response_at?: string | null
          id?: string
          impact?: Database["public"]["Enums"]["it_impact"] | null
          incident_number?: string
          organization_id?: string
          parent_incident_id?: string | null
          priority?: Database["public"]["Enums"]["it_priority"] | null
          related_incidents?: string[] | null
          related_problem_id?: string | null
          reported_by?: string | null
          resolution?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          sla_breached?: boolean | null
          sla_id?: string | null
          sla_resolution_due?: string | null
          sla_resolution_met?: boolean | null
          sla_response_due?: string | null
          sla_response_met?: boolean | null
          source?: string | null
          status?: Database["public"]["Enums"]["it_incident_status"] | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          urgency?: Database["public"]["Enums"]["it_urgency"] | null
          workaround?: string | null
          workaround_available?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "it_incidents_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_incidents_assignment_group_id_fkey"
            columns: ["assignment_group_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_incidents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_incidents_parent_incident_id_fkey"
            columns: ["parent_incident_id"]
            isOneToOne: false
            referencedRelation: "it_incidents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_incidents_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_incidents_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      it_knowledge_articles: {
        Row: {
          article_number: string
          article_type: string | null
          author_id: string | null
          category: string
          content: string
          content_html: string | null
          created_at: string | null
          expires_at: string | null
          helpful_count: number | null
          id: string
          is_published: boolean | null
          keywords: string[] | null
          not_helpful_count: number | null
          organization_id: string
          published_at: string | null
          related_cis: string[] | null
          related_services: string[] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          subcategory: string | null
          tags: string[] | null
          target_audience: string | null
          title: string
          updated_at: string | null
          version: number | null
          view_count: number | null
          visibility: string | null
        }
        Insert: {
          article_number: string
          article_type?: string | null
          author_id?: string | null
          category: string
          content: string
          content_html?: string | null
          created_at?: string | null
          expires_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          organization_id: string
          published_at?: string | null
          related_cis?: string[] | null
          related_services?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
          visibility?: string | null
        }
        Update: {
          article_number?: string
          article_type?: string | null
          author_id?: string | null
          category?: string
          content?: string
          content_html?: string | null
          created_at?: string | null
          expires_at?: string | null
          helpful_count?: number | null
          id?: string
          is_published?: boolean | null
          keywords?: string[] | null
          not_helpful_count?: number | null
          organization_id?: string
          published_at?: string | null
          related_cis?: string[] | null
          related_services?: string[] | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          subcategory?: string | null
          tags?: string[] | null
          target_audience?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
          view_count?: number | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_knowledge_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_knowledge_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_knowledge_articles_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      it_problems: {
        Row: {
          affected_ci_id: string | null
          affected_service: string | null
          assigned_to: string | null
          assignment_group_id: string | null
          business_impact: string | null
          category: string | null
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          customers_affected: number | null
          description: string | null
          fix_implemented_at: string | null
          fix_verified: boolean | null
          id: string
          impact: Database["public"]["Enums"]["it_impact"] | null
          incident_count: number | null
          known_error_created_at: string | null
          known_error_id: string | null
          organization_id: string
          owner_id: string | null
          permanent_fix: string | null
          priority: Database["public"]["Enums"]["it_priority"] | null
          problem_number: string
          related_change_id: string | null
          related_incidents: string[] | null
          resolution: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          root_cause_identified_at: string | null
          root_cause_identified_by: string | null
          status: Database["public"]["Enums"]["it_problem_status"] | null
          subcategory: string | null
          title: string
          updated_at: string | null
          workaround: string | null
          workaround_available: boolean | null
          workaround_documented_at: string | null
        }
        Insert: {
          affected_ci_id?: string | null
          affected_service?: string | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          business_impact?: string | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          customers_affected?: number | null
          description?: string | null
          fix_implemented_at?: string | null
          fix_verified?: boolean | null
          id?: string
          impact?: Database["public"]["Enums"]["it_impact"] | null
          incident_count?: number | null
          known_error_created_at?: string | null
          known_error_id?: string | null
          organization_id: string
          owner_id?: string | null
          permanent_fix?: string | null
          priority?: Database["public"]["Enums"]["it_priority"] | null
          problem_number: string
          related_change_id?: string | null
          related_incidents?: string[] | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          root_cause_identified_at?: string | null
          root_cause_identified_by?: string | null
          status?: Database["public"]["Enums"]["it_problem_status"] | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          workaround?: string | null
          workaround_available?: boolean | null
          workaround_documented_at?: string | null
        }
        Update: {
          affected_ci_id?: string | null
          affected_service?: string | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          business_impact?: string | null
          category?: string | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          customers_affected?: number | null
          description?: string | null
          fix_implemented_at?: string | null
          fix_verified?: boolean | null
          id?: string
          impact?: Database["public"]["Enums"]["it_impact"] | null
          incident_count?: number | null
          known_error_created_at?: string | null
          known_error_id?: string | null
          organization_id?: string
          owner_id?: string | null
          permanent_fix?: string | null
          priority?: Database["public"]["Enums"]["it_priority"] | null
          problem_number?: string
          related_change_id?: string | null
          related_incidents?: string[] | null
          resolution?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          root_cause_identified_at?: string | null
          root_cause_identified_by?: string | null
          status?: Database["public"]["Enums"]["it_problem_status"] | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          workaround?: string | null
          workaround_available?: boolean | null
          workaround_documented_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_problems_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_assignment_group_id_fkey"
            columns: ["assignment_group_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_problems_root_cause_identified_by_fkey"
            columns: ["root_cause_identified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      it_requests: {
        Row: {
          actual_cost: number | null
          approval_notes: string | null
          approval_required: boolean | null
          approved_at: string | null
          approver_id: string | null
          assigned_to: string | null
          assignment_group_id: string | null
          attachments_count: number | null
          catalog_item_id: string | null
          catalog_item_name: string | null
          category: string | null
          cost_center: string | null
          created_at: string | null
          department: string | null
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          form_data: Json | null
          fulfilled_at: string | null
          fulfilled_by: string | null
          fulfillment_notes: string | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["it_priority"] | null
          rejected_at: string | null
          request_number: string
          request_type: string | null
          requested_for_id: string | null
          requester_id: string | null
          sla_breached: boolean | null
          status: Database["public"]["Enums"]["it_request_status"] | null
          subcategory: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          approval_notes?: string | null
          approval_required?: boolean | null
          approved_at?: string | null
          approver_id?: string | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          attachments_count?: number | null
          catalog_item_id?: string | null
          catalog_item_name?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          form_data?: Json | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfillment_notes?: string | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["it_priority"] | null
          rejected_at?: string | null
          request_number: string
          request_type?: string | null
          requested_for_id?: string | null
          requester_id?: string | null
          sla_breached?: boolean | null
          status?: Database["public"]["Enums"]["it_request_status"] | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          approval_notes?: string | null
          approval_required?: boolean | null
          approved_at?: string | null
          approver_id?: string | null
          assigned_to?: string | null
          assignment_group_id?: string | null
          attachments_count?: number | null
          catalog_item_id?: string | null
          catalog_item_name?: string | null
          category?: string | null
          cost_center?: string | null
          created_at?: string | null
          department?: string | null
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          form_data?: Json | null
          fulfilled_at?: string | null
          fulfilled_by?: string | null
          fulfillment_notes?: string | null
          id?: string
          organization_id?: string
          priority?: Database["public"]["Enums"]["it_priority"] | null
          rejected_at?: string | null
          request_number?: string
          request_type?: string | null
          requested_for_id?: string | null
          requester_id?: string | null
          sla_breached?: boolean | null
          status?: Database["public"]["Enums"]["it_request_status"] | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_requests_approver_id_fkey"
            columns: ["approver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_assignment_group_id_fkey"
            columns: ["assignment_group_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_fulfilled_by_fkey"
            columns: ["fulfilled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_requested_for_id_fkey"
            columns: ["requested_for_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_requests_requester_id_fkey"
            columns: ["requester_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      it_service_catalog: {
        Row: {
          allowed_roles: string[] | null
          approval_required: boolean | null
          approver_roles: string[] | null
          avg_fulfillment_time_hours: number | null
          base_cost: number | null
          category: string
          cost_type: string | null
          created_at: string | null
          default_assignee_id: string | null
          description: string | null
          display_order: number | null
          estimated_time_minutes: number | null
          form_schema: Json | null
          fulfillment_group_id: string | null
          has_cost: boolean | null
          icon: string | null
          id: string
          image_url: string | null
          instructions: string | null
          is_active: boolean | null
          is_featured: boolean | null
          knowledge_article_id: string | null
          name: string
          organization_id: string
          published_at: string | null
          related_ci_id: string | null
          request_count: number | null
          satisfaction_score: number | null
          short_description: string | null
          sla_id: string | null
          subcategory: string | null
          target_resolution_hours: number | null
          updated_at: string | null
          visibility: string | null
        }
        Insert: {
          allowed_roles?: string[] | null
          approval_required?: boolean | null
          approver_roles?: string[] | null
          avg_fulfillment_time_hours?: number | null
          base_cost?: number | null
          category: string
          cost_type?: string | null
          created_at?: string | null
          default_assignee_id?: string | null
          description?: string | null
          display_order?: number | null
          estimated_time_minutes?: number | null
          form_schema?: Json | null
          fulfillment_group_id?: string | null
          has_cost?: boolean | null
          icon?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          knowledge_article_id?: string | null
          name: string
          organization_id: string
          published_at?: string | null
          related_ci_id?: string | null
          request_count?: number | null
          satisfaction_score?: number | null
          short_description?: string | null
          sla_id?: string | null
          subcategory?: string | null
          target_resolution_hours?: number | null
          updated_at?: string | null
          visibility?: string | null
        }
        Update: {
          allowed_roles?: string[] | null
          approval_required?: boolean | null
          approver_roles?: string[] | null
          avg_fulfillment_time_hours?: number | null
          base_cost?: number | null
          category?: string
          cost_type?: string | null
          created_at?: string | null
          default_assignee_id?: string | null
          description?: string | null
          display_order?: number | null
          estimated_time_minutes?: number | null
          form_schema?: Json | null
          fulfillment_group_id?: string | null
          has_cost?: boolean | null
          icon?: string | null
          id?: string
          image_url?: string | null
          instructions?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          knowledge_article_id?: string | null
          name?: string
          organization_id?: string
          published_at?: string | null
          related_ci_id?: string | null
          request_count?: number | null
          satisfaction_score?: number | null
          short_description?: string | null
          sla_id?: string | null
          subcategory?: string | null
          target_resolution_hours?: number | null
          updated_at?: string | null
          visibility?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_service_catalog_default_assignee_id_fkey"
            columns: ["default_assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_service_catalog_fulfillment_group_id_fkey"
            columns: ["fulfillment_group_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_service_catalog_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_service_catalog_related_ci_id_fkey"
            columns: ["related_ci_id"]
            isOneToOne: false
            referencedRelation: "cmdb_items"
            referencedColumns: ["id"]
          },
        ]
      }
      it_slas: {
        Row: {
          applies_to: string
          business_days: number[] | null
          business_hours_end: string | null
          business_hours_only: boolean | null
          business_hours_start: string | null
          created_at: string | null
          description: string | null
          escalation_enabled: boolean | null
          escalation_thresholds: Json | null
          id: string
          is_active: boolean | null
          is_default: boolean | null
          name: string
          organization_id: string
          resolution_critical: number | null
          resolution_high: number | null
          resolution_low: number | null
          resolution_medium: number | null
          response_critical: number | null
          response_high: number | null
          response_low: number | null
          response_medium: number | null
          timezone: string | null
          updated_at: string | null
        }
        Insert: {
          applies_to?: string
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          created_at?: string | null
          description?: string | null
          escalation_enabled?: boolean | null
          escalation_thresholds?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name: string
          organization_id: string
          resolution_critical?: number | null
          resolution_high?: number | null
          resolution_low?: number | null
          resolution_medium?: number | null
          response_critical?: number | null
          response_high?: number | null
          response_low?: number | null
          response_medium?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Update: {
          applies_to?: string
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean | null
          business_hours_start?: string | null
          created_at?: string | null
          description?: string | null
          escalation_enabled?: boolean | null
          escalation_thresholds?: Json | null
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          name?: string
          organization_id?: string
          resolution_critical?: number | null
          resolution_high?: number | null
          resolution_low?: number | null
          resolution_medium?: number | null
          response_critical?: number | null
          response_high?: number | null
          response_low?: number | null
          response_medium?: number | null
          timezone?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_slas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      it_work_notes: {
        Row: {
          content: string
          content_html: string | null
          created_at: string | null
          created_by: string | null
          entity_id: string
          entity_type: string
          id: string
          is_internal: boolean | null
          is_resolution: boolean | null
          note_type: string | null
          organization_id: string
          time_spent_minutes: number | null
          updated_at: string | null
        }
        Insert: {
          content: string
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id: string
          entity_type: string
          id?: string
          is_internal?: boolean | null
          is_resolution?: boolean | null
          note_type?: string | null
          organization_id: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          content_html?: string | null
          created_at?: string | null
          created_by?: string | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_internal?: boolean | null
          is_resolution?: boolean | null
          note_type?: string | null
          organization_id?: string
          time_spent_minutes?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "it_work_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "it_work_notes_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_enrollments: {
        Row: {
          completed_at: string | null
          contact_id: string | null
          context: Json | null
          created_at: string
          current_step_id: string | null
          current_step_key: string | null
          entered_at: string | null
          entry_source: string | null
          exit_reason: string | null
          exited_at: string | null
          goal_achieved_at: string | null
          id: string
          journey_id: string
          last_step_at: string | null
          lead_id: string | null
          next_step_at: string | null
          organization_id: string
          status: Database["public"]["Enums"]["enrollment_status"]
          step_history: Json | null
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          contact_id?: string | null
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          current_step_key?: string | null
          entered_at?: string | null
          entry_source?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          goal_achieved_at?: string | null
          id?: string
          journey_id: string
          last_step_at?: string | null
          lead_id?: string | null
          next_step_at?: string | null
          organization_id: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          step_history?: Json | null
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          contact_id?: string | null
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          current_step_key?: string | null
          entered_at?: string | null
          entry_source?: string | null
          exit_reason?: string | null
          exited_at?: string | null
          goal_achieved_at?: string | null
          id?: string
          journey_id?: string
          last_step_at?: string | null
          lead_id?: string | null
          next_step_at?: string | null
          organization_id?: string
          status?: Database["public"]["Enums"]["enrollment_status"]
          step_history?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "journey_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journey_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_steps: {
        Row: {
          avg_duration_ms: number | null
          branches: Json | null
          completed_count: number | null
          conditions: Json | null
          config: Json
          created_at: string
          description: string | null
          entered_count: number | null
          failed_count: number | null
          id: string
          is_entry_point: boolean | null
          is_exit_point: boolean | null
          journey_id: string
          name: string
          next_step_on_failure: string | null
          next_step_on_success: string | null
          position_x: number | null
          position_y: number | null
          step_key: string
          step_order: number
          type: Database["public"]["Enums"]["journey_step_type"]
          updated_at: string
          wait_duration_unit: string | null
          wait_duration_value: number | null
          wait_until_day: string | null
          wait_until_time: string | null
        }
        Insert: {
          avg_duration_ms?: number | null
          branches?: Json | null
          completed_count?: number | null
          conditions?: Json | null
          config?: Json
          created_at?: string
          description?: string | null
          entered_count?: number | null
          failed_count?: number | null
          id?: string
          is_entry_point?: boolean | null
          is_exit_point?: boolean | null
          journey_id: string
          name: string
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          position_x?: number | null
          position_y?: number | null
          step_key: string
          step_order: number
          type: Database["public"]["Enums"]["journey_step_type"]
          updated_at?: string
          wait_duration_unit?: string | null
          wait_duration_value?: number | null
          wait_until_day?: string | null
          wait_until_time?: string | null
        }
        Update: {
          avg_duration_ms?: number | null
          branches?: Json | null
          completed_count?: number | null
          conditions?: Json | null
          config?: Json
          created_at?: string
          description?: string | null
          entered_count?: number | null
          failed_count?: number | null
          id?: string
          is_entry_point?: boolean | null
          is_exit_point?: boolean | null
          journey_id?: string
          name?: string
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          position_x?: number | null
          position_y?: number | null
          step_key?: string
          step_order?: number
          type?: Database["public"]["Enums"]["journey_step_type"]
          updated_at?: string
          wait_duration_unit?: string | null
          wait_duration_value?: number | null
          wait_until_day?: string | null
          wait_until_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "journey_steps_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
        ]
      }
      journeys: {
        Row: {
          active_count: number | null
          allow_reentry: boolean | null
          avg_duration_hours: number | null
          completed_count: number | null
          conversion_rate: number | null
          created_at: string
          created_by: string | null
          description: string | null
          entry_count: number | null
          exited_count: number | null
          goal_achieved_count: number | null
          goal_config: Json | null
          goal_segment_id: string | null
          goal_type: string | null
          id: string
          max_enrollments: number | null
          name: string
          organization_id: string
          owner_id: string | null
          published_at: string | null
          published_by: string | null
          reentry_wait_days: number | null
          status: Database["public"]["Enums"]["journey_status"]
          tags: string[] | null
          timezone: string | null
          trigger_config: Json | null
          trigger_event_name: string | null
          trigger_segment_id: string | null
          trigger_type: string
          updated_at: string
        }
        Insert: {
          active_count?: number | null
          allow_reentry?: boolean | null
          avg_duration_hours?: number | null
          completed_count?: number | null
          conversion_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_count?: number | null
          exited_count?: number | null
          goal_achieved_count?: number | null
          goal_config?: Json | null
          goal_segment_id?: string | null
          goal_type?: string | null
          id?: string
          max_enrollments?: number | null
          name: string
          organization_id: string
          owner_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reentry_wait_days?: number | null
          status?: Database["public"]["Enums"]["journey_status"]
          tags?: string[] | null
          timezone?: string | null
          trigger_config?: Json | null
          trigger_event_name?: string | null
          trigger_segment_id?: string | null
          trigger_type: string
          updated_at?: string
        }
        Update: {
          active_count?: number | null
          allow_reentry?: boolean | null
          avg_duration_hours?: number | null
          completed_count?: number | null
          conversion_rate?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_count?: number | null
          exited_count?: number | null
          goal_achieved_count?: number | null
          goal_config?: Json | null
          goal_segment_id?: string | null
          goal_type?: string | null
          id?: string
          max_enrollments?: number | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          published_at?: string | null
          published_by?: string | null
          reentry_wait_days?: number | null
          status?: Database["public"]["Enums"]["journey_status"]
          tags?: string[] | null
          timezone?: string | null
          trigger_config?: Json | null
          trigger_event_name?: string | null
          trigger_segment_id?: string | null
          trigger_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journeys_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_goal_segment_id_fkey"
            columns: ["goal_segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journeys_trigger_segment_id_fkey"
            columns: ["trigger_segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_articles: {
        Row: {
          author_id: string
          category_id: string | null
          content: string
          content_html: string | null
          created_at: string
          custom_fields: Json | null
          expires_at: string | null
          helpful_count: number
          id: string
          is_featured: boolean
          is_internal: boolean
          is_public: boolean
          last_edited_by: string | null
          meta_description: string | null
          meta_title: string | null
          not_helpful_count: number
          organization_id: string
          published_at: string | null
          published_by: string | null
          related_article_ids: string[] | null
          related_product_ids: string[] | null
          review_notes: string | null
          reviewed_at: string | null
          reviewer_id: string | null
          slug: string
          status: Database["public"]["Enums"]["article_status"]
          summary: string | null
          tags: string[] | null
          title: string
          updated_at: string
          version: number
          view_count: number
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content: string
          content_html?: string | null
          created_at?: string
          custom_fields?: Json | null
          expires_at?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          is_internal?: boolean
          is_public?: boolean
          last_edited_by?: string | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_count?: number
          organization_id: string
          published_at?: string | null
          published_by?: string | null
          related_article_ids?: string[] | null
          related_product_ids?: string[] | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          slug: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          version?: number
          view_count?: number
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string
          content_html?: string | null
          created_at?: string
          custom_fields?: Json | null
          expires_at?: string | null
          helpful_count?: number
          id?: string
          is_featured?: boolean
          is_internal?: boolean
          is_public?: boolean
          last_edited_by?: string | null
          meta_description?: string | null
          meta_title?: string | null
          not_helpful_count?: number
          organization_id?: string
          published_at?: string | null
          published_by?: string | null
          related_article_ids?: string[] | null
          related_product_ids?: string[] | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewer_id?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["article_status"]
          summary?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          version?: number
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_articles_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_last_edited_by_fkey"
            columns: ["last_edited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_articles_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      knowledge_categories: {
        Row: {
          article_count: number
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          is_public: boolean
          name: string
          organization_id: string
          parent_id: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          article_count?: number
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          article_count?: number
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          is_public?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "knowledge_categories"
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
      lgpd_requests: {
        Row: {
          account_id: string | null
          attachments: Json | null
          completed_at: string | null
          completed_by: string | null
          contact_id: string | null
          created_at: string
          data_export_path: string | null
          deadline: string
          denied_reason: string | null
          id: string
          metadata: Json | null
          organization_id: string
          priority: string | null
          request_details: string | null
          requester_document: string | null
          requester_email: string
          requester_name: string | null
          response_notes: string | null
          status: Database["public"]["Enums"]["lgpd_status"]
          type: Database["public"]["Enums"]["lgpd_request_type"]
          updated_at: string
          verification_method: string | null
          verification_token: string | null
          verified: boolean
          verified_at: string | null
        }
        Insert: {
          account_id?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          contact_id?: string | null
          created_at?: string
          data_export_path?: string | null
          deadline?: string
          denied_reason?: string | null
          id?: string
          metadata?: Json | null
          organization_id: string
          priority?: string | null
          request_details?: string | null
          requester_document?: string | null
          requester_email: string
          requester_name?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["lgpd_status"]
          type: Database["public"]["Enums"]["lgpd_request_type"]
          updated_at?: string
          verification_method?: string | null
          verification_token?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Update: {
          account_id?: string | null
          attachments?: Json | null
          completed_at?: string | null
          completed_by?: string | null
          contact_id?: string | null
          created_at?: string
          data_export_path?: string | null
          deadline?: string
          denied_reason?: string | null
          id?: string
          metadata?: Json | null
          organization_id?: string
          priority?: string | null
          request_details?: string | null
          requester_document?: string | null
          requester_email?: string
          requester_name?: string | null
          response_notes?: string | null
          status?: Database["public"]["Enums"]["lgpd_status"]
          type?: Database["public"]["Enums"]["lgpd_request_type"]
          updated_at?: string
          verification_method?: string | null
          verification_token?: string | null
          verified?: boolean
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lgpd_requests_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lgpd_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_attribution: {
        Row: {
          account_id: string | null
          attribution_model: Database["public"]["Enums"]["attribution_model"]
          attribution_period_end: string | null
          attribution_period_start: string | null
          attribution_weight: number
          calculated_at: string | null
          calculation_details: Json | null
          campaign_id: string | null
          contact_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          journey_id: string | null
          lead_id: string | null
          opportunity_id: string | null
          order_id: string | null
          organization_id: string
          revenue_attributed: number | null
          touchpoint_id: string | null
        }
        Insert: {
          account_id?: string | null
          attribution_model: Database["public"]["Enums"]["attribution_model"]
          attribution_period_end?: string | null
          attribution_period_start?: string | null
          attribution_weight: number
          calculated_at?: string | null
          calculation_details?: Json | null
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          journey_id?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id: string
          revenue_attributed?: number | null
          touchpoint_id?: string | null
        }
        Update: {
          account_id?: string | null
          attribution_model?: Database["public"]["Enums"]["attribution_model"]
          attribution_period_end?: string | null
          attribution_period_start?: string | null
          attribution_weight?: number
          calculated_at?: string | null
          calculation_details?: Json | null
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          journey_id?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id?: string
          revenue_attributed?: number | null
          touchpoint_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_attribution_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_attribution_touchpoint_id_fkey"
            columns: ["touchpoint_id"]
            isOneToOne: false
            referencedRelation: "attribution_touchpoints"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_consents: {
        Row: {
          consent_ip: string | null
          consent_source: string | null
          consent_user_agent: string | null
          contact_id: string | null
          created_at: string
          email: string | null
          email_marketing: boolean | null
          global_unsubscribe: boolean | null
          id: string
          interests: string[] | null
          last_consent_update: string | null
          lead_id: string | null
          organization_id: string
          phone: string | null
          phone_calls: boolean | null
          preferred_frequency: string | null
          preferred_language: string | null
          preferred_time: string | null
          push_notifications: boolean | null
          sms_marketing: boolean | null
          unsubscribe_reason: string | null
          unsubscribed_at: string | null
          updated_at: string
          whatsapp_marketing: boolean | null
        }
        Insert: {
          consent_ip?: string | null
          consent_source?: string | null
          consent_user_agent?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          email_marketing?: boolean | null
          global_unsubscribe?: boolean | null
          id?: string
          interests?: string[] | null
          last_consent_update?: string | null
          lead_id?: string | null
          organization_id: string
          phone?: string | null
          phone_calls?: boolean | null
          preferred_frequency?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          push_notifications?: boolean | null
          sms_marketing?: boolean | null
          unsubscribe_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          whatsapp_marketing?: boolean | null
        }
        Update: {
          consent_ip?: string | null
          consent_source?: string | null
          consent_user_agent?: string | null
          contact_id?: string | null
          created_at?: string
          email?: string | null
          email_marketing?: boolean | null
          global_unsubscribe?: boolean | null
          id?: string
          interests?: string[] | null
          last_consent_update?: string | null
          lead_id?: string | null
          organization_id?: string
          phone?: string | null
          phone_calls?: boolean | null
          preferred_frequency?: string | null
          preferred_language?: string | null
          preferred_time?: string | null
          push_notifications?: boolean | null
          sms_marketing?: boolean | null
          unsubscribe_reason?: string | null
          unsubscribed_at?: string | null
          updated_at?: string
          whatsapp_marketing?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_consents_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_consents_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_consents_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_events: {
        Row: {
          browser: string | null
          campaign_id: string | null
          contact_id: string | null
          created_at: string
          device_type: string | null
          event_category: string | null
          event_name: string
          id: string
          ip_address: string | null
          journey_id: string | null
          landing_page: string | null
          lead_id: string | null
          location: Json | null
          organization_id: string
          os: string | null
          page_url: string | null
          properties: Json | null
          referrer: string | null
          session_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          browser?: string | null
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name: string
          id?: string
          ip_address?: string | null
          journey_id?: string | null
          landing_page?: string | null
          lead_id?: string | null
          location?: Json | null
          organization_id: string
          os?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          browser?: string | null
          campaign_id?: string | null
          contact_id?: string | null
          created_at?: string
          device_type?: string | null
          event_category?: string | null
          event_name?: string
          id?: string
          ip_address?: string | null
          journey_id?: string | null
          landing_page?: string | null
          lead_id?: string | null
          location?: Json | null
          organization_id?: string
          os?: string | null
          page_url?: string | null
          properties?: Json | null
          referrer?: string | null
          session_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_journey_id_fkey"
            columns: ["journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_forms: {
        Row: {
          add_to_segment_id: string | null
          assign_to_owner: string | null
          conversion_rate: number | null
          create_lead: boolean | null
          created_at: string
          created_by: string | null
          description: string | null
          double_opt_in: boolean | null
          embed_code: string | null
          enable_captcha: boolean | null
          enroll_in_journey_id: string | null
          fields: Json
          id: string
          is_active: boolean | null
          name: string
          notify_emails: string[] | null
          organization_id: string
          public_url: string | null
          published_at: string | null
          redirect_url: string | null
          style_config: Json | null
          submission_count: number | null
          submit_button_text: string | null
          success_message: string | null
          updated_at: string
          view_count: number | null
        }
        Insert: {
          add_to_segment_id?: string | null
          assign_to_owner?: string | null
          conversion_rate?: number | null
          create_lead?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          double_opt_in?: boolean | null
          embed_code?: string | null
          enable_captcha?: boolean | null
          enroll_in_journey_id?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name: string
          notify_emails?: string[] | null
          organization_id: string
          public_url?: string | null
          published_at?: string | null
          redirect_url?: string | null
          style_config?: Json | null
          submission_count?: number | null
          submit_button_text?: string | null
          success_message?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Update: {
          add_to_segment_id?: string | null
          assign_to_owner?: string | null
          conversion_rate?: number | null
          create_lead?: boolean | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          double_opt_in?: boolean | null
          embed_code?: string | null
          enable_captcha?: boolean | null
          enroll_in_journey_id?: string | null
          fields?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          notify_emails?: string[] | null
          organization_id?: string
          public_url?: string | null
          published_at?: string | null
          redirect_url?: string | null
          style_config?: Json | null
          submission_count?: number | null
          submit_button_text?: string | null
          success_message?: string | null
          updated_at?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketing_forms_add_to_segment_id_fkey"
            columns: ["add_to_segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_forms_assign_to_owner_fkey"
            columns: ["assign_to_owner"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_forms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_forms_enroll_in_journey_id_fkey"
            columns: ["enroll_in_journey_id"]
            isOneToOne: false
            referencedRelation: "journeys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketing_forms_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      merge_requests: {
        Row: {
          affected_records: Json | null
          approval_level: number | null
          approval_notes: string | null
          approved_at: string | null
          approved_by: string | null
          completed_at: string | null
          created_at: string | null
          entity_type: string
          error_details: Json | null
          error_message: string | null
          id: string
          merge_rules: Json | null
          organization_id: string
          preview_result: Json | null
          requested_at: string | null
          requested_by: string | null
          requires_approval: boolean | null
          result_entity_id: string | null
          rollback_data: Json | null
          rolled_back_at: string | null
          rolled_back_by: string | null
          source_ids: string[]
          started_at: string | null
          status: Database["public"]["Enums"]["merge_status"] | null
          target_id: string
          updated_at: string | null
        }
        Insert: {
          affected_records?: Json | null
          approval_level?: number | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          entity_type: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          merge_rules?: Json | null
          organization_id: string
          preview_result?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          result_entity_id?: string | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          source_ids: string[]
          started_at?: string | null
          status?: Database["public"]["Enums"]["merge_status"] | null
          target_id: string
          updated_at?: string | null
        }
        Update: {
          affected_records?: Json | null
          approval_level?: number | null
          approval_notes?: string | null
          approved_at?: string | null
          approved_by?: string | null
          completed_at?: string | null
          created_at?: string | null
          entity_type?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          merge_rules?: Json | null
          organization_id?: string
          preview_result?: Json | null
          requested_at?: string | null
          requested_by?: string | null
          requires_approval?: boolean | null
          result_entity_id?: string | null
          rollback_data?: Json | null
          rolled_back_at?: string | null
          rolled_back_by?: string | null
          source_ids?: string[]
          started_at?: string | null
          status?: Database["public"]["Enums"]["merge_status"] | null
          target_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "merge_requests_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "merge_requests_rolled_back_by_fkey"
            columns: ["rolled_back_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      order_items: {
        Row: {
          created_at: string | null
          description: string | null
          discount: number | null
          id: string
          metadata: Json | null
          name: string
          order_id: string
          product_id: string | null
          quantity: number
          sku: string | null
          tax: number | null
          total: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          name: string
          order_id: string
          product_id?: string | null
          quantity: number
          sku?: string | null
          tax?: number | null
          total: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount?: number | null
          id?: string
          metadata?: Json | null
          name?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          sku?: string | null
          tax?: number | null
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_status_history: {
        Row: {
          changed_by: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["order_status"]
          old_status: Database["public"]["Enums"]["order_status"] | null
          order_id: string
          reason: string | null
        }
        Insert: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["order_status"]
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id: string
          reason?: string | null
        }
        Update: {
          changed_by?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["order_status"]
          old_status?: Database["public"]["Enums"]["order_status"] | null
          order_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_status_history_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          account_id: string | null
          billing_address: Json | null
          cancellation_reason: string | null
          cancelled_at: string | null
          cancelled_by: string | null
          cart_id: string | null
          contact_id: string | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          custom_fields: Json | null
          customer_notes: string | null
          delivered_at: string | null
          discount_total: number | null
          estimated_delivery: string | null
          grand_total: number
          id: string
          internal_notes: string | null
          order_number: string
          organization_id: string
          payment_method: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          shipped_at: string | null
          shipping_address: Json | null
          shipping_method: string | null
          shipping_total: number | null
          source: string | null
          status: Database["public"]["Enums"]["order_status"] | null
          subtotal: number
          tags: string[] | null
          tax_total: number | null
          tracking_number: string | null
          updated_at: string | null
        }
        Insert: {
          account_id?: string | null
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cart_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_total?: number | null
          estimated_delivery?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          order_number: string
          organization_id: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tags?: string[] | null
          tax_total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Update: {
          account_id?: string | null
          billing_address?: Json | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          cancelled_by?: string | null
          cart_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          custom_fields?: Json | null
          customer_notes?: string | null
          delivered_at?: string | null
          discount_total?: number | null
          estimated_delivery?: string | null
          grand_total?: number
          id?: string
          internal_notes?: string | null
          order_number?: string
          organization_id?: string
          payment_method?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          shipped_at?: string | null
          shipping_address?: Json | null
          shipping_method?: string | null
          shipping_total?: number | null
          source?: string | null
          status?: Database["public"]["Enums"]["order_status"] | null
          subtotal?: number
          tags?: string[] | null
          tax_total?: number | null
          tracking_number?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cancelled_by_fkey"
            columns: ["cancelled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_cart_id_fkey"
            columns: ["cart_id"]
            isOneToOne: false
            referencedRelation: "carts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_organization_id_fkey"
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
      payments: {
        Row: {
          amount: number
          authorization_code: string | null
          boleto_barcode: string | null
          boleto_due_date: string | null
          boleto_url: string | null
          card_brand: string | null
          card_last_four: string | null
          created_at: string | null
          gateway: string | null
          gateway_response: Json | null
          id: string
          metadata: Json | null
          method: string
          notes: string | null
          order_id: string | null
          organization_id: string
          paid_at: string | null
          payment_number: string | null
          pix_copy_paste: string | null
          pix_expiration: string | null
          pix_qr_code: string | null
          refund_amount: number | null
          refund_reason: string | null
          refunded_at: string | null
          status: Database["public"]["Enums"]["payment_status"] | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          authorization_code?: string | null
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          gateway?: string | null
          gateway_response?: Json | null
          id?: string
          metadata?: Json | null
          method: string
          notes?: string | null
          order_id?: string | null
          organization_id: string
          paid_at?: string | null
          payment_number?: string | null
          pix_copy_paste?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          authorization_code?: string | null
          boleto_barcode?: string | null
          boleto_due_date?: string | null
          boleto_url?: string | null
          card_brand?: string | null
          card_last_four?: string | null
          created_at?: string | null
          gateway?: string | null
          gateway_response?: Json | null
          id?: string
          metadata?: Json | null
          method?: string
          notes?: string | null
          order_id?: string | null
          organization_id?: string
          paid_at?: string | null
          payment_number?: string | null
          pix_copy_paste?: string | null
          pix_expiration?: string | null
          pix_qr_code?: string | null
          refund_amount?: number | null
          refund_reason?: string | null
          refunded_at?: string | null
          status?: Database["public"]["Enums"]["payment_status"] | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      playbook_enrollments: {
        Row: {
          account_id: string
          assigned_to: string | null
          cancel_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          current_step: number
          enrolled_by: string | null
          id: string
          metadata: Json | null
          next_step_due: string | null
          organization_id: string
          outcome_notes: string | null
          paused_at: string | null
          playbook_id: string
          progress_percent: number | null
          started_at: string
          status: string
          step_history: Json | null
          success: boolean | null
          updated_at: string
        }
        Insert: {
          account_id: string
          assigned_to?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number
          enrolled_by?: string | null
          id?: string
          metadata?: Json | null
          next_step_due?: string | null
          organization_id: string
          outcome_notes?: string | null
          paused_at?: string | null
          playbook_id: string
          progress_percent?: number | null
          started_at?: string
          status?: string
          step_history?: Json | null
          success?: boolean | null
          updated_at?: string
        }
        Update: {
          account_id?: string
          assigned_to?: string | null
          cancel_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          current_step?: number
          enrolled_by?: string | null
          id?: string
          metadata?: Json | null
          next_step_due?: string | null
          organization_id?: string
          outcome_notes?: string | null
          paused_at?: string | null
          playbook_id?: string
          progress_percent?: number | null
          started_at?: string
          status?: string
          step_history?: Json | null
          success?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "playbook_enrollments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_enrollments_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_enrollments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_enrollments_enrolled_by_fkey"
            columns: ["enrolled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_enrollments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "playbook_enrollments_playbook_id_fkey"
            columns: ["playbook_id"]
            isOneToOne: false
            referencedRelation: "customer_playbooks"
            referencedColumns: ["id"]
          },
        ]
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
      promotion_usage: {
        Row: {
          account_id: string | null
          contact_id: string | null
          created_at: string | null
          discount_amount: number
          id: string
          order_id: string
          promotion_id: string
        }
        Insert: {
          account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          discount_amount: number
          id?: string
          order_id: string
          promotion_id: string
        }
        Update: {
          account_id?: string | null
          contact_id?: string | null
          created_at?: string | null
          discount_amount?: number
          id?: string
          order_id?: string
          promotion_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usage_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usage_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applies_to: string | null
          applies_to_ids: string[] | null
          buy_quantity: number | null
          can_combine: boolean | null
          code: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          end_date: string | null
          exclude_ids: string[] | null
          first_purchase_only: boolean | null
          get_product_id: string | null
          get_quantity: number | null
          id: string
          is_active: boolean | null
          is_automatic: boolean | null
          max_discount: number | null
          min_items: number | null
          min_purchase: number | null
          name: string
          new_customers_only: boolean | null
          organization_id: string
          priority: number | null
          specific_accounts: string[] | null
          specific_segments: string[] | null
          start_date: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at: string | null
          usage_limit: number | null
          usage_limit_per_customer: number | null
          used_count: number | null
          value: number | null
        }
        Insert: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          buy_quantity?: number | null
          can_combine?: boolean | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          exclude_ids?: string[] | null
          first_purchase_only?: boolean | null
          get_product_id?: string | null
          get_quantity?: number | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          max_discount?: number | null
          min_items?: number | null
          min_purchase?: number | null
          name: string
          new_customers_only?: boolean | null
          organization_id: string
          priority?: number | null
          specific_accounts?: string[] | null
          specific_segments?: string[] | null
          start_date?: string | null
          type: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number | null
          value?: number | null
        }
        Update: {
          applies_to?: string | null
          applies_to_ids?: string[] | null
          buy_quantity?: number | null
          can_combine?: boolean | null
          code?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          end_date?: string | null
          exclude_ids?: string[] | null
          first_purchase_only?: boolean | null
          get_product_id?: string | null
          get_quantity?: number | null
          id?: string
          is_active?: boolean | null
          is_automatic?: boolean | null
          max_discount?: number | null
          min_items?: number | null
          min_purchase?: number | null
          name?: string
          new_customers_only?: boolean | null
          organization_id?: string
          priority?: number | null
          specific_accounts?: string[] | null
          specific_segments?: string[] | null
          start_date?: string | null
          type?: Database["public"]["Enums"]["promotion_type"]
          updated_at?: string | null
          usage_limit?: number | null
          usage_limit_per_customer?: number | null
          used_count?: number | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "promotions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_get_product_id_fkey"
            columns: ["get_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      returns: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string | null
          exchange_order_id: string | null
          id: string
          inspected_at: string | null
          inspection_notes: string | null
          items: Json
          metadata: Json | null
          notes: string | null
          order_id: string
          organization_id: string
          reason: string
          reason_category: string | null
          received_at: string | null
          refund_amount: number | null
          refund_method: string | null
          refunded_at: string | null
          rejected_at: string | null
          rejected_by: string | null
          rejection_reason: string | null
          requested_by: string | null
          return_carrier: string | null
          return_label_url: string | null
          return_number: string
          return_tracking_number: string | null
          status: Database["public"]["Enums"]["return_status"] | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          exchange_order_id?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          items?: Json
          metadata?: Json | null
          notes?: string | null
          order_id: string
          organization_id: string
          reason: string
          reason_category?: string | null
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          return_carrier?: string | null
          return_label_url?: string | null
          return_number: string
          return_tracking_number?: string | null
          status?: Database["public"]["Enums"]["return_status"] | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string | null
          exchange_order_id?: string | null
          id?: string
          inspected_at?: string | null
          inspection_notes?: string | null
          items?: Json
          metadata?: Json | null
          notes?: string | null
          order_id?: string
          organization_id?: string
          reason?: string
          reason_category?: string | null
          received_at?: string | null
          refund_amount?: number | null
          refund_method?: string | null
          refunded_at?: string | null
          rejected_at?: string | null
          rejected_by?: string | null
          rejection_reason?: string | null
          requested_by?: string | null
          return_carrier?: string | null
          return_label_url?: string | null
          return_number?: string
          return_tracking_number?: string | null
          status?: Database["public"]["Enums"]["return_status"] | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_approved_by_fkey"
            columns: ["approved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_exchange_order_id_fkey"
            columns: ["exchange_order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_rejected_by_fkey"
            columns: ["rejected_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      segment_members: {
        Row: {
          account_id: string | null
          added_at: string | null
          added_by: string | null
          contact_id: string | null
          id: string
          lead_id: string | null
          segment_id: string
          source: string | null
        }
        Insert: {
          account_id?: string | null
          added_at?: string | null
          added_by?: string | null
          contact_id?: string | null
          id?: string
          lead_id?: string | null
          segment_id: string
          source?: string | null
        }
        Update: {
          account_id?: string | null
          added_at?: string | null
          added_by?: string | null
          contact_id?: string | null
          id?: string
          lead_id?: string | null
          segment_id?: string
          source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "segment_members_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segment_members_segment_id_fkey"
            columns: ["segment_id"]
            isOneToOne: false
            referencedRelation: "segments"
            referencedColumns: ["id"]
          },
        ]
      }
      segments: {
        Row: {
          auto_refresh: boolean | null
          calculation_duration_ms: number | null
          color: string | null
          created_at: string
          created_by: string | null
          custom_filter_expression: string | null
          description: string | null
          entity_type: string | null
          filter_logic: string | null
          filters: Json | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          last_calculated_at: string | null
          member_count: number | null
          name: string
          organization_id: string
          owner_id: string | null
          refresh_interval_hours: number | null
          tags: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          auto_refresh?: boolean | null
          calculation_duration_ms?: number | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          custom_filter_expression?: string | null
          description?: string | null
          entity_type?: string | null
          filter_logic?: string | null
          filters?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_calculated_at?: string | null
          member_count?: number | null
          name: string
          organization_id: string
          owner_id?: string | null
          refresh_interval_hours?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Update: {
          auto_refresh?: boolean | null
          calculation_duration_ms?: number | null
          color?: string | null
          created_at?: string
          created_by?: string | null
          custom_filter_expression?: string | null
          description?: string | null
          entity_type?: string | null
          filter_logic?: string | null
          filters?: Json | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_calculated_at?: string | null
          member_count?: number | null
          name?: string
          organization_id?: string
          owner_id?: string | null
          refresh_interval_hours?: number | null
          tags?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "segments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "segments_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          carrier_service: string | null
          cost: number | null
          created_at: string | null
          delivered_at: string | null
          dimensions: Json | null
          estimated_delivery: string | null
          id: string
          insurance_value: number | null
          items: Json | null
          metadata: Json | null
          notes: string | null
          order_id: string
          organization_id: string
          recipient_document: string | null
          recipient_name: string | null
          shipment_number: string | null
          shipped_at: string | null
          shipping_address: Json | null
          status: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number: string | null
          tracking_url: string | null
          updated_at: string | null
          weight: number | null
          weight_unit: string | null
        }
        Insert: {
          carrier?: string | null
          carrier_service?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          insurance_value?: number | null
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          order_id: string
          organization_id: string
          recipient_document?: string | null
          recipient_name?: string | null
          shipment_number?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Update: {
          carrier?: string | null
          carrier_service?: string | null
          cost?: number | null
          created_at?: string | null
          delivered_at?: string | null
          dimensions?: Json | null
          estimated_delivery?: string | null
          id?: string
          insurance_value?: number | null
          items?: Json | null
          metadata?: Json | null
          notes?: string | null
          order_id?: string
          organization_id?: string
          recipient_document?: string | null
          recipient_name?: string | null
          shipment_number?: string | null
          shipped_at?: string | null
          shipping_address?: Json | null
          status?: Database["public"]["Enums"]["shipment_status"] | null
          tracking_number?: string | null
          tracking_url?: string | null
          updated_at?: string | null
          weight?: number | null
          weight_unit?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
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
      ticket_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          display_order: number
          icon: string | null
          id: string
          is_active: boolean
          name: string
          organization_id: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name: string
          organization_id: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string | null
          id?: string
          is_active?: boolean
          name?: string
          organization_id?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_categories_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_messages: {
        Row: {
          attachment_ids: string[] | null
          content: string
          content_html: string | null
          created_at: string
          email_bcc: string[] | null
          email_cc: string[] | null
          email_in_reply_to: string | null
          email_message_id: string | null
          id: string
          is_auto_reply: boolean
          is_internal: boolean
          is_resolution: boolean
          metadata: Json | null
          sender_email: string | null
          sender_id: string | null
          sender_name: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at: string
        }
        Insert: {
          attachment_ids?: string[] | null
          content: string
          content_html?: string | null
          created_at?: string
          email_bcc?: string[] | null
          email_cc?: string[] | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          id?: string
          is_auto_reply?: boolean
          is_internal?: boolean
          is_resolution?: boolean
          metadata?: Json | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type: Database["public"]["Enums"]["message_sender_type"]
          ticket_id: string
          updated_at?: string
        }
        Update: {
          attachment_ids?: string[] | null
          content?: string
          content_html?: string | null
          created_at?: string
          email_bcc?: string[] | null
          email_cc?: string[] | null
          email_in_reply_to?: string | null
          email_message_id?: string | null
          id?: string
          is_auto_reply?: boolean
          is_internal?: boolean
          is_resolution?: boolean
          metadata?: Json | null
          sender_email?: string | null
          sender_id?: string | null
          sender_name?: string | null
          sender_type?: Database["public"]["Enums"]["message_sender_type"]
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_queues: {
        Row: {
          assignment_method: string | null
          auto_assign: boolean
          business_hours_only: boolean
          created_at: string
          description: string | null
          email_address: string | null
          id: string
          is_active: boolean
          is_default: boolean
          members: string[] | null
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          assignment_method?: string | null
          auto_assign?: boolean
          business_hours_only?: boolean
          created_at?: string
          description?: string | null
          email_address?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          members?: string[] | null
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          assignment_method?: string | null
          auto_assign?: boolean
          business_hours_only?: boolean
          created_at?: string
          description?: string | null
          email_address?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          members?: string[] | null
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_queues_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_slas: {
        Row: {
          business_days: number[] | null
          business_hours_end: string | null
          business_hours_only: boolean
          business_hours_start: string | null
          created_at: string
          description: string | null
          escalation_enabled: boolean
          escalation_threshold_percent: number | null
          escalation_to: string | null
          first_response_critical: number
          first_response_high: number
          first_response_low: number
          first_response_medium: number
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          organization_id: string
          resolution_critical: number
          resolution_high: number
          resolution_low: number
          resolution_medium: number
          updated_at: string
        }
        Insert: {
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean
          business_hours_start?: string | null
          created_at?: string
          description?: string | null
          escalation_enabled?: boolean
          escalation_threshold_percent?: number | null
          escalation_to?: string | null
          first_response_critical?: number
          first_response_high?: number
          first_response_low?: number
          first_response_medium?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          organization_id: string
          resolution_critical?: number
          resolution_high?: number
          resolution_low?: number
          resolution_medium?: number
          updated_at?: string
        }
        Update: {
          business_days?: number[] | null
          business_hours_end?: string | null
          business_hours_only?: boolean
          business_hours_start?: string | null
          created_at?: string
          description?: string | null
          escalation_enabled?: boolean
          escalation_threshold_percent?: number | null
          escalation_to?: string | null
          first_response_critical?: number
          first_response_high?: number
          first_response_low?: number
          first_response_medium?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          organization_id?: string
          resolution_critical?: number
          resolution_high?: number
          resolution_low?: number
          resolution_medium?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_slas_escalation_to_fkey"
            columns: ["escalation_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_slas_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_status_history: {
        Row: {
          changed_by: string | null
          created_at: string
          duration_minutes: number | null
          id: string
          new_status: Database["public"]["Enums"]["ticket_status"]
          old_status: Database["public"]["Enums"]["ticket_status"] | null
          reason: string | null
          ticket_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          new_status: Database["public"]["Enums"]["ticket_status"]
          old_status?: Database["public"]["Enums"]["ticket_status"] | null
          reason?: string | null
          ticket_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          duration_minutes?: number | null
          id?: string
          new_status?: Database["public"]["Enums"]["ticket_status"]
          old_status?: Database["public"]["Enums"]["ticket_status"] | null
          reason?: string | null
          ticket_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_status_history_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      ticket_watchers: {
        Row: {
          created_at: string
          id: string
          ticket_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          ticket_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          ticket_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ticket_watchers_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ticket_watchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          account_id: string | null
          assigned_at: string | null
          assigned_to: string | null
          category_id: string | null
          channel: Database["public"]["Enums"]["ticket_channel"]
          closed_at: string | null
          closed_by: string | null
          closure_code: string | null
          contact_id: string | null
          created_at: string
          csat_sent: boolean | null
          csat_sent_at: string | null
          custom_fields: Json | null
          description: string
          escalated_at: string | null
          escalated_to: string | null
          escalation_reason: string | null
          first_response_at: string | null
          id: string
          internal_notes: string | null
          is_escalated: boolean | null
          last_agent_response_at: string | null
          last_customer_response_at: string | null
          lead_id: string | null
          opportunity_id: string | null
          order_id: string | null
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          queue_id: string | null
          reporter_email: string | null
          reporter_id: string | null
          reporter_name: string | null
          resolution: string | null
          resolution_code: string | null
          resolved_at: string | null
          resolved_by: string | null
          sla_first_response_at: string | null
          sla_first_response_breached: boolean | null
          sla_first_response_due: string | null
          sla_id: string | null
          sla_pause_reason: string | null
          sla_paused_at: string | null
          sla_resolution_breached: boolean | null
          sla_resolution_due: string | null
          sla_total_paused_minutes: number | null
          source_data: Json | null
          status: Database["public"]["Enums"]["ticket_status"]
          subcategory: string | null
          subject: string
          tags: string[] | null
          ticket_number: string
          type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          category_id?: string | null
          channel?: Database["public"]["Enums"]["ticket_channel"]
          closed_at?: string | null
          closed_by?: string | null
          closure_code?: string | null
          contact_id?: string | null
          created_at?: string
          csat_sent?: boolean | null
          csat_sent_at?: string | null
          custom_fields?: Json | null
          description: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          is_escalated?: boolean | null
          last_agent_response_at?: string | null
          last_customer_response_at?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          queue_id?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_first_response_at?: string | null
          sla_first_response_breached?: boolean | null
          sla_first_response_due?: string | null
          sla_id?: string | null
          sla_pause_reason?: string | null
          sla_paused_at?: string | null
          sla_resolution_breached?: boolean | null
          sla_resolution_due?: string | null
          sla_total_paused_minutes?: number | null
          source_data?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subcategory?: string | null
          subject: string
          tags?: string[] | null
          ticket_number: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          category_id?: string | null
          channel?: Database["public"]["Enums"]["ticket_channel"]
          closed_at?: string | null
          closed_by?: string | null
          closure_code?: string | null
          contact_id?: string | null
          created_at?: string
          csat_sent?: boolean | null
          csat_sent_at?: string | null
          custom_fields?: Json | null
          description?: string
          escalated_at?: string | null
          escalated_to?: string | null
          escalation_reason?: string | null
          first_response_at?: string | null
          id?: string
          internal_notes?: string | null
          is_escalated?: boolean | null
          last_agent_response_at?: string | null
          last_customer_response_at?: string | null
          lead_id?: string | null
          opportunity_id?: string | null
          order_id?: string | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          queue_id?: string | null
          reporter_email?: string | null
          reporter_id?: string | null
          reporter_name?: string | null
          resolution?: string | null
          resolution_code?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          sla_first_response_at?: string | null
          sla_first_response_breached?: boolean | null
          sla_first_response_due?: string | null
          sla_id?: string | null
          sla_pause_reason?: string | null
          sla_paused_at?: string | null
          sla_resolution_breached?: boolean | null
          sla_resolution_due?: string | null
          sla_total_paused_minutes?: number | null
          source_data?: Json | null
          status?: Database["public"]["Enums"]["ticket_status"]
          subcategory?: string | null
          subject?: string
          tags?: string[] | null
          ticket_number?: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "ticket_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_escalated_to_fkey"
            columns: ["escalated_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_queue_id_fkey"
            columns: ["queue_id"]
            isOneToOne: false
            referencedRelation: "ticket_queues"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sla_id_fkey"
            columns: ["sla_id"]
            isOneToOne: false
            referencedRelation: "ticket_slas"
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
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          id: string
          is_active: boolean
          notes: string | null
          revoked_at: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          revoked_at?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      workflow_logs: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          level: string
          message: string
          run_id: string
          step_execution_id: string | null
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          level?: string
          message: string
          run_id: string
          step_execution_id?: string | null
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          level?: string
          message?: string
          run_id?: string
          step_execution_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_logs_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_logs_step_execution_id_fkey"
            columns: ["step_execution_id"]
            isOneToOne: false
            referencedRelation: "workflow_step_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_runs: {
        Row: {
          completed_at: string | null
          context: Json | null
          created_at: string
          current_step_id: string | null
          current_step_key: string | null
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          error_step_key: string | null
          execution_path: string[] | null
          id: string
          organization_id: string
          parent_run_id: string | null
          retry_count: number | null
          started_at: string | null
          status: Database["public"]["Enums"]["workflow_run_status"]
          trigger_data: Json | null
          trigger_record_id: string | null
          trigger_record_type: string | null
          triggered_by: string | null
          workflow_id: string
        }
        Insert: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          current_step_key?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_step_key?: string | null
          execution_path?: string[] | null
          id?: string
          organization_id: string
          parent_run_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          trigger_data?: Json | null
          trigger_record_id?: string | null
          trigger_record_type?: string | null
          triggered_by?: string | null
          workflow_id: string
        }
        Update: {
          completed_at?: string | null
          context?: Json | null
          created_at?: string
          current_step_id?: string | null
          current_step_key?: string | null
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          error_step_key?: string | null
          execution_path?: string[] | null
          id?: string
          organization_id?: string
          parent_run_id?: string | null
          retry_count?: number | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["workflow_run_status"]
          trigger_data?: Json | null
          trigger_record_id?: string | null
          trigger_record_type?: string | null
          triggered_by?: string | null
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_runs_current_step_id_fkey"
            columns: ["current_step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_parent_run_id_fkey"
            columns: ["parent_run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_runs_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_schedules: {
        Row: {
          created_at: string
          cron_expression: string
          id: string
          is_active: boolean | null
          last_run_at: string | null
          next_run_at: string | null
          organization_id: string
          run_count: number | null
          timezone: string | null
          updated_at: string
          workflow_id: string
        }
        Insert: {
          created_at?: string
          cron_expression: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id: string
          run_count?: number | null
          timezone?: string | null
          updated_at?: string
          workflow_id: string
        }
        Update: {
          created_at?: string
          cron_expression?: string
          id?: string
          is_active?: boolean | null
          last_run_at?: string | null
          next_run_at?: string | null
          organization_id?: string
          run_count?: number | null
          timezone?: string | null
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_schedules_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_schedules_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_step_executions: {
        Row: {
          completed_at: string | null
          created_at: string
          duration_ms: number | null
          error_details: Json | null
          error_message: string | null
          id: string
          input_data: Json | null
          output_data: Json | null
          retry_count: number | null
          run_id: string
          started_at: string | null
          status: Database["public"]["Enums"]["step_execution_status"]
          step_id: string
          step_key: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          retry_count?: number | null
          run_id: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_execution_status"]
          step_id: string
          step_key: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          duration_ms?: number | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          input_data?: Json | null
          output_data?: Json | null
          retry_count?: number | null
          run_id?: string
          started_at?: string | null
          status?: Database["public"]["Enums"]["step_execution_status"]
          step_id?: string
          step_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_step_executions_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "workflow_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_step_executions_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "workflow_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_steps: {
        Row: {
          conditions: Json | null
          config: Json
          continue_on_error: boolean | null
          created_at: string
          description: string | null
          id: string
          is_entry_point: boolean | null
          is_exit_point: boolean | null
          loop_config: Json | null
          name: string
          next_step_on_failure: string | null
          next_step_on_success: string | null
          parallel_branches: Json | null
          position_x: number | null
          position_y: number | null
          retry_count: number | null
          retry_delay_seconds: number | null
          step_key: string
          step_order: number
          timeout_seconds: number | null
          type: Database["public"]["Enums"]["workflow_step_type"]
          updated_at: string
          workflow_id: string
        }
        Insert: {
          conditions?: Json | null
          config?: Json
          continue_on_error?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_entry_point?: boolean | null
          is_exit_point?: boolean | null
          loop_config?: Json | null
          name: string
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          parallel_branches?: Json | null
          position_x?: number | null
          position_y?: number | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          step_key: string
          step_order: number
          timeout_seconds?: number | null
          type: Database["public"]["Enums"]["workflow_step_type"]
          updated_at?: string
          workflow_id: string
        }
        Update: {
          conditions?: Json | null
          config?: Json
          continue_on_error?: boolean | null
          created_at?: string
          description?: string | null
          id?: string
          is_entry_point?: boolean | null
          is_exit_point?: boolean | null
          loop_config?: Json | null
          name?: string
          next_step_on_failure?: string | null
          next_step_on_success?: string | null
          parallel_branches?: Json | null
          position_x?: number | null
          position_y?: number | null
          retry_count?: number | null
          retry_delay_seconds?: number | null
          step_key?: string
          step_order?: number
          timeout_seconds?: number | null
          type?: Database["public"]["Enums"]["workflow_step_type"]
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          icon: string | null
          id: string
          is_global: boolean | null
          name: string
          organization_id: string | null
          rating: number | null
          steps_config: Json
          tags: string[] | null
          trigger_entity: string
          trigger_type: Database["public"]["Enums"]["workflow_trigger"]
          updated_at: string
          usage_count: number | null
          variables: Json | null
        }
        Insert: {
          category: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name: string
          organization_id?: string | null
          rating?: number | null
          steps_config?: Json
          tags?: string[] | null
          trigger_entity: string
          trigger_type: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Update: {
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_global?: boolean | null
          name?: string
          organization_id?: string | null
          rating?: number | null
          steps_config?: Json
          tags?: string[] | null
          trigger_entity?: string
          trigger_type?: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          usage_count?: number | null
          variables?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "workflow_templates_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_templates_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      workflows: {
        Row: {
          avg_execution_time_ms: number | null
          created_at: string
          created_by: string | null
          description: string | null
          failure_count: number | null
          failure_notification_emails: string[] | null
          id: string
          is_template: boolean | null
          last_run_at: string | null
          last_success_at: string | null
          max_concurrent_runs: number | null
          max_retries: number | null
          name: string
          notify_on_failure: boolean | null
          organization_id: string
          retry_on_failure: boolean | null
          run_count: number | null
          schedule_config: Json | null
          status: string
          success_count: number | null
          template_category: string | null
          timeout_minutes: number | null
          trigger_conditions: Json | null
          trigger_entity: string
          trigger_fields: string[] | null
          trigger_type: Database["public"]["Enums"]["workflow_trigger"]
          updated_at: string
          updated_by: string | null
          version: number
        }
        Insert: {
          avg_execution_time_ms?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          failure_count?: number | null
          failure_notification_emails?: string[] | null
          id?: string
          is_template?: boolean | null
          last_run_at?: string | null
          last_success_at?: string | null
          max_concurrent_runs?: number | null
          max_retries?: number | null
          name: string
          notify_on_failure?: boolean | null
          organization_id: string
          retry_on_failure?: boolean | null
          run_count?: number | null
          schedule_config?: Json | null
          status?: string
          success_count?: number | null
          template_category?: string | null
          timeout_minutes?: number | null
          trigger_conditions?: Json | null
          trigger_entity: string
          trigger_fields?: string[] | null
          trigger_type: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Update: {
          avg_execution_time_ms?: number | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          failure_count?: number | null
          failure_notification_emails?: string[] | null
          id?: string
          is_template?: boolean | null
          last_run_at?: string | null
          last_success_at?: string | null
          max_concurrent_runs?: number | null
          max_retries?: number | null
          name?: string
          notify_on_failure?: boolean | null
          organization_id?: string
          retry_on_failure?: boolean | null
          run_count?: number | null
          schedule_config?: Json | null
          status?: string
          success_count?: number | null
          template_category?: string | null
          timeout_minutes?: number | null
          trigger_conditions?: Json | null
          trigger_entity?: string
          trigger_fields?: string[] | null
          trigger_type?: Database["public"]["Enums"]["workflow_trigger"]
          updated_at?: string
          updated_by?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "workflows_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflows_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_attribution: {
        Args: {
          p_model?: Database["public"]["Enums"]["attribution_model"]
          p_opportunity_id: string
          p_organization_id: string
        }
        Returns: undefined
      }
      calculate_health_score: {
        Args: { p_account_id: string }
        Returns: number
      }
      calculate_it_priority: {
        Args: {
          p_impact: Database["public"]["Enums"]["it_impact"]
          p_urgency: Database["public"]["Enums"]["it_urgency"]
        }
        Returns: Database["public"]["Enums"]["it_priority"]
      }
      calculate_segment_members: {
        Args: { p_segment_id: string }
        Returns: number
      }
      create_funnel_snapshot: {
        Args: {
          p_date?: string
          p_organization_id: string
          p_period_type?: string
        }
        Returns: string
      }
      detect_duplicates: {
        Args: {
          p_entity_id: string
          p_entity_type: string
          p_organization_id: string
        }
        Returns: {
          duplicate_id: string
          match_reasons: Json
          similarity_score: number
        }[]
      }
      generate_asset_tag: { Args: { org_id: string }; Returns: string }
      generate_change_number: { Args: { org_id: string }; Returns: string }
      generate_ci_number: { Args: { org_id: string }; Returns: string }
      generate_contract_number: { Args: { org_id: string }; Returns: string }
      generate_incident_number: { Args: { org_id: string }; Returns: string }
      generate_order_number: { Args: { org_id: string }; Returns: string }
      generate_problem_number: { Args: { org_id: string }; Returns: string }
      generate_request_number: { Args: { org_id: string }; Returns: string }
      generate_return_number: { Args: { org_id: string }; Returns: string }
      generate_ticket_number: { Args: { org_id: string }; Returns: string }
      get_stale_opportunities_count: {
        Args: { org_id: string; threshold_days?: number }
        Returns: number
      }
      get_user_highest_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
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
      user_has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
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
      article_status: "draft" | "in_review" | "published" | "archived"
      attribution_model:
        | "first_touch"
        | "last_touch"
        | "linear"
        | "time_decay"
        | "position_based"
        | "data_driven"
        | "custom"
      behavioral_event_type:
        | "page_view"
        | "form_submit"
        | "button_click"
        | "link_click"
        | "video_play"
        | "video_complete"
        | "file_download"
        | "search"
        | "add_to_cart"
        | "remove_from_cart"
        | "checkout_start"
        | "checkout_complete"
        | "signup"
        | "login"
        | "logout"
        | "profile_update"
        | "email_open"
        | "email_click"
        | "sms_click"
        | "push_click"
        | "custom"
      cadence_step_type: "email" | "call" | "linkedin" | "task"
      campaign_member_status:
        | "pending"
        | "sent"
        | "delivered"
        | "opened"
        | "clicked"
        | "converted"
        | "unsubscribed"
        | "bounced"
        | "complained"
        | "failed"
      campaign_status:
        | "draft"
        | "scheduled"
        | "sending"
        | "active"
        | "paused"
        | "completed"
        | "cancelled"
        | "archived"
      campaign_type:
        | "email"
        | "sms"
        | "whatsapp"
        | "push"
        | "social"
        | "ads"
        | "event"
        | "webinar"
        | "content"
        | "referral"
      ci_environment:
        | "production"
        | "staging"
        | "development"
        | "testing"
        | "disaster_recovery"
        | "training"
      ci_status:
        | "planned"
        | "in_development"
        | "testing"
        | "active"
        | "maintenance"
        | "degraded"
        | "inactive"
        | "retired"
        | "disposed"
      ci_type:
        | "server"
        | "virtual_machine"
        | "container"
        | "application"
        | "database"
        | "network_device"
        | "storage"
        | "service"
        | "workstation"
        | "laptop"
        | "mobile_device"
        | "printer"
        | "load_balancer"
        | "firewall"
        | "middleware"
        | "api"
        | "other"
      cmdb_relationship_type:
        | "runs_on"
        | "depends_on"
        | "connected_to"
        | "part_of"
        | "managed_by"
        | "backed_up_by"
        | "replicated_to"
        | "load_balanced_by"
        | "contained_in"
        | "uses"
        | "provides"
        | "supports"
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
      duplicate_status:
        | "detected"
        | "confirmed"
        | "false_positive"
        | "merged"
        | "ignored"
      enrollment_status: "active" | "completed" | "exited" | "paused" | "failed"
      forecast_category: "commit" | "best_case" | "pipeline" | "omitted"
      identifier_type:
        | "email"
        | "phone"
        | "document"
        | "external_id"
        | "cookie"
        | "device_id"
        | "social_id"
      it_asset_condition:
        | "new"
        | "good"
        | "fair"
        | "poor"
        | "damaged"
        | "non_functional"
      it_asset_status:
        | "ordered"
        | "received"
        | "available"
        | "in_use"
        | "in_repair"
        | "maintenance"
        | "retired"
        | "disposed"
        | "lost"
        | "stolen"
      it_asset_type:
        | "hardware"
        | "software"
        | "license"
        | "subscription"
        | "virtual"
        | "cloud_resource"
      it_change_risk: "low" | "medium" | "high" | "critical"
      it_change_status:
        | "draft"
        | "submitted"
        | "under_assessment"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "scheduled"
        | "implementing"
        | "under_review"
        | "completed"
        | "cancelled"
        | "failed"
        | "rolled_back"
      it_change_type: "standard" | "normal" | "emergency"
      it_impact: "low" | "medium" | "high" | "critical"
      it_incident_status:
        | "new"
        | "acknowledged"
        | "in_progress"
        | "pending_info"
        | "pending_vendor"
        | "on_hold"
        | "resolved"
        | "closed"
        | "cancelled"
      it_priority: "low" | "medium" | "high" | "critical"
      it_problem_status:
        | "logged"
        | "open"
        | "root_cause_analysis"
        | "known_error"
        | "resolution_identified"
        | "resolved"
        | "closed"
      it_request_status:
        | "submitted"
        | "pending_approval"
        | "approved"
        | "rejected"
        | "in_progress"
        | "pending_info"
        | "fulfilled"
        | "closed"
        | "cancelled"
      it_urgency: "low" | "medium" | "high" | "critical"
      journey_status: "draft" | "active" | "paused" | "completed" | "archived"
      journey_step_type:
        | "email"
        | "sms"
        | "whatsapp"
        | "push"
        | "wait"
        | "condition"
        | "split"
        | "goal"
        | "action"
        | "webhook"
        | "add_to_segment"
        | "remove_from_segment"
        | "update_field"
        | "create_task"
        | "notify_owner"
      lead_status:
        | "new"
        | "contacted"
        | "qualified"
        | "unqualified"
        | "converted"
      lgpd_request_type:
        | "access"
        | "rectification"
        | "deletion"
        | "portability"
        | "objection"
        | "restriction"
      lgpd_status:
        | "received"
        | "verified"
        | "processing"
        | "completed"
        | "denied"
        | "expired"
      merge_status:
        | "pending"
        | "approved"
        | "rejected"
        | "in_progress"
        | "completed"
        | "failed"
        | "cancelled"
      message_sender_type: "agent" | "customer" | "system"
      opportunity_stage:
        | "prospecting"
        | "qualification"
        | "proposal"
        | "negotiation"
        | "closed_won"
        | "closed_lost"
      order_status:
        | "pending"
        | "confirmed"
        | "processing"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "refunded"
      payment_status:
        | "pending"
        | "authorized"
        | "captured"
        | "failed"
        | "refunded"
        | "partially_refunded"
      playbook_type:
        | "onboarding"
        | "adoption"
        | "renewal"
        | "expansion"
        | "risk_mitigation"
        | "reactivation"
        | "offboarding"
      promotion_type: "percentage" | "fixed" | "buy_x_get_y" | "free_shipping"
      quote_status: "draft" | "sent" | "accepted" | "rejected" | "expired"
      return_status:
        | "requested"
        | "approved"
        | "rejected"
        | "received"
        | "refunded"
        | "completed"
      routing_rule_type:
        | "round_robin"
        | "territory"
        | "segment"
        | "load_balance"
        | "skill_based"
        | "priority"
      shipment_status:
        | "preparing"
        | "shipped"
        | "in_transit"
        | "out_for_delivery"
        | "delivered"
        | "returned"
      step_execution_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "skipped"
        | "waiting"
      ticket_channel:
        | "email"
        | "chat"
        | "phone"
        | "whatsapp"
        | "portal"
        | "form"
      ticket_priority: "low" | "medium" | "high" | "critical"
      ticket_status:
        | "new"
        | "open"
        | "pending"
        | "on_hold"
        | "resolved"
        | "closed"
      ticket_type: "incident" | "request" | "question" | "complaint" | "return"
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
      workflow_run_status:
        | "pending"
        | "running"
        | "completed"
        | "failed"
        | "cancelled"
        | "paused"
        | "waiting_approval"
      workflow_step_type:
        | "condition"
        | "action"
        | "delay"
        | "parallel"
        | "approval"
        | "loop"
        | "webhook"
        | "notification"
        | "field_update"
        | "create_record"
        | "send_email"
        | "assign_owner"
        | "add_tag"
        | "create_task"
        | "call_function"
      workflow_trigger:
        | "record_created"
        | "record_updated"
        | "field_changed"
        | "scheduled"
        | "manual"
        | "approval_completed"
        | "sla_breach"
        | "stage_changed"
        | "score_changed"
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
      article_status: ["draft", "in_review", "published", "archived"],
      attribution_model: [
        "first_touch",
        "last_touch",
        "linear",
        "time_decay",
        "position_based",
        "data_driven",
        "custom",
      ],
      behavioral_event_type: [
        "page_view",
        "form_submit",
        "button_click",
        "link_click",
        "video_play",
        "video_complete",
        "file_download",
        "search",
        "add_to_cart",
        "remove_from_cart",
        "checkout_start",
        "checkout_complete",
        "signup",
        "login",
        "logout",
        "profile_update",
        "email_open",
        "email_click",
        "sms_click",
        "push_click",
        "custom",
      ],
      cadence_step_type: ["email", "call", "linkedin", "task"],
      campaign_member_status: [
        "pending",
        "sent",
        "delivered",
        "opened",
        "clicked",
        "converted",
        "unsubscribed",
        "bounced",
        "complained",
        "failed",
      ],
      campaign_status: [
        "draft",
        "scheduled",
        "sending",
        "active",
        "paused",
        "completed",
        "cancelled",
        "archived",
      ],
      campaign_type: [
        "email",
        "sms",
        "whatsapp",
        "push",
        "social",
        "ads",
        "event",
        "webinar",
        "content",
        "referral",
      ],
      ci_environment: [
        "production",
        "staging",
        "development",
        "testing",
        "disaster_recovery",
        "training",
      ],
      ci_status: [
        "planned",
        "in_development",
        "testing",
        "active",
        "maintenance",
        "degraded",
        "inactive",
        "retired",
        "disposed",
      ],
      ci_type: [
        "server",
        "virtual_machine",
        "container",
        "application",
        "database",
        "network_device",
        "storage",
        "service",
        "workstation",
        "laptop",
        "mobile_device",
        "printer",
        "load_balancer",
        "firewall",
        "middleware",
        "api",
        "other",
      ],
      cmdb_relationship_type: [
        "runs_on",
        "depends_on",
        "connected_to",
        "part_of",
        "managed_by",
        "backed_up_by",
        "replicated_to",
        "load_balanced_by",
        "contained_in",
        "uses",
        "provides",
        "supports",
      ],
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
      duplicate_status: [
        "detected",
        "confirmed",
        "false_positive",
        "merged",
        "ignored",
      ],
      enrollment_status: ["active", "completed", "exited", "paused", "failed"],
      forecast_category: ["commit", "best_case", "pipeline", "omitted"],
      identifier_type: [
        "email",
        "phone",
        "document",
        "external_id",
        "cookie",
        "device_id",
        "social_id",
      ],
      it_asset_condition: [
        "new",
        "good",
        "fair",
        "poor",
        "damaged",
        "non_functional",
      ],
      it_asset_status: [
        "ordered",
        "received",
        "available",
        "in_use",
        "in_repair",
        "maintenance",
        "retired",
        "disposed",
        "lost",
        "stolen",
      ],
      it_asset_type: [
        "hardware",
        "software",
        "license",
        "subscription",
        "virtual",
        "cloud_resource",
      ],
      it_change_risk: ["low", "medium", "high", "critical"],
      it_change_status: [
        "draft",
        "submitted",
        "under_assessment",
        "pending_approval",
        "approved",
        "rejected",
        "scheduled",
        "implementing",
        "under_review",
        "completed",
        "cancelled",
        "failed",
        "rolled_back",
      ],
      it_change_type: ["standard", "normal", "emergency"],
      it_impact: ["low", "medium", "high", "critical"],
      it_incident_status: [
        "new",
        "acknowledged",
        "in_progress",
        "pending_info",
        "pending_vendor",
        "on_hold",
        "resolved",
        "closed",
        "cancelled",
      ],
      it_priority: ["low", "medium", "high", "critical"],
      it_problem_status: [
        "logged",
        "open",
        "root_cause_analysis",
        "known_error",
        "resolution_identified",
        "resolved",
        "closed",
      ],
      it_request_status: [
        "submitted",
        "pending_approval",
        "approved",
        "rejected",
        "in_progress",
        "pending_info",
        "fulfilled",
        "closed",
        "cancelled",
      ],
      it_urgency: ["low", "medium", "high", "critical"],
      journey_status: ["draft", "active", "paused", "completed", "archived"],
      journey_step_type: [
        "email",
        "sms",
        "whatsapp",
        "push",
        "wait",
        "condition",
        "split",
        "goal",
        "action",
        "webhook",
        "add_to_segment",
        "remove_from_segment",
        "update_field",
        "create_task",
        "notify_owner",
      ],
      lead_status: [
        "new",
        "contacted",
        "qualified",
        "unqualified",
        "converted",
      ],
      lgpd_request_type: [
        "access",
        "rectification",
        "deletion",
        "portability",
        "objection",
        "restriction",
      ],
      lgpd_status: [
        "received",
        "verified",
        "processing",
        "completed",
        "denied",
        "expired",
      ],
      merge_status: [
        "pending",
        "approved",
        "rejected",
        "in_progress",
        "completed",
        "failed",
        "cancelled",
      ],
      message_sender_type: ["agent", "customer", "system"],
      opportunity_stage: [
        "prospecting",
        "qualification",
        "proposal",
        "negotiation",
        "closed_won",
        "closed_lost",
      ],
      order_status: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "refunded",
      ],
      payment_status: [
        "pending",
        "authorized",
        "captured",
        "failed",
        "refunded",
        "partially_refunded",
      ],
      playbook_type: [
        "onboarding",
        "adoption",
        "renewal",
        "expansion",
        "risk_mitigation",
        "reactivation",
        "offboarding",
      ],
      promotion_type: ["percentage", "fixed", "buy_x_get_y", "free_shipping"],
      quote_status: ["draft", "sent", "accepted", "rejected", "expired"],
      return_status: [
        "requested",
        "approved",
        "rejected",
        "received",
        "refunded",
        "completed",
      ],
      routing_rule_type: [
        "round_robin",
        "territory",
        "segment",
        "load_balance",
        "skill_based",
        "priority",
      ],
      shipment_status: [
        "preparing",
        "shipped",
        "in_transit",
        "out_for_delivery",
        "delivered",
        "returned",
      ],
      step_execution_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "skipped",
        "waiting",
      ],
      ticket_channel: ["email", "chat", "phone", "whatsapp", "portal", "form"],
      ticket_priority: ["low", "medium", "high", "critical"],
      ticket_status: [
        "new",
        "open",
        "pending",
        "on_hold",
        "resolved",
        "closed",
      ],
      ticket_type: ["incident", "request", "question", "complaint", "return"],
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
      workflow_run_status: [
        "pending",
        "running",
        "completed",
        "failed",
        "cancelled",
        "paused",
        "waiting_approval",
      ],
      workflow_step_type: [
        "condition",
        "action",
        "delay",
        "parallel",
        "approval",
        "loop",
        "webhook",
        "notification",
        "field_update",
        "create_record",
        "send_email",
        "assign_owner",
        "add_tag",
        "create_task",
        "call_function",
      ],
      workflow_trigger: [
        "record_created",
        "record_updated",
        "field_changed",
        "scheduled",
        "manual",
        "approval_completed",
        "sla_breach",
        "stage_changed",
        "score_changed",
      ],
    },
  },
} as const
