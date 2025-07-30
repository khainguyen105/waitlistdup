import React from 'react';
import { X, User, Phone, Mail, Calendar, Star, Clock, Tag } from 'lucide-react';
import { format } from 'date-fns';

interface CustomerDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
}

export function CustomerDetailsModal({ isOpen, onClose, customer }: CustomerDetailsModalProps) {
  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-bold text-xl">
                  {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                </span>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl font-bold text-gray-900">{customer.name}</h2>
                  {customer.visitCount > 5 && (
                    <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded-full">
                      <Star className="w-4 h-4 text-yellow-600" />
                      <span className="text-xs font-medium text-yellow-800">VIP</span>
                    </div>
                  )}
                </div>
                <p className="text-gray-600">Customer since {format(new Date(customer.lastVisit), 'MMMM yyyy')}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Phone</p>
                  <p className="text-gray-900">{customer.phone}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-700">Email</p>
                  <p className="text-gray-900">{customer.email || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Visit Statistics */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Visit Statistics</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-6 bg-blue-50 rounded-xl">
                <div className="text-3xl font-bold text-blue-600 mb-2">{customer.visitCount}</div>
                <p className="text-sm text-blue-800">Total Visits</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl">
                <Calendar className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-green-800">Last Visit</div>
                <p className="text-xs text-green-700">{format(new Date(customer.lastVisit), 'MMM d, yyyy')}</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl">
                <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <div className="text-sm font-medium text-purple-800">Avg. Visit</div>
                <p className="text-xs text-purple-700">~45 minutes</p>
              </div>
            </div>
          </div>

          {/* Preferred Services */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              <div className="flex items-center space-x-2">
                <Tag className="w-5 h-5" />
                <span>Preferred Services</span>
              </div>
            </h3>
            {customer.preferredServices.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {customer.preferredServices.map((service: string, index: number) => (
                  <span key={index} className="inline-flex items-center px-3 py-2 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {service}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">No preferred services recorded</p>
            )}
          </div>

          {/* Customer Insights */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Customer Insights</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Customer Type:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customer.visitCount > 10 ? 'Loyal Customer' : 
                   customer.visitCount > 5 ? 'Regular Customer' : 
                   customer.visitCount > 1 ? 'Returning Customer' : 'New Customer'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Visit Frequency:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customer.visitCount > 5 ? 'High' : customer.visitCount > 2 ? 'Medium' : 'Low'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Service Variety:</span>
                <span className="text-sm font-medium text-gray-900">
                  {customer.preferredServices.length} different services
                </span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="flex flex-wrap gap-3">
              <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Add to Queue
              </button>
              <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Book Appointment
              </button>
              <button className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                Send Message
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}