import React, { useState } from 'react';
import { Clock, MapPin, Phone, User, Loader2, CheckCircle } from 'lucide-react';
import { useCheckinStore } from '../../stores/checkinStore';
import { useLocationStore } from '../../stores/locationStore';
import { useCustomerStore } from '../../stores/customerStore';
import { CustomerAutocomplete } from '../customers/CustomerAutocomplete';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface RemoteCheckinFormProps {
  locationId: string;
  onSuccess: (checkinCode: string) => void;
}

export function RemoteCheckinForm({ locationId, onSuccess }: RemoteCheckinFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    services: [] as string[],
    estimatedArrivalTime: '',
    notes: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { addCheckin } = useCheckinStore();
  const { getServicesForLocation, locations } = useLocationStore();
  const { addCustomer } = useCustomerStore();

  const location = locations.find(loc => loc.id === locationId);
  const availableServices = getServicesForLocation(locationId);

  // Generate time slots for the next 4 hours
  const generateTimeSlots = () => {
    const slots = [];
    const now = new Date();
    const currentMinutes = now.getMinutes();
    const roundedMinutes = Math.ceil(currentMinutes / 15) * 15;
    
    let startTime = new Date(now);
    startTime.setMinutes(roundedMinutes, 0, 0);
    
    // If rounded time is in the past, start from next 15-minute interval
    if (startTime <= now) {
      startTime.setMinutes(startTime.getMinutes() + 15);
    }

    for (let i = 0; i < 16; i++) { // 4 hours in 15-minute intervals
      const time = new Date(startTime.getTime() + i * 15 * 60 * 1000);
      slots.push({
        value: time.toISOString(),
        label: time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        display: `${time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (${Math.round((time.getTime() - now.getTime()) / (1000 * 60))} min)`
      });
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

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

    if (!formData.estimatedArrivalTime) {
      newErrors.estimatedArrivalTime = 'Please select your estimated arrival time';
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
      await new Promise(resolve => setTimeout(resolve, 1500));

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
        services: formData.services,
        checkinType: 'remote',
        status: 'en_route',
        estimatedArrivalTime: new Date(formData.estimatedArrivalTime),
        notes: formData.notes || undefined,
      });

      // Simulate sending SMS confirmation
      console.log(`SMS sent to ${formData.customerPhone}: Your check-in code is ${checkin.checkinCode}. Estimated arrival: ${new Date(formData.estimatedArrivalTime).toLocaleTimeString()}`);

      onSuccess(checkin.checkinCode);
    } catch (error) {
      console.error('Failed to submit remote check-in:', error);
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
          <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Pre-Check-In</h2>
          <p className="text-gray-600">Reserve your spot and arrive when it's convenient</p>
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
            <p className="text-xs text-gray-500 mt-1">We'll text you updates about your check-in</p>
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
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.name)}
                    onChange={() => toggleService(service.name)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
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
            {errors.services && (
              <p className="mt-1 text-sm text-red-600">{errors.services}</p>
            )}
          </div>

          {/* Estimated Arrival Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estimated Arrival Time *
            </label>
            <select
              value={formData.estimatedArrivalTime}
              onChange={(e) => setFormData(prev => ({ ...prev, estimatedArrivalTime: e.target.value }))}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.estimatedArrivalTime ? 'border-red-300 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select your arrival time</option>
              {timeSlots.map((slot) => (
                <option key={slot.value} value={slot.value}>
                  {slot.display}
                </option>
              ))}
            </select>
            {errors.estimatedArrivalTime && (
              <p className="mt-1 text-sm text-red-600">{errors.estimatedArrivalTime}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              We'll prepare for your arrival and notify you of any changes
            </p>
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
          >
            {isSubmitting ? 'Processing...' : 'Complete Pre-Check-In'}
          </TouchFriendlyButton>
        </form>

        {/* Benefits */}
        <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
          <h4 className="font-semibold text-green-900 mb-2">Pre-Check-In Benefits:</h4>
          <ul className="text-sm text-green-800 space-y-1">
            <li>• Skip the line when you arrive</li>
            <li>• Get real-time updates via SMS</li>
            <li>• Flexible arrival within your time window</li>
            <li>• Priority service preparation</li>
          </ul>
        </div>
      </div>
    </div>
  );
}