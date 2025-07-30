import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Employee, EmployeeAvailability, QueueControlRule, SystemAlert } from '../types';

interface EmployeeState {
  employees: Employee[];
  queueRules: QueueControlRule[];
  systemAlerts: SystemAlert[];
  selectedLocationId: string | null;
  isLoading: boolean;
  lastSyncTime: Date | null;
  
  // Employee Management
  updateEmployeeAvailability: (employeeId: string, availability: Partial<EmployeeAvailability>) => void;
  updateEmployeeQueueSettings: (employeeId: string, settings: Partial<Employee['queueSettings']>) => void;
  getAvailableEmployees: (locationId: string) => Employee[];
  getEmployeeWorkload: (employeeId: string) => number;
  
  // Queue Control
  addQueueRule: (rule: Omit<QueueControlRule, 'id' | 'createdAt'>) => void;
  updateQueueRule: (ruleId: string, updates: Partial<QueueControlRule>) => void;
  deleteQueueRule: (ruleId: string) => void;
  evaluateQueueRules: (locationId: string, context: any) => RuleAction[];
  
  // Load Balancing
  balanceEmployeeQueues: (locationId: string) => void;
  reassignCustomer: (customerId: string, fromEmployeeId: string, toEmployeeId: string) => void;
  
  // Emergency Management
  activateEmergencyOverride: (locationId: string, reason: string) => void;
  deactivateEmergencyOverride: (locationId: string) => void;
  
  // Alerts
  addSystemAlert: (alert: Omit<SystemAlert, 'id' | 'createdAt'>) => void;
  resolveAlert: (alertId: string) => void;
  getActiveAlerts: (locationId?: string) => SystemAlert[];
  
  // Sync
  syncData: () => Promise<void>;
  setSelectedLocation: (locationId: string) => void;
}

// Mock data for demonstration
const mockEmployees: Employee[] = [
  {
    id: '1',
    locationId: '1',
    firstName: 'Sarah',
    lastName: 'Wilson',
    email: 'sarah@salon.com',
    phone: '+1234567892',
    specialties: ['haircut', 'styling', 'coloring'],
    serviceIds: ['1', '2'],
    skillLevel: {
      '1': 'expert',
      '2': 'intermediate',
    },
    schedule: {
      monday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      thursday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      friday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      saturday: { isWorking: true, startTime: '08:00', endTime: '16:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      sunday: { isWorking: false, startTime: '10:00', endTime: '16:00', breakTimes: [] },
    },
    performance: {
      averageServiceTime: 45,
      customersServed: 156,
      customerRating: 4.8,
      currentWorkload: 2,
      efficiency: 92,
      lastUpdated: new Date(),
    },
    availability: {
      status: 'active',
      lastStatusChange: new Date(),
      notes: 'Available for new customers',
    },
    queueSettings: {
      maxQueueSize: 5,
      acceptNewCustomers: true,
      turnSharingEnabled: true,
      turnSharingPartners: ['2'],
      priorityHandling: 'flexible',
      breakSchedule: [
        { startTime: '12:00', endTime: '13:00', type: 'lunch', isRecurring: true },
        { startTime: '15:00', endTime: '15:15', type: 'break', isRecurring: true },
      ],
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    locationId: '1',
    firstName: 'Mike',
    lastName: 'Johnson',
    email: 'mike@salon.com',
    phone: '+1234567893',
    specialties: ['haircut', 'beard_trim', 'styling'],
    serviceIds: ['1', '3'],
    skillLevel: {
      '1': 'expert',
      '3': 'expert',
    },
    schedule: {
      monday: { isWorking: false, startTime: '10:00', endTime: '18:00', breakTimes: [] },
      tuesday: { isWorking: true, startTime: '10:00', endTime: '18:00', breakTimes: [{ startTime: '13:00', endTime: '14:00', type: 'lunch' }] },
      wednesday: { isWorking: true, startTime: '10:00', endTime: '18:00', breakTimes: [{ startTime: '13:00', endTime: '14:00', type: 'lunch' }] },
      thursday: { isWorking: true, startTime: '10:00', endTime: '18:00', breakTimes: [{ startTime: '13:00', endTime: '14:00', type: 'lunch' }] },
      friday: { isWorking: true, startTime: '10:00', endTime: '18:00', breakTimes: [{ startTime: '13:00', endTime: '14:00', type: 'lunch' }] },
      saturday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '13:00', endTime: '14:00', type: 'lunch' }] },
      sunday: { isWorking: true, startTime: '11:00', endTime: '15:00', breakTimes: [] },
    },
    performance: {
      averageServiceTime: 35,
      customersServed: 198,
      customerRating: 4.6,
      currentWorkload: 3,
      efficiency: 88,
      lastUpdated: new Date(),
    },
    availability: {
      status: 'active',
      lastStatusChange: new Date(),
      notes: 'Specializes in men\'s cuts',
    },
    queueSettings: {
      maxQueueSize: 4,
      acceptNewCustomers: true,
      turnSharingEnabled: true,
      turnSharingPartners: ['1'],
      priorityHandling: 'strict',
      breakSchedule: [
        { startTime: '13:00', endTime: '14:00', type: 'lunch', isRecurring: true },
      ],
    },
    isActive: true,
    createdAt: new Date(),
  },
];

const mockQueueRules: QueueControlRule[] = [
  {
    id: '1',
    locationId: '1',
    name: 'Auto Load Balancing',
    description: 'Automatically balance queues when one employee has 3+ more customers than another',
    type: 'load_balancing',
    conditions: [
      { field: 'queue_imbalance', operator: 'greater_than', value: 3 },
    ],
    actions: [
      { type: 'reassign_employee', parameters: { strategy: 'least_busy' } },
    ],
    priority: 1,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    locationId: '1',
    name: 'VIP Priority Override',
    description: 'Automatically prioritize VIP customers',
    type: 'priority_override',
    conditions: [
      { field: 'customer_type', operator: 'equals', value: 'vip' },
    ],
    actions: [
      { type: 'adjust_priority', parameters: { priority: 'high' } },
    ],
    priority: 2,
    isActive: true,
    createdAt: new Date(),
  },
];

export const useEmployeeStore = create<EmployeeState>()(
  persist(
    (set, get) => ({
      employees: mockEmployees,
      queueRules: mockQueueRules,
      systemAlerts: [],
      selectedLocationId: null,
      isLoading: false,
      lastSyncTime: new Date(),

      updateEmployeeAvailability: (employeeId, availability) => {
        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === employeeId
              ? { ...emp, availability: { ...emp.availability, ...availability, lastStatusChange: new Date() } }
              : emp
          ),
          lastSyncTime: new Date(),
        }));

        // Trigger notification
        window.dispatchEvent(new CustomEvent('employeeAvailabilityChanged', {
          detail: { employeeId, availability }
        }));
      },

      updateEmployeeQueueSettings: (employeeId, settings) => {
        set(state => ({
          employees: state.employees.map(emp =>
            emp.id === employeeId
              ? { ...emp, queueSettings: { ...emp.queueSettings, ...settings } }
              : emp
          ),
          lastSyncTime: new Date(),
        }));
      },

      getAvailableEmployees: (locationId) => {
        const { employees } = get();
        const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
        
        return employees.filter(emp => 
          emp.locationId === locationId &&
          emp.isActive &&
          emp.availability.status === 'active' &&
          emp.queueSettings.acceptNewCustomers &&
          emp.schedule[today]?.isWorking
        );
      },

      getEmployeeWorkload: (employeeId) => {
        const { employees } = get();
        const employee = employees.find(emp => emp.id === employeeId);
        return employee?.performance.currentWorkload || 0;
      },

      addQueueRule: (rule) => {
        const newRule: QueueControlRule = {
          ...rule,
          id: Date.now().toString(),
          createdAt: new Date(),
        };
        
        set(state => ({
          queueRules: [...state.queueRules, newRule],
          lastSyncTime: new Date(),
        }));
      },

      updateQueueRule: (ruleId, updates) => {
        set(state => ({
          queueRules: state.queueRules.map(rule =>
            rule.id === ruleId ? { ...rule, ...updates } : rule
          ),
          lastSyncTime: new Date(),
        }));
      },

      deleteQueueRule: (ruleId) => {
        set(state => ({
          queueRules: state.queueRules.filter(rule => rule.id !== ruleId),
          lastSyncTime: new Date(),
        }));
      },

      evaluateQueueRules: (locationId, context) => {
        const { queueRules } = get();
        const applicableRules = queueRules
          .filter(rule => rule.locationId === locationId && rule.isActive)
          .sort((a, b) => a.priority - b.priority);

        const triggeredActions: RuleAction[] = [];

        for (const rule of applicableRules) {
          const conditionsMet = rule.conditions.every(condition => {
            const contextValue = context[condition.field];
            
            switch (condition.operator) {
              case 'equals':
                return contextValue === condition.value;
              case 'greater_than':
                return contextValue > condition.value;
              case 'less_than':
                return contextValue < condition.value;
              case 'contains':
                return Array.isArray(contextValue) && contextValue.includes(condition.value);
              case 'in_range':
                const [min, max] = condition.value as [number, number];
                return contextValue >= min && contextValue <= max;
              default:
                return false;
            }
          });

          if (conditionsMet) {
            triggeredActions.push(...rule.actions);
          }
        }

        return triggeredActions;
      },

      balanceEmployeeQueues: (locationId) => {
        const { employees } = get();
        const locationEmployees = employees.filter(emp => 
          emp.locationId === locationId && 
          emp.isActive && 
          emp.availability.status === 'active'
        );

        // Calculate queue imbalance
        const workloads = locationEmployees.map(emp => ({
          employeeId: emp.id,
          workload: emp.performance.currentWorkload,
          maxCapacity: emp.queueSettings.maxQueueSize,
        }));

        const maxWorkload = Math.max(...workloads.map(w => w.workload));
        const minWorkload = Math.min(...workloads.map(w => w.workload));
        const imbalance = maxWorkload - minWorkload;

        if (imbalance >= 3) {
          // Trigger load balancing
          get().addSystemAlert({
            type: 'queue_overflow',
            severity: 'medium',
            message: `Queue imbalance detected at location ${locationId}. Automatic rebalancing recommended.`,
            locationId,
            isResolved: false,
          });

          // Trigger rebalancing event
          window.dispatchEvent(new CustomEvent('queueRebalanceNeeded', {
            detail: { locationId, imbalance, workloads }
          }));
        }
      },

      reassignCustomer: (customerId, fromEmployeeId, toEmployeeId) => {
        // Update employee workloads
        set(state => ({
          employees: state.employees.map(emp => {
            if (emp.id === fromEmployeeId) {
              return {
                ...emp,
                performance: {
                  ...emp.performance,
                  currentWorkload: Math.max(0, emp.performance.currentWorkload - 1),
                }
              };
            }
            if (emp.id === toEmployeeId) {
              return {
                ...emp,
                performance: {
                  ...emp.performance,
                  currentWorkload: emp.performance.currentWorkload + 1,
                }
              };
            }
            return emp;
          }),
          lastSyncTime: new Date(),
        }));

        // Trigger reassignment event
        window.dispatchEvent(new CustomEvent('customerReassigned', {
          detail: { customerId, fromEmployeeId, toEmployeeId }
        }));
      },

      activateEmergencyOverride: (locationId, reason) => {
        get().addSystemAlert({
          type: 'emergency',
          severity: 'critical',
          message: `Emergency override activated: ${reason}`,
          locationId,
          isResolved: false,
        });

        // Trigger emergency protocol
        window.dispatchEvent(new CustomEvent('emergencyOverrideActivated', {
          detail: { locationId, reason }
        }));
      },

      deactivateEmergencyOverride: (locationId) => {
        // Resolve emergency alerts
        set(state => ({
          systemAlerts: state.systemAlerts.map(alert =>
            alert.type === 'emergency' && alert.locationId === locationId
              ? { ...alert, isResolved: true, resolvedAt: new Date() }
              : alert
          ),
          lastSyncTime: new Date(),
        }));

        window.dispatchEvent(new CustomEvent('emergencyOverrideDeactivated', {
          detail: { locationId }
        }));
      },

      addSystemAlert: (alert) => {
        const newAlert: SystemAlert = {
          ...alert,
          id: Date.now().toString(),
          createdAt: new Date(),
        };

        set(state => ({
          systemAlerts: [...state.systemAlerts, newAlert],
          lastSyncTime: new Date(),
        }));

        // Trigger alert notification
        window.dispatchEvent(new CustomEvent('systemAlert', {
          detail: { alert: newAlert }
        }));
      },

      resolveAlert: (alertId) => {
        set(state => ({
          systemAlerts: state.systemAlerts.map(alert =>
            alert.id === alertId
              ? { ...alert, isResolved: true, resolvedAt: new Date() }
              : alert
          ),
          lastSyncTime: new Date(),
        }));
      },

      getActiveAlerts: (locationId) => {
        const { systemAlerts } = get();
        return systemAlerts.filter(alert => 
          !alert.isResolved && 
          (!locationId || alert.locationId === locationId)
        );
      },

      syncData: async () => {
        set({ isLoading: true });
        
        try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          set({
            lastSyncTime: new Date(),
            isLoading: false,
          });
        } catch (error) {
          console.error('Failed to sync employee data:', error);
          set({ isLoading: false });
        }
      },

      setSelectedLocation: (locationId) => {
        set({ selectedLocationId: locationId });
      },
    }),
    {
      name: 'employee-store',
      partialize: (state) => ({
        employees: state.employees,
        queueRules: state.queueRules,
        systemAlerts: state.systemAlerts,
        selectedLocationId: state.selectedLocationId,
      }),
    }
  )
);