import React, { useState, useEffect } from 'react';
import { Shield, X, AlertCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface PinVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationId?: string;
  title?: string;
  description?: string;
}

export function PinVerificationModal({
  isOpen,
  onClose,
  onSuccess,
  locationId,
  title = 'PIN Verification Required',
  description = 'Please enter your PIN to continue'
}: PinVerificationModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attempts, setAttempts] = useState(0);

  const { verifyPin, user } = useAuthStore();
  const { selectedLocation } = useLocationStore();

  const currentLocationId = locationId || selectedLocation?.id || '';

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setError('');
      setAttempts(0);
    }
  }, [isOpen]);

  const handlePinChange = (value: string) => {
    // Only allow digits and limit to 6 characters
    const numericValue = value.replace(/\D/g, '').slice(0, 6);
    setPin(numericValue);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!pin || pin.length < 4) {
      setError('Please enter a valid PIN');
      return;
    }

    if (!currentLocationId) {
      setError('No location selected');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const result = await verifyPin(pin, currentLocationId);
      
      if (result.success) {
        onSuccess();
        onClose();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(result.error || 'Invalid PIN');
        setPin('');

        if (newAttempts >= 3) {
          setError('Too many failed attempts. Please contact your supervisor.');
          setTimeout(() => {
            onClose();
          }, 3000);
        }
      }
    } catch (error) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit(e as any);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
                <p className="text-sm text-gray-600">{description}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 w-10 h-10 rounded-full flex items-center justify-center">
                <span className="text-blue-600 font-medium text-sm">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-sm text-gray-600 capitalize">
                  {user?.role?.replace('_', ' ')}
                </p>
              </div>
            </div>
          </div>

          {/* PIN Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Enter your PIN
            </label>
            <div className="flex justify-center">
              <input
                type="password"
                value={pin}
                onChange={(e) => handlePinChange(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-32 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="••••"
                maxLength={6}
                autoFocus
                disabled={isSubmitting}
              />
            </div>
            <p className="text-xs text-gray-500 text-center mt-2">
              Enter your 4-6 digit PIN
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              {attempts > 0 && attempts < 3 && (
                <p className="text-xs text-red-600 mt-1">
                  Attempts remaining: {3 - attempts}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <TouchFriendlyButton
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              fullWidth
            >
              Cancel
            </TouchFriendlyButton>
            <TouchFriendlyButton
              type="submit"
              disabled={!pin || pin.length < 4 || isSubmitting}
              loading={isSubmitting}
              fullWidth
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify PIN'
              )}
            </TouchFriendlyButton>
          </div>

          {/* Help Text */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              Forgot your PIN? Contact your supervisor for assistance.
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}