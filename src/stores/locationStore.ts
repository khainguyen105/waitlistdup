import { create } from 'zustand';
import { Location, Employee, Service, ServiceCategory } from '../types';

interface LocationState {
  locations: Location[];
  employees: Employee[];
  services: Service[];
  serviceCategories: ServiceCategory[];
  selectedLocation: Location | null;
  addLocation: (location: Omit<Location, 'id' | 'createdAt'>) => void;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  setSelectedLocation: (location: Location | null) => void;
  addEmployee: (employee: Omit<Employee, 'id' | 'createdAt'>) => void;
  updateEmployee: (id: string, updates: Partial<Employee>) => void;
  addService: (service: Omit<Service, 'id' | 'createdAt'>) => void;
  updateService: (id: string, updates: Partial<Service>) => void;
  addServiceCategory: (category: Omit<ServiceCategory, 'id' | 'createdAt'>) => void;
  updateServiceCategory: (id: string, updates: Partial<ServiceCategory>) => void;
  deleteServiceCategory: (id: string) => void;
  getEmployeesForLocation: (locationId: string) => Employee[];
  getServicesForLocation: (locationId: string) => Service[];
  getCategoriesForLocation: (locationId: string) => ServiceCategory[];
  getAvailableEmployeeForServices: (locationId: string, serviceIds: string[]) => Employee | null;
  assignEmployeeToService: (employeeId: string, serviceId: string, skillLevel?: 'beginner' | 'intermediate' | 'expert') => void;
  bulkAssignEmployeesToServices: (employeeIds: string[], serviceIds: string[]) => void;
  getEmployeesForService: (serviceId: string) => Employee[];
  getServicesForEmployee: (employeeId: string) => Service[];
}

// Mock data
const mockLocations: Location[] = [
  {
    id: '1',
    agencyId: '1',
    name: 'Downtown Salon',
    address: '123 Main St, Downtown City, DC 12345',
    phone: '+1234567890',
    email: 'downtown@salon.com',
    timezone: 'America/New_York',
    settings: {
      businessHours: {
        monday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        tuesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        wednesday: { isOpen: true, openTime: '09:00', closeTime: '18:00' },
        thursday: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
        friday: { isOpen: true, openTime: '09:00', closeTime: '20:00' },
        saturday: { isOpen: true, openTime: '08:00', closeTime: '18:00' },
        sunday: { isOpen: false, openTime: '10:00', closeTime: '16:00' },
      },
      maxQueueSize: 50,
      allowWalkIns: true,
      requireAppointments: false,
      allowRemoteCheckin: true,
      checkinRadius: 100,
      autoAssignEmployees: true,
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    agencyId: '1',
    name: 'Uptown Branch',
    address: '456 Oak Ave, Uptown City, UC 67890',
    phone: '+1234567891',
    email: 'uptown@salon.com',
    timezone: 'America/New_York',
    settings: {
      businessHours: {
        monday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
        tuesday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
        wednesday: { isOpen: true, openTime: '10:00', closeTime: '19:00' },
        thursday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
        friday: { isOpen: true, openTime: '10:00', closeTime: '21:00' },
        saturday: { isOpen: true, openTime: '09:00', closeTime: '19:00' },
        sunday: { isOpen: true, openTime: '11:00', closeTime: '17:00' },
      },
      maxQueueSize: 30,
      allowWalkIns: true,
      requireAppointments: true,
      allowRemoteCheckin: true,
      checkinRadius: 100,
      autoAssignEmployees: false,
    },
    isActive: true,
    createdAt: new Date(),
  },
];

const mockServiceCategories: ServiceCategory[] = [
  {
    id: '1',
    locationId: '1',
    name: 'Hair Services',
    description: 'Professional hair cutting, styling, and treatments',
    color: '#3B82F6',
    icon: 'scissors',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    locationId: '1',
    name: 'Grooming',
    description: 'Beard trimming and men\'s grooming services',
    color: '#10B981',
    icon: 'user',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    locationId: '1',
    name: 'Nail Services',
    description: 'Manicures, pedicures, and nail treatments',
    color: '#F59E0B',
    icon: 'hand',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    locationId: '1',
    name: 'Spa Treatments',
    description: 'Relaxing spa and wellness services',
    color: '#8B5CF6',
    icon: 'heart',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date(),
  },
];

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
      lastUpdated: new Date(),
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
      currentWorkload: 1,
      lastUpdated: new Date(),
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    locationId: '1',
    firstName: 'Emma',
    lastName: 'Davis',
    email: 'emma@salon.com',
    phone: '+1234567894',
    specialties: ['manicure', 'pedicure', 'nail_art'],
    serviceIds: ['4', '5'],
    skillLevel: {
      '4': 'expert',
      '5': 'intermediate',
    },
    schedule: {
      monday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      tuesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      wednesday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      thursday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      friday: { isWorking: true, startTime: '09:00', endTime: '17:00', breakTimes: [{ startTime: '12:00', endTime: '13:00', type: 'lunch' }] },
      saturday: { isWorking: false, startTime: '09:00', endTime: '17:00', breakTimes: [] },
      sunday: { isWorking: false, startTime: '10:00', endTime: '16:00', breakTimes: [] },
    },
    performance: {
      averageServiceTime: 60,
      customersServed: 89,
      customerRating: 4.9,
      currentWorkload: 0,
      lastUpdated: new Date(),
    },
    isActive: true,
    createdAt: new Date(),
  },
];

const mockServices: Service[] = [
  {
    id: '1',
    locationId: '1',
    categoryId: '1',
    name: 'Haircut & Style',
    description: 'Professional haircut with styling',
    category: 'Hair Services',
    estimatedDuration: 45,
    requirements: ['consultation'],
    price: 65,
    skillLevelRequired: 'intermediate',
    assignedEmployeeIds: ['1', '2'],
    autoAssignmentRules: {
      preferredEmployeeIds: ['1', '2'],
      requireSpecialty: true,
      considerWorkload: true,
      considerRating: true,
      fallbackToAnyEmployee: false,
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '2',
    locationId: '1',
    categoryId: '1',
    name: 'Hair Coloring',
    description: 'Full or partial hair coloring service',
    category: 'Hair Services',
    estimatedDuration: 120,
    requirements: ['patch_test', 'consultation'],
    price: 150,
    skillLevelRequired: 'expert',
    assignedEmployeeIds: ['1'],
    autoAssignmentRules: {
      preferredEmployeeIds: ['1'],
      requireSpecialty: true,
      considerWorkload: true,
      considerRating: true,
      fallbackToAnyEmployee: false,
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '3',
    locationId: '1',
    categoryId: '2',
    name: 'Beard Trim',
    description: 'Professional beard trimming and shaping',
    category: 'Grooming',
    estimatedDuration: 20,
    requirements: [],
    price: 25,
    skillLevelRequired: 'beginner',
    assignedEmployeeIds: ['2'],
    autoAssignmentRules: {
      preferredEmployeeIds: ['2'],
      requireSpecialty: true,
      considerWorkload: false,
      considerRating: true,
      fallbackToAnyEmployee: true,
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '4',
    locationId: '1',
    categoryId: '3',
    name: 'Manicure',
    description: 'Complete nail care and polish application',
    category: 'Nail Services',
    estimatedDuration: 45,
    requirements: [],
    price: 35,
    skillLevelRequired: 'intermediate',
    assignedEmployeeIds: ['3'],
    autoAssignmentRules: {
      preferredEmployeeIds: ['3'],
      requireSpecialty: true,
      considerWorkload: true,
      considerRating: true,
      fallbackToAnyEmployee: false,
    },
    isActive: true,
    createdAt: new Date(),
  },
  {
    id: '5',
    locationId: '1',
    categoryId: '3',
    name: 'Pedicure',
    description: 'Complete foot care and polish application',
    category: 'Nail Services',
    estimatedDuration: 60,
    requirements: [],
    price: 45,
    skillLevelRequired: 'intermediate',
    assignedEmployeeIds: ['3'],
    autoAssignmentRules: {
      preferredEmployeeIds: ['3'],
      requireSpecialty: true,
      considerWorkload: true,
      considerRating: true,
      fallbackToAnyEmployee: false,
    },
    isActive: true,
    createdAt: new Date(),
  },
];

export const useLocationStore = create<LocationState>((set, get) => ({
  locations: mockLocations,
  employees: mockEmployees,
  services: mockServices,
  serviceCategories: mockServiceCategories,
  selectedLocation: mockLocations[0],
  
  addLocation: (location) => {
    const newLocation: Location = {
      ...location,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ locations: [...state.locations, newLocation] }));
  },
  
  updateLocation: (id, updates) => {
    set(state => ({
      locations: state.locations.map(loc => 
        loc.id === id ? { ...loc, ...updates } : loc
      )
    }));
  },
  
  setSelectedLocation: (location) => {
    set({ selectedLocation: location });
  },
  
  addEmployee: (employee) => {
    const newEmployee: Employee = {
      ...employee,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ employees: [...state.employees, newEmployee] }));
  },
  
  updateEmployee: (id, updates) => {
    set(state => ({
      employees: state.employees.map(emp => 
        emp.id === id ? { ...emp, ...updates } : emp
      )
    }));
  },
  
  addService: (service) => {
    const newService: Service = {
      ...service,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ services: [...state.services, newService] }));
  },
  
  updateService: (id, updates) => {
    set(state => ({
      services: state.services.map(svc => 
        svc.id === id ? { ...svc, ...updates } : svc
      )
    }));
  },

  addServiceCategory: (category) => {
    const newCategory: ServiceCategory = {
      ...category,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    set(state => ({ serviceCategories: [...state.serviceCategories, newCategory] }));
  },

  updateServiceCategory: (id, updates) => {
    set(state => ({
      serviceCategories: state.serviceCategories.map(cat => 
        cat.id === id ? { ...cat, ...updates } : cat
      )
    }));
  },

  deleteServiceCategory: (id) => {
    set(state => ({
      serviceCategories: state.serviceCategories.filter(cat => cat.id !== id),
      // Update services that use this category to use the category name instead
      services: state.services.map(service => 
        service.categoryId === id ? { ...service, categoryId: undefined } : service
      )
    }));
  },
  
  getEmployeesForLocation: (locationId) => {
    return get().employees.filter(emp => emp.locationId === locationId && emp.isActive);
  },
  
  getServicesForLocation: (locationId) => {
    return get().services.filter(svc => svc.locationId === locationId && svc.isActive);
  },

  getCategoriesForLocation: (locationId) => {
    return get().serviceCategories
      .filter(cat => cat.locationId === locationId && cat.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  },

  getAvailableEmployeeForServices: (locationId, serviceIds) => {
    const { employees, services } = get();
    const locationEmployees = employees.filter(emp => emp.locationId === locationId && emp.isActive);
    const requestedServices = services.filter(svc => serviceIds.includes(svc.id));
    
    const today = new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
    
    // Filter employees who are working today
    const workingEmployees = locationEmployees.filter(emp => {
      const schedule = emp.schedule[today];
      return schedule?.isWorking;
    });

    if (workingEmployees.length === 0) return null;

    // Find employees who can perform all requested services
    const qualifiedEmployees = workingEmployees.filter(emp => {
      return requestedServices.every(service => {
        // Check if employee is assigned to this service
        if (!service.assignedEmployeeIds.includes(emp.id)) return false;
        
        // Check skill level requirement
        const employeeSkillLevel = emp.skillLevel[service.id];
        const requiredSkillLevel = service.skillLevelRequired;
        
        const skillLevels = { 'beginner': 1, 'intermediate': 2, 'expert': 3 };
        return skillLevels[employeeSkillLevel] >= skillLevels[requiredSkillLevel];
      });
    });

    if (qualifiedEmployees.length === 0) {
      // Fallback: find employees with matching specialties
      const specialtyMatches = workingEmployees.filter(emp => {
        return requestedServices.some(service => {
          const serviceSpecialty = service.name.toLowerCase().replace(/\s+/g, '_').replace(/&/g, '');
          return emp.specialties.some(specialty => 
            specialty.includes(serviceSpecialty) || serviceSpecialty.includes(specialty)
          );
        });
      });

      if (specialtyMatches.length > 0) {
        // Return best available employee based on rating and workload
        return specialtyMatches.sort((a, b) => {
          const ratingDiff = b.performance.customerRating - a.performance.customerRating;
          if (Math.abs(ratingDiff) > 0.1) return ratingDiff;
          return a.performance.currentWorkload - b.performance.currentWorkload;
        })[0];
      }

      return null;
    }

    // Return best qualified employee based on multiple factors
    return qualifiedEmployees.sort((a, b) => {
      // Priority 1: Preferred employees for the services
      const aPreferredScore = requestedServices.reduce((score, service) => {
        const preferredIndex = service.autoAssignmentRules.preferredEmployeeIds.indexOf(a.id);
        return score + (preferredIndex >= 0 ? (10 - preferredIndex) : 0);
      }, 0);
      
      const bPreferredScore = requestedServices.reduce((score, service) => {
        const preferredIndex = service.autoAssignmentRules.preferredEmployeeIds.indexOf(b.id);
        return score + (preferredIndex >= 0 ? (10 - preferredIndex) : 0);
      }, 0);
      
      if (aPreferredScore !== bPreferredScore) {
        return bPreferredScore - aPreferredScore;
      }

      // Priority 2: Customer rating
      const ratingDiff = b.performance.customerRating - a.performance.customerRating;
      if (Math.abs(ratingDiff) > 0.1) return ratingDiff;

      // Priority 3: Current workload (lower is better)
      return a.performance.currentWorkload - b.performance.currentWorkload;
    })[0];
  },

  assignEmployeeToService: (employeeId, serviceId, skillLevel = 'intermediate') => {
    const { services, employees } = get();
    
    // Update service to include employee
    const updatedServices = services.map(service => {
      if (service.id === serviceId) {
        const assignedEmployeeIds = service.assignedEmployeeIds.includes(employeeId) 
          ? service.assignedEmployeeIds 
          : [...service.assignedEmployeeIds, employeeId];
        return { ...service, assignedEmployeeIds };
      }
      return service;
    });

    // Update employee to include service and skill level
    const updatedEmployees = employees.map(employee => {
      if (employee.id === employeeId) {
        const serviceIds = employee.serviceIds.includes(serviceId) 
          ? employee.serviceIds 
          : [...employee.serviceIds, serviceId];
        const skillLevelUpdates = { ...employee.skillLevel, [serviceId]: skillLevel };
        return { 
          ...employee, 
          serviceIds,
          skillLevel: skillLevelUpdates
        };
      }
      return employee;
    });

    set({ services: updatedServices, employees: updatedEmployees });
  },

  bulkAssignEmployeesToServices: (employeeIds, serviceIds) => {
    employeeIds.forEach(employeeId => {
      serviceIds.forEach(serviceId => {
        get().assignEmployeeToService(employeeId, serviceId);
      });
    });
  },

  getEmployeesForService: (serviceId) => {
    const { employees, services } = get();
    const service = services.find(svc => svc.id === serviceId);
    if (!service) return [];
    
    return employees.filter(emp => 
      service.assignedEmployeeIds.includes(emp.id) && emp.isActive
    );
  },

  getServicesForEmployee: (employeeId) => {
    const { services } = get();
    return services.filter(svc => 
      svc.assignedEmployeeIds.includes(employeeId) && svc.isActive
    );
  },
}));