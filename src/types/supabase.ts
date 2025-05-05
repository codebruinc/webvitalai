export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          created_at: string
          email: string
          name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email: string
          name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
        }
      }
      websites: {
        Row: {
          id: string
          created_at: string
          user_id: string
          url: string
          name: string
          description: string | null
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          url: string
          name: string
          description?: string | null
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          url?: string
          name?: string
          description?: string | null
          is_active?: boolean
        }
      }
      scans: {
        Row: {
          id: string
          created_at: string
          website_id: string
          status: string
          completed_at: string | null
          error: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          website_id: string
          status: string
          completed_at?: string | null
          error?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          website_id?: string
          status?: string
          completed_at?: string | null
          error?: string | null
        }
      }
      metrics: {
        Row: {
          id: string
          created_at: string
          scan_id: string
          name: string
          value: number
          unit: string | null
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          scan_id: string
          name: string
          value: number
          unit?: string | null
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          scan_id?: string
          name?: string
          value?: number
          unit?: string | null
          category?: string
        }
      }
      issues: {
        Row: {
          id: string
          created_at: string
          scan_id: string
          title: string
          description: string
          severity: string
          category: string
        }
        Insert: {
          id?: string
          created_at?: string
          scan_id: string
          title: string
          description: string
          severity: string
          category: string
        }
        Update: {
          id?: string
          created_at?: string
          scan_id?: string
          title?: string
          description?: string
          severity?: string
          category?: string
        }
      }
      recommendations: {
        Row: {
          id: string
          created_at: string
          issue_id: string
          description: string
          priority: string
          implementation_details: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          issue_id: string
          description: string
          priority: string
          implementation_details?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          issue_id?: string
          description?: string
          priority?: string
          implementation_details?: string | null
        }
      }
      subscriptions: {
        Row: {
          id: string
          created_at: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_end: string
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          stripe_customer_id: string
          stripe_subscription_id: string
          plan_type: string
          status: string
          current_period_end: string
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          plan_type?: string
          status?: string
          current_period_end?: string
        }
      }
      alerts: {
        Row: {
          id: string
          created_at: string
          user_id: string
          website_id: string
          metric_name: string
          threshold: number
          condition: string
          is_active: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          user_id: string
          website_id: string
          metric_name: string
          threshold: number
          condition: string
          is_active?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string
          website_id?: string
          metric_name?: string
          threshold?: number
          condition?: string
          is_active?: boolean
        }
      }
      industry_benchmarks: {
        Row: {
          id: string
          created_at: string
          industry: string
          metric_name: string
          good_threshold: number
          average_threshold: number
          poor_threshold: number
        }
        Insert: {
          id?: string
          created_at?: string
          industry: string
          metric_name: string
          good_threshold: number
          average_threshold: number
          poor_threshold: number
        }
        Update: {
          id?: string
          created_at?: string
          industry?: string
          metric_name?: string
          good_threshold?: number
          average_threshold?: number
          poor_threshold?: number
        }
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
  }
}