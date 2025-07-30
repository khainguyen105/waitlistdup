import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AuthUser, AuthSession } from '../types/auth';
import { CryptoUtils } from '../utils/crypto';
import { useSecurityStore } from './securityStore';

interface AuthState {
  user: AuthUser | null;
  session: AuthSession | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  requiresPinVerification: boolean;
  
  // Authentication methods
  login: (username: string, password: string, locationId?: string) => Promise<{ success: boolean; requiresPin?: boolean; error?: string }>;
  verifyPin: (pin: string, locationId: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  refreshSession: () => Promise<boolean>;
  
  // Session management
  isSessionValid: () => boolean;
  extendSession: () => void;
  invalidateSession: () => void;
  
  // PIN management
  setupPin: (pin: string, locationId: string) => Promise<boolean>;
  resetUserPin: (locationId: string) => Promise<string>;
  
  // Utility methods
  setLoading: (loading: boolean) => void;
  getCurrentUser: () => AuthUser | null;
  hasPermission: (action: string) => boolean;
}

// Mock user data with enhanced security
const mockUsers = [
  {
    id: '1',
    username: 'khainguyen105',
    email: 'khai@agency.com',
    role: 'agency_admin' as const,
    firstName: 'Khai',
    lastName: 'Nguyen',
    locationIds: ['1', '2'],
    pinRequired: true,
    pinVerified: false,
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'khai123'
    salt: 'randomsalt123',
    createdAt: new Date(),
  },
  {
    id: '2',
    username: 'manager1',
    email: 'manager@location.com',
    role: 'location_manager' as const,
    firstName: 'John',
    lastName: 'Manager',
    agencyId: '1',
    locationIds: ['1'],
    pinRequired: true,
    pinVerified: false,
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'manager1'
    salt: 'randomsalt456',
    createdAt: new Date(),
  },
  {
    id: '3',
    username: 'staff1',
    email: 'staff@location.com',
    role: 'staff' as const,
    firstName: 'Jane',
    lastName: 'Staff',
    agencyId: '1',
    locationIds: ['1'],
    pinRequired: true,
    pinVerified: false,
    passwordHash: '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', // 'staff1'
    salt: 'randomsalt789',
    createdAt: new Date(),
  },
];

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isAuthenticated: false,
      isLoading: false,
      requiresPinVerification: false,

      login: async (username: string, password: string, locationId?: string) => {
        set({ isLoading: true });
        
        try {
          // Get client IP (in real app, this would come from server)
          const ipAddress = '127.0.0.1';
          const userAgent = navigator.userAgent;
          
          // Check if IP is blocked
          const securityStore = useSecurityStore.getState();
          if (securityStore.isIPBlocked(ipAddress)) {
            securityStore.recordLoginAttempt({
              username,
              ipAddress,
              userAgent,
              success: false,
              failureReason: 'IP_BLOCKED',
              locationId,
            });
            
            set({ isLoading: false });
            return { success: false, error: 'Too many failed attempts. Please try again later.' };
          }

          // Check if account is locked
          if (securityStore.isAccountLocked(username)) {
            securityStore.recordLoginAttempt({
              username,
              ipAddress,
              userAgent,
              success: false,
              failureReason: 'ACCOUNT_LOCKED',
              locationId,
            });
            
            set({ isLoading: false });
            return { success: false, error: 'Account is temporarily locked due to too many failed attempts.' };
          }

          // Simulate API call delay
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Find user and verify credentials
          const mockUser = mockUsers.find(u => u.username === username);
          
          if (!mockUser) {
            securityStore.recordLoginAttempt({
              username,
              ipAddress,
              userAgent,
              success: false,
              failureReason: 'INVALID_USERNAME',
              locationId,
            });
            
            set({ isLoading: false });
            return { success: false, error: 'Invalid username or password.' };
          }

          // Verify password (in real app, use proper password hashing)
          const isValidPassword = password === username || 
            (username === 'khainguyen105' && password === 'khai123');

          if (!isValidPassword) {
            securityStore.recordLoginAttempt({
              username,
              ipAddress,
              userAgent,
              success: false,
              failureReason: 'INVALID_PASSWORD',
              locationId,
            });
            
            set({ isLoading: false });
            return { success: false, error: 'Invalid username or password.' };
          }

          // Create session
          const sessionTimeout = securityStore.securitySettings.sessionTimeout;
          const expiresAt = new Date(Date.now() + sessionTimeout * 60 * 1000);
          
          const session: AuthSession = {
            token: await CryptoUtils.generateSessionToken(mockUser.id, locationId),
            userId: mockUser.id,
            expiresAt,
            refreshToken: CryptoUtils.generateToken(),
            pinVerified: false,
            locationId,
          };

          const user: AuthUser = {
            ...mockUser,
            pinVerified: false,
            lastLoginAt: new Date(),
            sessionExpiresAt: expiresAt,
          };

          // Record successful login
          securityStore.recordLoginAttempt({
            username,
            ipAddress,
            userAgent,
            success: true,
            locationId,
          });

          set({
            user,
            session,
            isAuthenticated: true,
            isLoading: false,
            requiresPinVerification: mockUser.pinRequired,
          });

          return { 
            success: true, 
            requiresPin: mockUser.pinRequired 
          };

        } catch (error) {
          console.error('Login error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
      },

      verifyPin: async (pin: string, locationId: string) => {
        const { user } = get();
        if (!user) {
          return { success: false, error: 'No active session found.' };
        }

        set({ isLoading: true });

        try {
          const securityStore = useSecurityStore.getState();
          const isValidPin = await securityStore.verifyPin(user.id, locationId, pin);

          if (isValidPin) {
            set(state => ({
              user: state.user ? { ...state.user, pinVerified: true } : null,
              session: state.session ? { ...state.session, pinVerified: true } : null,
              requiresPinVerification: false,
              isLoading: false,
            }));

            return { success: true };
          } else {
            set({ isLoading: false });
            return { success: false, error: 'Invalid PIN. Please try again.' };
          }
        } catch (error) {
          console.error('PIN verification error:', error);
          set({ isLoading: false });
          return { success: false, error: 'An error occurred during PIN verification.' };
        }
      },

      logout: () => {
        // Invalidate session on server (in real app)
        set({
          user: null,
          session: null,
          isAuthenticated: false,
          requiresPinVerification: false,
        });

        // Clear any cached data
        localStorage.removeItem('auth-storage');
      },

      refreshSession: async () => {
        const { session, user } = get();
        
        if (!session || !user) {
          return false;
        }

        // Check if session is still valid
        if (new Date() >= session.expiresAt) {
          get().logout();
          return false;
        }

        // Extend session if it's close to expiring (within 30 minutes)
        const thirtyMinutes = 30 * 60 * 1000;
        if (session.expiresAt.getTime() - Date.now() < thirtyMinutes) {
          get().extendSession();
        }

        return true;
      },

      isSessionValid: () => {
        const { session } = get();
        return session ? new Date() < session.expiresAt : false;
      },

      extendSession: () => {
        const securityStore = useSecurityStore.getState();
        const sessionTimeout = securityStore.securitySettings.sessionTimeout;
        const newExpiresAt = new Date(Date.now() + sessionTimeout * 60 * 1000);

        set(state => ({
          session: state.session ? { ...state.session, expiresAt: newExpiresAt } : null,
          user: state.user ? { ...state.user, sessionExpiresAt: newExpiresAt } : null,
        }));
      },

      invalidateSession: () => {
        set({
          session: null,
          isAuthenticated: false,
          requiresPinVerification: false,
        });
      },

      setupPin: async (pin: string, locationId: string) => {
        const { user } = get();
        if (!user) return false;

        const securityStore = useSecurityStore.getState();
        return await securityStore.createPin(user.id, locationId, pin);
      },

      resetUserPin: async (locationId: string) => {
        const { user } = get();
        if (!user) return '';

        const securityStore = useSecurityStore.getState();
        return await securityStore.resetPin(user.id, locationId);
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      getCurrentUser: () => {
        return get().user;
      },

      hasPermission: (action: string) => {
        const { user, session } = get();
        if (!user || !session) return false;

        const securityStore = useSecurityStore.getState();
        const requiresPinActions = securityStore.securitySettings.requirePinForActions;

        // If action requires PIN and PIN is not verified
        if (requiresPinActions.includes(action) && !session.pinVerified) {
          return false;
        }

        // Role-based permissions
        switch (user.role) {
          case 'agency_admin':
            return true;
          case 'location_manager':
            return !['agency_management'].includes(action);
          case 'staff':
            return ['queue_management', 'customer_service'].includes(action);
          default:
            return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        session: state.session,
        isAuthenticated: state.isAuthenticated,
        requiresPinVerification: state.requiresPinVerification,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.session) {
          // Convert date strings back to Date objects
          state.session.expiresAt = new Date(state.session.expiresAt);
          
          // Check if session is still valid
          if (new Date() >= state.session.expiresAt) {
            state.user = null;
            state.session = null;
            state.isAuthenticated = false;
            state.requiresPinVerification = false;
          }
        }
      },
    }
  )
);

// Auto-refresh session every 5 minutes
setInterval(() => {
  const authStore = useAuthStore.getState();
  if (authStore.isAuthenticated) {
    authStore.refreshSession();
  }
}, 5 * 60 * 1000);

// Cleanup expired security data every hour
setInterval(() => {
  const securityStore = useSecurityStore.getState();
  securityStore.cleanupExpiredAttempts();
  securityStore.cleanupExpiredLocks();
}, 60 * 60 * 1000);