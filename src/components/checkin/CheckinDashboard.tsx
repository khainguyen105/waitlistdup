import React, { useState, useEffect } from 'react';
import { Clock, MapPin, Phone, User, RefreshCw, Filter, Search, Calendar, Navigation, Wifi } from 'lucide-react';
import { useCheckinStore } from '../../stores/checkinStore';
import { useLocationStore } from '../../stores/locationStore';
import { useQueueStore } from '../../stores/queueStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { ResponsiveGrid } from '../common/ResponsiveGrid';
import { LocationSelector } from '../locations/LocationSelector';
import { CheckinEntry, CheckinStatus } from '../../types';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '../../utils/cn';

export function CheckinDashboard() {
  const [filterStatus, setFilterStatus] = useState<CheckinStatus | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'checkin_time' | 'arrival_time' | 'name'>('checkin_time');

  const { 
    checkins, 
    selectedLocationId, 
    isLoading, 
    lastSyncTime,
    getCheckinsForLocation,
    updateCheckin,
    convertToQueue,
    syncData,
    expireOldCheckins,
    cleanupOldCheckins
  } = useCheckinStore();

  const { selectedLocation } = useLocationStore();
  const { addToQueue } = useQueueStore();

  // Auto-sync and expire old check-ins
  useEffect(() => {
    const interval = setInterval(() => {
      expireOldCheckins();
      cleanupOldCheckins();
      syncData();
    }, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, [expireOldCheckins, cleanupOldCheckins, syncData]);

  // Listen for check-in events
  useEffect(() => {
    const handleAddToQueue = (event: any) => {
      const { checkin } = event.detail;
      
      // Add to queue when converting from check-in
      addToQueue({
        locationId: checkin.locationId,
        customerName: checkin.customerName,
        customerPhone: checkin.customerPhone,
        customerEmail: checkin.customerEmail,
        customerType: checkin.customerType || 'regular',
        services: checkin.services,
        serviceIds: checkin.services.map((service: string, index: number) => `service-${index}`),
        assignmentMethod: 'auto',
        priority: 'normal',
        status: 'waiting',
        estimatedWaitTime: checkin.services.length * 30, // Rough estimate
        specialRequests: checkin.notes,
      });
    };

    window.addEventListener('addToQueueFromCheckin', handleAddToQueue);
    return () => window.removeEventListener('addToQueueFromCheckin', handleAddToQueue);
  }, [addToQueue]);

  // Get check-ins for the selected location
  const locationCheckins = selectedLocationId ? getCheckinsForLocation(selectedLocationId) : checkins;

  // Filter and sort check-ins
  const filteredCheckins = locationCheckins
    .filter(checkin => {
      if (filterStatus !== 'all' && checkin.status !== filterStatus) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          checkin.customerName.toLowerCase().includes(search) ||
          checkin.customerPhone.includes(search) ||
          checkin.checkinCode.toLowerCase().includes(search)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'checkin_time':
          return new Date(b.checkinTime).getTime() - new Date(a.checkinTime).getTime();
        case 'arrival_time':
          if (!a.estimatedArrivalTime && !b.estimatedArrivalTime) return 0;
          if (!a.estimatedArrivalTime) return 1;
          if (!b.estimatedArrivalTime) return -1;
          return new Date(a.estimatedArrivalTime).getTime() - new Date(b.estimatedArrivalTime).getTime();
        case 'name':
          return a.customerName.localeCompare(b.customerName);
        default:
          return 0;
      }
    });

  const getStatusColor = (status: CheckinStatus) => {
    switch (status) {
      case 'en_route': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'present': return 'bg-green-100 text-green-800 border-green-200';
      case 'in_queue': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'expired': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusLabel = (status: CheckinStatus) => {
    switch (status) {
      case 'en_route': return 'En Route';
      case 'present': return 'Present';
      case 'in_queue': return 'In Queue';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getVerificationIcon = (method?: string) => {
    switch (method) {
      case 'geolocation': return <Navigation className="w-4 h-4" />;
      case 'wifi': return <Wifi className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const handleStatusUpdate = (checkinId: string, newStatus: CheckinStatus) => {
    updateCheckin(checkinId, { status: newStatus });
  };

  const handleAddToQueue = (checkinId: string) => {
    convertToQueue(checkinId);
  };

  const getStats = () => {
    const total = locationCheckins.length;
    const enRoute = locationCheckins.filter(c => c.status === 'en_route').length;
    const present = locationCheckins.filter(c => c.status === 'present').length;
    const inQueue = locationCheckins.filter(c => c.status === 'in_queue').length;
    const remote = locationCheckins.filter(c => c.checkinType === 'remote').length;
    const inStore = locationCheckins.filter(c => c.checkinType === 'in_store').length;

    return { total, enRoute, present, inQueue, remote, inStore };
  };

  const stats = getStats();

  const renderCheckinCard = (checkin: CheckinEntry) => (
    <div key={checkin.id} className="bg-white border border-gray-200 rounded-lg p-4 lg:p-6 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="font-semibold text-gray-900 truncate">{checkin.customerName}</h3>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium border', getStatusColor(checkin.status))}>
              {getStatusLabel(checkin.status)}
            </span>
            <span className={cn('px-2 py-1 rounded-full text-xs font-medium', 
              checkin.checkinType === 'remote' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
            )}>
              {checkin.checkinType === 'remote' ? 'Remote' : 'In-Store'}
            </span>
          </div>
          
          <div className="space-y-2 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>{checkin.customerPhone}</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="bg-gray-100 px-2 py-1 rounded text-xs font-mono">
                {checkin.checkinCode}
              </div>
              <span className="text-xs">Check-in Code</span>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Checked in {formatDistanceToNow(checkin.checkinTime, { addSuffix: true })}</span>
            </div>

            {checkin.estimatedArrivalTime && (
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4" />
                <span>
                  ETA: {format(checkin.estimatedArrivalTime, 'h:mm a')}
                  {checkin.estimatedArrivalTime > new Date() && (
                    <span className="text-blue-600 ml-1">
                      (in {formatDistanceToNow(checkin.estimatedArrivalTime)})
                    </span>
                  )}
                </span>
              </div>
            )}

            {checkin.actualArrivalTime && (
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4" />
                <span>Arrived {formatDistanceToNow(checkin.actualArrivalTime, { addSuffix: true })}</span>
              </div>
            )}

            {checkin.verificationMethod && (
              <div className="flex items-center space-x-2">
                {getVerificationIcon(checkin.verificationMethod)}
                <span className="capitalize">Verified via {checkin.verificationMethod}</span>
              </div>
            )}
          </div>

          {checkin.services.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-1">
                {checkin.services.map((service, index) => (
                  <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">
                    {service}
                  </span>
                ))}
              </div>
            </div>
          )}

          {checkin.notes && (
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">{checkin.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-200">
        {checkin.status === 'en_route' && (
          <TouchFriendlyButton
            size="sm"
            onClick={() => handleStatusUpdate(checkin.id, 'present')}
          >
            Mark Present
          </TouchFriendlyButton>
        )}
        
        {(checkin.status === 'present' || checkin.status === 'en_route') && (
          <TouchFriendlyButton
            variant="secondary"
            size="sm"
            onClick={() => handleAddToQueue(checkin.id)}
          >
            Add to Queue
          </TouchFriendlyButton>
        )}

        {checkin.status === 'en_route' && (
          <TouchFriendlyButton
            variant="danger"
            size="sm"
            onClick={() => handleStatusUpdate(checkin.id, 'cancelled')}
          >
            Cancel
          </TouchFriendlyButton>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Check-in Dashboard</h2>
          <p className="text-gray-600">Manage remote and in-store customer check-ins</p>
          {(error || checkinError) && (
            <p className="text-red-600 text-sm mt-1">
              Error: {error || checkinError}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-4">
          <LocationSelector />
          <TouchFriendlyButton
            variant="ghost"
            onClick={() => syncData()}
            disabled={isLoading || isCheckinLoading}
          >
            <RefreshCw className={cn('w-5 h-5 mr-2', (isLoading || isCheckinLoading) && 'animate-spin')} />
            {(isLoading || isCheckinLoading) ? 'Syncing...' : 'Sync'}
          </TouchFriendlyButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
          <div className="text-sm text-gray-600">Total Check-ins</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.enRoute}</div>
          <div className="text-sm text-gray-600">En Route</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.present}</div>
          <div className="text-sm text-gray-600">Present</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.inQueue}</div>
          <div className="text-sm text-gray-600">In Queue</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.remote}</div>
          <div className="text-sm text-gray-600">Remote</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4 text-center">
          <div className="text-2xl font-bold text-emerald-600">{stats.inStore}</div>
          <div className="text-sm text-gray-600">In-Store</div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, phone, or code..."
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as CheckinStatus | 'all')}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="en_route">En Route</option>
                <option value="present">Present</option>
                <option value="in_queue">In Queue</option>
                <option value="expired">Expired</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="checkin_time">Sort by Check-in Time</option>
              <option value="arrival_time">Sort by Arrival Time</option>
              <option value="name">Sort by Name</option>
            </select>
          </div>
        </div>

        {lastSyncTime && (
          <div className="mt-4 text-xs text-gray-500">
            Last synced: {format(lastSyncTime, 'MMM d, h:mm:ss a')}
          </div>
        )}
      </div>

      {/* Check-ins List */}
      {filteredCheckins.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm || filterStatus !== 'all' ? 'No check-ins found' : 'No check-ins yet'}
          </h3>
          <p className="text-gray-600">
            {searchTerm || filterStatus !== 'all' 
              ? 'Try adjusting your search or filter criteria'
              : 'Check-ins will appear here as customers use the system'
            }
          </p>
        </div>
      ) : (
        <ResponsiveGrid cols={{ default: 1, md: 2, xl: 3 }}>
          {filteredCheckins.map(renderCheckinCard)}
        </ResponsiveGrid>
      )}
    </div>
  );
}