import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireOperationsProps {
  children: React.ReactNode;
}

export const RequireOperations = ({ children }: RequireOperationsProps) => {
  const { userRole, loading, user, roleLoaded } = useAuth();

  // Check if user was previously authenticated (preserves UI during token refresh/tab switch)
  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';

  // ONLY show loading spinner on genuine initial load with NO prior authentication evidence
  if (loading && !user && !wasAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // If loading but we have evidence of prior auth, wait silently
  if (loading && wasAuthenticated && !user) {
    return null;
  }

  if (!user) {
    if (!loading) {
      try { sessionStorage.removeItem('was_authenticated'); } catch {}
    }
    return <Navigate to="/auth" replace />;
  }

  // User exists - store evidence for future tab switches
  try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}

  // Wait for roleLoaded - silent wait
  if (!roleLoaded) {
    return null;
  }

  // Now safely check access with role loaded
  const hasAccess = userRole.role === 'operations' || userRole.role === 'admin';

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
