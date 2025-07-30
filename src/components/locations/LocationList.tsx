import React, { useState } from 'react';
import { Plus, Edit2, MapPin, Phone, Mail, Clock, Trash2 } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { AddLocationForm } from './AddLocationForm';
import { EditLocationForm } from './EditLocationForm';
import { Location } from '../../types';

export function LocationList() {
  const { locations, updateLocation } = useLocationStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);

  const formatBusinessHours = (businessHours: any) => {
    const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    const todaySchedule = businessHours[today];
    
    if (!todaySchedule?.isOpen) {
      return 'Closed today';
    }
    
    return `Open today: ${todaySchedule.openTime} - ${todaySchedule.closeTime}`;
  };

  const handleEditLocation = (location: Location) => {
    setSelectedLocation(location);
    setShowEditForm(true);
  };

  const handleToggleActive = (location: Location) => {
    updateLocation(location.id, { isActive: !location.isActive });
  };

  const handleCloseEditForm = () => {
    setShowEditForm(false);
    setSelectedLocation(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Locations</h2>
          <p className="text-gray-600">Manage your business locations</p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Location</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {locations.map((location) => (
          <div key={location.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900">{location.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    location.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {location.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{location.address}</span>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => handleEditLocation(location)}
                  className="text-gray-400 hover:text-blue-600 transition-colors"
                  title="Edit location"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleToggleActive(location)}
                  className={`text-gray-400 hover:text-red-600 transition-colors ${
                    !location.isActive ? 'text-red-500' : ''
                  }`}
                  title={location.isActive ? 'Deactivate location' : 'Activate location'}
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <span>{location.phone}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <span>{location.email}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span>{formatBusinessHours(location.settings.businessHours)}</span>
              </div>

              <div className="pt-3 border-t border-gray-200">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Max Queue:</span>
                    <span className="ml-1 font-medium">{location.settings.maxQueueSize}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Walk-ins:</span>
                    <span className="ml-1 font-medium">
                      {location.settings.allowWalkIns ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
                <div className="mt-2 text-sm">
                  <span className="text-gray-600">Appointments:</span>
                  <span className="ml-1 font-medium">
                    {location.settings.requireAppointments ? 'Required' : 'Optional'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {locations.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No locations found</h3>
          <p className="text-gray-600 mb-4">Add your first location to start managing queues</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add First Location
          </button>
        </div>
      )}

      <AddLocationForm 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)}
      />

      {selectedLocation && (
        <EditLocationForm 
          isOpen={showEditForm} 
          onClose={handleCloseEditForm}
          location={selectedLocation}
        />
      )}
    </div>
  );
}