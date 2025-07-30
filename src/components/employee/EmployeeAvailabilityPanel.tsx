import React, { useState } from 'react';
import { User, Clock, Coffee, AlertCircle, CheckCircle, XCircle, Settings } from 'lucide-react';
import { useEmployeeStore } from '../../stores/employeeStore';
import { useLocationStore } from '../../stores/locationStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { ResponsiveGrid } from '../common/ResponsiveGrid';
import { Employee, EmployeeAvailability } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export function EmployeeAvailabilityPanel() {
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { 
    employees, 
    updateEmployeeAvailability, 
    updateEmployeeQueueSettings,
    getEmployeeWorkload,
    selectedLocationId 
  } = useEmployeeStore();

  const { selectedLocation } = useLocationStore();

  const locationEmployees = employees.filter(emp => 
    emp.locationId === selectedLocationId && emp.isActive
  );

  const getStatusColor = (status: EmployeeAvailability['status']) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'break': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'busy': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: EmployeeAvailability['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'inactive': return <XCircle className="w-4 h-4" />;
      case 'break': return <Coffee className="w-4 h-4" />;
      case 'busy': return <AlertCircle className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const handleStatusChange = (employeeId: string, status: EmployeeAvailability['status']) => {
    updateEmployeeAvailability(employeeId, { status });
  };

  const handleQueueSettingsChange = (employeeId: string, setting: string, value: any) => {
    const employee = employees.find(emp => emp.id === employeeId);
    if (!employee) return;

    updateEmployeeQueueSettings(employeeId, {
      ...employee.queueSettings,
      [setting]: value,
    });
  };

  const renderEmployeeCard = (employee: Employee) => {
    const workload = getEmployeeWorkload(employee.id);
    const utilizationPercentage = (workload / employee.queueSettings.maxQueueSize) * 100;

    return (
      <div key={employee.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
              <span className="text-blue-600 font-medium text-sm">
                {employee.firstName[0]}{employee.lastName[0]}
              </span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {employee.firstName} {employee.lastName}
              </h3>
              <p className="text-sm text-gray-600">{employee.email}</p>
            </div>
          </div>
          
          <button
            onClick={() => {
              setSelectedEmployee(employee);
              setShowSettings(true);
            }}
            className="text-gray-400 hover:text-gray-600 p-1 rounded"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>

        {/* Status */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Status</span>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border flex items-center space-x-1', getStatusColor(employee.availability.status))}>
              {getStatusIcon(employee.availability.status)}
              <span className="capitalize">{employee.availability.status}</span>
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <TouchFriendlyButton
              size="sm"
              variant={employee.availability.status === 'active' ? 'primary' : 'outline'}
              onClick={() => handleStatusChange(employee.id, 'active')}
              fullWidth
            >
              Active
            </TouchFriendlyButton>
            <TouchFriendlyButton
              size="sm"
              variant={employee.availability.status === 'break' ? 'secondary' : 'outline'}
              onClick={() => handleStatusChange(employee.id, 'break')}
              fullWidth
            >
              Break
            </TouchFriendlyButton>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            <TouchFriendlyButton
              size="sm"
              variant={employee.availability.status === 'busy' ? 'danger' : 'outline'}
              onClick={() => handleStatusChange(employee.id, 'busy')}
              fullWidth
            >
              Busy
            </TouchFriendlyButton>
            <TouchFriendlyButton
              size="sm"
              variant={employee.availability.status === 'inactive' ? 'ghost' : 'outline'}
              onClick={() => handleStatusChange(employee.id, 'inactive')}
              fullWidth
            >
              Inactive
            </TouchFriendlyButton>
          </div>
        </div>

        {/* Queue Info */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Current Queue</span>
            <span className="font-medium text-gray-900">
              {workload} / {employee.queueSettings.maxQueueSize}
            </span>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={cn('h-2 rounded-full transition-all', 
                utilizationPercentage > 90 ? 'bg-red-500' :
                utilizationPercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
              )}
              style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Accepting New</span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employee.queueSettings.acceptNewCustomers}
                onChange={(e) => handleQueueSettingsChange(employee.id, 'acceptNewCustomers', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Turn Sharing</span>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={employee.queueSettings.turnSharingEnabled}
                onChange={(e) => handleQueueSettingsChange(employee.id, 'turnSharingEnabled', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Rating</span>
            <span className="font-medium text-gray-900">
              {employee.performance.customerRating.toFixed(1)} ⭐
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Efficiency</span>
            <span className="font-medium text-gray-900">
              {employee.performance.efficiency}%
            </span>
          </div>
        </div>

        {/* Specialties */}
        {employee.specialties.length > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
            <div className="flex flex-wrap gap-1">
              {employee.specialties.map((specialty, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {specialty}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Last Status Change */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Status changed {format(employee.availability.lastStatusChange, 'h:mm a')}
          </p>
          {employee.availability.notes && (
            <p className="text-xs text-gray-600 mt-1">{employee.availability.notes}</p>
          )}
        </div>
      </div>
    );
  };

  if (!selectedLocation) {
    return (
      <div className="text-center py-8">
        <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Selected</h3>
        <p className="text-gray-600">Select a location to manage employee availability</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Availability</h2>
          <p className="text-gray-600">Manage staff status and queue settings</p>
        </div>
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span>Active ({locationEmployees.filter(emp => emp.availability.status === 'active').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <span>Break ({locationEmployees.filter(emp => emp.availability.status === 'break').length})</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span>Busy ({locationEmployees.filter(emp => emp.availability.status === 'busy').length})</span>
          </div>
        </div>
      </div>

      {locationEmployees.length === 0 ? (
        <div className="text-center py-12">
          <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Employees Found</h3>
          <p className="text-gray-600">Add employees to this location to manage their availability</p>
        </div>
      ) : (
        <ResponsiveGrid cols={{ default: 1, md: 2, lg: 3 }}>
          {locationEmployees.map(renderEmployeeCard)}
        </ResponsiveGrid>
      )}

      {/* Employee Settings Modal */}
      {showSettings && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  Queue Settings - {selectedEmployee.firstName} {selectedEmployee.lastName}
                </h3>
                <button
                  onClick={() => {
                    setShowSettings(false);
                    setSelectedEmployee(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Queue Size
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={selectedEmployee.queueSettings.maxQueueSize}
                  onChange={(e) => handleQueueSettingsChange(selectedEmployee.id, 'maxQueueSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority Handling
                </label>
                <select
                  value={selectedEmployee.queueSettings.priorityHandling}
                  onChange={(e) => handleQueueSettingsChange(selectedEmployee.id, 'priorityHandling', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="strict">Strict Priority</option>
                  <option value="flexible">Flexible Priority</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Turn Sharing Partners
                </label>
                <div className="space-y-2">
                  {locationEmployees
                    .filter(emp => emp.id !== selectedEmployee.id)
                    .map((employee) => (
                      <label key={employee.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedEmployee.queueSettings.turnSharingPartners.includes(employee.id)}
                          onChange={(e) => {
                            const partners = e.target.checked
                              ? [...selectedEmployee.queueSettings.turnSharingPartners, employee.id]
                              : selectedEmployee.queueSettings.turnSharingPartners.filter(id => id !== employee.id);
                            handleQueueSettingsChange(selectedEmployee.id, 'turnSharingPartners', partners);
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          {employee.firstName} {employee.lastName}
                        </span>
                      </label>
                    ))}
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <TouchFriendlyButton
                  variant="outline"
                  fullWidth
                  onClick={() => {
                    setShowSettings(false);
                    setSelectedEmployee(null);
                  }}
                >
                  Close
                </TouchFriendlyButton>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}