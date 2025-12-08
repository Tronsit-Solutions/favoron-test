import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/loading-state';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAuth = ({ children, fallback }: RequireAuthProps) => {
  const { user, loading, userRole, roleLoaded } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingState message="Verificando autenticación..." />;
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Wait for role to be loaded before deciding access
  if (!roleLoaded) {
    return <LoadingState message="Verificando permisos..." />;
  }

  // Operations users can ONLY access /operations - block all dashboard routes
  if (userRole?.role === 'operations' && location.pathname.startsWith('/dashboard')) {
    return <Navigate to="/operations" replace />;
  }

  return <>{children}</>;
};