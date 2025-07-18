import { Badge } from "@/components/ui/badge";

export interface StatusInfo {
  icon: string;
  label: string;
  color: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  'quote_sent': { icon: '💬', label: 'Cotización enviada', color: 'bg-blue-100 text-blue-800' },
  'payment_pending': { icon: '💳', label: 'Pago pendiente', color: 'bg-yellow-100 text-yellow-800' },
  'payment_confirmed': { icon: '✅', label: 'Pago confirmado', color: 'bg-green-100 text-green-800' },
  'in_transit': { icon: '🚚', label: 'En tránsito', color: 'bg-purple-100 text-purple-800' },
  'delivered': { icon: '📦', label: 'Entregado', color: 'bg-emerald-100 text-emerald-800' },
  'completed': { icon: '🎉', label: 'Completado', color: 'bg-emerald-100 text-emerald-800' },
  'rejected': { icon: '❌', label: 'Match roto', color: 'bg-red-100 text-red-800' },
  'quote_rejected': { icon: '❌', label: 'Cotización rechazada', color: 'bg-red-100 text-red-800' }
};

export const getStatusInfo = (status: string): StatusInfo => {
  return STATUS_MAP[status] || { icon: '⏳', label: 'Pendiente', color: 'bg-gray-100 text-gray-800' };
};

interface MatchStatusBadgeProps {
  status: string;
  className?: string;
}

export const MatchStatusBadge = ({ status, className = "text-xs" }: MatchStatusBadgeProps) => {
  const statusInfo = getStatusInfo(status);
  
  return (
    <Badge className={`${className} ${statusInfo.color} flex-shrink-0`}>
      {statusInfo.icon} {statusInfo.label}
    </Badge>
  );
};