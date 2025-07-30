import React, { useState } from 'react';
import { Plus, X, User } from 'lucide-react';
import { useQueueStore } from '../../stores/queueStore';
import { useLocationStore } from '../../stores/locationStore';
import { useCustomerStore } from '../../stores/customerStore';
import { CustomerAutocomplete } from '../customers/CustomerAutocomplete';
import { QueueEntry } from '../../types';

interface AddToQueueFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddToQueueForm({ isOpen, onClose }: AddToQueueFormProps) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    customerType: 'regular' as QueueEntry['customerType'],
    services: [] as string[],
    serviceIds: [] as string[],
    assignedEmployeeId: '',
    priority: 'normal' as QueueEntry['priority'],
    specialRequests: '',
  });

  const { addToQueue, selectedLocationId, refreshQueue, updateStats } = useQueueStore();
  const { 
    getServicesForLocation, 
    getEmployeesForLocation, 
    getAvailableEmployeeForServices,
    selectedLocation 
  } = useLocationStore();
  const { addCustomer } = useCustomerStore();

  const availableServices = selectedLocationId ? getServicesForLocation(selectedLocationId) : [];
  const availableEmployees = selectedLocationId ? getEmployeesForLocation(selectedLocationId) : [];
  const autoAssignEnabled = selectedLocation?.settings.autoAssignEmployees || false;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedLocationId || formData.services.length === 0) return;

    const estimatedDuration = formData.serviceIds.reduce((total, serviceId) => {
      const service = availableServices.find(s => s.id === serviceId);
      return total + (service?.estimatedDuration || 30);
    }, 0);

    // Auto-assign employee if enabled and no manual assignment
    let assignedEmployeeId = formData.assignedEmployeeId;
    let assignedEmployeeName = '';
    let assignmentMethod: 'manual' | 'auto' | 'preferred' = 'manual';

    if (!assignedEmployeeId && autoAssignEnabled) {
      const autoAssignedEmployee = getAvailableEmployeeForServices(selectedLocationId, formData.serviceIds);
      if (autoAssignedEmployee) {
        assignedEmployeeId = autoAssignedEmployee.id;
        assignedEmployeeName = `${autoAssignedEmployee.firstName} ${autoAssignedEmployee.lastName}`;
        assignmentMethod = 'auto';
      }
    } else if (assignedEmployeeId) {
      const employee = availableEmployees.find(emp => emp.id === assignedEmployeeId);
      if (employee) {
        assignedEmployeeName = `${employee.firstName} ${employee.lastName}`;
        assignmentMethod = 'manual';
      }
    }

    // Add customer to database if new
    addCustomer({
      phone: formData.customerPhone,
      name: formData.customerName,
      email: formData.customerEmail || undefined,
      preferredServices: formData.services,
    });

    // Create queue entry
    const newEntry = addToQueue({
      locationId: selectedLocationId,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      customerEmail: formData.customerEmail || undefined,
      customerType: formData.customerType,
      services: formData.services,
      serviceIds: formData.serviceIds,
      assignedEmployeeId: assignedEmployeeId || undefined,
      assignedEmployeeName: assignedEmployeeName || undefined,
      assignmentMethod,
      priority: formData.priority,
      status: 'waiting',
      estimatedWaitTime: estimatedDuration,
      specialRequests: formData.specialRequests || undefined,
      notifications: [],
    });

    // Immediate refresh
    setTimeout(() => {
      refreshQueue();
      updateStats();
    }, 100);

    // Reset form
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      customerType: 'regular',
      services: [],
      serviceIds: [],
      assignedEmployeeId: '',
      priority: 'normal',
      specialRequests: '',
    });
    
    onClose();
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

  const toggleService = (serviceName: string, serviceId: string) => {
    setFormData(prev => {
      const isSelected = prev.services.includes(serviceName);
      return {
        ...prev,
        services: isSelected
          ? prev.services.filter(s => s !== serviceName)
          : [...prev.services, serviceName],
        serviceIds: isSelected
          ? prev.serviceIds.filter(id => id !== serviceId)
          : [...prev.serviceIds, serviceId]
      };
    });
  };

  // Filter employees based on selected services
  const getQualifiedEmployees = () => {
    if (formData.serviceIds.length === 0) return availableEmployees;
    
    return availableEmployees.filter(employee => {
      return formData.serviceIds.every(serviceId => {
        const service = availableServices.find(s => s.id === serviceId);
        if (!service) return false;
        
        // Check if employee is assigned to this service
        return service.assignedEmployeeIds.includes(employee.id);
      });
    });
  };

  const qualifiedEmployees = getQualifiedEmployees();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <Plus className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add to Queue</h2>
            </div>
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
              Phone Number *
            </label>
            <CustomerAutocomplete
              value={formData.customerPhone}
              onChange={(value) => setFormData(prev => ({ ...prev, customerPhone: value }))}
              onCustomerSelect={handleCustomerSelect}
              placeholder="(555) 123-4567"
            />
            <p className="text-xs text-gray-500 mt-1">Start typing to search existing customers</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Name *
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData(prev => ({ ...prev, customerName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              value={formData.customerEmail}
              onChange={(e) => setFormData(prev => ({ ...prev, customerEmail: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Customer Type
            </label>
            <select
              value={formData.customerType}
              onChange={(e) => setFormData(prev => ({ ...prev, customerType: e.target.value as QueueEntry['customerType'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="new">New Customer</option>
              <option value="regular">Regular Customer</option>
              <option value="vip">VIP Customer</option>
              <option value="appointment">Appointment</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services *
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableServices.map((service) => (
                <label key={service.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.services.includes(service.name)}
                    onChange={() => toggleService(service.name, service.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 flex-1">
                    {service.name} ({service.estimatedDuration} min)
                    {service.price && <span className="text-green-600 ml-1">${service.price}</span>}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <div className="flex items-center justify-between">
                <span>Assign Employee</span>
                {autoAssignEnabled && (
                  <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    Auto-assign enabled
                  </span>
                )}
              </div>
            </label>
            <select
              value={formData.assignedEmployeeId}
              onChange={(e) => setFormData(prev => ({ ...prev, assignedEmployeeId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">
                {autoAssignEnabled ? 'Auto-assign based on services' : 'No specific employee'}
              </option>
              {qualifiedEmployees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.firstName} {employee.lastName}
                  {employee.specialties.length > 0 && (
                    ` (${employee.specialties.join(', ')})`
                  )}
                  {` - Rating: ${employee.performance.customerRating.toFixed(1)}`}
                </option>
              ))}
            </select>
            {formData.serviceIds.length > 0 && qualifiedEmployees.length === 0 && (
              <p className="text-xs text-red-600 mt-1">
                No employees are qualified for the selected services
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as QueueEntry['priority'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Special Requests (Optional)
            </label>
            <textarea
              value={formData.specialRequests}
              onChange={(e) => setFormData(prev => ({ ...prev, specialRequests: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Any special requirements or notes..."
            />
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
              disabled={!formData.customerName || !formData.customerPhone || formData.services.length === 0}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add to Queue
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}