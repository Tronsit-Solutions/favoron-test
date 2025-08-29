import { ReactNode } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { LoadingState } from '@/components/ui/loading-state';

interface RequireAdminProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export const RequireAdmin = ({ children, fallback }: RequireAdminProps) => {
  const { user, userRole, loading } = useAuth();

  if (loading) {
    return <LoadingState message="Verificando permisos..." />;
  }

  if (!user) {
    console.warn('🔒 Unauthorized access attempt: No user session');
    return <Navigate to="/auth" replace />;
  }

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