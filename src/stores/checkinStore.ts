import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CheckinEntry, CheckinStatus } from '../types';

interface CheckinState {
  checkins: CheckinEntry[];
  selectedLocationId: string | null;
  isLoading: boolean;
  lastSyncTime: Date | null;
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

      addCheckin: (checkin) => {
        const newCheckin: CheckinEntry = {
          ...checkin,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          checkinCode: generateCode(),
          checkinTime: new Date(),
        };

        set(state => ({
          checkins: [...state.checkins, newCheckin],
          lastSyncTime: new Date()
        }));

        // Clean up old check-ins
        setTimeout(() => {
          get().cleanupOldCheckins();
        }, 1000);

        // Trigger notification event
        window.dispatchEvent(new CustomEvent('checkinAdded', {
          detail: { checkin: newCheckin }
        }));

        return newCheckin;
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
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Expire old check-ins and clean up
          get().expireOldCheckins();
          get().cleanupOldCheckins();
          
          set({
            lastSyncTime: new Date(),
            isLoading: false
          });
        } catch (error) {
          console.error('Failed to sync check-in data:', error);
          set({ isLoading: false });
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