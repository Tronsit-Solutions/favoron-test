import { useState, useEffect, useRef, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { withRetry } from '@/lib/supabaseWithRetry';
import { SecurityMonitor } from '@/lib/securityMonitoring';
import { 
  initializeSessionSecurity, 
  stopSessionSecurity, 
  SensitiveOperationLimiter 
} from '@/lib/sessionSecurity';
import { setupDeepLinkHandler } from '@/lib/capacitorAuth';

interface UiPreferences {
  skip_package_intro?: boolean;
  skip_trip_intro?: boolean;
  [key: string]: boolean | undefined; // Allow additional boolean preferences
}

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  phone_number: string | null;
  avatar_url: string | null;
  trust_level: 'basic' | 'confiable' | 'prime';
  created_at: string;
  updated_at: string;
  username: string | null;
  email: string | null;
  country_code: string | null;
  email_notifications: boolean | null;
  email_notification_preferences: any | null;
  prime_expires_at: string | null;
  ui_preferences: UiPreferences | null;
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user' | 'operations';
  assigned_by: string | null;
  assigned_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  roleLoaded: boolean;
  signOut: () => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [roleLoaded, setRoleLoaded] = useState(false);
  const navigate = useNavigate();

  // Prevent duplicate profile fetches and manage loading lifecycle
  const fetchingProfileRef = useRef(false);
  const lastFetchedUserIdRef = useRef<string | null>(null);

  const cleanupAuthState = () => {
    // Remove standard auth tokens
    try { localStorage.removeItem('supabase.auth.token'); } catch {}

    // Remove all Supabase auth keys from localStorage
    Object.keys(localStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        localStorage.removeItem(key);
      }
    });

    // Remove from sessionStorage as well
    try {
      Object.keys(sessionStorage).forEach((key) => {
        if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch {}
  };

  const fetchProfile = async (userId: string, retryCount = 0, isInitialLoad = false): Promise<void> => {
    const MAX_RETRIES = 5; // More retries for iOS Safari
    const BASE_DELAY = 800; // Longer base delay
    
    try {
      console.log('🔍 fetchProfile called for userId:', userId, retryCount > 0 ? `(retry ${retryCount})` : '');
      
      // iOS Safari fix: Add longer initial delay after login to let the auth state settle
      // This prevents the "Load failed" error on immediate requests after auth
      if (isInitialLoad && retryCount === 0) {
        console.log('⏳ Initial load - waiting 600ms for iOS Safari compatibility...');
        await new Promise(resolve => setTimeout(resolve, 600));
      } else if (retryCount > 0) {
        // Additional delay before each retry
        const retryDelay = BASE_DELAY * Math.pow(1.5, retryCount);
        console.log(`⏳ Waiting ${retryDelay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
      
      // Fetch profile first, then roles (sequential to avoid iOS Safari connection issues)
      const profileResult = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      console.log('📊 Profile result:', {
        success: !profileResult.error,
        data: profileResult.data ? 'present' : null,
        error: profileResult.error
      });

      // Check for network error on profile fetch
      if (profileResult.error?.message?.includes('Load failed') || 
          profileResult.error?.message?.includes('Failed to fetch') ||
          profileResult.error?.message?.includes('NetworkError') ||
          profileResult.error?.message?.includes('network') ||
          profileResult.error?.message?.includes('aborted')) {
        throw new Error(profileResult.error.message);
      }

      if (profileResult.data) {
        console.log('✅ Setting profile:', profileResult.data.email);
        // Cast ui_preferences from Json to UiPreferences
        const profileData = {
          ...profileResult.data,
          ui_preferences: profileResult.data.ui_preferences as UiPreferences | null
        } as Profile;
        setProfile(profileData);
      } else {
        console.log('⚠️ No profile data found');
      }

      // Small delay between requests for iOS Safari stability
      await new Promise(resolve => setTimeout(resolve, 100));

      // Now fetch roles
      const rolesResult = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId);

      console.log('📊 Roles result:', {
        success: !rolesResult.error,
        count: rolesResult.data?.length || 0,
        roles: rolesResult.data,
        error: rolesResult.error
      });

      // Check for network error on roles fetch
      if (rolesResult.error?.message?.includes('Load failed') || 
          rolesResult.error?.message?.includes('Failed to fetch') ||
          rolesResult.error?.message?.includes('NetworkError')) {
        throw new Error(rolesResult.error.message);
      }
      
      // Handle multiple roles and prioritize admin
      if (rolesResult.data && rolesResult.data.length > 0) {
        const roles = rolesResult.data;
        console.log('✅ Found roles:', roles);
        
        // Prioritize roles: admin > operations > user
        const adminRole = roles.find(role => role.role === 'admin');
        const operationsRole = roles.find(role => role.role === 'operations');
        const selectedRole = adminRole || operationsRole || roles[0];
        
        console.log('✅ Setting userRole:', { role: selectedRole.role, id: selectedRole.id });
        setUserRole(selectedRole);
        setRoleLoaded(true);
      } else {
        console.log('⚠️ No roles found, using fallback');
        // Fallback role si no se puede cargar
        setUserRole({ 
          id: 'fallback', 
          user_id: userId, 
          role: 'user', 
          assigned_by: null, 
          assigned_at: new Date().toISOString() 
        });
        setRoleLoaded(true);
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      
      // Retry on network errors with exponential backoff
      const errorMessage = error instanceof Error ? error.message : '';
      const isNetworkError = errorMessage.includes('Load failed') || 
                            errorMessage.includes('Failed to fetch') ||
                            errorMessage.includes('NetworkError') ||
                            errorMessage.includes('network') ||
                            errorMessage.includes('aborted') ||
                            errorMessage.includes('timeout');
      
      if (isNetworkError && retryCount < MAX_RETRIES) {
        console.log(`⏳ Network error, retry ${retryCount + 1}/${MAX_RETRIES}...`);
        // Delay is now handled at the start of fetchProfile
        return fetchProfile(userId, retryCount + 1, false);
      }
      
      // After all retries failed, still set a fallback role so app doesn't break
      console.log('⚠️ Max retries reached or non-network error, setting fallback role');
      setUserRole({ 
        id: 'fallback', 
        user_id: userId, 
        role: 'user', 
        assigned_by: null, 
        assigned_at: new Date().toISOString() 
      });
      setRoleLoaded(true);
      
      SecurityMonitor.logEvent({
        type: 'data_access',
        details: {
          success: false,
          context: 'profile_fetch',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: userId,
          retryCount
        },
        userId: userId
      });
    }
  };

  // Wrapper to avoid duplicate fetches and control loading state
  // IMPORTANT: Only show loading if we don't have a profile yet (avoids modal unmount on token refresh)
  const loadProfile = async (userId: string, skipLoadingState: boolean = false, isInitialLoad: boolean = true) => {
    if (fetchingProfileRef.current && lastFetchedUserIdRef.current === userId) {
      return;
    }
    fetchingProfileRef.current = true;
    lastFetchedUserIdRef.current = userId;
    
    // Only show loading if we don't already have a profile (prevents modal unmount)
    const shouldShowLoading = !profile && !skipLoadingState;
    if (shouldShowLoading) {
      setLoading(true);
    }
    
    try {
      await fetchProfile(userId, 0, isInitialLoad);
    } finally {
      fetchingProfileRef.current = false;
      if (shouldShowLoading) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log('🔐 Auth state changed:', event, 'Session exists:', !!newSession);
        
        // OPTIMIZATION: Only update state if values actually changed to prevent unnecessary re-renders
        setSession(prev => {
          if (prev?.access_token === newSession?.access_token) return prev;
          return newSession;
        });
        
        setUser(prev => {
          const newUserId = newSession?.user?.id;
          if (prev?.id === newUserId) return prev; // Same user, don't update reference
          return newSession?.user ?? null;
        });

        const session = newSession;

        if (session?.user) {
          console.log('👤 User authenticated:', session.user.id, session.user.email);
          
          // OPTIMIZATION: Skip profile reload for TOKEN_REFRESHED if user is the same
          // This prevents modals from being unmounted when returning from external links
          if (event === 'TOKEN_REFRESHED' && lastFetchedUserIdRef.current === session.user.id) {
            console.log('🔄 Token refreshed for same user - skipping profile reload to preserve UI state');
            return;
          }
          
          SecurityMonitor.logEvent({
            type: 'auth_attempt',
            details: {
              success: true,
              event: event,
              userId: session.user.id
            },
            userId: session.user.id
          });
          
          // Skip loading state for token refresh to prevent UI disruption
          const skipLoading = event === 'TOKEN_REFRESHED';
          loadProfile(session.user.id, skipLoading);
        } else {
          console.log('🚪 User signed out or no session');
          if (event === 'SIGNED_OUT') {
            SecurityMonitor.logEvent({
              type: 'auth_attempt',
              details: {
                success: true,
                event: 'SIGNED_OUT'
              }
            });
          }
          setProfile(null);
          setUserRole(null);
          setRoleLoaded(false);
          setLoading(false);
        }
      }
    );

    // Check for existing session on mount
    console.log('🔍 Checking for existing session...');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('🔍 Initial session check result:', !!session);
      
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        console.log('👤 Found existing session for:', session.user.id, session.user.email);
        SecurityMonitor.logEvent({
          type: 'auth_attempt',
          details: {
            success: true,
            context: 'session_restore',
            userId: session.user.id
          },
          userId: session.user.id
        });
        loadProfile(session.user.id);
      } else {
        console.log('🚫 No existing session found');
        setRoleLoaded(false);
        setLoading(false);
      }
    });

    return () => {
      console.log('🧹 Cleaning up auth subscription');
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    try {
      // Clean up auth state first
      cleanupAuthState();
      
      // Attempt global sign out
      try {
        await supabase.auth.signOut({ scope: 'global' });
      } catch (err) {
        // Continue even if this fails
      }
      
      setUser(null);
      setSession(null);
      setProfile(null);
      setUserRole(null);
      setRoleLoaded(false);
      
      // Navigate to auth using React Router (no page reload)
      navigate('/auth');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Profile>) => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        // Cast ui_preferences from Json to UiPreferences
        const profileData = {
          ...data,
          ui_preferences: data.ui_preferences as UiPreferences | null
        } as Profile;
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const value = {
    user,
    session,
    profile,
    userRole,
    loading,
    roleLoaded,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};