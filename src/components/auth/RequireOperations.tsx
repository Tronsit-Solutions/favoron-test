import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireOperationsProps {
  children: React.ReactNode;
}

export const RequireOperations = ({ children }: RequireOperationsProps) => {
  const { userRole, loading, user, roleLoaded } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Wait for roleLoaded to be true - guarantees userRole is set
  if (!roleLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="text-muted-foreground ml-3">Verificando permisos...</p>
      </div>
    );
  }

  // Now safely check access with role loaded
  const hasAccess = userRole.role === 'operations' || userRole.role === 'admin';

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
