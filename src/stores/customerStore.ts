import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CustomerHistory {
  phone: string;
  name: string;
  email?: string;
  lastVisit: Date;
  visitCount: number;
  preferredServices: string[];
  notes?: string;
}

interface CustomerState {
  customers: CustomerHistory[];
  addCustomer: (customer: Omit<CustomerHistory, 'lastVisit' | 'visitCount'>) => void;
  updateCustomer: (phone: string, updates: Partial<CustomerHistory>) => void;
  deleteCustomer: (phone: string) => void;
  getCustomerByPhone: (phone: string) => CustomerHistory | null;
  recordVisit: (phone: string, services: string[]) => void;
  searchCustomers: (query: string) => CustomerHistory[];
}

export const useCustomerStore = create<CustomerState>()(
  persist(
    (set, get) => ({
      customers: [
        // Sample data for demo
        {
          phone: '(555) 123-4567',
          name: 'Alice Johnson',
          email: 'alice@email.com',
          lastVisit: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
          visitCount: 8,
          preferredServices: ['Haircut & Style', 'Hair Coloring'],
          notes: 'Prefers morning appointments'
        },
        {
          phone: '(555) 987-6543',
          name: 'Bob Smith',
          email: 'bob@email.com',
          lastVisit: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
          visitCount: 3,
          preferredServices: ['Haircut & Style', 'Beard Trim'],
        },
        {
          phone: '(555) 456-7890',
          name: 'Carol Davis',
          email: 'carol@email.com',
          lastVisit: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
          visitCount: 12,
          preferredServices: ['Hair Coloring', 'Haircut & Style'],
          notes: 'VIP customer, allergic to certain hair products'
        },
        {
          phone: '(555) 321-0987',
          name: 'David Wilson',
          lastVisit: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 1 month ago
          visitCount: 1,
          preferredServices: ['Haircut & Style'],
        },
        {
          phone: '(555) 654-3210',
          name: 'Emma Brown',
          email: 'emma@email.com',
          lastVisit: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
          visitCount: 6,
          preferredServices: ['Haircut & Style', 'Hair Coloring'],
        }
      ],
      
      addCustomer: (customer) => {
        const { customers } = get();
        const existingCustomer = customers.find(c => c.phone === customer.phone);
        
        if (existingCustomer) {
          // Update existing customer
          get().updateCustomer(customer.phone, {
            name: customer.name,
            email: customer.email,
            lastVisit: new Date(),
            visitCount: existingCustomer.visitCount + 1,
            preferredServices: [...new Set([...existingCustomer.preferredServices, ...customer.preferredServices])],
            notes: customer.notes
          });
        } else {
          // Add new customer
          const newCustomer: CustomerHistory = {
            ...customer,
            lastVisit: new Date(),
            visitCount: 1,
          };
          set({ customers: [...customers, newCustomer] });
        }
      },
      
      updateCustomer: (phone, updates) => {
        const { customers } = get();
        const updatedCustomers = customers.map(customer =>
          customer.phone === phone ? { ...customer, ...updates } : customer
        );
        set({ customers: updatedCustomers });
      },

      deleteCustomer: (phone) => {
        const { customers } = get();
        const filteredCustomers = customers.filter(customer => customer.phone !== phone);
        set({ customers: filteredCustomers });
      },
      
      getCustomerByPhone: (phone) => {
        const { customers } = get();
        return customers.find(c => c.phone === phone) || null;
      },
      
      recordVisit: (phone, services) => {
        const { customers } = get();
        const customer = customers.find(c => c.phone === phone);
        
        if (customer) {
          get().updateCustomer(phone, {
            lastVisit: new Date(),
            visitCount: customer.visitCount + 1,
            preferredServices: [...new Set([...customer.preferredServices, ...services])]
          });
        }
      },

      searchCustomers: (query) => {
        const { customers } = get();
        const lowercaseQuery = query.toLowerCase();
        
        return customers.filter(customer =>
          customer.name.toLowerCase().includes(lowercaseQuery) ||
          customer.phone.includes(query) ||
          (customer.email && customer.email.toLowerCase().includes(lowercaseQuery)) ||
          customer.preferredServices.some(service => 
            service.toLowerCase().includes(lowercaseQuery)
          )
        );
      },
    }),
    {
      name: 'customer-history-storage',
    }
  )
);