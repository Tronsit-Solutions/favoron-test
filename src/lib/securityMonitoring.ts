// Security monitoring and logging utilities

interface SecurityEvent {
  type: 'auth_attempt' | 'auth_failure' | 'suspicious_activity' | 'data_access' | 'form_submission';
  details: Record<string, any>;
  timestamp: number;
  userAgent?: string;
  ipAddress?: string;
  userId?: string;
}

class SecurityMonitor {
  private static readonly MAX_AUTH_ATTEMPTS = 5;
  private static readonly AUTH_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
  private static readonly STORAGE_KEY = 'favoron_security_events';

  // Log security events
  static logEvent(event: Omit<SecurityEvent, 'timestamp' | 'userAgent'>): void {
    const securityEvent: SecurityEvent = {
      ...event,
      timestamp: Date.now(),
      userAgent: navigator.userAgent
    };

    try {
      // Store locally for analysis
      const events = this.getStoredEvents();
      events.push(securityEvent);
      
      // Keep only last 100 events to prevent storage bloat
      const recentEvents = events.slice(-100);
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(recentEvents));

      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log('🔒 Security Event:', securityEvent);
      }

      // Check for suspicious patterns
      this.analyzeSuspiciousActivity(recentEvents);
    } catch (error) {
      console.warn('Failed to log security event:', error);
    }
  }

  // Check for authentication rate limiting
  static shouldBlockAuthAttempt(identifier: string): boolean {
    try {
      const events = this.getStoredEvents();
      const cutoff = Date.now() - this.AUTH_ATTEMPT_WINDOW;
      
      const recentFailures = events.filter(event => 
        event.type === 'auth_failure' &&
        event.timestamp > cutoff &&
        (event.details.email === identifier || event.details.phone === identifier)
      );

      return recentFailures.length >= this.MAX_AUTH_ATTEMPTS;
    } catch {
      return false;
    }
  }

  // Get stored security events
  private static getStoredEvents(): SecurityEvent[] {
    try {
      const stored = sessionStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  // Analyze for suspicious activity patterns
  private static analyzeSuspiciousActivity(events: SecurityEvent[]): void {
    const recentEvents = events.filter(event => 
      Date.now() - event.timestamp < 60 * 60 * 1000 // Last hour
    );

    // Check for rapid repeated actions
    const actionCounts: Record<string, number> = {};
    recentEvents.forEach(event => {
      const key = `${event.type}_${event.userId || 'anonymous'}`;
      actionCounts[key] = (actionCounts[key] || 0) + 1;
    });

    // Alert if excessive activity detected
    Object.entries(actionCounts).forEach(([action, count]) => {
      if (count > 50) { // Threshold for suspicious activity
        console.warn(`🚨 Suspicious activity detected: ${action} performed ${count} times in the last hour`);
        
        // Log suspicious activity
        this.logEvent({
          type: 'suspicious_activity',
          details: {
            pattern: 'excessive_actions',
            action,
            count,
            timeWindow: '1 hour'
          }
        });
      }
    });
  }

  // Clear security events (useful for testing or privacy)
  static clearEvents(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear security events:', error);
    }
  }

  // Get security statistics
  static getSecurityStats(): {
    totalEvents: number;
    authFailures: number;
    suspiciousActivities: number;
    lastEvent?: SecurityEvent;
  } {
    const events = this.getStoredEvents();
    
    return {
      totalEvents: events.length,
      authFailures: events.filter(e => e.type === 'auth_failure').length,
      suspiciousActivities: events.filter(e => e.type === 'suspicious_activity').length,
      lastEvent: events[events.length - 1]
    };
  }
}

export { SecurityMonitor, type SecurityEvent };
