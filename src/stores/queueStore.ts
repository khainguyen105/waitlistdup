import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { QueueEntry, QueueStats } from '../types';

interface QueueState {
  entries: QueueEntry[];
  stats: QueueStats;
  selectedLocationId: string | null;
  isLoading: boolean;
  lastSyncTime: Date | null;
  addToQueue: (entry: Omit<QueueEntry, 'id' | 'position' | 'joinedAt'>) => QueueEntry;
  updateQueueEntry: (id: string, updates: Partial<QueueEntry>) => void;
  removeFromQueue: (id: string) => void;
  callNext: (employeeId?: string) => void;
  setSelectedLocation: (locationId: string) => void;
  getQueueForLocation: (locationId: string) => QueueEntry[];
  updateStats: () => void;
  syncData: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  refreshQueue: () => void;
  forceUpdate: () => void;
  cleanupCompletedEntries: () => void;
}

// Mock data - reduced to avoid conflicts
const mockEntries: QueueEntry[] = [
  {
    id: '1',
    locationId: '1',
    customerName: 'Alice Johnson',
    customerPhone: '+1234567890',
    customerEmail: 'alice@email.com',
    customerType: 'regular',
    services: ['Haircut & Style'],
    serviceIds: ['1'],
    assignmentMethod: 'auto',
    priority: 'normal',
    status: 'waiting',
    position: 1,
    estimatedWaitTime: 15,
    joinedAt: new Date(Date.now() - 10 * 60 * 1000),
    notifications: [],
  },
];

export const useQueueStore = create<QueueState>()(
  persist(
    (set, get) => ({
      entries: mockEntries,
      stats: {
        totalWaiting: 1,
        averageWaitTime: 30,
        customersServedToday: 12,
        currentlyServing: 0,
        noShows: 1,
        remoteCheckins: 5,
        inStoreCheckins: 7,
        employeeUtilization: [],
        queueEfficiency: 85,
        customerSatisfaction: 4.2,
      },
      selectedLocationId: '1',
      isLoading: false,
      lastSyncTime: new Date(),
      
      addToQueue: async (entry) => {
        set({ isLoading: true, error: null });
        
        try {
          // Calculate position first
          const { entries } = get();
          const locationEntries = entries.filter(e => 
            e.locationId === entry.locationId && 
            (e.status === 'waiting' || e.status === 'called' || e.status === 'in_progress')
          );
          const waitingEntries = locationEntries.filter(e => e.status === 'waiting');
          const position = waitingEntries.length + 1;

          // Import supabase only when needed
          const { supabase } = await import('../lib/supabase');
          
          // Try to save to Supabase first
          const { data, error } = await supabase
            .from('queue_entries')
            .insert({
              location_id: entry.locationId,
              customer_name: entry.customerName,
              customer_phone: entry.customerPhone,
              customer_email: entry.customerEmail,
              customer_type: entry.customerType,
              services: entry.services,
              service_ids: entry.serviceIds || [],
              assigned_employee_id: entry.assignedEmployeeId,
              assigned_employee_name: entry.assignedEmployeeName,
              preferred_employee_id: entry.preferredEmployeeId,
              assignment_method: entry.assignmentMethod,
              priority: entry.priority,
              status: entry.status,
              position,
              estimated_wait_time: entry.estimatedWaitTime,
              special_requests: entry.specialRequests,
              notes: entry.notes,
              notifications: entry.notifications || [],
            })
            .select()
            .single();

          if (error) {
            console.error('Supabase insertion error:', error);
            throw error;
          }

          // Convert Supabase response to local format
          const newEntry: QueueEntry = {
            id: data.id,
            locationId: data.location_id,
            customerName: data.customer_name,
            customerPhone: data.customer_phone,
            customerEmail: data.customer_email,
            customerType: data.customer_type,
            services: data.services,
            serviceIds: data.service_ids,
            assignedEmployeeId: data.assigned_employee_id,
            assignedEmployeeName: data.assigned_employee_name,
            preferredEmployeeId: data.preferred_employee_id,
            assignmentMethod: data.assignment_method,
            priority: data.priority,
            status: data.status,
            position: data.position,
            estimatedWaitTime: data.estimated_wait_time,
            actualWaitTime: data.actual_wait_time,
            serviceStartTime: data.service_start_time ? new Date(data.service_start_time) : undefined,
            serviceEndTime: data.service_end_time ? new Date(data.service_end_time) : undefined,
            joinedAt: new Date(data.joined_at),
            calledAt: data.called_at ? new Date(data.called_at) : undefined,
            completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
            notifications: data.notifications || [],
            specialRequests: data.special_requests,
            notes: data.notes,
          };
        
          // Clean up old completed entries before adding new one
          const cleanedEntries = entries.filter(e => {
            if (e.status === 'completed' || e.status === 'no_show' || e.status === 'cancelled') {
              const completedTime = e.completedAt || e.joinedAt;
              const hoursSinceCompleted = (Date.now() - completedTime.getTime()) / (1000 * 60 * 60);
              return hoursSinceCompleted < 24; // Keep completed entries for 24 hours
            }
            return true;
          });
          
          const updatedEntries = [...cleanedEntries, newEntry];
          
          // Recalculate positions for all waiting entries in this location
          const recalculatedEntries = updatedEntries.map(e => {
            if (e.locationId === entry.locationId && e.status === 'waiting') {
              const waitingInLocation = updatedEntries
                .filter(entry => entry.locationId === e.locationId && entry.status === 'waiting')
                .sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
              const newPosition = waitingInLocation.findIndex(waiting => waiting.id === e.id) + 1;
              return { ...e, position: newPosition };
            }
            return e;
          });
          
          set({ 
            entries: recalculatedEntries,
            isLoading: false,
            lastSyncTime: new Date()
          });
          
          // Immediate stats update
          setTimeout(() => {
            get().updateStats();
          }, 100);
          
          // Trigger a custom event to notify other parts of the app
          window.dispatchEvent(new CustomEvent('queueUpdated', { 
            detail: { type: 'added', entry: newEntry } 
          }));

          return newEntry;
        } catch (error) {
          console.error('Failed to add to queue:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add to queue',
            isLoading: false 
          });
          
          // Fallback to local storage only
          const position = get().entries.filter(e => 
            e.locationId === entry.locationId && e.status === 'waiting'
          ).length + 1;
          
          const newEntry: QueueEntry = {
            id: 'local-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...entry,
            position,
            joinedAt: new Date(),
            notifications: [],
          };
          
          set(state => ({
            entries: [...state.entries, newEntry],
            isLoading: false,
            lastSyncTime: new Date()
          }));
          
          return newEntry;
        }
      },
      
      updateQueueEntry: (id, updates) => {
        const { entries } = get();
        const entryToUpdate = entries.find(e => e.id === id);
        
        if (!entryToUpdate) return;
        
        // Add completion timestamp if status is being set to completed
        if (updates.status === 'completed' && !updates.completedAt) {
          updates.completedAt = new Date();
        }
        
        const updatedEntries = entries.map(entry => 
          entry.id === id ? { ...entry, ...updates } : entry
        );
        
        // If status changed to completed, no_show, or cancelled, recalculate positions
        if (updates.status === 'completed' || updates.status === 'no_show' || updates.status === 'cancelled') {
          const updatedEntry = updatedEntries.find(e => e.id === id);
          if (updatedEntry) {
            const locationEntries = updatedEntries.filter(e => 
              e.locationId === updatedEntry.locationId && e.status === 'waiting'
            ).sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
            
            locationEntries.forEach((entry, index) => {
              const entryIndex = updatedEntries.findIndex(e => e.id === entry.id);
              if (entryIndex !== -1) {
                updatedEntries[entryIndex] = { ...updatedEntries[entryIndex], position: index + 1 };
              }
            });
          }
        }
        
        set({ 
          entries: updatedEntries,
          lastSyncTime: new Date()
        });
        
        // Immediate stats update
        setTimeout(() => {
          get().updateStats();
        }, 100);
        
        // Trigger a custom event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('queueUpdated', { 
          detail: { type: 'updated', entryId: id, updates } 
        }));
      },
      
      removeFromQueue: (id) => {
        const { entries } = get();
        const entryToRemove = entries.find(e => e.id === id);
        const filteredEntries = entries.filter(entry => entry.id !== id);
        
        // Recalculate positions for remaining waiting entries in the same location
        if (entryToRemove) {
          const locationEntries = filteredEntries.filter(e => 
            e.locationId === entryToRemove.locationId && e.status === 'waiting'
          ).sort((a, b) => new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime());
          
          locationEntries.forEach((entry, index) => {
            const entryIndex = filteredEntries.findIndex(e => e.id === entry.id);
            if (entryIndex !== -1) {
              filteredEntries[entryIndex] = { ...filteredEntries[entryIndex], position: index + 1 };
            }
          });
        }
        
        set({ 
          entries: filteredEntries,
          lastSyncTime: new Date()
        });
        
        // Immediate stats update
        setTimeout(() => {
          get().updateStats();
        }, 100);
        
        // Trigger a custom event to notify other parts of the app
        window.dispatchEvent(new CustomEvent('queueUpdated', { 
          detail: { type: 'removed', entryId: id } 
        }));
      },
      
      callNext: (employeeId) => {
        const { entries, selectedLocationId } = get();
        const locationId = selectedLocationId || '1';
        
        const waitingEntries = entries
          .filter(e => e.locationId === locationId && e.status === 'waiting')
          .sort((a, b) => a.position - b.position);
        
        if (waitingEntries.length > 0) {
          const nextEntry = waitingEntries[0];
          get().updateQueueEntry(nextEntry.id, {
            status: 'called',
            assignedEmployeeId: employeeId,
            calledAt: new Date(),
          });
        }
      },
      
      setSelectedLocation: (locationId) => {
        set({ selectedLocationId: locationId });
        setTimeout(() => {
          get().updateStats();
        }, 100);
      },
      
      getQueueForLocation: (locationId) => {
        const { entries } = get();
        return entries.filter(entry => entry.locationId === locationId);
      },
      
      updateStats: () => {
        const { entries, selectedLocationId } = get();
        const locationEntries = selectedLocationId 
          ? entries.filter(e => e.locationId === selectedLocationId)
          : entries;
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const stats: QueueStats = {
          totalWaiting: locationEntries.filter(e => e.status === 'waiting').length,
          averageWaitTime: 30, // This would be calculated based on historical data
          customersServedToday: locationEntries.filter(e => 
            e.status === 'completed' && 
            e.completedAt && 
            new Date(e.completedAt) >= today
          ).length,
          currentlyServing: locationEntries.filter(e => e.status === 'in_progress').length,
          noShows: locationEntries.filter(e => e.status === 'no_show').length,
          remoteCheckins: locationEntries.filter(e => e.customerType === 'regular').length,
          inStoreCheckins: locationEntries.filter(e => e.customerType === 'new').length,
          employeeUtilization: [],
          queueEfficiency: 85,
          customerSatisfaction: 4.2,
        };
        
        set({ stats });
      },

      syncData: async () => {
        set({ isLoading: true });
        
        try {
          // Fetch fresh data from Supabase
          await get().fetchFromSupabase(get().selectedLocationId || undefined);
          
          // Clean up old entries
          get().cleanupCompletedEntries();
          
          // Force refresh the queue data
          get().refreshQueue();
          get().updateStats();
          
          set({ 
            lastSyncTime: new Date(),
            isLoading: false 
          });
          
          // Trigger a custom event to notify other parts of the app
          window.dispatchEvent(new CustomEvent('queueSynced'));
          
        } catch (error) {
          console.error('Failed to sync data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sync data',
            isLoading: false 
          });
        }
      },

      setLoading: (loading) => {
        set({ isLoading: loading });
      },

      refreshQueue: () => {
        // Force a re-render by updating the last sync time
        set({ lastSyncTime: new Date() });
        get().updateStats();
      },

      forceUpdate: () => {
        // Trigger a state change to force re-render
        set(state => ({ ...state, lastSyncTime: new Date() }));
      },

      cleanupCompletedEntries: () => {
        const { entries } = get();
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Remove entries that are completed/cancelled and older than 24 hours
        const cleanedEntries = entries.filter(entry => {
          if (entry.status === 'completed' || entry.status === 'no_show' || entry.status === 'cancelled') {
            const completedTime = entry.completedAt || entry.joinedAt;
            return completedTime > oneDayAgo;
          }
          return true;
        });
        
        if (cleanedEntries.length !== entries.length) {
          set({ entries: cleanedEntries });
        }
      },
    }),
    {
      name: 'queue-storage',
      partialize: (state) => ({ 
        entries: state.entries,
        selectedLocationId: state.selectedLocationId 
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.entries) {
          // Convert date strings back to Date objects
          state.entries = state.entries.map(entry => ({
            ...entry,
            joinedAt: new Date(entry.joinedAt),
            calledAt: entry.calledAt ? new Date(entry.calledAt) : undefined,
            completedAt: entry.completedAt ? new Date(entry.completedAt) : undefined,
          }));
          
          // Force update after rehydration
          setTimeout(() => {
            const store = useQueueStore.getState();
            store.cleanupCompletedEntries();
            store.updateStats();
          }, 100);
        }
      },
    }
  )
);