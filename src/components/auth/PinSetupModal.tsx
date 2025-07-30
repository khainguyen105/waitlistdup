import React, { useState } from 'react';
import { Shield, X, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useSecurityStore } from '../../stores/securityStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  locationId: string;
  locationName: string;
}

export function PinSetupModal({
  isOpen,
  onClose,
  onSuccess,
  locationId,
  locationName
}: PinSetupModalProps) {
  const [step, setStep] = useState<'setup' | 'confirm'>('setup');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { setupPin, user } = useAuthStore();
  const { securitySettings } = useSecurityStore();

  const handlePinChange = (value: string, isConfirm = false) => {
    const numericValue = value.replace(/\D/g, '').slice(0, securitySettings.pinLength);
    
    if (isConfirm) {
      setConfirmPin(numericValue);
    } else {
      setPin(numericValue);
    }
    
    setError('');
  };

  const handleSetupSubmit = () => {
    if (pin.length !== securitySettings.pinLength) {
      setError(`PIN must be exactly ${securitySettings.pinLength} digits`);
      return;
    }

    // Check for weak PINs
    const weakPatterns = [
      /^(\d)\1+$/, // All same digits (1111, 2222, etc.)
      /^1234$/, // Sequential
      /^4321$/, // Reverse sequential
      /^0000$/, // All zeros
    ];

    if (weakPatterns.some(pattern => pattern.test(pin))) {
      setError('Please choose a stronger PIN. Avoid repeated digits or sequential numbers.');
      return;
    }

    setStep('confirm');
  };

  const handleConfirmSubmit = async () => {
    if (pin !== confirmPin) {
      setError('PINs do not match. Please try again.');
      setConfirmPin('');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const success = await setupPin(pin, locationId);
      
      if (success) {
        onSuccess();
        onClose();
        // Reset form
        setStep('setup');
        setPin('');
        setConfirmPin('');
      } else {
        setError('Failed to set up PIN. Please try again.');
      }
    } catch (error) {
      setError('An error occurred while setting up your PIN.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    setStep('setup');
    setConfirmPin('');
    setError('');
  };

  const handleClose = () => {
    setStep('setup');
    setPin('');
    setConfirmPin('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Set Up Your PIN</h2>
                <p className="text-sm text-gray-600">{locationName}</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
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

          {step === 'setup' ? (
            <>
              {/* PIN Setup */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Create a {securitySettings.pinLength}-digit PIN
                </label>
                <div className="flex justify-center">
                  <input
                    type="password"
                    value={pin}
                    onChange={(e) => handlePinChange(e.target.value)}
                    className="w-32 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••"
                    maxLength={securitySettings.pinLength}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Enter {securitySettings.pinLength} digits
                </p>
              </div>

              {/* Security Guidelines */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">PIN Security Guidelines:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Avoid using repeated digits (1111, 2222)</li>
                  <li>• Don't use sequential numbers (1234, 4321)</li>
                  <li>• Choose something memorable but not obvious</li>
                  <li>• Keep your PIN confidential</li>
                </ul>
              </div>

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <TouchFriendlyButton
                onClick={handleSetupSubmit}
                disabled={pin.length !== securitySettings.pinLength}
                fullWidth
              >
                Continue
              </TouchFriendlyButton>
            </>
          ) : (
            <>
              {/* PIN Confirmation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Confirm your PIN
                </label>
                <div className="flex justify-center">
                  <input
                    type="password"
                    value={confirmPin}
                    onChange={(e) => handlePinChange(e.target.value, true)}
                    className="w-32 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-lg py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="••••"
                    maxLength={securitySettings.pinLength}
                    autoFocus
                  />
                </div>
                <p className="text-xs text-gray-500 text-center mt-2">
                  Re-enter your {securitySettings.pinLength}-digit PIN
                </p>
              </div>

              {/* Success Message */}
              {confirmPin.length === securitySettings.pinLength && pin === confirmPin && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                    <p className="text-sm text-green-700">PINs match! Ready to set up.</p>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <TouchFriendlyButton
                  variant="outline"
                  onClick={handleBack}
                  disabled={isSubmitting}
                  fullWidth
                >
                  Back
                </TouchFriendlyButton>
                <TouchFriendlyButton
                  onClick={handleConfirmSubmit}
                  disabled={confirmPin.length !== securitySettings.pinLength || pin !== confirmPin || isSubmitting}
                  loading={isSubmitting}
                  fullWidth
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Setting up...
                    </>
                  ) : (
                    'Set Up PIN'
                  )}
                </TouchFriendlyButton>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}