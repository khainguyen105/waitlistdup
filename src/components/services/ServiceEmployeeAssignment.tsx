import React, { useState } from 'react';
import { X, Users, Star, Plus, Trash2, Check } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';
import { Service, Employee } from '../../types';

interface ServiceEmployeeAssignmentProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
}

export function ServiceEmployeeAssignment({ isOpen, onClose, service }: ServiceEmployeeAssignmentProps) {
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(service.assignedEmployeeIds);
  const [skillLevels, setSkillLevels] = useState<Record<string, 'beginner' | 'intermediate' | 'expert'>>({});
  const [autoAssignmentRules, setAutoAssignmentRules] = useState(service.autoAssignmentRules);

  const { 
    getEmployeesForLocation, 
    updateService,
    assignEmployeeToService,
    getEmployeesForService 
  } = useLocationStore();

  const allEmployees = getEmployeesForLocation(service.locationId);
  const currentlyAssigned = getEmployeesForService(service.id);

  // Initialize skill levels from current assignments
  React.useEffect(() => {
    const initialSkillLevels: Record<string, 'beginner' | 'intermediate' | 'expert'> = {};
    currentlyAssigned.forEach(emp => {
      initialSkillLevels[emp.id] = emp.skillLevel[service.id] || 'intermediate';
    });
    setSkillLevels(initialSkillLevels);
  }, [currentlyAssigned, service.id]);

  const handleEmployeeToggle = (employeeId: string) => {
    setSelectedEmployees(prev => {
      const newSelection = prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId];
      
      // Set default skill level for newly added employees
      if (!prev.includes(employeeId)) {
        setSkillLevels(prevSkills => ({
          ...prevSkills,
          [employeeId]: 'intermediate'
        }));
      }
      
      return newSelection;
    });
  };

  const handleSkillLevelChange = (employeeId: string, skillLevel: 'beginner' | 'intermediate' | 'expert') => {
    setSkillLevels(prev => ({
      ...prev,
      [employeeId]: skillLevel
    }));
  };

  const handleBulkAssign = () => {
    const availableEmployees = allEmployees.filter(emp => !selectedEmployees.includes(emp.id));
    const newAssignments = availableEmployees.map(emp => emp.id);
    
    setSelectedEmployees(prev => [...prev, ...newAssignments]);
    
    // Set default skill levels for bulk assigned employees
    const newSkillLevels = { ...skillLevels };
    newAssignments.forEach(empId => {
      newSkillLevels[empId] = 'intermediate';
    });
    setSkillLevels(newSkillLevels);
  };

  const handleSave = () => {
    // Update service with new assignments and rules
    updateService(service.id, {
      assignedEmployeeIds: selectedEmployees,
      autoAssignmentRules: {
        ...autoAssignmentRules,
        preferredEmployeeIds: selectedEmployees,
      }
    });

    // Update individual employee skill levels
    selectedEmployees.forEach(employeeId => {
      const skillLevel = skillLevels[employeeId] || 'intermediate';
      assignEmployeeToService(employeeId, service.id, skillLevel);
    });

    onClose();
  };

  const getSkillLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expert': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Calculate skill level counts
  const skillLevelCounts = Object.values(skillLevels).reduce((acc, level) => {
    acc[level] = (acc[level] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Manage Employee Assignment</h2>
                <p className="text-sm text-gray-600">{service.name}</p>
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

        <div className="p-6 space-y-6">
          {/* Service Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">{service.name}</h3>
                <p className="text-sm text-blue-700">{service.description}</p>
              </div>
              <div className="text-right">
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Duration:</span> {service.estimatedDuration} min
                </div>
                <div className="text-sm text-blue-700">
                  <span className="font-medium">Skill Required:</span> {service.skillLevelRequired}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Employee Assignment</h3>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-600">
                {selectedEmployees.length} of {allEmployees.length} employees assigned
              </span>
              <button
                onClick={handleBulkAssign}
                disabled={selectedEmployees.length === allEmployees.length}
                className="bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1 rounded text-sm font-medium flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>Assign All</span>
              </button>
            </div>
          </div>

          {/* Employee List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allEmployees.map((employee) => {
              const isAssigned = selectedEmployees.includes(employee.id);
              const skillLevel = skillLevels[employee.id] || 'intermediate';
              
              return (
                <div
                  key={employee.id}
                  className={`border-2 rounded-lg p-4 transition-all ${
                    isAssigned 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isAssigned}
                          onChange={() => handleEmployeeToggle(employee.id)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-3"
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {employee.firstName} {employee.lastName}
                          </h4>
                          <p className="text-sm text-gray-600">{employee.email}</p>
                        </div>
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium">{employee.performance.customerRating.toFixed(1)}</span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Workload: {employee.performance.currentWorkload}
                      </div>
                    </div>
                  </div>

                  {/* Employee Specialties */}
                  {employee.specialties.length > 0 && (
                    <div className="mb-3">
                      <div className="flex flex-wrap gap-1">
                        {employee.specialties.map((specialty, index) => (
                          <span key={index} className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Skill Level Selection */}
                  {isAssigned && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Skill Level for this Service:
                      </label>
                      <div className="flex space-x-2">
                        {(['beginner', 'intermediate', 'expert'] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => handleSkillLevelChange(employee.id, level)}
                            className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                              skillLevel === level
                                ? getSkillLevelColor(level)
                                : 'bg-gray-100 text-gray-600 border-gray-200 hover:bg-gray-200'
                            }`}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Auto-assignment Rules */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Auto-assignment Rules</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoAssignmentRules.requireSpecialty}
                  onChange={(e) => setAutoAssignmentRules(prev => ({
                    ...prev,
                    requireSpecialty: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Require matching specialty</span>
                  <p className="text-xs text-gray-500">Only assign employees with relevant specialties</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoAssignmentRules.considerWorkload}
                  onChange={(e) => setAutoAssignmentRules(prev => ({
                    ...prev,
                    considerWorkload: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Consider current workload</span>
                  <p className="text-xs text-gray-500">Prefer employees with lower workload</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoAssignmentRules.considerRating}
                  onChange={(e) => setAutoAssignmentRules(prev => ({
                    ...prev,
                    considerRating: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Consider customer rating</span>
                  <p className="text-xs text-gray-500">Prefer employees with higher ratings</p>
                </div>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={autoAssignmentRules.fallbackToAnyEmployee}
                  onChange={(e) => setAutoAssignmentRules(prev => ({
                    ...prev,
                    fallbackToAnyEmployee: e.target.checked
                  }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-sm font-medium text-gray-700">Fallback to any employee</span>
                  <p className="text-xs text-gray-500">If no match found, assign to any available</p>
                </div>
              </label>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Assignment Summary</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Total Assigned:</span>
                <span className="ml-2 font-medium">{selectedEmployees.length} employees</span>
              </div>
              <div>
                <span className="text-gray-600">Skill Levels:</span>
                <div className="ml-2">
                  {Object.entries(skillLevelCounts).map(([level, count]) => (
                    <span key={level} className="mr-2">
                      {count} {level}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="text-gray-600">Auto-assignment:</span>
                <span className="ml-2 font-medium">
                  {Object.values(autoAssignmentRules).filter(Boolean).length} rules enabled
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-3 px-4 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
            >
              <Check className="w-5 h-5" />
              <span>Save Assignment</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}