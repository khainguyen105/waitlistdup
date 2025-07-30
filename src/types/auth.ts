export interface AuthUser {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  agencyId?: string;
  locationIds: string[];
  pinRequired: boolean;
  pinVerified: boolean;
  lastLoginAt?: Date;
  sessionExpiresAt?: Date;
  createdAt: Date;
}

export interface AuthSession {
  token: string;
  userId: string;
  expiresAt: Date;
  refreshToken: string;
  pinVerified: boolean;
  locationId?: string;
}

export interface PinCode {
  id: string;
  userId: string;
  locationId: string;
  hashedPin: string;
  salt: string;
  createdAt: Date;
  lastUsedAt?: Date;
  failedAttempts: number;
  lockedUntil?: Date;
}

export interface LoginAttempt {
  id: string;
  username?: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  failureReason?: string;
  timestamp: Date;
  locationId?: string;
}

export interface SecuritySettings {
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
  sessionTimeout: number; // minutes
  pinLength: number;
  requirePinForActions: string[];
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
}

export type UserRole = 'agency_admin' | 'location_manager' | 'staff' | 'customer';