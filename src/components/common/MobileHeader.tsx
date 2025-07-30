import React from 'react';
import { Menu, Bell, Search } from 'lucide-react';
import { cn } from '../../utils/cn';

interface MobileHeaderProps {
  title: string;
  subtitle?: string;
  onMenuToggle: () => void;
  actions?: React.ReactNode;
}

export function MobileHeader({ title, subtitle, onMenuToggle, actions }: MobileHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 px-4 py-3 lg:hidden">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            id="mobile-menu-button"
            onClick={onMenuToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors touch-manipulation"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-lg font-semibold text-gray-900 truncate">{title}</h1>
            {subtitle && (
              <p className="text-sm text-gray-500 truncate">{subtitle}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {actions}
        </div>
      </div>
    </header>
  );
}