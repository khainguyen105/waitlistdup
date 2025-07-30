import React, { useEffect, useState } from 'react';
import { Clock, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { useQueueStore } from '../../stores/queueStore';
import { cn } from '../../utils/cn';
import { format } from 'date-fns';

export function DashboardStats() {
  const { stats, selectedLocationId, updateStats, syncData, refreshQueue, isLoading, lastSyncTime } = useQueueStore();
  const [refreshKey, setRefreshKey] = useState(0);

  // Update stats when component mounts or location changes
  useEffect(() => {
    updateStats();
  }, [selectedLocationId, updateStats, refreshKey]);

  // Listen for queue updates
  useEffect(() => {
    const handleQueueUpdate = () => {
      updateStats();
      setRefreshKey(prev => prev + 1);
    };

    const handleQueueSync = () => {
      updateStats();
      setRefreshKey(prev => prev + 1);
    };

    window.addEventListener('queueUpdated', handleQueueUpdate);
    window.addEventListener('queueSynced', handleQueueSync);

    // Auto-refresh stats every 15 seconds
    const interval = setInterval(() => {
      updateStats();
      setRefreshKey(prev => prev + 1);
    }, 15000);

    return () => {
      window.removeEventListener('queueUpdated', handleQueueUpdate);
      window.removeEventListener('queueSynced', handleQueueSync);
      clearInterval(interval);
    };
  }, [updateStats]);

  const handleSyncData = async () => {
    await syncData();
    setRefreshKey(prev => prev + 1);
  };

  const statCards = [
    {
      title: 'Waiting in Queue',
      value: stats.totalWaiting,
      icon: Clock,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-700',
    },
    {
      title: 'Currently Serving',
      value: stats.currentlyServing,
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
    },
    {
      title: 'Served Today',
      value: stats.customersServedToday,
      icon: CheckCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-700',
    },
    {
      title: 'No Shows',
      value: stats.noShows,
      icon: XCircle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Sync Status Bar */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={cn(
              'w-3 h-3 rounded-full',
              isLoading ? 'bg-yellow-500 animate-pulse' : 'bg-green-500'
            )}></div>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {isLoading ? 'Syncing data...' : 'Data synchronized'}
              </p>
              {lastSyncTime && !isLoading && (
                <p className="text-xs text-gray-500">
                  Last updated: {format(lastSyncTime, 'MMM d, h:mm:ss a')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={handleSyncData}
            disabled={isLoading}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-medium flex items-center space-x-2 transition-colors"
          >
            <RefreshCw className={cn('w-4 h-4', isLoading && 'animate-spin')} />
            <span>{isLoading ? 'Syncing...' : 'Sync Data'}</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={`${stat.title}-${refreshKey}`} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}