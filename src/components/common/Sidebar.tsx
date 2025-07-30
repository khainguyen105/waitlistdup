import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  MapPin, 
  Settings, 
  LogOut,
  Clock,
  UserCog,
  Briefcase,
  Building,
  QrCode,
  UserCheck
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface SidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function Sidebar({ activeSection, onSectionChange }: SidebarProps) {
  const { user, logout } = useAuthStore();

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'queue', label: 'Queue Management', icon: Clock },
    ];

    const roleSpecificItems = {
      agency_admin: [
        { id: 'agencies', label: 'Agency Management', icon: Building },
        { id: 'locations', label: 'Locations', icon: MapPin },
        { id: 'qr-codes', label: 'QR Codes', icon: QrCode },
        { id: 'employees', label: 'Employees', icon: UserCog },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: UserCheck },
      ],
      location_manager: [
        { id: 'locations', label: 'Locations', icon: MapPin },
        { id: 'qr-codes', label: 'QR Codes', icon: QrCode },
        { id: 'employees', label: 'Employees', icon: UserCog },
        { id: 'services', label: 'Services', icon: Briefcase },
        { id: 'customers', label: 'Customers', icon: UserCheck },
      ],
      staff: [
        { id: 'qr-codes', label: 'QR Codes', icon: QrCode },
        { id: 'customers', label: 'Customers', icon: UserCheck },
      ],
      customer: [],
    };

    return [
      ...baseItems,
      ...(roleSpecificItems[user?.role || 'customer'] || []),
      { id: 'settings', label: 'Settings', icon: Settings },
    ];
  };

  const menuItems = getMenuItems();

  return (
    <div className="bg-white border-r border-gray-200 w-64 flex flex-col h-full">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
            <Clock className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-gray-900">QueueFlow</h1>
            <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors',
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3 mb-4">
          <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
            <Users className="w-5 h-5 text-gray-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user?.firstName} {user?.lastName}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center space-x-3 px-3 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );
}