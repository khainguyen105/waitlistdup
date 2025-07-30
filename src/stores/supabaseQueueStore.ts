import { create } from 'zustand'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/supabase'

type QueueEntry = Database['public']['Tables']['queue_entries']['Row']
type QueueInsert = Database['public']['Tables']['queue_entries']['Insert']
type QueueUpdate = Database['public']['Tables']['queue_entries']['Update']

interface SupabaseQueueState {
  entries: QueueEntry[]
  selectedLocationId: string | null
  isLoading: boolean
  error: string | null
  
  // Actions
  fetchQueue: (locationId?: string) => Promise<void>
  addToQueue: (entry: Omit<QueueInsert, 'position' | 'joined_at'>) => Promise<QueueEntry | null>
  updateQueueEntry: (id: string, updates: QueueUpdate) => Promise<void>
  callNext: (locationId: string) => Promise<void>
  setSelectedLocation: (locationId: string) => void
  subscribeToChanges: (locationId: string) => () => void
}

export const useSupabaseQueueStore = create<SupabaseQueueState>((set, get) => ({
  entries: [],
  selectedLocationId: null,
  isLoading: false,
  error: null,

  fetchQueue: async (locationId) => {
    set({ isLoading: true, error: null })
    
    try {
      let query = supabase
        .from('queue_entries')
        .select('*')
        .in('status', ['waiting', 'called', 'in_progress'])
        .order('position', { ascending: true })

      if (locationId) {
        query = query.eq('location_id', locationId)
      }

      const { data, error } = await query

      if (error) {
        throw error
      }

      set({ entries: data || [], isLoading: false })
    } catch (error) {
      console.error('Error fetching queue:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to fetch queue',
        isLoading: false 
      })
    }
  },

  addToQueue: async (entry) => {
    set({ isLoading: true, error: null })
    
    try {
      // Call the edge function to add to queue (handles position calculation and auto-assignment)
      const { data, error } = await supabase.functions.invoke('queue-management', {
        body: {
          ...entry,
          assignment_method: entry.assignment_method || 'auto',
        },
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (error) {
        throw error
      }

      // Refresh the queue
      await get().fetchQueue(get().selectedLocationId || undefined)
      
      set({ isLoading: false })
      return data
    } catch (error) {
      console.error('Error adding to queue:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to add to queue',
        isLoading: false 
      })
      return null
    }
  },

  updateQueueEntry: async (id, updates) => {
    set({ isLoading: true, error: null })
    
    try {
      const { error } = await supabase.functions.invoke('queue-management', {
        body: { id, ...updates },
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (error) {
        throw error
      }

      // Refresh the queue
      await get().fetchQueue(get().selectedLocationId || undefined)
      
      set({ isLoading: false })
    } catch (error) {
      console.error('Error updating queue entry:', error)
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update queue entry',
        isLoading: false 
      })
    }
  },

  callNext: async (locationId) => {
    const { entries } = get()
    const waitingEntries = entries
      .filter(e => e.location_id === locationId && e.status === 'waiting')
      .sort((a, b) => a.position - b.position)

    if (waitingEntries.length > 0) {
      const nextEntry = waitingEntries[0]
      await get().updateQueueEntry(nextEntry.id, {
        status: 'called',
        called_at: new Date().toISOString(),
      })
    }
  },

  setSelectedLocation: (locationId) => {
    set({ selectedLocationId: locationId })
    get().fetchQueue(locationId)
  },

  subscribeToChanges: (locationId) => {
    const channel = supabase
      .channel('queue_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'queue_entries',
          filter: `location_id=eq.${locationId}`,
        },
        (payload) => {
          console.log('Queue change detected:', payload)
          // Refresh the queue when changes occur
          get().fetchQueue(locationId)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  },
}))