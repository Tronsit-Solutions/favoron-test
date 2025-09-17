// Enhanced session security and monitoring utilities

import { SecurityMonitor } from './securityMonitoring';

interface SessionConfig {
  maxIdleTime: number; // milliseconds
  maxSessionTime: number; // milliseconds
  checkInterval: number; // milliseconds
}

const DEFAULT_SESSION_CONFIG: SessionConfig = {
  maxIdleTime: 30 * 60 * 1000, // 30 minutes
  maxSessionTime: 8 * 60 * 60 * 1000, // 8 hours
  checkInterval: 60 * 1000 // 1 minute
};

class SessionSecurityManager {
  private config: SessionConfig;
  private lastActivity: number;
  private sessionStart: number;
  private checkInterval: NodeJS.Timeout | null = null;
  private onSessionExpired?: () => void;

  constructor(config: Partial<SessionConfig> = {}) {
    this.config = { ...DEFAULT_SESSION_CONFIG, ...config };
    this.lastActivity = Date.now();
    this.sessionStart = Date.now();
  }

  /**
   * Initialize session security monitoring
   */
  start(onSessionExpired?: () => void): void {
    this.onSessionExpired = onSessionExpired;
    this.updateActivity();
    
    // Set up periodic session checks
    this.checkInterval = setInterval(() => {
      this.checkSessionValidity();
    }, this.config.checkInterval);

    // Monitor user activity
    this.setupActivityListeners();

    SecurityMonitor.logEvent({
      type: 'auth_attempt',
      details: {
        action: 'session_started',
        timestamp: this.sessionStart
      }
    });
  }

  /**
   * Stop session monitoring
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.removeActivityListeners();
  }

  /**
   * Update last activity timestamp
   */
  updateActivity(): void {
    this.lastActivity = Date.now();
  }

  /**
   * Check if current session is valid
   */
  isSessionValid(): boolean {
    const now = Date.now();
    const idleTime = now - this.lastActivity;
    const sessionTime = now - this.sessionStart;

    return idleTime <= this.config.maxIdleTime && 
           sessionTime <= this.config.maxSessionTime;
  }

  /**
   * Get remaining session time
   */
  getSessionInfo(): {
    remainingIdleTime: number;
    remainingSessionTime: number;
    isValid: boolean;
  } {
    const now = Date.now();
    const idleTime = now - this.lastActivity;
    const sessionTime = now - this.sessionStart;

    return {
      remainingIdleTime: Math.max(0, this.config.maxIdleTime - idleTime),
      remainingSessionTime: Math.max(0, this.config.maxSessionTime - sessionTime),
      isValid: this.isSessionValid()
    };
  }

  /**
   * Force session expiration
   */
  expireSession(): void {
    SecurityMonitor.logEvent({
      type: 'auth_attempt',
      details: {
        action: 'session_expired',
        reason: 'forced_expiration',
        sessionDuration: Date.now() - this.sessionStart
      }
    });

    this.onSessionExpired?.();
  }

  private checkSessionValidity(): void {
    if (!this.isSessionValid()) {
      const now = Date.now();
      const idleTime = now - this.lastActivity;
      const sessionTime = now - this.sessionStart;

      const reason = idleTime > this.config.maxIdleTime ? 'idle_timeout' : 'max_session_time';

      SecurityMonitor.logEvent({
        type: 'auth_attempt',
        details: {
          action: 'session_expired',
          reason,
          idleTime,
          sessionTime,
          sessionDuration: sessionTime
        }
      });

      this.onSessionExpired?.();
    }
  }

  private setupActivityListeners(): void {
    // Mouse and keyboard activity
    const updateActivity = () => this.updateActivity();
    
    document.addEventListener('mousedown', updateActivity, true);
    document.addEventListener('mousemove', updateActivity, true);
    document.addEventListener('keydown', updateActivity, true);
    document.addEventListener('scroll', updateActivity, true);
    document.addEventListener('touchstart', updateActivity, true);

    // Store listeners for cleanup
    this.activityListeners = [
      { event: 'mousedown', handler: updateActivity },
      { event: 'mousemove', handler: updateActivity },
      { event: 'keydown', handler: updateActivity },
      { event: 'scroll', handler: updateActivity },
      { event: 'touchstart', handler: updateActivity }
    ];
  }

  private removeActivityListeners(): void {
    if (this.activityListeners) {
      this.activityListeners.forEach(({ event, handler }) => {
        document.removeEventListener(event, handler, true);
      });
      this.activityListeners = [];
    }
  }

  private activityListeners: Array<{ event: string; handler: () => void }> = [];
}

// Global session manager instance
let sessionManager: SessionSecurityManager | null = null;

/**
 * Initialize enhanced session security
 */
export function initializeSessionSecurity(
  config?: Partial<SessionConfig>,
  onSessionExpired?: () => void
): void {
  if (sessionManager) {
    sessionManager.stop();
  }

  sessionManager = new SessionSecurityManager(config);
  sessionManager.start(onSessionExpired);
}

/**
 * Stop session security monitoring
 */
export function stopSessionSecurity(): void {
  if (sessionManager) {
    sessionManager.stop();
    sessionManager = null;
  }
}

/**
 * Update activity timestamp
 */
export function updateSessionActivity(): void {
  sessionManager?.updateActivity();
}

/**
 * Get current session information
 */
export function getSessionInfo() {
  return sessionManager?.getSessionInfo() || {
    remainingIdleTime: 0,
    remainingSessionTime: 0,
    isValid: false
  };
}

/**
 * Force session expiration
 */
export function expireSession(): void {
  sessionManager?.expireSession();
}

/**
 * Check if session is valid
 */
export function isSessionValid(): boolean {
  return sessionManager?.isSessionValid() || false;
}

/**
 * Rate limiting for sensitive operations
 */
export class SensitiveOperationLimiter {
  private static attempts: Map<string, number[]> = new Map();
  private static readonly WINDOW_MS = 15 * 60 * 1000; // 15 minutes
  private static readonly MAX_ATTEMPTS = 5;

  static canPerformOperation(operationType: string, userId: string): boolean {
    const key = `${operationType}_${userId}`;
    const now = Date.now();
    const attempts = this.attempts.get(key) || [];
    
    // Remove old attempts outside the window
    const recentAttempts = attempts.filter(time => now - time < this.WINDOW_MS);
    
    if (recentAttempts.length >= this.MAX_ATTEMPTS) {
      SecurityMonitor.logEvent({
        type: 'suspicious_activity',
        details: {
          action: 'rate_limit_exceeded',
          operationType,
          userId,
          attempts: recentAttempts.length
        }
      });
      return false;
    }

    return true;
  }

  static recordAttempt(operationType: string, userId: string): void {
    const key = `${operationType}_${userId}`;
    const attempts = this.attempts.get(key) || [];
    attempts.push(Date.now());
    this.attempts.set(key, attempts);
  }

  static resetAttempts(operationType: string, userId: string): void {
    const key = `${operationType}_${userId}`;
    this.attempts.delete(key);
  }
}