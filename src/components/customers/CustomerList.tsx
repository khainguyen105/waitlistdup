import React, { useState, useMemo } from 'react';
import { Search, Plus, Edit2, Trash2, Download, Phone, Mail, Calendar, Star, Filter, SortAsc, SortDesc } from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';
import { AddCustomerForm } from './AddCustomerForm';
import { EditCustomerForm } from './EditCustomerForm';
import { CustomerDetailsModal } from './CustomerDetailsModal';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { ResponsiveGrid } from '../common/ResponsiveGrid';
import { format } from 'date-fns';

type SortField = 'name' | 'phone' | 'lastVisit' | 'visitCount';
type SortDirection = 'asc' | 'desc';

export function CustomerList() {
  const { customers, deleteCustomer } = useCustomerStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Check if mobile
  const [isMobile, setIsMobile] = useState(false);
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth < 768) {
        setViewMode('cards');
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter and sort customers
  const filteredAndSortedCustomers = useMemo(() => {
    let filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.phone.includes(searchTerm) ||
      (customer.email && customer.email.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'phone':
          aValue = a.phone;
          bValue = b.phone;
          break;
        case 'lastVisit':
          aValue = new Date(a.lastVisit).getTime();
          bValue = new Date(b.lastVisit).getTime();
          break;
        case 'visitCount':
          aValue = a.visitCount;
          bValue = b.visitCount;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [customers, searchTerm, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleEditCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    setShowEditForm(true);
  };

  const handleViewDetails = (customer: any) => {
    setSelectedCustomer(customer);
    setShowDetailsModal(true);
  };

  const handleDeleteCustomer = (phone: string) => {
    if (window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      deleteCustomer(phone);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Phone', 'Email', 'Visit Count', 'Last Visit', 'Preferred Services'];
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedCustomers.map(customer => [
        `"${customer.name}"`,
        `"${customer.phone}"`,
        `"${customer.email || ''}"`,
        customer.visitCount,
        `"${format(new Date(customer.lastVisit), 'yyyy-MM-dd')}"`,
        `"${customer.preferredServices.join('; ')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `customers-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <Filter className="w-4 h-4 text-gray-400" />;
    return sortDirection === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-600" /> : 
      <SortDesc className="w-4 h-4 text-blue-600" />;
  };

  const renderCustomerCard = (customer: any) => (
    <div key={customer.phone} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold text-gray-900">{customer.name}</h3>
              {customer.visitCount > 5 && (
                <Star className="w-4 h-4 text-yellow-500" title="VIP Customer" />
              )}
            </div>
            <p className="text-sm text-gray-600">{customer.phone}</p>
            {customer.email && (
              <p className="text-sm text-gray-600">{customer.email}</p>
            )}
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <TouchFriendlyButton
            variant="ghost"
            size="sm"
            onClick={() => handleEditCustomer(customer)}
          >
            <Edit2 className="w-4 h-4" />
          </TouchFriendlyButton>
          <TouchFriendlyButton
            variant="ghost"
            size="sm"
            onClick={() => handleDeleteCustomer(customer.phone)}
          >
            <Trash2 className="w-4 h-4" />
          </TouchFriendlyButton>
        </div>
      </div>

      <div className="space-y-2 mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Visits:</span>
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
            {customer.visitCount}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Last Visit:</span>
          <span className="text-sm text-gray-900">
            {format(new Date(customer.lastVisit), 'MMM d, yyyy')}
          </span>
        </div>
      </div>

      {customer.preferredServices.length > 0 && (
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-700 mb-2">Preferred Services:</p>
          <div className="flex flex-wrap gap-1">
            {customer.preferredServices.slice(0, 2).map((service: string, index: number) => (
              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {service}
              </span>
            ))}
            {customer.preferredServices.length > 2 && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                +{customer.preferredServices.length - 2} more
              </span>
            )}
          </div>
        </div>
      )}

      <TouchFriendlyButton
        variant="outline"
        size="sm"
        fullWidth
        onClick={() => handleViewDetails(customer)}
      >
        View Details
      </TouchFriendlyButton>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Customers</h2>
          <p className="text-gray-600">Manage your customer database and history</p>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <TouchFriendlyButton
            variant="secondary"
            onClick={exportToCSV}
            className="flex items-center justify-center"
          >
            <Download className="w-5 h-5 mr-2" />
            Export CSV
          </TouchFriendlyButton>
          <TouchFriendlyButton
            onClick={() => setShowAddForm(true)}
            className="flex items-center justify-center"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Customer
          </TouchFriendlyButton>
        </div>
      </div>

      {/* Search and Stats */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search customers..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent touch-manipulation"
            />
          </div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium text-gray-900">{filteredAndSortedCustomers.length}</span> customers
            </div>
            <div>
              <span className="font-medium text-gray-900">
                {customers.reduce((sum, customer) => sum + customer.visitCount, 0)}
              </span> total visits
            </div>
          </div>
        </div>
      </div>

      {/* Customer List */}
      {viewMode === 'cards' || isMobile ? (
        <ResponsiveGrid cols={{ default: 1, sm: 2, lg: 3 }}>
          {filteredAndSortedCustomers.map(renderCustomerCard)}
        </ResponsiveGrid>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('name')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Name</span>
                      <SortIcon field="name" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('phone')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Phone</span>
                      <SortIcon field="phone" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('visitCount')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Visits</span>
                      <SortIcon field="visitCount" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left">
                    <button
                      onClick={() => handleSort('lastVisit')}
                      className="flex items-center space-x-1 text-xs font-medium text-gray-500 uppercase tracking-wider hover:text-gray-700"
                    >
                      <span>Last Visit</span>
                      <SortIcon field="lastVisit" />
                    </button>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Preferred Services
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAndSortedCustomers.map((customer) => (
                  <tr key={customer.phone} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                          <span className="text-blue-600 font-medium text-sm">
                            {customer.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-gray-900">{customer.name}</span>
                            {customer.visitCount > 5 && (
                              <Star className="w-4 h-4 text-yellow-500" title="VIP Customer" />
                            )}
                          </div>
                          <button
                            onClick={() => handleViewDetails(customer)}
                            className="text-xs text-blue-600 hover:text-blue-700"
                          >
                            View details
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">{customer.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {customer.email ? (
                        <div className="flex items-center space-x-2">
                          <Mail className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-900">{customer.email}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {customer.visitCount} visits
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-900">
                          {format(new Date(customer.lastVisit), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {customer.preferredServices.slice(0, 2).map((service: string, index: number) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {service}
                          </span>
                        ))}
                        {customer.preferredServices.length > 2 && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            +{customer.preferredServices.length - 2} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditCustomer(customer)}
                          className="text-blue-600 hover:text-blue-700 p-1 rounded transition-colors"
                          title="Edit customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(customer.phone)}
                          className="text-red-600 hover:text-red-700 p-1 rounded transition-colors"
                          title="Delete customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {filteredAndSortedCustomers.length === 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Search className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'No customers found' : 'No customers yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchTerm 
              ? 'Try adjusting your search terms or add a new customer'
              : 'Add your first customer to start building your database'
            }
          </p>
          <TouchFriendlyButton onClick={() => setShowAddForm(true)}>
            Add Customer
          </TouchFriendlyButton>
        </div>
      )}

      {/* Modals */}
      <AddCustomerForm 
        isOpen={showAddForm} 
        onClose={() => setShowAddForm(false)} 
      />

      {selectedCustomer && (
        <>
          <EditCustomerForm 
            isOpen={showEditForm} 
            onClose={() => {
              setShowEditForm(false);
              setSelectedCustomer(null);
            }}
            customer={selectedCustomer}
          />

          <CustomerDetailsModal 
            isOpen={showDetailsModal} 
            onClose={() => {
              setShowDetailsModal(false);
              setSelectedCustomer(null);
            }}
            customer={selectedCustomer}
          />
        </>
      )}
    </div>
  );
}