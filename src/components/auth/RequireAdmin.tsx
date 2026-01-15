import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/loading-state';

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAdmin = ({ children, fallback }: RequireAdminProps) => {
  const { user, userRole, loading, roleLoaded } = useAuth();

  // Check if user was previously authenticated (preserves UI during token refresh/tab switch)
  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';

  // ONLY show loading spinner on genuine initial load with NO prior authentication evidence
  if (loading && !user && !wasAuthenticated) {
    return <LoadingState message="Verificando permisos..." />;
  }

  // If loading but we have evidence of prior auth, wait silently (no spinner)
  if (loading && wasAuthenticated && !user) {
    return null;
  }

  if (!user) {
    // Clear auth evidence since user is definitely not authenticated
    if (!loading) {
      try { sessionStorage.removeItem('was_authenticated'); } catch {}
    }
    console.warn('🔒 Unauthorized access attempt: No user session');
    return <Navigate to="/auth" replace />;
  }

  // User exists - store evidence for future tab switches
  try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}

  // Wait for role to be loaded before deciding access - silent wait
  if (!roleLoaded) {
    return null;
  }

  // Now safely check admin access with role loaded
  if (userRole?.role !== 'admin') {
    console.warn('🔒 Unauthorized admin access attempt:', { 
      userId: user.id, 
      email: user.email,
      role: userRole?.role 
    });
    
    if (fallback) {
      return <>{fallback}</>;
    }
    
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
