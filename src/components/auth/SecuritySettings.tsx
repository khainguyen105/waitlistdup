import React, { useState } from 'react';
import { Shield, Clock, Lock, AlertTriangle, Save, RefreshCw } from 'lucide-react';
import { useSecurityStore } from '../../stores/securityStore';
import { useAuthStore } from '../../stores/authStore';
import { TouchFriendlyButton } from '../common/TouchFriendlyButton';

export function SecuritySettings() {
  const { securitySettings, updateSecuritySettings, loginAttempts, pinCodes } = useSecurityStore();
  const { user, hasPermission } = useAuthStore();
  
  const [settings, setSettings] = useState(securitySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const canManageSecurity = hasPermission('security_management') || user?.role === 'agency_admin';

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      updateSecuritySettings(settings);
      
      // Show success message (in real app, use toast notification)
      alert('Security settings updated successfully');
    } catch (error) {
      alert('Failed to update security settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(securitySettings);
  };

  const getRecentLoginAttempts = () => {
    const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return loginAttempts.filter(attempt => attempt.timestamp > last24Hours);
  };

  const getFailedAttempts = () => {
    return getRecentLoginAttempts().filter(attempt => !attempt.success);
  };

  const getActivePins = () => {
    return pinCodes.filter(pin => !pin.lockedUntil || pin.lockedUntil <= new Date());
  };

  const recentAttempts = getRecentLoginAttempts();
  const failedAttempts = getFailedAttempts();
  const activePins = getActivePins();

  if (!canManageSecurity) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Restricted</h3>
        <p className="text-gray-600">You don't have permission to view security settings.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Security Settings</h2>
          <p className="text-gray-600">Manage authentication and security policies</p>
        </div>
        <div className="flex items-center space-x-3">
          <TouchFriendlyButton
            variant="outline"
            onClick={handleReset}
            disabled={isSaving}
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset
          </TouchFriendlyButton>
          <TouchFriendlyButton
            onClick={handleSave}
            loading={isSaving}
            disabled={JSON.stringify(settings) === JSON.stringify(securitySettings)}
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </TouchFriendlyButton>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-blue-600 mb-2">{recentAttempts.length}</div>
          <div className="text-sm text-gray-600">Login Attempts (24h)</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-red-600 mb-2">{failedAttempts.length}</div>
          <div className="text-sm text-gray-600">Failed Attempts</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-green-600 mb-2">{activePins.length}</div>
          <div className="text-sm text-gray-600">Active PINs</div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="text-2xl font-bold text-purple-600 mb-2">{settings.sessionTimeout}</div>
          <div className="text-sm text-gray-600">Session Timeout (min)</div>
        </div>
      </div>

      {/* Authentication Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Lock className="w-5 h-5 mr-2" />
          Authentication Settings
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maximum Login Attempts
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings(prev => ({ ...prev, maxLoginAttempts: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Account locks after this many failed attempts
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lockout Duration (minutes)
            </label>
            <input
              type="number"
              min="5"
              max="60"
              value={settings.lockoutDuration}
              onChange={(e) => setSettings(prev => ({ ...prev, lockoutDuration: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              How long accounts remain locked
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Session Timeout (minutes)
            </label>
            <input
              type="number"
              min="30"
              max="1440"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings(prev => ({ ...prev, sessionTimeout: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              Automatic logout after inactivity
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              PIN Length
            </label>
            <select
              value={settings.pinLength}
              onChange={(e) => setSettings(prev => ({ ...prev, pinLength: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value={4}>4 digits</option>
              <option value={5}>5 digits</option>
              <option value={6}>6 digits</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Required length for PIN codes
            </p>
          </div>
        </div>
      </div>

      {/* Password Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="w-5 h-5 mr-2" />
          Password Requirements
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Minimum Password Length
            </label>
            <input
              type="number"
              min="6"
              max="20"
              value={settings.passwordMinLength}
              onChange={(e) => setSettings(prev => ({ ...prev, passwordMinLength: parseInt(e.target.value) }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={settings.passwordRequireSpecialChars}
                onChange={(e) => setSettings(prev => ({ ...prev, passwordRequireSpecialChars: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Require special characters
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Passwords must contain symbols (!@#$%^&*)
            </p>
          </div>
        </div>
      </div>

      {/* PIN Requirements */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2" />
          PIN Requirements
        </h3>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Actions Requiring PIN Verification
          </label>
          <div className="space-y-2">
            {[
              { id: 'queue_management', label: 'Queue Management' },
              { id: 'employee_management', label: 'Employee Management' },
              { id: 'settings', label: 'Settings Changes' },
              { id: 'customer_data', label: 'Customer Data Access' },
              { id: 'reports', label: 'Report Generation' },
            ].map((action) => (
              <label key={action.id} className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={settings.requirePinForActions.includes(action.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSettings(prev => ({
                        ...prev,
                        requirePinForActions: [...prev.requirePinForActions, action.id]
                      }));
                    } else {
                      setSettings(prev => ({
                        ...prev,
                        requirePinForActions: prev.requirePinForActions.filter(id => id !== action.id)
                      }));
                    }
                  }}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{action.label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Advanced Security
          </h3>
          <TouchFriendlyButton
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
          >
            {showAdvanced ? 'Hide' : 'Show'} Advanced
          </TouchFriendlyButton>
        </div>

        {showAdvanced && (
          <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm font-medium text-yellow-800">
                  Advanced settings can affect system security and user experience
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recent Login Attempts</h4>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {recentAttempts.slice(0, 10).map((attempt) => (
                    <div key={attempt.id} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
                      <span className={attempt.success ? 'text-green-600' : 'text-red-600'}>
                        {attempt.success ? '✓' : '✗'}
                      </span>
                      {' '}
                      {attempt.username || 'Unknown'} - {attempt.timestamp.toLocaleTimeString()}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-2">PIN Status</h4>
                <div className="max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                  {activePins.slice(0, 10).map((pin) => (
                    <div key={pin.id} className="text-xs text-gray-600 py-1 border-b border-gray-100 last:border-b-0">
                      User {pin.userId} - Location {pin.locationId}
                      {pin.lastUsedAt && (
                        <span className="text-gray-500 ml-2">
                          (Last used: {pin.lastUsedAt.toLocaleDateString()})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}