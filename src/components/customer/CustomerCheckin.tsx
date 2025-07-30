import React, { useState, useEffect } from 'react';
import { Clock, Users, Phone, Mail, CheckCircle, MapPin, Loader2, Settings } from 'lucide-react';
import { useQueueStore } from '../../stores/queueStore';
import { useLocationStore } from '../../stores/locationStore';
import { QueueEntry } from '../../types';

interface CustomerCheckinProps {
  locationId?: string;
}

export function CustomerCheckin({ locationId }: CustomerCheckinProps) {
  const [step, setStep] = useState<'select-location' | 'join-queue' | 'in-queue'>('select-location');
  const [selectedLocationId, setSelectedLocationId] = useState<string>(locationId || '');
  const [customerEntry, setCustomerEntry] = useState<QueueEntry | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    services: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { locations, getServicesForLocation } = useLocationStore();
  const { entries, addToQueue, stats } = useQueueStore();

  const selectedLocation = locations.find(loc => loc.id === selectedLocationId);
  const availableServices = selectedLocationId ? getServicesForLocation(selectedLocationId) : [];
  
  // Find customer's entry in queue
  useEffect(() => {
    if (selectedLocationId && formData.customerPhone) {
      const entry = entries.find(e => 
        e.locationId === selectedLocationId && 
        e.customerPhone === formData.customerPhone &&
        (e.status === 'waiting' || e.status === 'called' || e.status === 'in_progress')
      );
      if (entry) {
        setCustomerEntry(entry);
        setStep('in-queue');
      }
    }
  }, [entries, selectedLocationId, formData.customerPhone]);

  const handleLocationSelect = (locId: string) => {
    // Redirect to location-specific page
    window.location.href = `/location/${locId}`;
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLocationId || formData.services.length === 0) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const estimatedDuration = formData.services.reduce((total, serviceName) => {
      const service = availableServices.find(s => s.name === serviceName);
      return total + (service?.estimatedDuration || 30);
    }, 0);

    addToQueue({
      locationId: selectedLocationId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      services: formData.services,
      priority: 'normal',
      status: 'waiting',
      estimatedWaitTime: estimatedDuration,
    });

    setIsSubmitting(false);
    setStep('in-queue');
  };

  const toggleService = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter(s => s !== serviceName)
        : [...prev.services, serviceName]
    }));
  };

  const getQueuePosition = () => {
    if (!customerEntry) return 0;
    const waitingEntries = entries
      .filter(e => e.locationId === selectedLocationId && e.status === 'waiting')
      .sort((a, b) => a.position - b.position);
    return waitingEntries.findIndex(e => e.id === customerEntry.id) + 1;
  };

  const getEstimatedWaitTime = () => {
    const position = getQueuePosition();
    if (position === 0) return 0;
    return position * 25; // Rough estimate of 25 minutes per person ahead
  };

  // Admin Login Button Component
  const AdminLoginButton = () => (
    <div className="fixed bottom-6 right-6 z-40">
      <a
        href="/login"
        className="bg-gray-800 hover:bg-gray-900 text-white p-3 rounded-full shadow-lg transition-all duration-300 hover:scale-105 flex items-center justify-center group"
        title="Staff Login"
      >
        <Settings className="w-6 h-6" />
        <span className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap">
          Staff Login
        </span>
      </a>
    </div>
  );

  if (step === 'select-location') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8 pt-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Join the Queue</h1>
            <p className="text-gray-600">Select your location to get started</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {locations.map((location) => (
              <div
                key={location.id}
                onClick={() => handleLocationSelect(location.id)}
                className="bg-white rounded-xl shadow-lg p-6 cursor-pointer hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-blue-200"
              >
                <div className="flex items-start space-x-4">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <MapPin className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{location.name}</h3>
                    <p className="text-gray-600 mb-4">{location.address}</p>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <Users className="w-4 h-4 text-green-500" />
                        <span className="text-gray-700">
                          {entries.filter(e => e.locationId === location.id && e.status === 'waiting').length} waiting
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-gray-700">~25 min wait</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">
                        {location.settings.allowWalkIns ? 'Walk-ins welcome' : 'Appointments only'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <AdminLoginButton />
      </div>
    );
  }

  return null;
}