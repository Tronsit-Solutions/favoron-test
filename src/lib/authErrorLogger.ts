import { supabase } from '@/integrations/supabase/client';

interface AuthErrorContext {
  provider?: string;
  emailDomain?: string;
  supabaseErrorCode?: string;
  supabaseErrorMsg?: string;
  redirectUrl?: string;
  userAgent?: string;
}

export const logAuthError = async (
  type: 'auth_signup' | 'auth_signin' | 'auth_oauth' | 'auth_redirect',
  message: string,
  severity: 'error' | 'warning' | 'info' = 'error',
  context?: AuthErrorContext
) => {
  try {
    // Get current route
    const route = window.location.pathname;
    
    // Get user agent
    const userAgent = navigator.userAgent;
    
    // Build context with privacy considerations
    const safeContext = {
      ...context,
      userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      referrer: document.referrer
    };

    // Send to our edge function
    const response = await fetch('https://dfhoduirmqbarjnspbdh.supabase.co/functions/v1/log-client-error', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message,
        type,
        severity,
        route,
        url: window.location.href,
        referrer: document.referrer,
        context: safeContext,
        browser: {
          userAgent,
          language: navigator.language,
          platform: navigator.platform
        }
      })
    });

    if (!response.ok) {
      console.warn('Failed to log auth error:', response.status);
    }
  } catch (error) {
    console.warn('Auth error logging failed:', error);
    // Don't throw - this shouldn't break the auth flow
  }
};

export const getEmailDomain = (email: string): string => {
  try {
    return email.split('@')[1] || 'unknown';
  } catch {
    return 'unknown';
  }
};

export const detectAuthErrorFromUrl = () => {
  // Check for OAuth errors in URL params
  const urlParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.substring(1));
  
  const error = urlParams.get('error') || hashParams.get('error');
  const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
  
  if (error) {
    logAuthError(
      'auth_oauth',
      `OAuth error: ${error}`,
      'error',
      {
        supabaseErrorCode: error,
        supabaseErrorMsg: errorDescription || undefined,
        redirectUrl: window.location.href
      }
    );
  }
  
  return { error, errorDescription };
};