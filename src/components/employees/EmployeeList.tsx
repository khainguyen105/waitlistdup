import React, { useState } from 'react';
import { Plus, Edit2, Star, Clock, Users } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { AddEmployeeForm } from './AddEmployeeForm';
import { Employee } from '../../types';

export function EmployeeList() {
  const { selectedLocation, getEmployeesForLocation } = useLocationStore();
  const [showAddForm, setShowAddForm] = useState(false);

  const employees = selectedLocation ? getEmployeesForLocation(selectedLocation.id) : [];

  const formatSchedule = (employee: Employee) => {
    const workingDays = Object.entries(employee.schedule)
      .filter(([_, schedule]) => schedule.isWorking)
      .map(([day, _]) => day.charAt(0).toUpperCase() + day.slice(1, 3))
      .join(', ');
    
    return workingDays || 'No schedule set';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
          <p className="text-gray-600">
            {selectedLocation ? `Managing ${selectedLocation.name}` : 'Select a location'}
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          <span>Add Employee</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {employees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {employee.firstName} {employee.lastName}
                  </h3>
                  <p className="text-sm text-gray-600">{employee.email}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600">
                <Edit2 className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Specialties</p>
                <div className="flex flex-wrap gap-1">
                  {employee.specialties.map((specialty, index) => (
                    <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                      {specialty}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Schedule</p>
                <p className="text-sm text-gray-600">{formatSchedule(employee)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-3 border-t border-gray-200">
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm font-medium text-gray-700">Rating</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {employee.performance.customerRating.toFixed(1)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center space-x-1 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium text-gray-700">Avg Time</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {employee.performance.averageServiceTime}m
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-sm text-gray-600">
                  Served {employee.performance.customersServed} customers
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {employees.length === 0 && (
        <div className="text-center py-12">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-4">
            {selectedLocation 
              ? 'Add your first employee to get started with queue management'
              : 'Select a location to view and manage employees'
            }
          </p>
          {selectedLocation && (
            <button
              onClick={() => setShowAddForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Add First Employee
            </button>
          )}
        </div>
      )}

      {selectedLocation && (
        <AddEmployeeForm 
          isOpen={showAddForm} 
          onClose={() => setShowAddForm(false)}
          locationId={selectedLocation.id}
        />
      )}
    </div>
  );
}