import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface RequireOperationsProps {
  children: React.ReactNode;
}

export const RequireOperations = ({ children }: RequireOperationsProps) => {
  const { userRole, loading, user } = useAuth();

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

  // Allow both operations and admin roles
  const hasAccess = userRole?.role === 'operations' || userRole?.role === 'admin';

  if (!hasAccess) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
