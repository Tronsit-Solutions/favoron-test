import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { LoadingState } from '@/components/ui/loading-state';

interface RequireAuthProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAuth = ({ children, fallback }: RequireAuthProps) => {
  const { user, initialLoading } = useAuth();
  const location = useLocation();

  // Solo bloquear UI durante la carga inicial de la app
  if (initialLoading) {
    return <LoadingState message="Verificando autenticación..." />;
  }

  if (!user) {
    // Save the attempted location so we can redirect after login
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};