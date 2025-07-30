import React, { useState, useEffect } from 'react';
import { Settings, AlertTriangle, Users, ArrowRightLeft, Shield, Plus, Edit2, Trash2 } from 'lucide-react';
import { useEmployeeStore } from '../../stores/employeeStore';
import { useQueueStore } from '../../stores/queueStore';
import { useLocationStore } from '../../stores/locationStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';
import { ResponsiveGrid } from '../common/ResponsiveGrid';
import { QueueControlRule, SystemAlert } from '../../types';
import { format } from 'date-fns';
import { cn } from '../../utils/cn';

export function QueueControlPanel() {
  const [showAddRule, setShowAddRule] = useState(false);
  const [selectedRule, setSelectedRule] = useState<QueueControlRule | null>(null);
  const [emergencyMode, setEmergencyMode] = useState(false);

  const {
    queueRules,
    systemAlerts,
    selectedLocationId,
    addQueueRule,
    updateQueueRule,
    deleteQueueRule,
    balanceEmployeeQueues,
    activateEmergencyOverride,
    deactivateEmergencyOverride,
    resolveAlert,
    getActiveAlerts,
  } = useEmployeeStore();

  const { entries, updateQueueEntry } = useQueueStore();
  const { selectedLocation } = useLocationStore();

  const activeAlerts = getActiveAlerts(selectedLocationId || undefined);
  const locationRules = queueRules.filter(rule => rule.locationId === selectedLocationId);

  // Auto-evaluate queue rules
  useEffect(() => {
    if (!selectedLocationId) return;

    const interval = setInterval(() => {
      balanceEmployeeQueues(selectedLocationId);
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [selectedLocationId, balanceEmployeeQueues]);

  const handleEmergencyToggle = () => {
    if (!selectedLocationId) return;

    if (emergencyMode) {
      deactivateEmergencyOverride(selectedLocationId);
      setEmergencyMode(false);
    } else {
      const reason = prompt('Enter emergency reason:');
      if (reason) {
        activateEmergencyOverride(selectedLocationId, reason);
        setEmergencyMode(true);
      }
    }
  };

  const handleReassignCustomer = (customerId: string, newEmployeeId: string) => {
    updateQueueEntry(customerId, {
      assignedEmployeeId: newEmployeeId,
      assignmentMethod: 'manual',
    });
  };

  const getSeverityColor = (severity: SystemAlert['severity']) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRuleTypeIcon = (type: QueueControlRule['type']) => {
    switch (type) {
      case 'load_balancing': return <ArrowRightLeft className="w-5 h-5" />;
      case 'priority_override': return <Users className="w-5 h-5" />;
      case 'service_limit': return <Settings className="w-5 h-5" />;
      case 'emergency_protocol': return <Shield className="w-5 h-5" />;
      default: return <Settings className="w-5 h-5" />;
    }
  };

  if (!selectedLocation) {
    return (
      <div className="text-center py-8">
        <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Location Selected</h3>
        <p className="text-gray-600">Select a location to manage queue controls</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Queue Control Panel</h2>
          <p className="text-gray-600">Manage queue rules and system alerts</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <TouchFriendlyButton
            variant={emergencyMode ? 'danger' : 'outline'}
            onClick={handleEmergencyToggle}
            className="flex items-center space-x-2"
          >
            <Shield className="w-5 h-5" />
            <span>{emergencyMode ? 'Deactivate Emergency' : 'Emergency Override'}</span>
          </TouchFriendlyButton>
          
          <TouchFriendlyButton
            onClick={() => setShowAddRule(true)}
            className="flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Add Rule</span>
          </TouchFriendlyButton>
        </div>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span>Active Alerts ({activeAlerts.length})</span>
          </h3>
          
          <div className="space-y-3">
            {activeAlerts.map((alert) => (
              <div key={alert.id} className={cn('border rounded-lg p-4', getSeverityColor(alert.severity))}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium capitalize">{alert.type.replace('_', ' ')}</span>
                      <span className="text-xs uppercase font-medium">{alert.severity}</span>
                    </div>
                    <p className="text-sm">{alert.message}</p>
                    <p className="text-xs mt-1 opacity-75">
                      {format(alert.createdAt, 'MMM d, h:mm a')}
                    </p>
                  </div>
                  
                  <TouchFriendlyButton
                    size="sm"
                    variant="outline"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </TouchFriendlyButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Queue Rules */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Queue Control Rules</h3>
        
        {locationRules.length === 0 ? (
          <div className="text-center py-8">
            <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h4 className="text-lg font-medium text-gray-900 mb-2">No Rules Configured</h4>
            <p className="text-gray-600 mb-4">Add rules to automate queue management</p>
            <TouchFriendlyButton onClick={() => setShowAddRule(true)}>
              Add First Rule
            </TouchFriendlyButton>
          </div>
        ) : (
          <ResponsiveGrid cols={{ default: 1, md: 2 }}>
            {locationRules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-lg">
                      {getRuleTypeIcon(rule.type)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{rule.name}</h4>
                      <p className="text-sm text-gray-600">{rule.description}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={rule.isActive}
                        onChange={(e) => updateQueueRule(rule.id, { isActive: e.target.checked })}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </label>
                    <button
                      onClick={() => setSelectedRule(rule)}
                      className="text-gray-400 hover:text-gray-600 p-1 rounded"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Are you sure you want to delete this rule?')) {
                          deleteQueueRule(rule.id);
                        }
                      }}
                      className="text-red-400 hover:text-red-600 p-1 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="ml-2 capitalize">{rule.type.replace('_', ' ')}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Priority:</span>
                    <span className="ml-2">{rule.priority}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Conditions:</span>
                    <span className="ml-2">{rule.conditions.length}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Actions:</span>
                    <span className="ml-2">{rule.actions.length}</span>
                  </div>
                </div>

                <div className={cn('mt-3 px-2 py-1 rounded text-xs font-medium', 
                  rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                )}>
                  {rule.isActive ? 'Active' : 'Inactive'}
                </div>
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </div>

      {/* Emergency Mode Banner */}
      {emergencyMode && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Shield className="w-6 h-6 text-red-600" />
            <div>
              <h4 className="font-semibold text-red-900">Emergency Override Active</h4>
              <p className="text-sm text-red-700">
                All queue rules are bypassed. Manual control is enabled for all operations.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Rule Modal */}
      {(showAddRule || selectedRule) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-gray-900">
                  {selectedRule ? 'Edit Rule' : 'Add Queue Rule'}
                </h3>
                <button
                  onClick={() => {
                    setShowAddRule(false);
                    setSelectedRule(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Queue rules help automate queue management based on conditions you set.
              </p>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <TouchFriendlyButton
                    variant="outline"
                    onClick={() => {
                      addQueueRule({
                        locationId: selectedLocationId!,
                        name: 'Auto Load Balancing',
                        description: 'Automatically balance queues when imbalanced',
                        type: 'load_balancing',
                        conditions: [
                          { field: 'queue_imbalance', operator: 'greater_than', value: 3 }
                        ],
                        actions: [
                          { type: 'reassign_employee', parameters: { strategy: 'least_busy' } }
                        ],
                        priority: 1,
                        isActive: true,
                      });
                      setShowAddRule(false);
                    }}
                    className="h-20 flex-col"
                  >
                    <ArrowRightLeft className="w-6 h-6 mb-2" />
                    <span>Load Balancing</span>
                  </TouchFriendlyButton>

                  <TouchFriendlyButton
                    variant="outline"
                    onClick={() => {
                      addQueueRule({
                        locationId: selectedLocationId!,
                        name: 'VIP Priority',
                        description: 'Automatically prioritize VIP customers',
                        type: 'priority_override',
                        conditions: [
                          { field: 'customer_type', operator: 'equals', value: 'vip' }
                        ],
                        actions: [
                          { type: 'adjust_priority', parameters: { priority: 'high' } }
                        ],
                        priority: 2,
                        isActive: true,
                      });
                      setShowAddRule(false);
                    }}
                    className="h-20 flex-col"
                  >
                    <Users className="w-6 h-6 mb-2" />
                    <span>VIP Priority</span>
                  </TouchFriendlyButton>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <TouchFriendlyButton
                    variant="outline"
                    onClick={() => {
                      addQueueRule({
                        locationId: selectedLocationId!,
                        name: 'Service Time Limit',
                        description: 'Limit service time for certain customer types',
                        type: 'service_limit',
                        conditions: [
                          { field: 'customer_type', operator: 'equals', value: 'new' }
                        ],
                        actions: [
                          { type: 'limit_service', parameters: { maxTime: 60 } }
                        ],
                        priority: 3,
                        isActive: true,
                      });
                      setShowAddRule(false);
                    }}
                    className="h-20 flex-col"
                  >
                    <Settings className="w-6 h-6 mb-2" />
                    <span>Service Limits</span>
                  </TouchFriendlyButton>

                  <TouchFriendlyButton
                    variant="outline"
                    onClick={() => {
                      addQueueRule({
                        locationId: selectedLocationId!,
                        name: 'Emergency Protocol',
                        description: 'Emergency queue management protocol',
                        type: 'emergency_protocol',
                        conditions: [
                          { field: 'emergency_mode', operator: 'equals', value: true }
                        ],
                        actions: [
                          { type: 'emergency_override', parameters: { clearQueue: false } }
                        ],
                        priority: 0,
                        isActive: false,
                      });
                      setShowAddRule(false);
                    }}
                    className="h-20 flex-col"
                  >
                    <Shield className="w-6 h-6 mb-2" />
                    <span>Emergency</span>
                  </TouchFriendlyButton>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}