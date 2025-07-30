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
  Menu,
  X,
  ClipboardList,
  Activity,
  Shield
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../utils/cn';

interface MobileSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export function MobileSidebar({ activeSection, onSectionChange, isOpen, onToggle }: MobileSidebarProps) {
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.getElementById('mobile-menu-button');
      
      if (isOpen && sidebar && !sidebar.contains(event.target as Node) && 
          menuButton && !menuButton.contains(event.target as Node)) {
        onToggle();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onToggle();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onToggle]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

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

  const handleSectionChange = (section: string) => {
    onSectionChange(section);
    onToggle();
  };

  return (
    <>
      <div 
        className={cn(
          'fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onToggle}
        aria-hidden="true"
      />

      <div 
        id="mobile-sidebar"
        className={cn(
          'fixed top-0 left-0 h-full w-80 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
      >
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600 w-10 h-10 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">QueueFlow</h1>
                <p className="text-sm text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
            </div>
            <button
              onClick={onToggle}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close menu"
            >
              <X className="w-6 h-6 text-gray-600" />
            </button>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => handleSectionChange(item.id)}
                className={cn(
                  'w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors touch-manipulation',
                  activeSection === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 active:bg-gray-100'
                )}
                role="menuitem"
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center space-x-3 mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{user?.firstName} {user?.lastName}</p>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center space-x-3 px-4 py-3 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors touch-manipulation"
            role="menuitem"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
}