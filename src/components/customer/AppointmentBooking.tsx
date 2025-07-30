import React, { useState } from 'react';
import { Calendar, Clock, User, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { format, addDays, startOfWeek, isSameDay, isAfter, isBefore } from 'date-fns';

interface AppointmentBookingProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  onBookingComplete: (appointmentDetails: any) => void;
}

export function AppointmentBooking({
  isOpen,
  onClose,
  locationId,
  customerName,
  customerPhone,
  customerEmail,
  onBookingComplete
}: AppointmentBookingProps) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { getServicesForLocation, locations } = useLocationStore();
  
  const location = locations.find(loc => loc.id === locationId);
  const availableServices = getServicesForLocation(locationId);

  // Generate available time slots
  const generateTimeSlots = (date: Date) => {
    if (!location) return [];
    
    const dayName = format(date, 'EEEE').toLowerCase();
    const businessHours = location.settings.businessHours[dayName];
    
    if (!businessHours?.isOpen) return [];
    
    const slots = [];
    const [openHour, openMinute] = businessHours.openTime.split(':').map(Number);
    const [closeHour, closeMinute] = businessHours.closeTime.split(':').map(Number);
    
    let currentHour = openHour;
    let currentMinute = openMinute;
    
    while (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)) {
      const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      // Skip if it's in the past for today
      const slotDateTime = new Date(date);
      slotDateTime.setHours(currentHour, currentMinute, 0, 0);
      
      if (isAfter(slotDateTime, new Date())) {
        slots.push(timeString);
      }
      
      // Increment by 30 minutes
      currentMinute += 30;
      if (currentMinute >= 60) {
        currentMinute = 0;
        currentHour += 1;
      }
    }
    
    return slots;
  };

  const getWeekDays = () => {
    const start = startOfWeek(currentWeek);
    const days = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(start, i);
      // Only show future dates
      if (isAfter(day, new Date()) || isSameDay(day, new Date())) {
        days.push(day);
      }
    }
    
    return days;
  };

  const toggleService = (serviceName: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceName)
        ? prev.filter(s => s !== serviceName)
        : [...prev, serviceName]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime || selectedServices.length === 0) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const appointmentDetails = {
      date: selectedDate,
      time: selectedTime,
      services: selectedServices,
      customerName,
      customerPhone,
      customerEmail,
      locationId,
      estimatedDuration: selectedServices.reduce((total, serviceName) => {
        const service = availableServices.find(s => s.name === serviceName);
        return total + (service?.estimatedDuration || 30);
      }, 0)
    };

    onBookingComplete(appointmentDetails);
    setIsSubmitting(false);
    onClose();
  };

  const weekDays = getWeekDays();
  const availableTimeSlots = selectedDate ? generateTimeSlots(selectedDate) : [];

  if (!isOpen || !location) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Book Your Next Appointment</h2>
                <p className="text-sm text-gray-600">{location.name}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Customer Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-2 mb-2">
              <User className="w-4 h-4 text-gray-600" />
              <span className="font-medium text-gray-900">Booking for:</span>
            </div>
            <p className="text-gray-700">{customerName}</p>
            <p className="text-sm text-gray-600">{customerPhone}</p>
            {customerEmail && <p className="text-sm text-gray-600">{customerEmail}</p>}
          </div>

          {/* Service Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Services *
            </label>
            <div className="space-y-3 max-h-48 overflow-y-auto">
              {availableServices.map((service) => (
                <label
                  key={service.id}
                  className={`flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedServices.includes(service.name)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedServices.includes(service.name)}
                    onChange={() => toggleService(service.name)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900">{service.name}</span>
                      <div className="flex items-center space-x-3 text-sm text-gray-600">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
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
          </div>

          {/* Date Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Date *
            </label>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="font-semibold text-gray-900">
                  {format(currentWeek, 'MMMM yyyy')}
                </h3>
                <button
                  type="button"
                  onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
                  className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid grid-cols-7 gap-2">
                {weekDays.map((day) => {
                  const dayName = format(day, 'EEEE').toLowerCase();
                  const businessHours = location.settings.businessHours[dayName];
                  const isAvailable = businessHours?.isOpen;
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  
                  return (
                    <button
                      key={day.toISOString()}
                      type="button"
                      onClick={() => isAvailable ? setSelectedDate(day) : null}
                      disabled={!isAvailable}
                      className={`p-3 text-center rounded-lg transition-colors ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : isAvailable
                          ? 'bg-white hover:bg-blue-50 border border-gray-200'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-xs font-medium">
                        {format(day, 'EEE')}
                      </div>
                      <div className="text-sm font-bold">
                        {format(day, 'd')}
                      </div>
                      {!isAvailable && (
                        <div className="text-xs">Closed</div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Time Selection */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Time *
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableTimeSlots.map((time) => (
                  <button
                    key={time}
                    type="button"
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 text-center rounded-lg border transition-colors ${
                      selectedTime === time
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white hover:bg-blue-50 border-gray-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
              {availableTimeSlots.length === 0 && (
                <p className="text-gray-500 text-center py-4">
                  No available time slots for this date
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedDate && selectedTime && selectedServices.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Appointment Summary</h4>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Date:</strong> {format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Services:</strong> {selectedServices.join(', ')}</p>
                <p><strong>Duration:</strong> ~{selectedServices.reduce((total, serviceName) => {
                  const service = availableServices.find(s => s.name === serviceName);
                  return total + (service?.estimatedDuration || 30);
                }, 0)} minutes</p>
              </div>
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedDate || !selectedTime || selectedServices.length === 0 || isSubmitting}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Booking...' : 'Book Appointment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}