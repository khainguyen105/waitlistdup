import React, { useState, useEffect } from 'react';
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
  UserCheck,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Activity,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface ResponsiveSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
}

export function ResponsiveSidebar({ activeSection, onSectionChange }: ResponsiveSidebarProps) {
  const { user, logout } = useAuthStore();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1280) {
        setIsCollapsed(true);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'queue', label: 'Queue Management', icon: Clock },
      { id: 'checkins', label: 'Check-in Management', icon: ClipboardList },
      { id: 'employee-availability', label: 'Employee Availability', icon: Activity },
      { id: 'queue-control', label: 'Queue Control', icon: Shield },
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
    <div className={cn(
      'hidden lg:flex flex-col h-full bg-white border-r border-gray-200 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">QueueFlow</h1>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
          )}
          
          {isCollapsed && (
            <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center mx-auto">
              <Clock className="w-6 h-6 text-white" />
            </div>
          )}
          
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onSectionChange(item.id)}
              className={cn(
                'w-full flex items-center rounded-lg text-left transition-colors group relative',
                isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2',
                activeSection === item.id
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
              
              {isCollapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && (
          <div className="flex items-center space-x-3 mb-4">
            <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        )}
        
        <button
          onClick={logout}
          className={cn(
            'w-full flex items-center rounded-lg transition-colors group relative',
            isCollapsed ? 'justify-center p-3' : 'space-x-3 px-3 py-2',
            'text-gray-600 hover:bg-gray-50'
          )}
          title={isCollapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5" />
          {!isCollapsed && <span className="font-medium">Sign Out</span>}
          
          {isCollapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
              Sign Out
            </div>
          )}
        </button>
      </div>
    </div>
  );
}