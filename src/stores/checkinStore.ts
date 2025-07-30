import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { CheckinEntry, CheckinStatus } from '../types';

interface CheckinState {
  checkins: CheckinEntry[];
  selectedLocationId: string | null;
  isLoading: boolean;
  lastSyncTime: Date | null;
  error: string | null;
  realTimeChannel: any;
  addCheckin: (checkin: Omit<CheckinEntry, 'id' | 'checkinCode' | 'checkinTime'>) => CheckinEntry;
  updateCheckin: (id: string, updates: Partial<CheckinEntry>) => void;
  removeCheckin: (id: string) => void;
  getCheckinsForLocation: (locationId: string) => CheckinEntry[];
  generateCheckinCode: () => string;
  verifyLocation: (locationId: string, coordinates?: GeolocationCoordinates) => Promise<boolean>;
  convertToQueue: (checkinId: string) => void;
  expireOldCheckins: () => void;
  setSelectedLocation: (locationId: string) => void;
  syncData: () => Promise<void>;
  cleanupOldCheckins: () => void;
  initializeRealTime: (locationId: string) => void;
  disconnectRealTime: () => void;
  fetchFromSupabase: (locationId?: string) => Promise<void>;
}

// Generate a unique 6-character check-in code
const generateCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
};

// Mock location data with coordinates
const mockLocationCoordinates: Record<string, { latitude: number; longitude: number }> = {
  '1': { latitude: 40.7128, longitude: -74.0060 }, // NYC
  '2': { latitude: 40.7589, longitude: -73.9851 }, // Times Square
};

export const useCheckinStore = create<CheckinState>()(
  persist(
    (set, get) => ({
      checkins: [],
      selectedLocationId: null,
      isLoading: false,
      lastSyncTime: new Date(),
      error: null,
      realTimeChannel: null,

      addCheckin: async (checkin) => {
        set({ isLoading: true, error: null });
        
        try {
          // Import supabase only when needed
          const { supabase } = await import('../lib/supabase');
          
          console.log('Attempting to insert checkin:', checkin);
          const generatedCheckinCode = get().generateCheckinCode();
          // First try to save to Supabase
          const { data, error } = await supabase
            .from('checkin_entries')
            .insert({
              location_id: checkin.locationId,
              customer_name: checkin.customerName,
              customer_phone: checkin.customerPhone,
              customer_email: checkin.customerEmail,
              customer_type: checkin.customerType,
              services: checkin.services,
              preferred_employee_id: checkin.preferredEmployeeId,
              checkin_type: checkin.checkinType,
              status: checkin.status,
              checkin_code: generatedCheckinCode,
              estimated_arrival_time: checkin.estimatedArrivalTime?.toISOString(),
              actual_arrival_time: checkin.actualArrivalTime?.toISOString(),
              verification_method: checkin.verificationMethod,
              coordinates: checkin.coordinates,
              special_requests: checkin.specialRequests,
              notes: checkin.notes,
            })
            .select()
            // Removed .single() to make it more robust against potential non-single returns
            ;

          if (error) {
            console.error('Supabase insertion error details:', error);
            throw error;
          }

          if (!data || data.length === 0) {
            throw new Error('Supabase insert returned no data.');
          }

          const insertedData = data[0]; // Get the first inserted row

          // Convert Supabase response to local format
          const newCheckin: CheckinEntry = {
            id: insertedData.id,
            locationId: insertedData.location_id,
            customerName: insertedData.customer_name,
            customerPhone: insertedData.customer_phone,
            customerEmail: insertedData.customer_email,
            customerType: insertedData.customer_type,
            services: insertedData.services,
            preferredEmployeeId: insertedData.preferred_employee_id,
            checkinType: insertedData.checkin_type,
            status: insertedData.status,
            checkinCode: insertedData.checkin_code,
            estimatedArrivalTime: insertedData.estimated_arrival_time ? new Date(insertedData.estimated_arrival_time) : undefined,
            actualArrivalTime: insertedData.actual_arrival_time ? new Date(insertedData.actual_arrival_time) : undefined,
            checkinTime: new Date(insertedData.checkin_time),
            verificationMethod: insertedData.verification_method,
            coordinates: insertedData.coordinates,
            specialRequests: insertedData.special_requests,
            notes: insertedData.notes,
          };

          // Update local state
          set(state => ({
            checkins: [...state.checkins, newCheckin],
            lastSyncTime: new Date(),
            isLoading: false,
          }));

          // Trigger cross-tab synchronization
          window.dispatchEvent(new CustomEvent('checkinAdded', {
            detail: { checkin: newCheckin }
          }));

          return newCheckin;
        } catch (error) {
          console.error('Failed to add check-in (catch block):', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to add check-in',
            isLoading: false 
          });
          
          // Fallback to local storage only
          const newCheckin: CheckinEntry = {
            id: 'local-' + Date.now().toString() + Math.random().toString(36).substr(2, 9),
            ...checkin,
            checkinCode: get().generateCheckinCode(), // Ensure code is generated for fallback
            checkinTime: new Date(),
          };

          set(state => ({
            checkins: [...state.checkins, newCheckin],
            isLoading: false,
            lastSyncTime: new Date()
          }));

          return newCheckin;
        }
      },

      updateCheckin: (id, updates) => {
        set(state => ({
          checkins: state.checkins.map(checkin =>
            checkin.id === id ? { ...checkin, ...updates } : checkin
          ),
          lastSyncTime: new Date()
        }));

        // Trigger notification event
        window.dispatchEvent(new CustomEvent('checkinUpdated', {
          detail: { checkinId: id, updates }
        }));
      },

      removeCheckin: (id) => {
        set(state => ({
          checkins: state.checkins.filter(checkin => checkin.id !== id),
          lastSyncTime: new Date()
        }));
      },

      getCheckinsForLocation: (locationId) => {
        const { checkins } = get();
        return checkins
          .filter(checkin => checkin.locationId === locationId)
          .sort((a, b) => new Date(b.checkinTime).getTime() - new Date(a.checkinTime).getTime());
      },

      generateCheckinCode: generateCode,

      verifyLocation: async (locationId, coordinates) => {
        if (!coordinates) return false;

        const locationCoords = mockLocationCoordinates[locationId];
        if (!locationCoords) return false;

        const distance = calculateDistance(
          coordinates.latitude,
          coordinates.longitude,
          locationCoords.latitude,
          locationCoords.longitude
        );

        // Allow check-in within 100 meters of the location
        return distance <= 100;
      },

      convertToQueue: (checkinId) => {
        const { checkins } = get();
        const checkin = checkins.find(c => c.id === checkinId);
        
        if (checkin) {
          // Update checkin status
          get().updateCheckin(checkinId, { status: 'in_queue' });

          // Trigger queue addition event
          window.dispatchEvent(new CustomEvent('addToQueueFromCheckin', {
            detail: { checkin }
          }));
        }
      },

      expireOldCheckins: () => {
        const { checkins } = get();
        const now = new Date();
        const fourHoursAgo = new Date(now.getTime() - 4 * 60 * 60 * 1000);

        const updatedCheckins = checkins.map(checkin => {
          if (
            checkin.status === 'en_route' &&
            checkin.estimatedArrivalTime &&
            checkin.estimatedArrivalTime < fourHoursAgo
          ) {
            return { ...checkin, status: 'expired' as CheckinStatus };
          }
          return checkin;
        });

        set({ checkins: updatedCheckins });
      },

      setSelectedLocation: (locationId) => {
        set({ selectedLocationId: locationId });
      },

      syncData: async () => {
        set({ isLoading: true });
        
        try {
          // Expire old check-ins and clean up
          get().expireOldCheckins();
          get().cleanupOldCheckins();
          
          set({
            lastSyncTime: new Date(),
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to sync check-in data:', error);
          set({ 
            error: error instanceof Error ? error.message : 'Failed to sync data',
            isLoading: false 
          });
        }
      },

      cleanupOldCheckins: () => {
        const { checkins } = get();
        
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        
        // Remove check-ins older than 24 hours that are completed or expired
        const cleanedCheckins = checkins.filter(checkin => {
          if (checkin.status === 'expired' || checkin.status === 'cancelled' || checkin.status === 'in_queue') {
            return checkin.checkinTime > oneDayAgo;
          }
          return true;
        });
        
        if (cleanedCheckins.length !== checkins.length) {
          set({ checkins: cleanedCheckins });
        }
      },

      initializeRealTime: (locationId) => {
        // Placeholder for real-time initialization
        console.log('Initializing real-time for location:', locationId);
      },

      disconnectRealTime: () => {
        // Placeholder for real-time disconnection
        console.log('Disconnecting real-time');
      },
    }),
    {
      name: 'checkin-storage',
      partialize: (state) => ({
        checkins: state.checkins,
        selectedLocationId: state.selectedLocationId
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.checkins) {
          // Convert date strings back to Date objects
          state.checkins = state.checkins.map(checkin => ({
            ...checkin,
            checkinTime: new Date(checkin.checkinTime),
            estimatedArrivalTime: checkin.estimatedArrivalTime ? new Date(checkin.estimatedArrivalTime) : undefined,
            actualArrivalTime: checkin.actualArrivalTime ? new Date(checkin.actualArrivalTime) : undefined,
          }));
          
          // Clean up old check-ins after rehydration
          setTimeout(() => {
            const store = useCheckinStore.getState();
            store.cleanupOldCheckins();
          }, 100);
        }
      },
    }
  )
);