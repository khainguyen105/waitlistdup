import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type Location = Database['public']['Tables']['locations']['Row']
type Employee = Database['public']['Tables']['employees']['Row']
type Service = Database['public']['Tables']['services']['Row']

interface SupabaseLocationState {
  locations: Location[]
  employees: Employee[]
  services: Service[]
  selectedLocation: Location | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchLocations: () => Promise<void>
  fetchEmployees: (locationId: string) => Promise<void>
  fetchServices: (locationId: string) => Promise<void>
  setSelectedLocation: (location: Location | null) => void
  getServicesForLocation: (locationId: string) => Service[]
  getEmployeesForLocation: (locationId: string) => Employee[]
}

export const useSupabaseLocationStore = create<SupabaseLocationState>((set, get) => ({
  locations: [],
  employees: [],
  services: [],
  selectedLocation: null,
  isLoading: false,
  error: null,

  fetchLocations: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      set({ locations: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching locations:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch locations',
        isLoading: false 
      })
    }
  },

  fetchEmployees: async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('first_name')

      if (error) {
        throw error
      }

      set({ employees: data || [] })
    } catch (error) {
      console.error('Error fetching employees:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch employees'
      })
    }
  },

  fetchServices: async (locationId) => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('location_id', locationId)
        .eq('is_active', true)
        .order('name')

      if (error) {
        throw error
      }

      set({ services: data || [] })
    } catch (error) {
      console.error('Error fetching services:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch services'
      })
    }
  },

  setSelectedLocation: (location) => {
    set({ selectedLocation: location })
    
    if (location) {
      get().fetchEmployees(location.id)
      get().fetchServices(location.id)
    }
  },

  getServicesForLocation: (locationId) => {
    return get().services.filter(service => service.location_id === locationId)
  },

  getEmployeesForLocation: (locationId) => {
    return get().employees.filter(employee => employee.location_id === locationId)
  },
}))