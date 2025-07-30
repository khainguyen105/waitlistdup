import React, { useState, useEffect } from 'react';
import { MapPin, Phone, User, Loader2, CheckCircle, AlertCircle, Wifi } from 'lucide-react';
import { useCheckinStore } from '../../stores/checkinStore';
import { useLocationStore } from '../../stores/locationStore';
import { useCustomerStore } from '../../stores/customerStore';
import { CustomerAutocomplete } from '../customers/CustomerAutocomplete';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface InStoreCheckinFormProps {
  locationId: string;
  onSuccess: (checkinCode: string) => void;
}

export function InStoreCheckinForm({ locationId, onSuccess }: InStoreCheckinFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    services: [] as string[],
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'verified' | 'failed'>('pending');
  const [verificationMethod, setVerificationMethod] = useState<'geolocation' | 'wifi' | 'manual'>('geolocation');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);

  const { addCheckin, verifyLocation } = useCheckinStore();
  const { getServicesForLocation, locations } = useLocationStore();
  const { addCustomer } = useCustomerStore();

  const location = locations.find(loc => loc.id === locationId);
  const availableServices = getServicesForLocation(locationId);

  // Verify location on component mount
  useEffect(() => {
    verifyPresence();
  }, []);

  const verifyPresence = async () => {
    setIsVerifying(true);
    
    try {
      // Try geolocation first
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 30000, // Increased timeout to 30 seconds
            maximumAge: 60000
          });
        });

        setCoordinates(position.coords);
        const isNearLocation = await verifyLocation(locationId, position.coords);
        
        if (isNearLocation) {
          setVerificationStatus('verified');
          setVerificationMethod('geolocation');
        } else {
          // Try WiFi verification as fallback
          await tryWifiVerification();
        }
      } else {
        await tryWifiVerification();
      }
    } catch (error) {
      console.error('Geolocation failed:', error);
      await tryWifiVerification();
    } finally {
      setIsVerifying(false);
    }
  };

  const tryWifiVerification = async () => {
    // Simulate WiFi network detection
    // In a real app, this would check the connected WiFi network
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock WiFi verification - in production, this would check actual network
      const mockWifiVerified = Math.random() > 0.3; // 70% success rate for demo
      
      if (mockWifiVerified) {
        setVerificationStatus('verified');
        setVerificationMethod('wifi');
      } else {
        setVerificationStatus('failed');
        setVerificationMethod('manual');
      }
    } catch (error) {
      setVerificationStatus('failed');
      setVerificationMethod('manual');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = 'Name is required';
    }

    if (!formData.customerPhone.trim()) {
      newErrors.customerPhone = 'Phone number is required';
    } else if (!/^\(\d{3}\) \d{3}-\d{4}$/.test(formData.customerPhone)) {
      newErrors.customerPhone = 'Please enter a valid phone number';
    }

    if (formData.customerEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.customerEmail)) {
      newErrors.customerEmail = 'Please enter a valid email address';
    }

    if (formData.services.length === 0) {
      newErrors.services = 'Please select at least one service';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const toggleService = (serviceName: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(serviceName)
        ? prev.services.filter(s => s !== serviceName)
        : [...prev.services, serviceName]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Add customer to database
      addCustomer({
        phone: formData.customerPhone,
        name: formData.customerName,
        email: formData.customerEmail || undefined,
        preferredServices: formData.services,
      });

      // Create check-in entry
      const checkin = addCheckin({
        locationId,
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail || undefined,
        customerType: 'regular',
        services: formData.services,
        checkinType: 'in_store',
        status: 'present',
        actualArrivalTime: new Date(),
        verificationMethod,
        coordinates: coordinates ? {
          latitude: coordinates.latitude,
          longitude: coordinates.longitude
        } : undefined,
        notes: formData.notes || undefined,
      });

      // Ensure we have a valid checkin code
      const checkinCode = checkin?.checkinCode || generateCode();
      onSuccess(checkinCode);
    } catch (error) {
      console.error('Failed to submit in-store check-in:', error);
      setErrors({ submit: 'Failed to submit check-in. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!location) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Location not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-6 lg:p-8">
        <div className="text-center mb-8">
          <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <MapPin className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">In-Store Check-In</h2>
          <p className="text-gray-600">You're here! Let's get you checked in</p>
        </div>

        {/* Location Verification Status */}
        <div className={`border rounded-lg p-4 mb-6 ${
          isVerifying ? 'border-yellow-200 bg-yellow-50' :
          verificationStatus === 'verified' ? 'border-green-200 bg-green-50' :
          'border-red-200 bg-red-50'
        }`}>
          <div className="flex items-center space-x-3">
            {isVerifying ? (
              <Loader2 className="w-5 h-5 text-yellow-600 animate-spin" />
            ) : verificationStatus === 'verified' ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600" />
            )}
            
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <h3 className={`font-semibold ${
                  isVerifying ? 'text-yellow-900' :
                  verificationStatus === 'verified' ? 'text-green-900' :
                  'text-red-900'
                }`}>
                  {isVerifying ? 'Verifying Location...' :
                   verificationStatus === 'verified' ? 'Location Verified' :
                   'Manual Verification Required'}
                </h3>
                
                {verificationMethod === 'wifi' && verificationStatus === 'verified' && (
                  <Wifi className="w-4 h-4 text-green-600" />
                )}
              </div>
              
              <p className={`text-sm ${
                isVerifying ? 'text-yellow-700' :
                verificationStatus === 'verified' ? 'text-green-700' :
                'text-red-700'
              }`}>
                {isVerifying ? 'Checking your location and network...' :
                 verificationStatus === 'verified' ? 
                   `Verified via ${verificationMethod === 'geolocation' ? 'GPS location' : 'store WiFi network'}` :
                 'Please confirm with staff that you are physically present in the store'}
              </p>
            </div>
          </div>
        </div>

        {/* Location Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-3">
            <MapPin className="w-5 h-5 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">{location.name}</h3>
              <p className="text-sm text-blue-700">{location.address}</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <CustomerAutocomplete
              value={formData.customerPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
              onCustomerSelect={handleCustomerSelect}
              placeholder="(555) 123-4567"
              className={errors.customerPhone ? 'border-red-300 bg-red-50' : ''}
            />
            {errors.customerPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.customerPhone}</p>
            )}
          </div>

          {/* Customer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.customerName ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
            </div>
            {errors.customerName && (
              <p className="mt-1 text-sm text-red-600">{errors.customerName}</p>
            )}
          </div>

          {/* Email (Optional) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.customerEmail ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
              placeholder="your@email.com"
            />
            {errors.customerEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.customerEmail}</p>
            )}
          </div>

          {/* Services */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Services *
            </label>
            <div className={`space-y-3 max-h-64 overflow-y-auto border rounded-lg p-3 ${
              errors.services ? 'border-red-300 bg-red-50' : 'border-gray-200'
            }`}>
              {availableServices.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.services.includes(service.name)
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.name)}
                    onChange={() => toggleService(service.name)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
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
            {errors.services && (
              <p className="mt-1 text-sm text-red-600">{errors.services}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              placeholder="Any special requests or preferences..."
            />
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
              {errors.submit}
            </div>
          )}

          {/* Submit Button */}
          <TouchFriendlyButton
            type="submit"
            disabled={isSubmitting}
            loading={isSubmitting}
            fullWidth
            className="text-lg py-4"
            variant="secondary"
          >
            {isSubmitting ? 'Processing...' : 'Complete Check-In'}
          </TouchFriendlyButton>
        </form>

        {/* Benefits */}
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-semibold text-blue-900 mb-2">In-Store Check-In Benefits:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Immediate queue entry</li>
            <li>• Real-time wait time updates</li>
            <li>• Priority for walk-in availability</li>
            <li>• Direct staff assistance</li>
          </ul>
        </div>
      </div>
    </div>
  );
}