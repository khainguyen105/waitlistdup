import { useEffect } from 'react';
import { useQueueStore } from '../stores/queueStore';
import { useCheckinStore } from '../stores/checkinStore';

/**
 * Custom hook to manage real-time synchronization across browser tabs
 * This hook handles cross-tab communication and Supabase real-time subscriptions
 */
export function useRealTimeSync(locationId?: string) {
  const queueStore = useQueueStore();
  const checkinStore = useCheckinStore();

  useEffect(() => {
    if (!locationId) return;

    // Initialize real-time subscriptions
    queueStore.initializeRealTime(locationId);
    checkinStore.initializeRealTime(locationId);

    // Set up cross-tab communication listeners
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'queue-storage' || e.key === 'checkin-storage') {
        // Force refresh when other tabs update local storage
        queueStore.fetchFromSupabase(locationId);
        checkinStore.fetchFromSupabase(locationId);
      }
    };

    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Refresh data when tab becomes visible
        queueStore.fetchFromSupabase(locationId);
        checkinStore.fetchFromSupabase(locationId);
      }
    };

    const handleFocus = () => {
      // Refresh data when window gains focus
      queueStore.fetchFromSupabase(locationId);
      checkinStore.fetchFromSupabase(locationId);
    };

    // Cross-tab communication via localStorage changes
    window.addEventListener('storage', handleStorageChange);
    
    // Refresh on tab visibility change
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Refresh on window focus
    window.addEventListener('focus', handleFocus);

    // Cleanup function
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      
      // Disconnect real-time subscriptions
      queueStore.disconnectRealTime();
      checkinStore.disconnectRealTime();
    };
  }, [locationId, queueStore, checkinStore]);

  return {
    isQueueLoading: queueStore.isLoading,
    isCheckinLoading: checkinStore.isLoading,
    queueError: queueStore.error,
    checkinError: checkinStore.error,
  };
}