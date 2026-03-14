import { Capacitor } from '@capacitor/core';
import { App, URLOpenListenerEvent } from '@capacitor/app';
import { SupabaseClient } from '@supabase/supabase-js';
import type { NavigateFunction } from 'react-router-dom';

/**
 * Sets up a deep link listener for handling OAuth callbacks on native Capacitor apps.
 * Intercepts favoron://auth/callback and exchanges the auth code for a session.
 * Returns a cleanup function to remove the listener.
 */
export const setupDeepLinkHandler = (
  supabase: SupabaseClient,
  navigate: NavigateFunction
): (() => void) => {
  if (!Capacitor.isNativePlatform()) {
    return () => {};
  }

  console.log('📱 Setting up Capacitor deep link handler for auth callbacks');

  let listenerHandle: { remove: () => void } | null = null;

  App.addListener('appUrlOpen', async (event: URLOpenListenerEvent) => {
    console.log('📱 Deep link received:', event.url);

    try {
      const url = new URL(event.url);

      if (!url.pathname.includes('/auth/callback') && !url.host.includes('auth/callback')) {
        console.log('📱 Ignoring non-auth deep link');
        return;
      }

      const code = url.searchParams.get('code');
      if (code) {
        console.log('📱 Found auth code, exchanging for session...');
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('📱 Error exchanging code for session:', error);
          return;
        }
        console.log('📱 Session established successfully');
        navigate('/dashboard', { replace: true });
        return;
      }

      const accessToken = url.searchParams.get('access_token');
      const refreshToken = url.searchParams.get('refresh_token');
      if (accessToken && refreshToken) {
        console.log('📱 Found tokens directly, setting session...');
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          console.error('📱 Error setting session from tokens:', error);
          return;
        }
        console.log('📱 Session set successfully from tokens');
        navigate('/dashboard', { replace: true });
        return;
      }

      const errorParam = url.searchParams.get('error');
      if (errorParam) {
        console.error('📱 Auth callback error:', errorParam, url.searchParams.get('error_description'));
        return;
      }

      console.log('📱 Auth callback received but no code or tokens found');
    } catch (error) {
      console.error('📱 Error handling deep link:', error);
    }
  }).then(handle => {
    listenerHandle = handle;
  });

  return () => {
    console.log('📱 Removing deep link listener');
    listenerHandle?.remove();
  };
};
