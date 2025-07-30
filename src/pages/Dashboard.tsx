import React, { useState, useEffect } from 'react';
import { ResponsiveSidebar } from '../components/common/ResponsiveSidebar';
import { MobileSidebar } from '../components/common/MobileSidebar';
import { MobileHeader } from '../components/common/MobileHeader';
import { ResponsiveContainer } from '../components/common/ResponsiveContainer';
import { TouchFriendlyButton } from '../components/common/TouchFriendlyButton';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { QueueList } from '../components/queue/QueueList';
import { AddToQueueForm } from '../components/queue/AddToQueueForm';
import { EmployeeList } from '../components/employees/EmployeeList';
import { ServiceList } from '../components/services/ServiceList';
import { LocationList } from '../components/locations/LocationList';
import { LocationQRCodes } from '../components/locations/LocationQRCodes';
import { LocationSelector } from '../components/locations/LocationSelector';
import { CustomerList } from '../components/customers/CustomerList';
import { CheckinDashboard } from '../components/checkin/CheckinDashboard';
import { EmployeeAvailabilityPanel } from '../components/employee/EmployeeAvailabilityPanel';
import { QueueControlPanel } from '../components/queue/QueueControlPanel';
import { useQueueStore } from '../stores/queueStore';
import { useEmployeeStore } from '../stores/employeeStore';
import { Plus, RefreshCw, Users, Settings } from 'lucide-react';
import { cn } from '../utils/cn';

export function Dashboard() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [showAddToQueue, setShowAddToQueue] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  const { selectedLocationId, setSelectedLocation, syncData, isLoading } = useQueueStore();
  const { setSelectedLocation: setEmployeeLocation } = useEmployeeStore();

  // Set default location if none selected
  useEffect(() => {
    if (!selectedLocationId) {
      setSelectedLocation('1');
      setEmployeeLocation('1');
    }
  }, [selectedLocationId, setSelectedLocation, setEmployeeLocation]);

  // Close mobile sidebar when section changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [activeSection]);

  const handleSyncData = () => {
    syncData();
  };

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Dashboard';
      case 'queue': return 'Queue Management';
      case 'checkins': return 'Check-in Management';
      case 'employee-availability': return 'Employee Availability';
      case 'queue-control': return 'Queue Control';
      case 'employees': return 'Employees';
      case 'services': return 'Services';
      case 'locations': return 'Locations';
      case 'qr-codes': return 'QR Codes';
      case 'customers': return 'Customers';
      case 'agencies': return 'Agency Management';
      case 'settings': return 'Settings';
      default: return 'Dashboard';
    }
  };

  const getSectionSubtitle = () => {
    switch (activeSection) {
      case 'dashboard': return 'Overview of your queue management system';
      case 'queue': return 'Manage customer queue and wait times';
      case 'checkins': return 'Manage remote and in-store check-ins';
      case 'employee-availability': return 'Manage staff status and queue settings';
      case 'queue-control': return 'Configure queue rules and controls';
      case 'employees': return 'Manage your team members';
      case 'services': return 'Manage available services';
      case 'locations': return 'Manage your business locations';
      case 'qr-codes': return 'Generate QR codes for customer check-in';
      case 'customers': return 'Manage your customer database';
      case 'agencies': return 'Manage your agency and client accounts';
      case 'settings': return 'Configure your system preferences';
      default: return '';
    }
  };

  const getHeaderActions = () => {
    if (activeSection === 'dashboard' || activeSection === 'queue') {
      return (
        <div className="flex items-center space-x-2">
          <TouchFriendlyButton
            variant="ghost"
            size="sm"
            onClick={handleSyncData}
            disabled={isLoading}
            className="hidden sm:flex"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
          </TouchFriendlyButton>
          <TouchFriendlyButton
            variant="primary"
            size="sm"
            onClick={() => setShowAddToQueue(true)}
          >
            <Plus className="w-4 h-4" />
          </TouchFriendlyButton>
        </div>
      );
    }
    
    if (activeSection === 'employee-availability') {
      return (
        <TouchFriendlyButton
          variant="ghost"
          size="sm"
          onClick={() => setActiveSection('queue-control')}
        >
          <Settings className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Queue Control</span>
        </TouchFriendlyButton>
      );
    }
    
    return null;
  };

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600">Overview of your queue management system</p>
              </div>
              <div className="flex items-center space-x-4">
                <LocationSelector />
                <TouchFriendlyButton
                  variant="ghost"
                  onClick={handleSyncData}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
                  {isLoading ? 'Syncing...' : 'Sync'}
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  variant="primary"
                  onClick={() => setShowAddToQueue(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Queue
                </TouchFriendlyButton>
              </div>
            </div>
            
            <div className="lg:hidden">
              <LocationSelector />
            </div>
            
            <DashboardStats />
            <QueueList />
          </div>
        );
      
      case 'queue':
        return (
          <div className="space-y-6">
            <div className="hidden lg:flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Queue Management</h1>
                <p className="text-gray-600">Manage customer queue and wait times</p>
              </div>
              <div className="flex items-center space-x-4">
                <LocationSelector />
                <TouchFriendlyButton
                  variant="ghost"
                  onClick={handleSyncData}
                  disabled={isLoading}
                >
                  <RefreshCw className={cn('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
                  {isLoading ? 'Syncing...' : 'Sync'}
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  variant="primary"
                  onClick={() => setShowAddToQueue(true)}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add to Queue
                </TouchFriendlyButton>
              </div>
            </div>
            
            <div className="lg:hidden">
              <LocationSelector />
            </div>
            
            <QueueList />
          </div>
        );

      case 'checkins':
        return <CheckinDashboard />;

      case 'employee-availability':
        return (
          <div>
            <div className="mb-6 lg:hidden">
              <LocationSelector />
            </div>
            <div className="hidden lg:block mb-6">
              <LocationSelector />
            </div>
            <EmployeeAvailabilityPanel />
          </div>
        );

      case 'queue-control':
        return (
          <div>
            <div className="mb-6 lg:hidden">
              <LocationSelector />
            </div>
            <div className="hidden lg:block mb-6">
              <LocationSelector />
            </div>
            <QueueControlPanel />
          </div>
        );
      
      case 'employees':
        return (
          <div>
            <div className="mb-6 lg:hidden">
              <LocationSelector />
            </div>
            <div className="hidden lg:block mb-6">
              <LocationSelector />
            </div>
            <EmployeeList />
          </div>
        );
      
      case 'services':
        return (
          <div>
            <div className="mb-6 lg:hidden">
              <LocationSelector />
            </div>
            <div className="hidden lg:block mb-6">
              <LocationSelector />
            </div>
            <ServiceList />
          </div>
        );
      
      case 'locations':
        return <LocationList />;

      case 'qr-codes':
        return <LocationQRCodes />;

      case 'customers':
        return <CustomerList />;
      
      case 'agencies':
        return (
          <div className="space-y-6">
            <div className="hidden lg:block">
              <h1 className="text-3xl font-bold text-gray-900">Agency Management</h1>
              <p className="text-gray-600">Manage your agency and client accounts</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Agency Dashboard</h3>
              <p className="text-gray-600">White-label management and client onboarding features coming soon</p>
            </div>
          </div>
        );
      
      case 'settings':
        return (
          <div className="space-y-6">
            <div className="hidden lg:block">
              <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600">Configure your system preferences</p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">System Settings</h3>
              <p className="text-gray-600">Notification preferences, integrations, and system configuration</p>
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <ResponsiveSidebar 
        activeSection={activeSection} 
        onSectionChange={setActiveSection} 
      />
      
      <MobileSidebar
        activeSection={activeSection}
        onSectionChange={setActiveSection}
        isOpen={isMobileSidebarOpen}
        onToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <MobileHeader
          title={getSectionTitle()}
          subtitle={getSectionSubtitle()}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          actions={getHeaderActions()}
        />
        
        <main className="flex-1 overflow-y-auto">
          <ResponsiveContainer>
            {renderContent()}
          </ResponsiveContainer>
        </main>
      </div>

      <AddToQueueForm 
        isOpen={showAddToQueue} 
        onClose={() => setShowAddToQueue(false)} 
      />
    </div>
  );
}