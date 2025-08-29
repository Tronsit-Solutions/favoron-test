import { supabase } from '@/integrations/supabase/client';
import { PostgrestError } from '@supabase/supabase-js';

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryableErrors: string[];
}

const DEFAULT_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 8000,
  retryableErrors: [
    'Load failed',
    'Failed to fetch',
    'Network error',
    'fetch failed',
    'ERR_NETWORK',
    'ERR_INTERNET_DISCONNECTED',
    'TIMEOUT',
  ],
};

// Circuit breaker state
let failureCount = 0;
let lastFailureTime = 0;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 30000; // 30 seconds

function isRetryableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || error.toString() || '';
  const errorCode = error.code || '';
  
  return DEFAULT_CONFIG.retryableErrors.some(pattern => 
    errorMessage.toLowerCase().includes(pattern.toLowerCase()) ||
    errorCode.toLowerCase().includes(pattern.toLowerCase())
  );
}

function isCircuitBreakerOpen(): boolean {
  if (failureCount < CIRCUIT_BREAKER_THRESHOLD) return false;
  
  const timeSinceLastFailure = Date.now() - lastFailureTime;
  if (timeSinceLastFailure > CIRCUIT_BREAKER_TIMEOUT) {
    // Reset circuit breaker
    failureCount = 0;
    return false;
  }
  
  return true;
}

function recordFailure(): void {
  failureCount++;
  lastFailureTime = Date.now();
}

function recordSuccess(): void {
  failureCount = Math.max(0, failureCount - 1);
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function calculateDelay(attempt: number): number {
  const exponentialDelay = DEFAULT_CONFIG.baseDelay * Math.pow(2, attempt);
  const jitteredDelay = exponentialDelay * (0.5 + Math.random() * 0.5);
  return Math.min(jitteredDelay, DEFAULT_CONFIG.maxDelay);
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'unknown',
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  
  if (isCircuitBreakerOpen()) {
    throw new Error(`Circuit breaker is open for ${operationName}. Please try again later.`);
  }

  let lastError: any;
  
  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const result = await operation();
      recordSuccess();
      return result;
    } catch (error) {
      lastError = error;
      
      // Don't retry on the last attempt
      if (attempt === finalConfig.maxRetries) {
        break;
      }
      
      // Check if error is retryable
      if (!isRetryableError(error)) {
        console.warn(`Non-retryable error in ${operationName}:`, error);
        break;
      }
      
      const delayMs = calculateDelay(attempt);
      console.warn(`Retry attempt ${attempt + 1}/${finalConfig.maxRetries} for ${operationName} after ${delayMs}ms:`, error);
      
      await delay(delayMs);
    }
  }
  
  recordFailure();
  throw lastError;
}

// Enhanced Supabase client with retry logic
export const supabaseWithRetry = {
  auth: {
    signUp: (credentials: any) => 
      withRetry(() => supabase.auth.signUp(credentials), 'auth.signUp'),
    
    signInWithPassword: (credentials: any) => 
      withRetry(() => supabase.auth.signInWithPassword(credentials), 'auth.signInWithPassword'),
    
    signOut: () => 
      withRetry(() => supabase.auth.signOut(), 'auth.signOut'),
    
    getSession: () => 
      withRetry(() => supabase.auth.getSession(), 'auth.getSession'),
    
    onAuthStateChange: supabase.auth.onAuthStateChange.bind(supabase.auth),
  },
};

// Network status utilities
export function getNetworkInfo() {
  const nav = navigator as any;
  return {
    online: navigator.onLine,
    connection: nav.connection || nav.mozConnection || nav.webkitConnection,
    userAgent: navigator.userAgent,
    isSafari: /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent),
    isMobile: /Mobile|Android|iPhone|iPad/.test(navigator.userAgent),
  };
}