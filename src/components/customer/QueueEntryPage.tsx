import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Clock, Users, Phone, Mail, CheckCircle, MapPin, Settings, RefreshCw, Calendar, Star } from 'lucide-react';
import { useQueueStore } from '../../stores/queueStore';
import { useLocationStore } from '../../stores/locationStore';
import { ServiceRating } from './ServiceRating';
import { AppointmentBooking } from './AppointmentBooking';
import { QueueEntry } from '../../types';

export function QueueEntryPage() {
  const { entryId } = useParams<{ entryId: string }>();
  const navigate = useNavigate();
  const [customerEntry, setCustomerEntry] = useState<QueueEntry | null>(null);
  const [showRating, setShowRating] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { entries, syncData, refreshQueue } = useQueueStore();
  const { locations } = useLocationStore();

  // Find the queue entry by ID
  useEffect(() => {
    if (entryId) {
      const entry = entries.find(e => e.id === entryId);
      if (entry) {
        setCustomerEntry(entry);
        
        // If entry is completed and we haven't shown rating yet, show it
        if (entry.status === 'completed' && !showRating) {
          setTimeout(() => {
            setShowRating(true);
          }, 1000);
        }
      } else {
        // Entry not found, redirect to location selection
        navigate('/checkin');
      }
    }
  }, [entryId, entries, navigate, showRating]);

  // Listen for real-time queue updates
  useEffect(() => {
    const handleQueueUpdate = (event: any) => {
      const { type, entryId: updatedEntryId, updates } = event.detail;
      
      if (customerEntry && updatedEntryId === customerEntry.id) {
        // Update the customer entry with new data
        const updatedEntry = { ...customerEntry, ...updates };
        setCustomerEntry(updatedEntry);
        
        // Handle status transitions
        if (updates?.status === 'completed' && !showRating) {
          // Auto-show rating after a brief delay
          setTimeout(() => {
            setShowRating(true);
          }, 1000);
        }
      }
    };

    window.addEventListener('queueUpdated', handleQueueUpdate);
    return () => window.removeEventListener('queueUpdated', handleQueueUpdate);
  }, [customerEntry, showRating]);

  const getQueuePosition = () => {
    if (!customerEntry) return 0;
    const waitingEntries = entries
      .filter(e => e.locationId === customerEntry.locationId && e.status === 'waiting')
      .sort((a, b) => a.position - b.position);
    return waitingEntries.findIndex(e => e.id === customerEntry.id) + 1;
  };

  const getEstimatedWaitTime = () => {
    const position = getQueuePosition();
    if (position === 0) return 0;
    return position * 25; // Rough estimate of 25 minutes per person ahead
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await syncData();
    refreshQueue();
    setIsRefreshing(false);
  };

  const handleRatingSubmit = (rating: number, feedback?: string) => {
    console.log('Rating submitted:', { rating, feedback, customer: customerEntry?.customerName });
    setShowRating(false);
  };

  const handleAppointmentBooking = (appointmentDetails: any) => {
    console.log('Appointment booked:', appointmentDetails);
    alert(`Appointment booked for ${appointmentDetails.date.toLocaleDateString()} at ${appointmentDetails.time}!`);
    
    // Navigate back to location page for new booking
    if (customerEntry) {
      navigate(`/location/${customerEntry.locationId}`);
    }
  };

  const handleStartOver = () => {
    if (customerEntry) {
      navigate(`/location/${customerEntry.locationId}`);
    } else {
      navigate('/checkin');
    }
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

  if (!customerEntry) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Queue Entry Not Found</h1>
          <p className="text-gray-600 mb-6">The queue entry you're looking for doesn't exist or has expired.</p>
          <a
            href="/checkin"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center space-x-2"
          >
            <span>Join a Queue</span>
          </a>
        </div>
        <AdminLoginButton />
      </div>
    );
  }

  const selectedLocation = locations.find(loc => loc.id === customerEntry.locationId);
  const position = getQueuePosition();
  const estimatedWait = getEstimatedWaitTime();

  if (customerEntry.status === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="text-center mb-8">
            <div className="bg-purple-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Service Complete!</h1>
            <p className="text-gray-600 text-lg">Thank you for visiting {selectedLocation?.name}</p>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Thank you, {customerEntry.customerName}!
            </h2>
            <p className="text-gray-600 mb-6">
              We hope you enjoyed your experience today. Your feedback helps us improve our service.
            </p>
            
            <div className="flex flex-wrap justify-center gap-2 mb-8">
              {customerEntry.services.map((service, index) => (
                <span key={index} className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                  {service}
                </span>
              ))}
            </div>

            <div className="space-y-4">
              <button
                onClick={() => setShowRating(true)}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
              >
                <Star className="w-5 h-5" />
                <span>Rate Your Experience</span>
              </button>
              
              {/* Show appointment booking button only if location allows appointments */}
              {selectedLocation?.settings.requireAppointments && (
                <button
                  onClick={() => setShowAppointmentBooking(true)}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors flex items-center justify-center space-x-2"
                >
                  <Calendar className="w-5 h-5" />
                  <span>Book Your Next Appointment</span>
                </button>
              )}
              
              <button
                onClick={handleStartOver}
                className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-6 rounded-lg transition-colors"
              >
                Book Another Service
              </button>
            </div>
          </div>
        </div>
        <AdminLoginButton />
        
        {showRating && (
          <ServiceRating
            isOpen={showRating}
            onClose={() => setShowRating(false)}
            customerName={customerEntry.customerName}
            services={customerEntry.services}
            locationName={selectedLocation?.name || ''}
            onSubmitRating={handleRatingSubmit}
          />
        )}

        {showAppointmentBooking && selectedLocation && (
          <AppointmentBooking
            isOpen={showAppointmentBooking}
            onClose={() => setShowAppointmentBooking(false)}
            locationId={customerEntry.locationId}
            customerName={customerEntry.customerName}
            customerPhone={customerEntry.customerPhone}
            customerEmail={customerEntry.customerEmail}
            onBookingComplete={handleAppointmentBooking}
          />
        )}
      </div>
    );
  }

  // In-queue view
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        <div className="text-center mb-8">
          <div className="bg-green-600 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">You're in line!</h1>
          <p className="text-gray-600 text-lg">{selectedLocation?.name}</p>
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
        {selectedLocation && (
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
        )}

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