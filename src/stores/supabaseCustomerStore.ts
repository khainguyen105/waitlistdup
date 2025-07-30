import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type CustomerHistory = Database['public']['Tables']['customer_history']['Row']
type CustomerInsert = Database['public']['Tables']['customer_history']['Insert']
type CustomerUpdate = Database['public']['Tables']['customer_history']['Update']

interface SupabaseCustomerState {
  customers: CustomerHistory[]
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchCustomers: () => Promise<void>
  addCustomer: (customer: CustomerInsert) => Promise<void>
  updateCustomer: (phone: string, updates: CustomerUpdate) => Promise<void>
  getCustomerByPhone: (phone: string) => CustomerHistory | null
  searchCustomers: (query: string) => CustomerHistory[]
}

export const useSupabaseCustomerStore = create<SupabaseCustomerState>((set, get) => ({
  customers: [],
  isLoading: false,
  error: null,

  fetchCustomers: async () => {
    set({ isLoading: true, error: null })
    
    try {
      const { data, error } = await supabase
        .from('customer_history')
        .select('*')
        .order('last_visit', { ascending: false })

      if (error) {
        throw error
      }

      set({ customers: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching customers:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch customers',
        isLoading: false 
      })
    }
  },

  addCustomer: async (customer) => {
    try {
      const { error } = await supabase
        .from('customer_history')
        .upsert(customer, {
          onConflict: 'phone',
        })

      if (error) {
        throw error
      }

      // Refresh customers list
      await get().fetchCustomers()
    } catch (error) {
      console.error('Error adding customer:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add customer'
      })
    }
  },

  updateCustomer: async (phone, updates) => {
    try {
      const { error } = await supabase
        .from('customer_history')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('phone', phone)

      if (error) {
        throw error
      }

      // Refresh customers list
      await get().fetchCustomers()
    } catch (error) {
      console.error('Error updating customer:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update customer'
      })
    }
  },

  getCustomerByPhone: (phone) => {
    const { customers } = get()
    return customers.find(c => c.phone === phone) || null
  },

  searchCustomers: (query) => {
    const { customers } = get()
    const lowercaseQuery = query.toLowerCase()
    
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(lowercaseQuery) ||
      customer.phone.includes(query) ||
      (customer.email && customer.email.toLowerCase().includes(lowercaseQuery)) ||
      customer.preferred_services.some(service => 
        service.toLowerCase().includes(lowercaseQuery)
      )
    )
  },
}))