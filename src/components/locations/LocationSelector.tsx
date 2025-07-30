import React, { useEffect } from 'react';
import { MapPin, ChevronDown } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { useQueueStore } from '../../stores/queueStore';
import { useCheckinStore } from '../../stores/checkinStore';

export function LocationSelector() {
  const { locations, selectedLocation, setSelectedLocation } = useLocationStore();
  const { selectedLocationId, setSelectedLocation: setQueueLocation } = useQueueStore();
  const { setSelectedLocation: setCheckinLocation } = useCheckinStore();

  // Sync location selection between stores
  useEffect(() => {
    if (selectedLocation && selectedLocationId !== selectedLocation.id) {
      setQueueLocation(selectedLocation.id);
      setCheckinLocation(selectedLocation.id);
    }
  }, [selectedLocation, selectedLocationId, setQueueLocation, setCheckinLocation]);

  const handleLocationChange = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    setSelectedLocation(location || null);
    setQueueLocation(locationId);
    setCheckinLocation(locationId);
  };

  return (
    <div className="relative">
      {/* Visual container for the selector */}
      <div className="relative flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 cursor-pointer">
        <MapPin className="w-5 h-5 text-gray-400 pointer-events-none" />
        
        {/* Display text */}
        <span className="font-medium text-gray-900 min-w-[150px] pointer-events-none">
          {selectedLocation?.name || 'Select Location'}
        </span>
        
        <ChevronDown className="w-4 h-4 text-gray-400 pointer-events-none" />
        
        {/* Invisible select element covering the entire area */}
        <select
          value={selectedLocation?.id || ''}
          onChange={(e) => handleLocationChange(e.target.value)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          style={{ pointerEvents: 'auto' }}
        >
          <option value="">Select Location</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {location.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}