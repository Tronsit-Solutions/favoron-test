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
}

interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'user';
  assigned_by: string | null;
  assigned_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  userRole: UserRole | null;
  loading: boolean;
  initialLoading: boolean;
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
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const fetchProfile = async (userId: string) => {
    try {
      console.log('fetchProfile called for userId:', userId);
      
      // Combinar queries en una sola para reducir requests
      const [profileResult, rolesResult] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('*')
          .eq('user_id', userId)
      ]);

      console.log('Profile result:', profileResult);
      console.log('Roles result:', rolesResult);

      if (profileResult.data) {
        console.log('Setting profile:', profileResult.data);
        setProfile(profileResult.data);
      }
      
      // Handle multiple roles and prioritize admin
      if (rolesResult.data && rolesResult.data.length > 0) {
        const roles = rolesResult.data;
        console.log('Found roles:', roles);
        
        // Prioritize admin role if present
        const adminRole = roles.find(role => role.role === 'admin');
        const selectedRole = adminRole || roles[0];
        
        console.log('Setting userRole:', selectedRole);
        setUserRole(selectedRole);
      } else {
        console.log('No roles found, using fallback');
        // Fallback role si no se puede cargar
        setUserRole({ 
          id: 'fallback', 
          user_id: userId, 
          role: 'user', 
          assigned_by: null, 
          assigned_at: new Date().toISOString() 
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      SecurityMonitor.logEvent({
        type: 'data_access',
        details: {
          success: false,
          context: 'profile_fetch',
          error: error instanceof Error ? error.message : 'Unknown error',
          userId: userId
        },
        userId: userId
      });
    }
  };

  // Wrapper to avoid duplicate fetches and control loading state
  const loadProfile = async (userId: string, isInitial = false) => {
    // Si ya tenemos el profile del mismo usuario, refrescar en background sin mostrar loading
    if (lastFetchedUserIdRef.current === userId && profile?.id === userId && !isInitial) {
      // Silent refresh en background
      if (!fetchingProfileRef.current) {
        fetchingProfileRef.current = true;
        try {
          await fetchProfile(userId);
        } finally {
          fetchingProfileRef.current = false;
        }
      }
      return;
    }
    
    // Prevenir fetches duplicados del mismo usuario
    if (fetchingProfileRef.current && lastFetchedUserIdRef.current === userId) {
      return;
    }
    
    fetchingProfileRef.current = true;
    lastFetchedUserIdRef.current = userId;
    
    // Solo mostrar loading en carga inicial o cambio de usuario
    if (isInitial) {
      setInitialLoading(true);
    }
    
    try {
      await fetchProfile(userId);
    } finally {
      fetchingProfileRef.current = false;
      if (isInitial) {
        setInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    console.log('🔐 Setting up auth state listener');
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth state changed:', event, 'Session exists:', !!session);
        
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          console.log('👤 User authenticated:', session.user.id, session.user.email);
          SecurityMonitor.logEvent({
            type: 'auth_attempt',
            details: {
              success: true,
              event: event,
              userId: session.user.id
            },
            userId: session.user.id
          });
          
          // Solo cargar profile si es un usuario diferente o evento relevante
          // TOKEN_REFRESHED no requiere recargar el profile si es el mismo usuario
          const shouldLoadProfile = 
            event !== 'TOKEN_REFRESHED' || 
            lastFetchedUserIdRef.current !== session.user.id;
          
          if (shouldLoadProfile) {
            loadProfile(session.user.id, false);
          }
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
          setInitialLoading(false);
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
        loadProfile(session.user.id, true); // isInitial = true
      } else {
        console.log('🚫 No existing session found');
        setInitialLoading(false);
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
      if (data) setProfile(data);
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
    initialLoading,
    signOut,
    updateProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};