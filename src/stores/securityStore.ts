import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { LoginAttempt, SecuritySettings, PinCode } from '../types/auth';
import { CryptoUtils } from '../utils/crypto';

interface SecurityState {
  loginAttempts: LoginAttempt[];
  pinCodes: PinCode[];
  securitySettings: SecuritySettings;
  blockedIPs: Set<string>;
  
  // Login attempt tracking
  recordLoginAttempt: (attempt: Omit<LoginAttempt, 'id' | 'timestamp'>) => void;
  getFailedAttempts: (username: string, ipAddress: string) => number;
  isAccountLocked: (username: string) => boolean;
  isIPBlocked: (ipAddress: string) => boolean;
  
  // PIN management
  createPin: (userId: string, locationId: string, pin: string) => Promise<boolean>;
  verifyPin: (userId: string, locationId: string, pin: string) => Promise<boolean>;
  resetPin: (userId: string, locationId: string) => Promise<string>;
  updatePinFailedAttempts: (userId: string, locationId: string, increment: boolean) => void;
  
  // Security settings
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  
  // Cleanup
  cleanupExpiredAttempts: () => void;
  cleanupExpiredLocks: () => void;
}

const defaultSecuritySettings: SecuritySettings = {
  maxLoginAttempts: 5,
  lockoutDuration: 15, // 15 minutes
  sessionTimeout: 480, // 8 hours
  pinLength: 4,
  requirePinForActions: ['queue_management', 'employee_management', 'settings'],
  passwordMinLength: 8,
  passwordRequireSpecialChars: true,
};

export const useSecurityStore = create<SecurityState>()(
  persist(
    (set, get) => ({
      loginAttempts: [],
      pinCodes: [],
      securitySettings: defaultSecuritySettings,
      blockedIPs: new Set(),

      recordLoginAttempt: (attempt) => {
        const newAttempt: LoginAttempt = {
          ...attempt,
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          timestamp: new Date(),
        };

        set(state => ({
          loginAttempts: [...state.loginAttempts, newAttempt]
        }));

        // Auto-cleanup old attempts
        setTimeout(() => {
          get().cleanupExpiredAttempts();
        }, 1000);
      },

      getFailedAttempts: (username, ipAddress) => {
        const { loginAttempts, securitySettings } = get();
        const cutoffTime = new Date(Date.now() - securitySettings.lockoutDuration * 60 * 1000);
        
        return loginAttempts.filter(attempt => 
          !attempt.success &&
          attempt.timestamp > cutoffTime &&
          (attempt.username === username || attempt.ipAddress === ipAddress)
        ).length;
      },

      isAccountLocked: (username) => {
        const { securitySettings } = get();
        const failedAttempts = get().getFailedAttempts(username, '');
        return failedAttempts >= securitySettings.maxLoginAttempts;
      },

      isIPBlocked: (ipAddress) => {
        const { blockedIPs, securitySettings } = get();
        if (blockedIPs.has(ipAddress)) return true;
        
        const failedAttempts = get().getFailedAttempts('', ipAddress);
        return failedAttempts >= securitySettings.maxLoginAttempts * 2; // IP blocks at 2x the account limit
      },

      createPin: async (userId, locationId, pin) => {
        try {
          const { securitySettings } = get();
          
          // Validate PIN length
          if (pin.length !== securitySettings.pinLength) {
            return false;
          }

          // Validate PIN contains only digits
          if (!/^\d+$/.test(pin)) {
            return false;
          }

          const salt = CryptoUtils.generateSalt();
          const hashedPin = await CryptoUtils.hashPin(pin, salt);

          const newPinCode: PinCode = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            userId,
            locationId,
            hashedPin,
            salt,
            createdAt: new Date(),
            failedAttempts: 0,
          };

          set(state => ({
            pinCodes: [
              ...state.pinCodes.filter(p => !(p.userId === userId && p.locationId === locationId)),
              newPinCode
            ]
          }));

          return true;
        } catch (error) {
          console.error('Failed to create PIN:', error);
          return false;
        }
      },

      verifyPin: async (userId, locationId, pin) => {
        try {
          const { pinCodes, securitySettings } = get();
          const pinCode = pinCodes.find(p => p.userId === userId && p.locationId === locationId);

          if (!pinCode) {
            return false;
          }

          // Check if PIN is locked
          if (pinCode.lockedUntil && pinCode.lockedUntil > new Date()) {
            return false;
          }

          const isValid = await CryptoUtils.verifyPin(pin, pinCode.hashedPin, pinCode.salt);

          if (isValid) {
            // Reset failed attempts and update last used
            set(state => ({
              pinCodes: state.pinCodes.map(p =>
                p.id === pinCode.id
                  ? { ...p, failedAttempts: 0, lastUsedAt: new Date(), lockedUntil: undefined }
                  : p
              )
            }));
            return true;
          } else {
            // Increment failed attempts
            const newFailedAttempts = pinCode.failedAttempts + 1;
            const shouldLock = newFailedAttempts >= securitySettings.maxLoginAttempts;
            const lockedUntil = shouldLock 
              ? new Date(Date.now() + securitySettings.lockoutDuration * 60 * 1000)
              : undefined;

            set(state => ({
              pinCodes: state.pinCodes.map(p =>
                p.id === pinCode.id
                  ? { ...p, failedAttempts: newFailedAttempts, lockedUntil }
                  : p
              )
            }));

            return false;
          }
        } catch (error) {
          console.error('Failed to verify PIN:', error);
          return false;
        }
      },

      resetPin: async (userId, locationId) => {
        try {
          const { securitySettings } = get();
          const newPin = CryptoUtils.generatePin(securitySettings.pinLength);
          
          const success = await get().createPin(userId, locationId, newPin);
          return success ? newPin : '';
        } catch (error) {
          console.error('Failed to reset PIN:', error);
          return '';
        }
      },

      updatePinFailedAttempts: (userId, locationId, increment) => {
        set(state => ({
          pinCodes: state.pinCodes.map(p =>
            p.userId === userId && p.locationId === locationId
              ? { 
                  ...p, 
                  failedAttempts: increment ? p.failedAttempts + 1 : 0,
                  lockedUntil: increment && p.failedAttempts + 1 >= state.securitySettings.maxLoginAttempts
                    ? new Date(Date.now() + state.securitySettings.lockoutDuration * 60 * 1000)
                    : undefined
                }
              : p
          )
        }));
      },

      updateSecuritySettings: (settings) => {
        set(state => ({
          securitySettings: { ...state.securitySettings, ...settings }
        }));
      },

      cleanupExpiredAttempts: () => {
        const { securitySettings } = get();
        const cutoffTime = new Date(Date.now() - securitySettings.lockoutDuration * 60 * 1000);
        
        set(state => ({
          loginAttempts: state.loginAttempts.filter(attempt => attempt.timestamp > cutoffTime)
        }));
      },

      cleanupExpiredLocks: () => {
        const now = new Date();
        set(state => ({
          pinCodes: state.pinCodes.map(p =>
            p.lockedUntil && p.lockedUntil <= now
              ? { ...p, lockedUntil: undefined, failedAttempts: 0 }
              : p
          )
        }));
      },
    }),
    {
      name: 'security-storage',
      partialize: (state) => ({
        pinCodes: state.pinCodes,
        securitySettings: state.securitySettings,
        loginAttempts: state.loginAttempts.slice(-100), // Keep only last 100 attempts
      }),
    }
  )
);