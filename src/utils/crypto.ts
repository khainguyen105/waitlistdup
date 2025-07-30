export class CryptoUtils {
  private static readonly SALT_LENGTH = 32;
  private static readonly ITERATIONS = 100000;
  private static readonly KEY_LENGTH = 64;

  /**
   * Generate a cryptographically secure random salt
   */
  static generateSalt(): string {
    const array = new Uint8Array(this.SALT_LENGTH);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Hash a password with salt using PBKDF2
   */
  static async hashPassword(password: string, salt: string): Promise<string> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);
    const saltBuffer = encoder.encode(salt);

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );

    const derivedKey = await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: this.ITERATIONS,
        hash: 'SHA-512'
      },
      keyMaterial,
      { name: 'HMAC', hash: 'SHA-512', length: this.KEY_LENGTH * 8 },
      true,
      ['sign']
    );

    const exportedKey = await window.crypto.subtle.exportKey('raw', derivedKey);
    return Array.from(new Uint8Array(exportedKey), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Verify a password against a hash
   */
  static async verifyPassword(password: string, hash: string, salt: string): Promise<boolean> {
    const computedHash = await this.hashPassword(password, salt);
    return this.constantTimeCompare(computedHash, hash);
  }

  /**
   * Hash a PIN code with salt
   */
  static async hashPin(pin: string, salt: string): Promise<string> {
    return await this.hashPassword(pin, salt);
  }

  /**
   * Verify a PIN against a hash
   */
  static async verifyPin(pin: string, hash: string, salt: string): Promise<boolean> {
    return await this.verifyPassword(pin, hash, salt);
  }

  /**
   * Generate a secure random token
   */
  static generateToken(length: number = 32): string {
    const array = new Uint8Array(length);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a random PIN of specified length
   */
  static generatePin(length: number = 4): string {
    const digits = '0123456789';
    let pin = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * digits.length);
      pin += digits[randomIndex];
    }
    return pin;
  }

  /**
   * Constant-time string comparison to prevent timing attacks
   */
  private static constantTimeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
  }

  /**
   * Create a SHA-256 hash of a string
   */
  static async sha256(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    return Array.from(new Uint8Array(hashBuffer), byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate a session token with embedded metadata
   */
  static async generateSessionToken(userId: string, locationId?: string): Promise<string> {
    const timestamp = Date.now().toString();
    const randomPart = this.generateToken(16);
    const metadata = `${userId}:${locationId || ''}:${timestamp}`;
    const signature = await this.sha256(metadata + randomPart);
    
    return btoa(`${metadata}:${randomPart}:${signature}`);
  }

  /**
   * Validate and parse a session token
   */
  static async parseSessionToken(token: string): Promise<{ userId: string; locationId?: string; timestamp: number } | null> {
    try {
      const decoded = atob(token);
      const parts = decoded.split(':');
      
      if (parts.length !== 5) return null;
      
      const [userId, locationId, timestamp, randomPart, signature] = parts;
      const metadata = `${userId}:${locationId}:${timestamp}`;
      const expectedSignature = await this.sha256(metadata + randomPart);
      
      if (!this.constantTimeCompare(signature, expectedSignature)) {
        return null;
      }
      
      return {
        userId,
        locationId: locationId || undefined,
        timestamp: parseInt(timestamp, 10)
      };
    } catch {
      return null;
    }
  }
}