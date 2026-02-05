import { supabase } from '@/integrations/supabase/client';
import { withRetry, getNetworkInfo } from '@/lib/supabaseWithRetry';

interface AuthErrorContext {
  provider?: string;
  emailDomain?: string;
  supabaseErrorCode?: string;
  supabaseErrorMsg?: string;
  redirectUrl?: string;
  userAgent?: string;
  networkType?: string;
  isSlowConnection?: boolean;
  isSafari?: boolean;
  retryAttempt?: number;
}

export const logAuthError = async (
  type: 'auth_signup' | 'auth_signin' | 'auth_oauth' | 'auth_redirect',
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  context?: AuthErrorContext
) => {
  try {
    const networkInfo = getNetworkInfo();
    
    // Get current route
    const route = window.location.pathname;
    
    // Build context with network and browser info
    const fullContext = {
      ...context,
      timestamp: new Date().toISOString(),
      networkOnline: networkInfo.online,
      networkConnection: networkInfo.connection?.effectiveType || 'unknown',
      isSafari: networkInfo.isSafari,
      isMobile: networkInfo.isMobile,
    };

    // Build browser info
    const browser = {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
    };

    // Send to edge function with correct structure (flat, not nested)
    await withRetry(async () => {
      const { error } = await supabase.functions.invoke('log-client-error', {
        body: {
          type,
          message,
          severity,
          route,
          url: window.location.href,
          referrer: document.referrer,
          name: context?.supabaseErrorCode || 'AuthError',
          context: fullContext,
          browser,
        },
      });

      if (error) {
        throw error;
      }
    }, 'log-auth-error', { maxRetries: 2 });

  } catch (error) {
    console.warn('Auth error logging failed:', error);
    // Don't throw - this shouldn't break the auth flow
  }
};

export function getEmailDomain(email: string): string {
  try {
    return email.split('@')[1] || 'unknown';
  } catch {
    return 'unknown';
  }
}

export function detectAuthErrorFromUrl(): void {
  // Check for OAuth errors in URL params or hash
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const error = urlParams.get('error') || hashParams.get('error');
  const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
  
  if (error) {
    logAuthError('auth_oauth', error, 'error', {
      provider: 'oauth',
      supabaseErrorMsg: errorDescription || 'OAuth error'
    });
  }
}