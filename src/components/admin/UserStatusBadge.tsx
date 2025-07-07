import { Badge } from "@/components/ui/badge";

interface UserStatusBadgeProps {
  status: 'active' | 'verified' | 'blocked' | undefined;
}

const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  const statusConfig = {
    active: { label: 'Activo', variant: 'default' as const },
    verified: { label: 'Verificado', variant: 'default' as const },
    blocked: { label: 'Bloqueado', variant: 'destructive' as const }
  };

  const config = statusConfig[status || 'active'];
  
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export default UserStatusBadge;