import React, { useState, useEffect } from 'react';
import { LogIn, User, Lock, Loader2, Shield, AlertCircle, MapPin } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useLocationStore } from '../../stores/locationStore';
import { useSecurityStore } from '../../stores/securityStore';
import { PinVerificationModal } from './PinVerificationModal';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

export function LoginForm() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    locationId: '',
  });
  const [error, setError] = useState('');
  const [showPinModal, setShowPinModal] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  
  const { login, isLoading, user } = useAuthStore();
  const { locations } = useLocationStore();
  const { securitySettings, getFailedAttempts } = useSecurityStore();

  // Auto-select location if user has only one
  useEffect(() => {
    if (user && user.locationIds.length === 1) {
      setFormData(prev => ({ ...prev, locationId: user.locationIds[0] }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!formData.username || !formData.password) {
      setError('Please enter both username and password');
      return;
    }

    if (!formData.locationId) {
      setError('Please select a location');
      return;
    }

    // Check failed attempts for this user
    const failedAttempts = getFailedAttempts(formData.username, '127.0.0.1');
    if (failedAttempts >= securitySettings.maxLoginAttempts) {
      setError(`Account temporarily locked. Please try again in ${securitySettings.lockoutDuration} minutes.`);
      return;
    }

    const result = await login(formData.username, formData.password, formData.locationId);
    
    if (result.success) {
      setLoginSuccess(true);
      if (result.requiresPin) {
        setShowPinModal(true);
      }
    } else {
      setError(result.error || 'Login failed. Please try again.');
    }
  };

  const handlePinSuccess = () => {
    setShowPinModal(false);
    // Navigation will be handled by the auth state change
  };

  const handlePinModalClose = () => {
    setShowPinModal(false);
    if (!loginSuccess) {
      // If PIN verification was cancelled and login wasn't complete, reset form
      setFormData(prev => ({ ...prev, password: '' }));
    }
  };

  const getLocationName = (locationId: string) => {
    const location = locations.find(loc => loc.id === locationId);
    return location?.name || 'Unknown Location';
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-8">
          <div className="text-center mb-8">
            <div className="bg-blue-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure Login</h1>
            <p className="text-gray-600">Sign in to your queue management account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Location Selection */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <select
                  id="location"
                  value={formData.locationId}
                  onChange={(e) => setFormData(prev => ({ ...prev, locationId: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  required
                >
                  <option value="">Select a location</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                Username *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="username"
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your username"
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password *
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  required
                  autoComplete="current-password"
                />
              </div>
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

            {/* Security Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-blue-900">Enhanced Security</p>
                  <p className="text-xs text-blue-700">
                    PIN verification required for sensitive operations
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <TouchFriendlyButton
              type="submit"
              disabled={isLoading || !formData.username || !formData.password || !formData.locationId}
              loading={isLoading}
              fullWidth
              className="text-lg py-4"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign In'
              )}
            </TouchFriendlyButton>
          </form>

          {/* Demo Credentials */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-medium mb-2">Demo Credentials:</p>
            <div className="text-xs text-gray-500 space-y-1">
              <div>Agency Admin: khainguyen105 / khai123</div>
              <div>Manager: manager1 / manager1</div>
              <div>Staff: staff1 / staff1</div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Default PIN: 1234 (for demo purposes)
            </p>
          </div>

          {/* Security Info */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Maximum {securitySettings.maxLoginAttempts} login attempts allowed.
              Account locks for {securitySettings.lockoutDuration} minutes after failed attempts.
            </p>
          </div>
        </div>
      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={handlePinModalClose}
        onSuccess={handlePinSuccess}
        locationId={formData.locationId}
        title="Complete Login"
        description={`Enter your PIN for ${getLocationName(formData.locationId)}`}
      />
    </>
  );
}