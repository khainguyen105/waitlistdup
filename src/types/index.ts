export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  agencyId?: string;
  locationIds: string[];
  createdAt: Date;
}

export type UserRole = 'agency_admin' | 'location_manager' | 'staff' | 'customer';

export interface Agency {
  id: string;
  name: string;
  domain: string;
  logo?: string;
  brandColor: string;
  settings: AgencySettings;
  createdAt: Date;
}

export interface AgencySettings {
  allowSelfJoin: boolean;
  requirePhoneVerification: boolean;
  enableSMSNotifications: boolean;
  enableEmailNotifications: boolean;
  defaultWaitTimeBuffer: number;
}

export interface Location {
  id: string;
  agencyId: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  timezone: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  settings: LocationSettings;
  isActive: boolean;
  createdAt: Date;
}

export interface LocationSettings {
  businessHours: BusinessHours;
  maxQueueSize: number;
  allowWalkIns: boolean;
  requireAppointments: boolean;
  allowRemoteCheckin: boolean;
  checkinRadius: number; // meters for geolocation verification
  wifiSSID?: string; // for wifi-based verification
  autoAssignEmployees: boolean; // Auto-assign employees to queue entries
  maxQueuePerEmployee: number; // Maximum customers per employee queue
  loadBalancingThreshold: number; // Threshold for automatic load balancing
  serviceLimits: ServiceLimits;
  priorityOverrides: PriorityOverride[];
  emergencyOverride: boolean;
}

export interface ServiceLimits {
  [customerType: string]: {
    maxServiceTime: number; // minutes
    allowedServices: string[];
  };
}

export interface PriorityOverride {
  id: string;
  condition: string; // e.g., 'vip_customer', 'appointment', 'emergency'
  priorityLevel: QueueEntry['priority'];
  isActive: boolean;
}

export interface BusinessHours {
  [key: string]: {
    isOpen: boolean;
    openTime: string;
    closeTime: string;
  };
}

export interface Employee {
  id: string;
  locationId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  specialties: string[];
  serviceIds: string[]; // Services this employee can perform
  skillLevel: EmployeeSkillLevel;
  schedule: Schedule;
  performance: EmployeePerformance;
  availability: EmployeeAvailability;
  queueSettings: EmployeeQueueSettings;
  isActive: boolean;
  createdAt: Date;
}

export interface EmployeeAvailability {
  status: 'active' | 'inactive' | 'break' | 'busy';
  lastStatusChange: Date;
  currentCustomerId?: string;
  estimatedAvailableTime?: Date;
  notes?: string;
}

export interface EmployeeQueueSettings {
  maxQueueSize: number;
  acceptNewCustomers: boolean;
  turnSharingEnabled: boolean;
  turnSharingPartners: string[]; // Employee IDs
  priorityHandling: 'strict' | 'flexible';
  breakSchedule: BreakSchedule[];
}

export interface BreakSchedule {
  startTime: string;
  endTime: string;
  type: 'break' | 'lunch' | 'meeting';
  isRecurring: boolean;
}

export interface EmployeeSkillLevel {
  [serviceId: string]: 'beginner' | 'intermediate' | 'expert';
}

export interface Schedule {
  [key: string]: {
    isWorking: boolean;
    startTime: string;
    endTime: string;
    breakTimes: BreakTime[];
  };
}

export interface BreakTime {
  startTime: string;
  endTime: string;
  type: 'break' | 'lunch';
}

export interface EmployeePerformance {
  averageServiceTime: number;
  customersServed: number;
  customerRating: number;
  currentWorkload: number; // Number of active queue entries
  efficiency: number; // Percentage of on-time completions
  lastUpdated: Date;
}

export interface ServiceCategory {
  id: string;
  locationId: string;
  name: string;
  description?: string;
  color: string;
  icon?: string;
  sortOrder: number;
  parentCategoryId?: string; // For hierarchical categories
  isActive: boolean;
  createdAt: Date;
}

export interface Service {
  id: string;
  locationId: string;
  categoryId?: string;
  name: string;
  description: string;
  category: string; // Keep for backward compatibility
  estimatedDuration: number;
  requirements: string[];
  price?: number;
  skillLevelRequired: 'beginner' | 'intermediate' | 'expert';
  assignedEmployeeIds: string[]; // Employees who can perform this service
  autoAssignmentRules: ServiceAutoAssignmentRules;
  customerTypes: CustomerTypeRestriction[];
  isActive: boolean;
  createdAt: Date;
}

export interface CustomerTypeRestriction {
  type: 'vip' | 'regular' | 'new' | 'appointment';
  maxServiceTime?: number;
  requiresApproval?: boolean;
}

export interface ServiceAutoAssignmentRules {
  preferredEmployeeIds: string[]; // Priority order for assignment
  requireSpecialty: boolean; // Must have matching specialty
  considerWorkload: boolean; // Factor in current workload
  considerRating: boolean; // Factor in customer rating
  considerAvailability: boolean; // Check employee availability status
  fallbackToAnyEmployee: boolean; // Assign to any available employee if no match
  loadBalancingEnabled: boolean; // Enable automatic load balancing
}

export interface QueueEntry {
  id: string;
  locationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerType: 'vip' | 'regular' | 'new' | 'appointment';
  services: string[];
  serviceIds: string[]; // Service IDs for better tracking
  assignedEmployeeId?: string;
  assignedEmployeeName?: string;
  preferredEmployeeId?: string; // Customer's preferred employee
  assignmentMethod: 'manual' | 'auto' | 'preferred' | 'load_balanced';
  priority: 'low' | 'normal' | 'high' | 'urgent' | 'emergency';
  status: QueueStatus;
  position: number;
  estimatedWaitTime: number;
  actualWaitTime?: number;
  serviceStartTime?: Date;
  serviceEndTime?: Date;
  joinedAt: Date;
  calledAt?: Date;
  completedAt?: Date;
  notifications: QueueNotification[];
  specialRequests?: string;
  notes?: string;
}

export interface QueueNotification {
  id: string;
  type: 'sms' | 'email' | 'push';
  status: 'pending' | 'sent' | 'failed';
  message: string;
  sentAt?: Date;
  error?: string;
}

export type QueueStatus = 'waiting' | 'called' | 'in_progress' | 'completed' | 'no_show' | 'cancelled' | 'transferred';

export interface CheckinEntry {
  id: string;
  locationId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerType: 'vip' | 'regular' | 'new' | 'appointment';
  services: string[];
  preferredEmployeeId?: string;
  checkinType: 'remote' | 'in_store';
  status: CheckinStatus;
  checkinCode: string;
  estimatedArrivalTime?: Date;
  actualArrivalTime?: Date;
  checkinTime: Date;
  verificationMethod?: 'geolocation' | 'wifi' | 'manual' | 'staff_confirmed';
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  specialRequests?: string;
  notes?: string;
}

export type CheckinStatus = 'en_route' | 'present' | 'in_queue' | 'expired' | 'cancelled';

export interface QueueStats {
  totalWaiting: number;
  averageWaitTime: number;
  customersServedToday: number;
  currentlyServing: number;
  noShows: number;
  remoteCheckins: number;
  inStoreCheckins: number;
  employeeUtilization: EmployeeUtilization[];
  queueEfficiency: number;
  customerSatisfaction: number;
}

export interface EmployeeUtilization {
  employeeId: string;
  employeeName: string;
  currentQueueSize: number;
  averageServiceTime: number;
  utilizationPercentage: number;
  status: 'active' | 'inactive' | 'break' | 'busy';
}

export interface QueueControlRule {
  id: string;
  locationId: string;
  name: string;
  description: string;
  type: 'load_balancing' | 'priority_override' | 'service_limit' | 'emergency_protocol';
  conditions: RuleCondition[];
  actions: RuleAction[];
  priority: number;
  isActive: boolean;
  createdAt: Date;
}

export interface RuleCondition {
  field: string; // e.g., 'queue_length', 'wait_time', 'customer_type', 'service_type'
  operator: 'equals' | 'greater_than' | 'less_than' | 'contains' | 'in_range';
  value: string | number | string[];
}

export interface RuleAction {
  type: 'reassign_employee' | 'adjust_priority' | 'send_notification' | 'limit_service' | 'emergency_override';
  parameters: Record<string, any>;
}

export interface SystemAlert {
  id: string;
  type: 'queue_overflow' | 'employee_unavailable' | 'system_error' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  locationId?: string;
  employeeId?: string;
  customerId?: string;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface EmployeeAssignmentRule {
  id: string;
  locationId: string;
  name: string;
  priority: number;
  conditions: AssignmentCondition[];
  actions: AssignmentAction[];
  isActive: boolean;
}

export interface AssignmentCondition {
  type: 'service' | 'time' | 'workload' | 'rating' | 'specialty' | 'customer_type' | 'availability';
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
  value: string | number;
}

export interface AssignmentAction {
  type: 'assign_employee' | 'set_priority' | 'add_note' | 'send_notification';
  value: string;
}