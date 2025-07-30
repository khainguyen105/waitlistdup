import React, { useState } from 'react';
import { X, Tag, Plus, Users } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';

interface AddServiceFormProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

export function AddServiceForm({ isOpen, onClose, locationId }: AddServiceFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categoryId: '',
    estimatedDuration: 30,
    price: '',
    requirements: [] as string[],
    skillLevelRequired: 'intermediate' as 'beginner' | 'intermediate' | 'expert',
    assignedEmployeeIds: [] as string[],
    autoAssignmentRules: {
      requireSpecialty: true,
      considerWorkload: true,
      considerRating: true,
      fallbackToAnyEmployee: false,
    },
  });
  const [showNewCategoryForm, setShowNewCategoryForm] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  const { 
    addService, 
    getCategoriesForLocation, 
    getEmployeesForLocation,
    addServiceCategory 
  } = useLocationStore();

  const categories = getCategoriesForLocation(locationId);
  const employees = getEmployeesForLocation(locationId);

  const availableRequirements = [
    'consultation',
    'patch_test',
    'appointment_only',
    'id_required',
    'payment_upfront',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get category name for backward compatibility
    const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
    const categoryName = selectedCategory?.name || 'Other';

    addService({
      locationId,
      name: formData.name,
      description: formData.description,
      categoryId: formData.categoryId || undefined,
      category: categoryName,
      estimatedDuration: formData.estimatedDuration,
      price: formData.price ? parseFloat(formData.price) : undefined,
      requirements: formData.requirements,
      skillLevelRequired: formData.skillLevelRequired,
      assignedEmployeeIds: formData.assignedEmployeeIds,
      autoAssignmentRules: {
        ...formData.autoAssignmentRules,
        preferredEmployeeIds: formData.assignedEmployeeIds,
      },
      isActive: true,
    });

    setFormData({
      name: '',
      description: '',
      categoryId: '',
      estimatedDuration: 30,
      price: '',
      requirements: [],
      skillLevelRequired: 'intermediate',
      assignedEmployeeIds: [],
      autoAssignmentRules: {
        requireSpecialty: true,
        considerWorkload: true,
        considerRating: true,
        fallbackToAnyEmployee: false,
      },
    });
    
    onClose();
  };

  const handleAddNewCategory = () => {
    if (!newCategoryName.trim()) return;

    const nextSortOrder = Math.max(...categories.map(cat => cat.sortOrder), 0) + 1;
    
    addServiceCategory({
      locationId,
      name: newCategoryName,
      description: '',
      color: '#3B82F6',
      icon: 'tag',
      sortOrder: nextSortOrder,
      isActive: true,
    });

    // Select the new category
    const newCategoryId = Date.now().toString();
    setFormData(prev => ({ ...prev, categoryId: newCategoryId }));
    setNewCategoryName('');
    setShowNewCategoryForm(false);
  };

  const toggleRequirement = (requirement: string) => {
    setFormData(prev => ({
      ...prev,
      requirements: prev.requirements.includes(requirement)
        ? prev.requirements.filter(r => r !== requirement)
        : [...prev.requirements, requirement]
    }));
  };

  const toggleEmployee = (employeeId: string) => {
    setFormData(prev => ({
      ...prev,
      assignedEmployeeIds: prev.assignedEmployeeIds.includes(employeeId)
        ? prev.assignedEmployeeIds.filter(id => id !== employeeId)
        : [...prev.assignedEmployeeIds, employeeId]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Service</h2>
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
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Haircut & Style, Manicure, Facial"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Skill Level Required *
              </label>
              <select
                value={formData.skillLevelRequired}
                onChange={(e) => setFormData(prev => ({ ...prev, skillLevelRequired: e.target.value as any }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="expert">Expert</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of the service..."
            />
          </div>

          {/* Category Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <div className="space-y-3">
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData(prev => ({ ...prev, categoryId: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>

              {!showNewCategoryForm ? (
                <button
                  type="button"
                  onClick={() => setShowNewCategoryForm(true)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create new category</span>
                </button>
              ) : (
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="New category name"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    disabled={!newCategoryName.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewCategoryForm(false);
                      setNewCategoryName('');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Duration and Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estimated Duration (minutes) *
              </label>
              <input
                type="number"
                min="5"
                max="480"
                value={formData.estimatedDuration}
                onChange={(e) => setFormData(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>

          {/* Employee Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4" />
                <span>Assign Employees</span>
              </div>
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-3">
              {employees.map((employee) => (
                <label key={employee.id} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.assignedEmployeeIds.includes(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700">
                        {employee.firstName} {employee.lastName}
                      </span>
                      <div className="flex items-center space-x-2 text-xs text-gray-500">
                        <span>Rating: {employee.performance.customerRating.toFixed(1)}</span>
                        <span>•</span>
                        <span>Workload: {employee.performance.currentWorkload}</span>
                      </div>
                    </div>
                    {employee.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {employee.specialties.map((specialty, index) => (
                          <span key={index} className="bg-gray-100 text-gray-600 px-1 py-0.5 rounded text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </label>
              ))}
            </div>
            {employees.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                No employees available. Add employees to the location first.
              </p>
            )}
          </div>

          {/* Auto-assignment Rules */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Auto-assignment Rules
            </label>
            <div className="space-y-3">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoAssignmentRules.requireSpecialty}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    autoAssignmentRules: {
                      ...prev.autoAssignmentRules,
                      requireSpecialty: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Require matching specialty</span>
                  <p className="text-xs text-gray-500">Only assign employees with relevant specialties</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoAssignmentRules.considerWorkload}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    autoAssignmentRules: {
                      ...prev.autoAssignmentRules,
                      considerWorkload: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Consider current workload</span>
                  <p className="text-xs text-gray-500">Prefer employees with lower current workload</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoAssignmentRules.considerRating}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    autoAssignmentRules: {
                      ...prev.autoAssignmentRules,
                      considerRating: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Consider customer rating</span>
                  <p className="text-xs text-gray-500">Prefer employees with higher ratings</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={formData.autoAssignmentRules.fallbackToAnyEmployee}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    autoAssignmentRules: {
                      ...prev.autoAssignmentRules,
                      fallbackToAnyEmployee: e.target.checked
                    }
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm text-gray-700">Fallback to any available employee</span>
                  <p className="text-xs text-gray-500">If no matching employee found, assign to any available</p>
                </div>
              </label>
            </div>
          </div>

          {/* Requirements */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Requirements
            </label>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {availableRequirements.map((requirement) => (
                <label key={requirement} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.requirements.includes(requirement)}
                    onChange={() => toggleRequirement(requirement)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 capitalize">
                    {requirement.replace('_', ' ')}
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
              disabled={!formData.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              Add Service
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}