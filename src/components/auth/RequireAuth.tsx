import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/loading-state';
import { isProfileComplete } from '@/hooks/useProfileCompletion';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
  allowIncompleteProfile?: boolean;
}

export const RequireAuth = ({ children, fallback, allowIncompleteProfile = false }: RequireAuthProps) => {
  const { user, loading, userRole, roleLoaded, profile } = useAuth();
  const location = useLocation();

  // Check if user was previously authenticated (preserves UI during token refresh/tab switch)
  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';

  // ONLY show loading spinner on genuine initial load with NO prior authentication evidence
  if (loading && !user && !wasAuthenticated) {
    return <LoadingState message="Verificando autenticación..." />;
  }

  // If loading but we have evidence of prior auth, wait silently (no spinner)
  if (loading && wasAuthenticated && !user) {
    return null;
  }

  if (!user) {
    // Clear the auth evidence since user is definitely not authenticated
    if (!loading) {
      try { sessionStorage.removeItem('was_authenticated'); } catch {}
    }
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // User exists - ensure we have evidence stored for future tab switches
  try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}

  // Wait for role to be loaded before deciding access
  if (!roleLoaded) {
    return null; // Silent wait instead of spinner
  }

  // Operations users can ONLY access /operations - block all dashboard routes
  if (userRole?.role === 'operations' && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/operations" replace />;
  }

  // Profile completeness check — redirect to /complete-profile if incomplete
  if (!allowIncompleteProfile && profile && !isProfileComplete(profile) && location.pathname !== '/complete-profile') {
    return <Navigate to="/complete-profile" replace />;
  }

  return <>{children}</>;
};