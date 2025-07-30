import React, { useState } from 'react';
import { Clock, MapPin, Navigation, Smartphone } from 'lucide-react';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { RemoteCheckinForm } from '../checkin/RemoteCheckinForm';
import { InStoreCheckinForm } from '../checkin/InStoreCheckinForm';
import { CheckinSuccess } from '../checkin/CheckinSuccess';
import { useLocationStore } from '../../stores/locationStore';

interface CheckinSelectionProps {
  locationId: string;
}

export function CheckinSelection({ locationId }: CheckinSelectionProps) {
  const [checkinType, setCheckinType] = useState<'selection' | 'remote' | 'in_store' | 'success'>('selection');
  const [successData, setSuccessData] = useState<{
    checkinCode: string;
    checkinType: 'remote' | 'in_store';
    customerName: string;
    estimatedArrivalTime?: Date;
  } | null>(null);

  const { locations } = useLocationStore();
  const location = locations.find(loc => loc.id === locationId);

  const handleCheckinSuccess = (checkinCode: string, type: 'remote' | 'in_store', customerName: string, estimatedArrivalTime?: Date) => {
    setSuccessData({
      checkinCode,
      checkinType: type,
      customerName,
      estimatedArrivalTime
    });
    setCheckinType('success');
  };

  const handleStartOver = () => {
    setCheckinType('selection');
    setSuccessData(null);
  };

  if (!location) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center max-w-md">
          <div className="bg-red-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Location Not Found</h1>
          <p className="text-gray-600">The location you're looking for doesn't exist or is no longer available.</p>
        </div>
      </div>
    );
  }

  if (checkinType === 'success' && successData) {
    return (
      <CheckinSuccess
        checkinCode={successData.checkinCode}
        checkinType={successData.checkinType}
        customerName={successData.customerName}
        locationName={location.name}
        estimatedArrivalTime={successData.estimatedArrivalTime}
        onStartOver={handleStartOver}
      />
    );
  }

  if (checkinType === 'remote') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="mb-6">
            <TouchFriendlyButton
              variant="ghost"
              onClick={() => setCheckinType('selection')}
            >
              ← Back to Options
            </TouchFriendlyButton>
          </div>
          <RemoteCheckinForm
            locationId={locationId}
            onSuccess={(code) => handleCheckinSuccess(code, 'remote', 'Customer', new Date())}
          />
        </div>
      </div>
    );
  }

  if (checkinType === 'in_store') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <div className="mb-6">
            <TouchFriendlyButton
              variant="ghost"
              onClick={() => setCheckinType('selection')}
            >
              ← Back to Options
            </TouchFriendlyButton>
          </div>
          <InStoreCheckinForm
            locationId={locationId}
            onSuccess={(code) => handleCheckinSuccess(code, 'in_store', 'Customer')}
          />
        </div>
      </div>
    );
  }

  // Selection screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        {/* Location Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <MapPin className="w-8 h-8 text-purple-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">{location.name}</h1>
              <p className="text-gray-600 mb-2">{location.address}</p>
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                <span>📞 {location.phone}</span>
                <span>✉️ {location.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Check-in Options */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">How would you like to check in?</h2>
          <p className="text-gray-600 text-lg">Choose the option that works best for you</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Remote Check-in */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-10 h-10 text-blue-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Pre-Check-In</h3>
              <p className="text-gray-600">Check in remotely before you arrive</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Skip the Wait</h4>
                  <p className="text-sm text-gray-600">Reserve your spot and arrive when convenient</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Real-time Updates</h4>
                  <p className="text-sm text-gray-600">Get SMS notifications about your queue status</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-blue-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Flexible Timing</h4>
                  <p className="text-sm text-gray-600">Choose your estimated arrival time</p>
                </div>
              </div>
            </div>

            <TouchFriendlyButton
              fullWidth
              size="lg"
              onClick={() => setCheckinType('remote')}
              className="text-lg py-4"
            >
              <Clock className="w-6 h-6 mr-3" />
              Pre-Check-In Now
            </TouchFriendlyButton>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800 text-center">
                Perfect for busy schedules • Arrive within your time window
              </p>
            </div>
          </div>

          {/* In-Store Check-in */}
          <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-shadow">
            <div className="text-center mb-6">
              <div className="bg-green-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Navigation className="w-10 h-10 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">In-Store Check-In</h3>
              <p className="text-gray-600">Check in when you're physically here</p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Immediate Service</h4>
                  <p className="text-sm text-gray-600">Join the queue right away</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Location Verified</h4>
                  <p className="text-sm text-gray-600">Automatic verification you're here</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="bg-green-500 w-2 h-2 rounded-full mt-2 flex-shrink-0"></div>
                <div>
                  <h4 className="font-semibold text-gray-900">Staff Assistance</h4>
                  <p className="text-sm text-gray-600">Get help from our team if needed</p>
                </div>
              </div>
            </div>

            <TouchFriendlyButton
              fullWidth
              size="lg"
              variant="secondary"
              onClick={() => setCheckinType('in_store')}
              className="text-lg py-4"
            >
              <MapPin className="w-6 h-6 mr-3" />
              Check In Here
            </TouchFriendlyButton>

            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-xs text-green-800 text-center">
                Walk-ins welcome • Immediate queue entry
              </p>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">Need Help Choosing?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Choose Pre-Check-In if:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• You're not at the location yet</li>
                <li>• You want to plan your arrival time</li>
                <li>• You prefer to wait elsewhere</li>
                <li>• You have a busy schedule</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Choose In-Store Check-In if:</h4>
              <ul className="space-y-1 text-gray-600">
                <li>• You're already at the location</li>
                <li>• You're ready to wait here</li>
                <li>• You want immediate service</li>
                <li>• You need staff assistance</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}