import React, { useState, useEffect, useRef } from 'react';
import { Phone, User, Star } from 'lucide-react';
import { useCustomerStore } from '../../stores/customerStore';

interface CustomerAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCustomerSelect: (customer: any) => void;
  placeholder?: string;
  className?: string;
}

export function CustomerAutocomplete({ 
  value, 
  onChange, 
  onCustomerSelect, 
  placeholder = "(555) 123-4567",
  className = ""
}: CustomerAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { customers, getCustomerByPhone } = useCustomerStore();

  // Format phone number as user types
  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
    if (digits.length >= 6) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
    } else if (digits.length >= 3) {
      return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
    } else {
      return digits;
    }
  };

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatPhoneNumber(rawValue);
    onChange(formatted);

    // Auto-fill if exact match found (10+ digits)
    const digits = rawValue.replace(/\D/g, '');
    if (digits.length >= 10) {
      const customer = getCustomerByPhone(formatted);
      if (customer) {
        onCustomerSelect(customer);
        setIsOpen(false);
        return;
      }
    }

    // Show suggestions for partial matches
    if (rawValue.length >= 3) {
      const filtered = customers.filter(customer =>
        customer.phone.includes(rawValue) ||
        customer.name.toLowerCase().includes(rawValue.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  // Handle suggestion selection
  const handleSuggestionClick = (customer: any) => {
    onChange(customer.phone);
    onCustomerSelect(customer);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle focus
  const handleFocus = () => {
    if (value.length >= 3) {
      const filtered = customers.filter(customer =>
        customer.phone.includes(value) ||
        customer.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      
      setSuggestions(filtered);
      setIsOpen(filtered.length > 0);
    }
  };

  // Handle blur with delay to allow for clicks
  const handleBlur = () => {
    setTimeout(() => {
      setIsOpen(false);
    }, 200);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          ref={inputRef}
          type="tel"
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={`w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${className}`}
          placeholder={placeholder}
          maxLength={14}
        />
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
          {suggestions.map((customer, index) => (
            <button
              key={customer.phone}
              type="button"
              onClick={() => handleSuggestionClick(customer)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <p className="font-medium text-gray-900 truncate">{customer.name}</p>
                    {customer.visitCount > 5 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        <span className="text-xs text-gray-500">VIP</span>
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{customer.phone}</p>
                  {customer.preferredServices.length > 0 && (
                    <p className="text-xs text-gray-500 truncate">
                      Usually gets: {customer.preferredServices.slice(0, 2).join(', ')}
                      {customer.preferredServices.length > 2 && '...'}
                    </p>
                  )}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-xs text-gray-500">{customer.visitCount} visits</p>
                  <p className="text-xs text-gray-400">
                    Last: {new Date(customer.lastVisit).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}