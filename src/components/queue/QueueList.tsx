import React, { useEffect, useState } from 'react';
import { Clock, Phone, Mail, User, AlertCircle, RefreshCw, X } from 'lucide-react';
import { QueueEntry } from '../../types';
import { useQueueStore } from '../../stores/queueStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { SwipeableCard } from '../common/SwipeableCard';
import { ResponsiveGrid } from '../common/ResponsiveGrid';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';

export function QueueList() {
  const { 
    entries, 
    selectedLocationId, 
    updateQueueEntry, 
    callNext, 
    updateStats, 
    syncData, 
    refreshQueue,
    isLoading, 
    lastSyncTime,
    cleanupCompletedEntries
  } = useQueueStore();
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  
  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Update stats when entries change
  useEffect(() => {
    updateStats();
  }, [entries, updateStats, refreshKey]);

  // Listen for queue updates from other parts of the app
  useEffect(() => {
    const handleQueueUpdate = () => {
      refreshQueue();
      updateStats();
      setRefreshKey(prev => prev + 1);
    };

    const handleQueueSync = () => {
      refreshQueue();
      updateStats();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('queueUpdated', handleQueueUpdate);
    window.addEventListener('queueSynced', handleQueueSync);

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      refreshQueue();
      updateStats();
      cleanupCompletedEntries();
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => {
      window.removeEventListener('queueUpdated', handleQueueUpdate);
      window.removeEventListener('queueSynced', handleQueueSync);
      clearInterval(interval);
    };
  }, [refreshQueue, updateStats, cleanupCompletedEntries]);
  
  const queueEntries = entries
    .filter(entry => selectedLocationId ? entry.locationId === selectedLocationId : true)
    .filter(entry => entry.status === 'waiting' || entry.status === 'called' || entry.status === 'in_progress')
    .sort((a, b) => {
      if (a.status === 'in_progress' && b.status !== 'in_progress') return -1;
      if (b.status === 'in_progress' && a.status !== 'in_progress') return 1;
      if (a.status === 'called' && b.status === 'waiting') return -1;
      if (b.status === 'called' && a.status === 'waiting') return 1;
      return a.position - b.position;
    });

  const getStatusColor = (status: QueueEntry['status']) => {
    switch (status) {
      case 'waiting': return 'bg-yellow-100 text-yellow-800';
      case 'called': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: QueueEntry['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'normal': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCallNext = () => {
    callNext();
    // Immediate refresh
    setTimeout(() => {
      refreshQueue();
      updateStats();
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const handleUpdateStatus = (id: string, status: QueueEntry['status']) => {
    updateQueueEntry(id, { 
      status, 
      ...(status === 'completed' ? { completedAt: new Date() } : {}),
      ...(status === 'in_progress' ? { serviceStartTime: new Date() } : {}),
    });
    
    // Immediate refresh
    setTimeout(() => {
      refreshQueue();
      updateStats();
      setRefreshKey(prev => prev + 1);
    }, 100);
  };

  const handleSyncData = async () => {
    await syncData();
    setRefreshKey(prev => prev + 1);
  };

  const renderQueueEntry = (entry: QueueEntry) => {
    const entryContent = (
      <div className="p-4 lg:p-6">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-3 mb-2">
              <div className="flex items-center space-x-2">
                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-full text-sm font-medium">
                  #{entry.position}
                </span>
                <h3 className="font-semibold text-gray-900 truncate">{entry.customerName}</h3>
              </div>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(entry.status))}>
                {entry.status.replace('_', ' ')}
              </span>
              <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getPriorityColor(entry.priority))}>
                {entry.priority}
              </span>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3">
              <div className="flex items-center space-x-1">
                <Phone className="w-4 h-4" />
                <span>{entry.customerPhone}</span>
              </div>
              {entry.customerEmail && (
                <div className="flex items-center space-x-1">
                  <Mail className="w-4 h-4" />
                  <span className="truncate">{entry.customerEmail}</span>
                </div>
              )}
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{entry.estimatedWaitTime} min wait</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <span>Joined: {format(entry.joinedAt, 'h:mm a')}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-3">
              {entry.services.map((service, index) => (
                <span key={index} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                  {service}
                </span>
              ))}
            </div>

            {entry.assignedEmployeeId && (
              <div className="flex items-center space-x-1 text-sm text-gray-600 mb-2">
                <User className="w-4 h-4" />
                <span>Assigned to Employee #{entry.assignedEmployeeId}</span>
              </div>
            )}

            {entry.specialRequests && (
              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                <div className="flex items-start space-x-1">
                  <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{entry.specialRequests}</p>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Actions */}
          <div className="hidden lg:flex flex-col space-y-2 ml-4">
            {entry.status === 'waiting' && (
              <TouchFriendlyButton
                size="sm"
                onClick={() => handleUpdateStatus(entry.id, 'called')}
                disabled={isLoading}
              >
                Call
              </TouchFriendlyButton>
            )}
            {entry.status === 'called' && (
              <TouchFriendlyButton
                variant="secondary"
                size="sm"
                onClick={() => handleUpdateStatus(entry.id, 'in_progress')}
                disabled={isLoading}
              >
                Start Service
              </TouchFriendlyButton>
            )}
            {entry.status === 'in_progress' && (
              <TouchFriendlyButton
                variant="outline"
                size="sm"
                onClick={() => handleUpdateStatus(entry.id, 'completed')}
                disabled={isLoading}
              >
                Complete
              </TouchFriendlyButton>
            )}
            <TouchFriendlyButton
              variant="danger"
              size="sm"
              onClick={() => handleUpdateStatus(entry.id, 'no_show')}
              disabled={isLoading}
            >
              No Show
            </TouchFriendlyButton>
          </div>
        </div>

        {/* Mobile Actions */}
        <div className="lg:hidden flex flex-wrap gap-2">
          {entry.status === 'waiting' && (
            <TouchFriendlyButton
              size="sm"
              onClick={() => handleUpdateStatus(entry.id, 'called')}
              disabled={isLoading}
              className="flex-1"
            >
              Call
            </TouchFriendlyButton>
          )}
          {entry.status === 'called' && (
            <TouchFriendlyButton
              variant="secondary"
              size="sm"
              onClick={() => handleUpdateStatus(entry.id, 'in_progress')}
              disabled={isLoading}
              className="flex-1"
            >
              Start Service
            </TouchFriendlyButton>
          )}
          {entry.status === 'in_progress' && (
            <TouchFriendlyButton
              variant="outline"
              size="sm"
              onClick={() => handleUpdateStatus(entry.id, 'completed')}
              disabled={isLoading}
              className="flex-1"
            >
              Complete
            </TouchFriendlyButton>
          )}
          <TouchFriendlyButton
            variant="danger"
            size="sm"
            onClick={() => handleUpdateStatus(entry.id, 'no_show')}
            disabled={isLoading}
            className="flex-1"
          >
            No Show
          </TouchFriendlyButton>
        </div>
      </div>
    );

    // Use swipeable card on mobile
    if (isMobile) {
      return (
        <SwipeableCard
          key={`${entry.id}-${refreshKey}`}
          onSwipeLeft={() => handleUpdateStatus(entry.id, 'no_show')}
          onSwipeRight={() => {
            if (entry.status === 'waiting') {
              handleUpdateStatus(entry.id, 'called');
            } else if (entry.status === 'called') {
              handleUpdateStatus(entry.id, 'in_progress');
            } else if (entry.status === 'in_progress') {
              handleUpdateStatus(entry.id, 'completed');
            }
          }}
          leftAction={{
            icon: <X className="w-5 h-5" />,
            label: 'No Show',
            color: 'bg-red-500'
          }}
          rightAction={{
            icon: <Clock className="w-5 h-5" />,
            label: entry.status === 'waiting' ? 'Call' : 
                   entry.status === 'called' ? 'Start' : 'Complete',
            color: 'bg-green-500'
          }}
          className="bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          {entryContent}
        </SwipeableCard>
      );
    }

    // Regular card for desktop
    return (
      <div key={`${entry.id}-${refreshKey}`} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
        {entryContent}
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 lg:p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Current Queue</h2>
            <div className="flex items-center space-x-4 mt-1">
              <p className="text-sm text-gray-600">
                {queueEntries.length} {queueEntries.length === 1 ? 'customer' : 'customers'} in queue
              </p>
              {lastSyncTime && (
                <p className="text-xs text-gray-500">
                  Last synced: {format(lastSyncTime, 'h:mm:ss a')}
                </p>
              )}
              <div className={cn(
                'w-2 h-2 rounded-full',
                isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
              )}></div>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <TouchFriendlyButton
              variant="ghost"
              size="sm"
              onClick={handleSyncData}
              disabled={isLoading}
              className="hidden lg:flex"
            >
              <RefreshCw className={cn('w-5 h-5 mr-2', isLoading && 'animate-spin')} />
              {isLoading ? 'Syncing...' : 'Sync'}
            </TouchFriendlyButton>
            <TouchFriendlyButton
              onClick={handleCallNext}
              disabled={queueEntries.filter(e => e.status === 'waiting').length === 0 || isLoading}
            >
              Call Next
            </TouchFriendlyButton>
          </div>
        </div>
      </div>

      <div className="p-4 lg:p-6">
        {queueEntries.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Queue is empty</h3>
            <p className="text-gray-500">No customers are currently waiting</p>
          </div>
        ) : (
          <div className="space-y-4">
            {queueEntries.map(renderQueueEntry)}
          </div>
        )}
      </div>

      {/* Mobile swipe hint */}
      {isMobile && queueEntries.length > 0 && (
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            💡 Swipe right to advance, swipe left for no-show
          </p>
        </div>
      )}
    </div>
  );
}