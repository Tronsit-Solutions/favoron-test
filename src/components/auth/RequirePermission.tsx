import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions, PermissionKey } from '@/hooks/useUserPermissions';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/loading-state';

interface RequirePermissionProps {
  children: ReactNode;
  permission: PermissionKey;
  fallback?: ReactNode;
}

export const RequirePermission = ({ children, permission, fallback }: RequirePermissionProps) => {
  const { user, loading: authLoading, roleLoaded } = useAuth();
  const { hasPermission, loading: permLoading } = useUserPermissions();

  const wasAuthenticated = sessionStorage.getItem('was_authenticated') === 'true';

  if (authLoading && !user && !wasAuthenticated) {
    return <LoadingState message="Verificando permisos..." />;
  }

  if (authLoading && wasAuthenticated && !user) {
    return null;
  }

  if (!user) {
    if (!authLoading) {
      try { sessionStorage.removeItem('was_authenticated'); } catch {}
    }
    return <Navigate to="/auth" replace />;
  }

  try { sessionStorage.setItem('was_authenticated', 'true'); } catch {}

  if (!roleLoaded || permLoading) {
    return null;
  }

  if (!hasPermission(permission)) {
    if (fallback) return <>{fallback}</>;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
