import React, { useState } from 'react';
import { Calendar, AlertCircle } from 'lucide-react';

interface BirthdayFieldProps {
  value?: Date;
  onChange: (date: Date | undefined) => void;
  error?: string;
}

export function BirthdayField({ value, onChange, error }: BirthdayFieldProps) {
  const [inputValue, setInputValue] = useState(
    value ? formatDateForInput(value) : ''
  );

  function formatDateForInput(date: Date): string {
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
  }

  function parseInputDate(input: string): Date | null {
    // Remove any non-digit characters except /
    const cleaned = input.replace(/[^\d/]/g, '');
    
    // Auto-format as MM/DD/YYYY
    let formatted = cleaned;
    if (cleaned.length >= 2 && !cleaned.includes('/')) {
      formatted = cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    if (cleaned.length >= 5 && cleaned.split('/').length === 2) {
      const parts = cleaned.split('/');
      formatted = parts[0] + '/' + parts[1] + '/' + cleaned.slice(5);
    }

    // Parse the date
    const parts = formatted.split('/');
    if (parts.length === 3) {
      const month = parseInt(parts[0], 10);
      const day = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      // Basic validation
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31 && year >= 1900 && year <= new Date().getFullYear()) {
        const date = new Date(year, month - 1, day);
        // Check if the date is valid (handles invalid dates like Feb 30)
        if (date.getMonth() === month - 1 && date.getDate() === day && date.getFullYear() === year) {
          return date;
        }
      }
    }

    return null;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Auto-format the input
    let formatted = input.replace(/[^\d/]/g, '');
    
    // Add slashes automatically
    if (formatted.length >= 2 && formatted.charAt(2) !== '/') {
      formatted = formatted.slice(0, 2) + '/' + formatted.slice(2);
    }
    if (formatted.length >= 5 && formatted.charAt(5) !== '/') {
      formatted = formatted.slice(0, 5) + '/' + formatted.slice(5);
    }
    
    // Limit to MM/DD/YYYY format
    if (formatted.length > 10) {
      formatted = formatted.slice(0, 10);
    }

    setInputValue(formatted);

    // Try to parse and update the date
    const parsedDate = parseInputDate(formatted);
    onChange(parsedDate || undefined);
  };

  const handleBlur = () => {
    // Validate the final input
    if (inputValue && !parseInputDate(inputValue)) {
      setInputValue('');
      onChange(undefined);
    }
  };

  return (
    <div>
      <div className="relative">
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleBlur}
          placeholder="MM/DD/YYYY"
          className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors ${
            error ? 'border-red-300 bg-red-50' : 'border-gray-300'
          }`}
          maxLength={10}
          inputMode="numeric"
        />
      </div>
      
      {error && (
        <div className="mt-2 flex items-center space-x-2 text-red-600">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="text-sm">{error}</span>
        </div>
      )}
      
      <p className="mt-2 text-xs text-gray-500">
        Must be at least 13 years old. We use this to send you birthday specials!
      </p>
    </div>
  );
}