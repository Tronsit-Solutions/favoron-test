import { useState, useEffect, useCallback, useSyncExternalStore } from "react";

interface CountdownState {
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

// Global state manager for all countdowns
class CountdownManager {
  private subscribers = new Set<() => void>();
  private tick = 0;

  constructor() {
    // Single global interval
    setInterval(() => {
      this.tick++;
      this.notifyAll();
    }, 1000);
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notifyAll() {
    this.subscribers.forEach(cb => cb());
  }

  getSnapshot() {
    return this.tick;
  }
}

// Singleton instance
const countdownManager = new CountdownManager();

// Calculate time left from expiration date
function calculateTimeLeft(expiresAt: string | Date | null | undefined): CountdownState {
  if (!expiresAt) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const expireTime = new Date(expiresAt).getTime();
  const now = Date.now();
  const difference = expireTime - now;

  if (difference <= 0) {
    return { hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  return {
    hours: Math.floor(difference / (1000 * 60 * 60)),
    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((difference % (1000 * 60)) / 1000),
    isExpired: false,
  };
}

/**
 * Optimized countdown hook using a global timer
 * All components share a single setInterval instead of each having their own
 */
export const useGlobalCountdown = (expiresAt: string | Date | null | undefined, onExpire?: () => void): CountdownState => {
  const [hasExpiredCallbackFired, setHasExpiredCallbackFired] = useState(false);

  // Subscribe to global tick updates
  useSyncExternalStore(
    countdownManager.subscribe.bind(countdownManager),
    countdownManager.getSnapshot.bind(countdownManager)
  );

  const timeLeft = calculateTimeLeft(expiresAt);

  // Fire onExpire callback only once
  useEffect(() => {
    if (timeLeft.isExpired && !hasExpiredCallbackFired && onExpire) {
      setHasExpiredCallbackFired(true);
      onExpire();
    }
  }, [timeLeft.isExpired, hasExpiredCallbackFired, onExpire]);

  // Reset callback fired state if expiresAt changes
  useEffect(() => {
    setHasExpiredCallbackFired(false);
  }, [expiresAt]);

  return timeLeft;
};

export default useGlobalCountdown;
