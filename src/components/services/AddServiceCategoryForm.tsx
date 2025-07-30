import React, { useState } from 'react';
import { X, Tag, Palette } from 'lucide-react';
import { useLocationStore } from '../../stores/locationStore';

interface AddServiceCategoryFormProps {
  isOpen: boolean;
  onClose: () => void;
  locationId: string;
}

const predefinedColors = [
  '#3B82F6', // Blue
  '#10B981', // Green
  '#F59E0B', // Yellow
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export function AddServiceCategoryForm({ isOpen, onClose, locationId }: AddServiceCategoryFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: predefinedColors[0],
    icon: 'tag',
  });

  const { addServiceCategory, getCategoriesForLocation } = useLocationStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const existingCategories = getCategoriesForLocation(locationId);
    const nextSortOrder = Math.max(...existingCategories.map(cat => cat.sortOrder), 0) + 1;

    addServiceCategory({
      locationId,
      name: formData.name,
      description: formData.description,
      color: formData.color,
      icon: formData.icon,
      sortOrder: nextSortOrder,
      isActive: true,
    });

    setFormData({
      name: '',
      description: '',
      color: predefinedColors[0],
      icon: 'tag',
    });
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Add Service Category</h2>
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
              Category Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="e.g., Hair Services, Nail Care, Spa Treatments"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Brief description of this service category..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <div className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>Category Color</span>
              </div>
            </label>
            <div className="grid grid-cols-5 gap-3">
              {predefinedColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, color }))}
                  className={`w-12 h-12 rounded-lg border-2 transition-all ${
                    formData.color === color 
                      ? 'border-gray-900 scale-110' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-3 p-3 rounded-lg border-2" style={{ 
              backgroundColor: formData.color + '20', 
              borderColor: formData.color 
            }}>
              <div className="flex items-center space-x-2">
                <div 
                  className="w-4 h-4 rounded-full" 
                  style={{ backgroundColor: formData.color }}
                />
                <span className="font-medium" style={{ color: formData.color }}>
                  {formData.name || 'Category Preview'}
                </span>
              </div>
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
              Add Category
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}