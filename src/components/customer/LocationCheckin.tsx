import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Phone, Mail, CheckCircle, MapPin, Loader2, Settings, User, Star, RefreshCw, Calendar } from 'lucide-react';
import { useQueueStore } from '../../stores/queueStore';
import { useLocationStore } from '../../stores/locationStore';
import { useCustomerStore } from '../../stores/customerStore';
import { CustomerAutocomplete } from '../customers/CustomerAutocomplete';
import { ThankYouPage } from './ThankYouPage';
import { AppointmentBooking } from './AppointmentBooking';
import { CheckinSelection } from './CheckinSelection';
import { QueueEntry } from '../../types';

export function LocationCheckin() {
  const { locationId } = useParams<{ locationId: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<'checkin-selection' | 'join-queue' | 'in-queue' | 'completed' | 'thank-you'>('checkin-selection');
  const [customerEntry, setCustomerEntry] = useState<QueueEntry | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    services: [] as string[],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { locations, getServicesForLocation } = useLocationStore();
  const { entries, addToQueue, syncData, refreshQueue } = useQueueStore();
  const { addCustomer, recordVisit } = useCustomerStore();

  const selectedLocation = locations.find(loc => loc.id === locationId);
  const availableServices = locationId ? getServicesForLocation(locationId) : [];
  
  // Find customer's active entry in queue (exclude completed entries)
  useEffect(() => {
    if (locationId && formData.customerPhone) {
      const activeEntry = entries.find(e => 
        e.locationId === locationId && 
        e.customerPhone === formData.customerPhone &&
        (e.status === 'waiting' || e.status === 'called' || e.status === 'in_progress')
      );
      
      if (activeEntry) {
        setCustomerEntry(activeEntry);
        setStep('in-queue');
      } else {
        // Check if there's a recently completed entry (within last 5 minutes)
        const recentlyCompleted = entries.find(e => 
          e.locationId === locationId && 
          e.customerPhone === formData.customerPhone &&
          e.status === 'completed' &&
          e.completedAt &&
          (new Date().getTime() - new Date(e.completedAt).getTime()) < 5 * 60 * 1000 // 5 minutes
        );
        
        if (recentlyCompleted && step !== 'checkin-selection' && step !== 'join-queue') {
          setCustomerEntry(recentlyCompleted);
          setStep('thank-you'); // Go directly to thank you page
        } else if (step !== 'checkin-selection' && step !== 'join-queue') {
          // No active or recent entry, reset to checkin selection
          setStep('checkin-selection');
          setCustomerEntry(null);
        }
      }
    }
  }, [entries, locationId, formData.customerPhone, step]);

  // Listen for real-time queue updates
  useEffect(() => {
    const handleQueueUpdate = (event: any) => {
      const { type, entryId, updates } = event.detail;
      
      if (customerEntry && entryId === customerEntry.id) {
        // Update the customer entry with new data
        const updatedEntry = { ...customerEntry, ...updates };
        setCustomerEntry(updatedEntry);
        
        // Handle status transitions
        if (updates?.status === 'completed') {
          setStep('thank-you'); // Go to thank you page instead of completed
        } else if (updates?.status === 'called') {
          // Customer has been called
          setStep('in-queue');
        } else if (updates?.status === 'in_progress') {
          // Service has started
          setStep('in-queue');
        }
      }
    };

    window.addEventListener('queueUpdated', handleQueueUpdate);
    return () => window.removeEventListener('queueUpdated', handleQueueUpdate);
  }, [customerEntry]);

  const handleCustomerSelect = (customer: any) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      customerEmail: customer.email || '',
      services: customer.preferredServices.filter((service: string) =>
        availableServices.some(s => s.name === service)
      )
    }));
  };

  const handleJoinQueue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationId || formData.services.length === 0) return;

    setIsSubmitting(true);

    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    const estimatedDuration = formData.services.reduce((total, serviceName) => {
      const service = availableServices.find(s => s.name === serviceName);
      return total + (service?.estimatedDuration || 30);
    }, 0);

    // Add to queue
    const newEntry = addToQueue({
      locationId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      services: formData.services,
      priority: 'normal',
      status: 'waiting',
      estimatedWaitTime: estimatedDuration,
    });

    // Record customer visit
    addCustomer({
      phone: formData.customerPhone,
      name: formData.customerName,
      email: formData.customerEmail || undefined,
      preferredServices: formData.services,
    });

    recordVisit(formData.customerPhone, formData.services);

    setIsSubmitting(false);
    setStep('in-queue');

    // Navigate to unique queue entry URL
    if (newEntry) {
      navigate(`/queue/${newEntry.id}`, { replace: true });
    }
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
      .filter(e => e.locationId === locationId && e.status === 'waiting')
      .sort((a, b) => a.position - b.position);
    return waitingEntries.findIndex(e => e.id === customerEntry.id) + 1;
  };

  const getEstimatedWaitTime = () => {
    const position = getQueuePosition();
    if (position === 0) return 0;
    return position * 25; // Rough estimate of 25 minutes per person ahead
  };

  const getCurrentQueueLength = () => {
    return entries.filter(e => e.locationId === locationId && e.status === 'waiting').length;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncData();
    refreshQueue();
    setIsRefreshing(false);
  };

  const handleAppointmentBooking = (appointmentDetails: any) => {
    console.log('Appointment booked:', appointmentDetails);
    // In a real app, this would save the appointment to your backend
    
    // Show success message and reset
    alert(`Appointment booked for ${appointmentDetails.date.toLocaleDateString()} at ${appointmentDetails.time}!`);
    
    // Reset everything and navigate back to location page
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      services: [],
    });
    setCustomerEntry(null);
    setStep('checkin-selection');
    setShowAppointmentBooking(false);
    navigate(`/location/${locationId}`, { replace: true });
  };

  const handleStartOver = () => {
    // Reset everything and navigate back to location page
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      services: [],
    });
    setCustomerEntry(null);
    setStep('checkin-selection');
    setShowAppointmentBooking(false);
    navigate(`/location/${locationId}`, { replace: true });
  };

  const handleThankYouComplete = () => {
    handleStartOver();
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

  if (!selectedLocation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Not Found</h1>
          <p className="text-gray-600 mb-6">The location you're looking for doesn't exist or is no longer available.</p>
          <a
            href="/checkin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <span>View All Locations</span>
          </a>
        </div>
        <AdminLoginButton />
      </div>
    );
  }

  if (step === 'thank-you' && customerEntry) {
    return (
      <ThankYouPage
        customerName={customerEntry.customerName}
        services={customerEntry.services}
        locationName={selectedLocation.name}
        onComplete={handleThankYouComplete}
      />
    );
  }

  if (step === 'checkin-selection') {
    return (
      <>
        <CheckinSelection locationId={locationId!} />
        <AdminLoginButton />
      </>
    );
  }

  if (step === 'join-queue') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          {/* Location Header */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 p-3 rounded-lg">
                <MapPin className="w-8 h-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold text-gray-900">{selectedLocation.name}</h1>
                <p className="text-gray-600 mb-2">{selectedLocation.address}</p>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center space-x-1">
                    <Users className="w-4 h-4 text-green-500" />
                    <span className="text-gray-700">{getCurrentQueueLength()} in queue</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-gray-700">~{getCurrentQueueLength() * 25} min wait</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Join Queue Form */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Join the Queue</h2>
              <p className="text-gray-600">Fill out your information to get in line</p>
            </div>

            <form onSubmit={handleJoinQueue} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number *
                </label>
                <CustomerAutocomplete
                  value={formData.customerPhone}
                  onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
                  onCustomerSelect={handleCustomerSelect}
                  placeholder="(555) 123-4567"
                />
                <p className="text-xs text-gray-500 mt-1">We'll text you when it's your turn</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your Name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (Optional)
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Select Services *
                </label>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {availableServices.map((service) => (
                    <label
                      key={service.id}
                      className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                        formData.services.includes(service.name)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={formData.services.includes(service.name)}
                        onChange={() => toggleService(service.name)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-4"
                      />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">{service.name}</span>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{service.estimatedDuration} min</span>
                            </span>
                            {service.price && (
                              <span className="font-semibold text-green-600">${service.price}</span>
                            )}
                          </div>
                        </div>
                        {service.description && (
                          <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
                {availableServices.length === 0 && (
                  <p className="text-gray-500 text-center py-4">No services available at this location</p>
                )}
              </div>

              <button
                type="submit"
                disabled={!formData.customerName || !formData.customerPhone || formData.services.length === 0 || isSubmitting}
                className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center text-lg"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                    Joining Queue...
                  </>
                ) : (
                  'Join Queue'
                )}
              </button>
            </form>
          </div>

          <div className="text-center mt-6">
            <a
              href="/checkin"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              ← View other locations
            </a>
          </div>
        </div>
        <AdminLoginButton />
      </div>
    );
  }

  if (step === 'in-queue' && customerEntry) {
    const position = getQueuePosition();
    const estimatedWait = getEstimatedWaitTime();
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">You're in line!</h1>
            <p className="text-gray-600 text-lg">{selectedLocation.name}</p>
          </div>

          {/* Position Display */}
          <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div className="text-center flex-1">
                <div className="text-7xl font-bold text-green-600 mb-4">
                  {customerEntry.status === 'in_progress' ? 'NOW' : position === 0 ? 'NEXT!' : `#${position}`}
                </div>
                <p className="text-xl text-gray-700">
                  {customerEntry.status === 'in_progress' 
                    ? 'Your service is in progress!' 
                    : position === 0 
                    ? 'You are next in line!' 
                    : `${position} ${position === 1 ? 'person' : 'people'} ahead of you`
                  }
                </p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-lg transition-colors flex items-center justify-center"
                title="Refresh queue status"
              >
                <RefreshCw className={`w-6 h-6 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <Clock className="w-10 h-10 text-blue-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Estimated Wait</p>
                <p className="text-3xl font-bold text-gray-900">
                  {customerEntry.status === 'in_progress' ? '0' : estimatedWait}
                </p>
                <p className="text-sm text-gray-600">minutes</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <p className="text-xl font-semibold text-gray-900 capitalize">
                  {customerEntry.status === 'waiting' && 'Waiting'}
                  {customerEntry.status === 'called' && 'Called'}
                  {customerEntry.status === 'in_progress' && 'In Progress'}
                </p>
              </div>
            </div>

            {customerEntry.status === 'called' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="bg-yellow-500 w-3 h-3 rounded-full animate-pulse"></div>
                  <p className="font-semibold text-yellow-800">You've been called!</p>
                </div>
                <p className="text-yellow-700 text-sm mt-1">Please head to the front desk now.</p>
              </div>
            )}

            {customerEntry.status === 'in_progress' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-center space-x-2">
                  <div className="bg-blue-500 w-3 h-3 rounded-full animate-pulse"></div>
                  <p className="font-semibold text-blue-800">Your service is in progress!</p>
                </div>
                <p className="text-blue-700 text-sm mt-1">Please enjoy your service. We'll notify you when complete.</p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6">
              <h3 className="font-semibold text-gray-900 mb-4">Your Information</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Name:</span>
                  <span className="font-medium">{customerEntry.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Phone:</span>
                  <span className="font-medium">{customerEntry.customerPhone}</span>
                </div>
                {customerEntry.customerEmail && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-medium">{customerEntry.customerEmail}</span>
                  </div>
                )}
                <div>
                  <span className="text-gray-600">Services:</span>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {customerEntry.services.map((service, index) => (
                      <span key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {service}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center space-x-2">
              <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">!</span>
              </div>
              <span>Important Information</span>
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start space-x-3">
                <div className="bg-green-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-green-600 text-xs font-bold">✓</span>
                </div>
                <p>We'll send you a text message when it's almost your turn</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-yellow-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-yellow-600 text-xs font-bold">⚠</span>
                </div>
                <p>Please arrive within 5 minutes of being called to avoid losing your spot</p>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-100 w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-600 text-xs font-bold">i</span>
                </div>
                <p>Check in with the front desk when you arrive</p>
              </div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Need Help?</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <a href={`tel:${selectedLocation.phone}`} className="text-blue-600 hover:text-blue-700">
                  {selectedLocation.phone}
                </a>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <a href={`mailto:${selectedLocation.email}`} className="text-blue-600 hover:text-blue-700">
                  {selectedLocation.email}
                </a>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <button
              onClick={handleStartOver}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Join another queue
            </button>
          </div>
        </div>
        <AdminLoginButton />
      </div>
    );
  }

  return null;
}