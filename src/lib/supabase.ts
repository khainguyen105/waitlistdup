import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types for database tables
export interface Database {
  public: {
    Tables: {
      queue_entries: {
        Row: {
          id: string
          location_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          customer_type: 'vip' | 'regular' | 'new' | 'appointment'
          services: string[]
          service_ids: string[]
          assigned_employee_id: string | null
          assigned_employee_name: string | null
          preferred_employee_id: string | null
          assignment_method: 'manual' | 'auto' | 'preferred' | 'load_balanced'
          priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
          status: 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'transferred'
          position: number
          estimated_wait_time: number
          actual_wait_time: number | null
          service_start_time: string | null
          service_end_time: string | null
          joined_at: string
          called_at: string | null
          completed_at: string | null
          notifications: any[]
          special_requests: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          location_id: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          customer_type?: 'vip' | 'regular' | 'new' | 'appointment'
          services: string[]
          service_ids: string[]
          assigned_employee_id?: string | null
          assigned_employee_name?: string | null
          preferred_employee_id?: string | null
          assignment_method?: 'manual' | 'auto' | 'preferred' | 'load_balanced'
          priority?: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
          status?: 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'transferred'
          position: number
          estimated_wait_time: number
          actual_wait_time?: number | null
          service_start_time?: string | null
          service_end_time?: string | null
          joined_at?: string
          called_at?: string | null
          completed_at?: string | null
          notifications?: any[]
          special_requests?: string | null
          notes?: string | null
        }
        Update: {
          location_id?: string
          customer_name?: string
          customer_phone?: string
          customer_email?: string | null
          customer_type?: 'vip' | 'regular' | 'new' | 'appointment'
          services?: string[]
          service_ids?: string[]
          assigned_employee_id?: string | null
          assigned_employee_name?: string | null
          preferred_employee_id?: string | null
          assignment_method?: 'manual' | 'auto' | 'preferred' | 'load_balanced'
          priority?: 'low' | 'normal' | 'high' | 'urgent' | 'emergency'
          status?: 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'transferred'
          position?: number
          estimated_wait_time?: number
          actual_wait_time?: number | null
          service_start_time?: string | null
          service_end_time?: string | null
          called_at?: string | null
          completed_at?: string | null
          notifications?: any[]
          special_requests?: string | null
          notes?: string | null
          updated_at?: string
        }
      }
      checkin_entries: {
        Row: {
          id: string
          location_id: string
          customer_name: string
          customer_phone: string
          customer_email: string | null
          customer_type: 'vip' | 'regular' | 'new' | 'appointment'
          services: string[]
          preferred_employee_id: string | null
          checkin_type: 'remote' | 'in_store'
          status: 'en_route' | 'present' | 'in_queue' | 'expired' | 'cancelled'
          checkin_code: string
          estimated_arrival_time: string | null
          actual_arrival_time: string | null
          checkin_time: string
          verification_method: 'geolocation' | 'wifi' | 'manual' | 'staff_confirmed' | null
          coordinates: any | null
          special_requests: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          location_id: string
          customer_name: string
          customer_phone: string
          customer_email?: string | null
          customer_type?: 'vip' | 'regular' | 'new' | 'appointment'
          services: string[]
          preferred_employee_id?: string | null
          checkin_type: 'remote' | 'in_store'
          status?: 'en_route' | 'present' | 'in_queue' | 'expired' | 'cancelled'
          checkin_code: string
          estimated_arrival_time?: string | null
          actual_arrival_time?: string | null
          checkin_time?: string
          verification_method?: 'geolocation' | 'wifi' | 'manual' | 'staff_confirmed' | null
          coordinates?: any | null
          special_requests?: string | null
          notes?: string | null
        }
      }
      customer_history: {
        Row: {
          id: string
          phone: string
          name: string
          email: string | null
          last_visit: string
          visit_count: number
          preferred_services: string[]
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          phone: string
          name: string
          email?: string | null
          last_visit?: string
          visit_count?: number
          preferred_services?: string[]
          notes?: string | null
        }
        Update: {
          name?: string
          email?: string | null
          last_visit?: string
          visit_count?: number
          preferred_services?: string[]
          notes?: string | null
          updated_at?: string
        }
      }
      locations: {
        Row: {
          id: string
          agency_id: string | null
          name: string
          address: string
          phone: string
          email: string
          timezone: string
          coordinates: any | null
          settings: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      services: {
        Row: {
          id: string
          location_id: string
          category_id: string | null
          name: string
          description: string
          category: string
          estimated_duration: number
          requirements: string[]
          price: number | null
          skill_level_required: 'beginner' | 'intermediate' | 'expert'
          assigned_employee_ids: string[]
          auto_assignment_rules: any
          customer_types: any[]
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
      employees: {
        Row: {
          id: string
          location_id: string
          first_name: string
          last_name: string
          email: string
          phone: string
          specialties: string[]
          service_ids: string[]
          skill_level: any
          schedule: any
          performance: any
          availability: any
          queue_settings: any
          is_active: boolean
          created_at: string
          updated_at: string
        }
      }
    }
  }
}