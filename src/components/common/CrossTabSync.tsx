import React, { useEffect } from 'react';
import { useQueueStore } from '../../stores/queueStore';
import { useCheckinStore } from '../../stores/checkinStore';

/**
 * Component to handle cross-tab synchronization
 * This should be included in your App component to ensure it runs globally
 */
export function CrossTabSync() {
  const { refreshQueue, selectedLocationId: queueLocationId } = useQueueStore();
  const { syncData: syncCheckins, selectedLocationId: checkinLocationId } = useCheckinStore();

  useEffect(() => {
    // Handle cross-tab communication for queue updates
    const handleQueueUpdate = (event: any) => {
      console.log('Cross-tab queue update received:', event.detail);
      refreshQueue();
    };

    // Handle cross-tab communication for checkin updates
    const handleCheckinUpdate = (event: any) => {
      console.log('Cross-tab checkin update received:', event.detail);
      syncCheckins();
    };

    // Handle Supabase real-time updates
    const handleSupabaseQueueUpdate = (event: any) => {
      console.log('Supabase queue update received:', event.detail);
      // Data is already updated by the real-time subscription
      // Just trigger a UI refresh
      refreshQueue();
    };

    const handleSupabaseCheckinUpdate = (event: any) => {
      console.log('Supabase checkin update received:', event.detail);
      // Data is already updated by the real-time subscription
      // Just trigger a UI refresh
      syncCheckins();
    };

    // Listen for cross-tab events
    window.addEventListener('queueUpdated', handleQueueUpdate);
    window.addEventListener('checkinAdded', handleCheckinUpdate);
    window.addEventListener('checkinUpdated', handleCheckinUpdate);
    
    // Listen for Supabase real-time events
    window.addEventListener('supabaseQueueUpdate', handleSupabaseQueueUpdate);
    window.addEventListener('supabaseCheckinUpdate', handleSupabaseCheckinUpdate);

    // Cleanup listeners
    return () => {
      window.removeEventListener('queueUpdated', handleQueueUpdate);
      window.removeEventListener('checkinAdded', handleCheckinUpdate);
      window.removeEventListener('checkinUpdated', handleCheckinUpdate);
      window.removeEventListener('supabaseQueueUpdate', handleSupabaseQueueUpdate);
      window.removeEventListener('supabaseCheckinUpdate', handleSupabaseCheckinUpdate);
    };
  }, [refreshQueue, syncCheckins]);

  return null; // This component doesn't render anything
}