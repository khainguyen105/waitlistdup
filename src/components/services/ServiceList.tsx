import React, { useState } from 'react';
import { Plus, Edit2, Clock, DollarSign, Tag, Trash2, Settings, Users, Star } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { AddServiceForm } from './AddServiceForm';
import { AddServiceCategoryForm } from './AddServiceCategoryForm';
import { ServiceEmployeeAssignment } from './ServiceEmployeeAssignment';
import { Service } from '../../types';

export function ServiceList() {
  const { 
    selectedLocation, 
    getServicesForLocation, 
    getCategoriesForLocation,
    getEmployeesForService,
    updateServiceCategory,
    deleteServiceCategory 
  } = useLocationStore();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showEmployeeAssignment, setShowEmployeeAssignment] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [managingCategories, setManagingCategories] = useState(false);

  const services = selectedLocation ? getServicesForLocation(selectedLocation.id) : [];
  const categories = selectedLocation ? getCategoriesForLocation(selectedLocation.id) : [];

  // Group services by category
  const servicesByCategory = categories.reduce((acc, category) => {
    acc[category.id] = services.filter(service => service.categoryId === category.id);
    return acc;
  }, {} as Record<string, typeof services>);

  // Services without a category
  const uncategorizedServices = services.filter(service => !service.categoryId);

  const handleDeleteCategory = (categoryId: string) => {
    if (window.confirm('Are you sure you want to delete this category? Services in this category will become uncategorized.')) {
      deleteServiceCategory(categoryId);
    }
  };

  const handleManageEmployees = (service: Service) => {
    setSelectedService(service);
    setShowEmployeeAssignment(true);
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderCategoryHeader = (category: any, serviceCount: number) => (
    <div className="flex items-center justify-between p-4 bg-gray-50 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <div 
          className="w-4 h-4 rounded-full" 
          style={{ backgroundColor: category.color }}
        />
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
          {category.description && (
            <p className="text-sm text-gray-600">{category.description}</p>
          )}
        </div>
        <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
          {serviceCount} {serviceCount === 1 ? 'service' : 'services'}
        </span>
      </div>
      
      {managingCategories && (
        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleDeleteCategory(category.id)}
            className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
            title="Delete category"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );

  const renderService = (service: Service) => {
    const assignedEmployees = getEmployeesForService(service.id);
    
    return (
      <div key={service.id} className="bg-white border border-gray-200 p-6 rounded-lg">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <h4 className="font-semibold text-gray-900">{service.name}</h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(service.skillLevelRequired)}`}>
                {service.skillLevelRequired}
              </span>
            </div>
            <p className="text-sm text-gray-600 mb-3">{service.description}</p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={() => handleManageEmployees(service)}
              className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
              title="Manage employees"
            >
              <Users className="w-5 h-5" />
            </button>
            <button className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
              <Edit2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-blue-500" />
              <span className="text-sm text-gray-600">Duration</span>
            </div>
            <span className="font-medium text-gray-900">{service.estimatedDuration} min</span>
          </div>

          {service.price && (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-sm text-gray-600">Price</span>
              </div>
              <span className="font-medium text-gray-900">${service.price}</span>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="w-4 h-4 text-purple-500" />
              <span className="text-sm text-gray-600">Assigned Staff</span>
            </div>
            <span className="font-medium text-gray-900">{assignedEmployees.length}</span>
          </div>

          {service.requirements.length > 0 && (
            <div>
              <div className="flex items-center space-x-2 mb-2">
                <Tag className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium text-gray-700">Requirements</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {service.requirements.map((req: string, index: number) => (
                  <span key={index} className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs">
                    {req.replace('_', ' ')}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Assigned Employees */}
        {assignedEmployees.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Assigned Employees:</h5>
            <div className="space-y-2">
              {assignedEmployees.slice(0, 3).map((employee) => (
                <div key={employee.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-blue-600 text-xs font-medium">
                        {employee.firstName[0]}{employee.lastName[0]}
                      </span>
                    </div>
                    <span className="text-gray-900">{employee.firstName} {employee.lastName}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getSkillLevelColor(employee.skillLevel[service.id] || 'beginner')}`}>
                      {employee.skillLevel[service.id] || 'beginner'}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-3 h-3 text-yellow-500" />
                      <span className="text-xs text-gray-600">{employee.performance.customerRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
              {assignedEmployees.length > 3 && (
                <div className="text-xs text-gray-500 text-center">
                  +{assignedEmployees.length - 3} more employees
                </div>
              )}
            </div>
          </div>
        )}

        {/* Auto-assignment Rules */}
        <div className="border-t border-gray-200 pt-4 mt-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">Auto-assignment Rules:</h5>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className={`p-2 rounded ${service.autoAssignmentRules.requireSpecialty ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
              Require Specialty: {service.autoAssignmentRules.requireSpecialty ? 'Yes' : 'No'}
            </div>
            <div className={`p-2 rounded ${service.autoAssignmentRules.considerWorkload ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
              Consider Workload: {service.autoAssignmentRules.considerWorkload ? 'Yes' : 'No'}
            </div>
            <div className={`p-2 rounded ${service.autoAssignmentRules.considerRating ? 'bg-green-50 text-green-700' : 'bg-gray-50 text-gray-600'}`}>
              Consider Rating: {service.autoAssignmentRules.considerRating ? 'Yes' : 'No'}
            </div>
            <div className={`p-2 rounded ${service.autoAssignmentRules.fallbackToAnyEmployee ? 'bg-yellow-50 text-yellow-700' : 'bg-gray-50 text-gray-600'}`}>
              Fallback: {service.autoAssignmentRules.fallbackToAnyEmployee ? 'Any Employee' : 'Strict'}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Services</h2>
          <p className="text-gray-600">
            {selectedLocation ? `Managing ${selectedLocation.name}` : 'Select a location'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setManagingCategories(!managingCategories)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              managingCategories 
                ? 'bg-gray-600 hover:bg-gray-700 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span>{managingCategories ? 'Done Managing' : 'Manage Categories'}</span>
          </button>
          <button
            onClick={() => setShowAddCategoryForm(true)}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Category</span>
          </button>
          <button
            onClick={() => setShowAddForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Service</span>
          </button>
        </div>
      </div>

      {/* Categories with Services */}
      {categories.map((category) => {
        const categoryServices = servicesByCategory[category.id] || [];
        
        return (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {renderCategoryHeader(category, categoryServices.length)}
            
            {categoryServices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
                {categoryServices.map(renderService)}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Tag className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No services in this category yet</p>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium mt-2"
                >
                  Add the first service
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* Uncategorized Services */}
      {uncategorizedServices.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-4 h-4 rounded-full bg-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Uncategorized</h3>
              <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded-full text-xs font-medium">
                {uncategorizedServices.length} {uncategorizedServices.length === 1 ? 'service' : 'services'}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {uncategorizedServices.map(renderService)}
          </div>
        </div>
      )}

      {/* Empty State */}
      {services.length === 0 && (
        <div className="text-center py-12">
          <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No services found</h3>
          <p className="text-gray-600 mb-4">
            {selectedLocation 
              ? 'Add your first service to start accepting customers'
              : 'Select a location to view and manage services'
            }
          </p>
          {selectedLocation && (
            <div className="flex justify-center space-x-3">
              <button
                onClick={() => setShowAddCategoryForm(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Create Category First
              </button>
              <button
                onClick={() => setShowAddForm(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
              >
                Add First Service
              </button>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      {selectedLocation && (
        <>
          <AddServiceForm 
            isOpen={showAddForm} 
            onClose={() => setShowAddForm(false)}
            locationId={selectedLocation.id}
          />
          <AddServiceCategoryForm 
            isOpen={showAddCategoryForm} 
            onClose={() => setShowAddCategoryForm(false)}
            locationId={selectedLocation.id}
          />
          {selectedService && (
            <ServiceEmployeeAssignment
              isOpen={showEmployeeAssignment}
              onClose={() => {
                setShowEmployeeAssignment(false);
                setSelectedService(null);
              }}
              service={selectedService}
            />
          )}
        </>
      )}
    </div>
  );
}