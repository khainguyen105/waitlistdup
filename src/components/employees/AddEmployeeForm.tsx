import React, { useState } from 'react';
import { X, User } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { Employee } from '../../types';


interface AddEmployeeFormProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

export function AddEmployeeForm({ isOpen, onClose, locationId }: AddEmployeeFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialties: [] as string[],
  });

  const { addEmployee } = useLocationStore(); // Ensure addEmployee is awaited

  const availableSpecialties = [
    'haircut',
    'styling',
    'coloring',
    'beard_trim',
    'manicure',
    'pedicure',
    'facial',
    'massage',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const defaultSchedule = {
      monday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' as const }] },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' as const }] },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' as const }] },
      thursday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' as const }] },
      friday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' as const }] },
      saturday: { isWorking: false, startTime: '09:00', endTime: '17:00', breakTimes: [] },
      sunday: { isWorking: false, startTime: '09:00', endTime: '17:00', breakTimes: [] },
    };
    const defaultAvailability = { status: 'active' as const, lastStatusChange: new Date(), currentCustomerId: undefined, estimatedAvailableTime: undefined, notes: undefined };
    const defaultQueueSettings = { maxQueueSize: 5, acceptNewCustomers: true, turnSharingEnabled: false, turnSharingPartners: [], priorityHandling: 'flexible' as const, breakSchedule: [] };

    await addEmployee({
      locationId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      specialties: formData.specialties,
      serviceIds: [], // Default empty array for serviceIds
      skillLevel: {}, // Default empty object for skillLevel
      schedule: defaultSchedule,
      performance: {
        averageServiceTime: 30,
        customersServed: 0,
        customerRating: 5.0,
        lastUpdated: new Date(),
      },
      availability: defaultAvailability, // Pass default availability
      queueSettings: defaultQueueSettings, // Pass default queue settings
      isActive: true,
    });

    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialties: [],
    });
    
    onClose();
  };

  const toggleSpecialty = (specialty: string) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialty)
        ? prev.specialties.filter(s => s !== specialty)
        : [...prev.specialties, specialty]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Add Employee</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              First Name *
            </label>
            <input
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Last Name *
            </label>
            <input
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Specialties
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableSpecialties.map((specialty) => (
                <label key={specialty} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.specialties.includes(specialty)}
                    onChange={() => toggleSpecialty(specialty)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {specialty.replace('_', ' ')}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!formData.firstName || !formData.lastName || !formData.email || !formData.phone}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Employee
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}