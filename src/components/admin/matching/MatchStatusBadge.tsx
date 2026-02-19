
import { Badge } from "@/components/ui/badge";

export interface StatusInfo {
  icon: string;
  label: string;
  color: string;
}

const STATUS_MAP: Record<string, StatusInfo> = {
  'pending_approval': { icon: '⏳', label: 'Pendiente de aprobación', color: 'bg-warning/10 text-black border-warning/20' },
  'approved': { icon: '✅', label: 'Aprobado', color: 'bg-success/10 text-black border-success/20' },
  'matched': { icon: '🤝', label: 'Emparejado con viajero', color: 'bg-info/10 text-black border-info/20' },
  'quote_sent': { icon: '💬', label: 'Cotización enviada', color: 'bg-warning/10 text-black border-warning/20' },
  'quote_accepted': { icon: '✅', label: 'Cotización aceptada', color: 'bg-success/10 text-black border-success/20' },
  'quote_rejected': { icon: '❌', label: 'Cotización rechazada', color: 'bg-destructive/10 text-black border-destructive/20' },
  'quote_expired': { icon: '⏰', label: 'Cotización expirada', color: 'bg-muted/50 text-black border-muted' },
  'payment_pending': { icon: '💳', label: 'Esperando pago', color: 'bg-warning/10 text-black border-warning/20' },
  'payment_pending_approval': { icon: '🧾', label: 'Pago pendiente de aprobación', color: 'bg-warning/10 text-black border-warning/20' },
  'pending_purchase': { icon: '🛒', label: 'Pago confirmado - Comprando', color: 'bg-info/10 text-black border-info/20' },
  'in_transit': { icon: '🚚', label: 'En tránsito', color: 'bg-info/10 text-black border-info/20' },
  'received_by_traveler': { icon: '👤', label: 'Recibido por viajero', color: 'bg-success/10 text-black border-success/20' },
  'pending_office_confirmation': { icon: '🏢', label: 'Esperando confirmación oficina', color: 'bg-warning/10 text-black border-warning/20' },
  'ready_for_pickup': { icon: '📋', label: 'Listo para recoger', color: 'bg-info/10 text-black border-info/20' },
  'ready_for_delivery': { icon: '🚛', label: 'Listo para entrega', color: 'bg-info/10 text-black border-info/20' },
  'delivered_to_office': { icon: '📦', label: 'Entregado en oficina', color: 'bg-success/10 text-black border-success/20' },
  'delivered': { icon: '📦', label: 'Entregado al destinatario', color: 'bg-success/10 text-black border-success/20' },
  'completed': { icon: '🎉', label: 'Completado', color: 'bg-success/10 text-black border-success/20' },
  'rejected': { icon: '❌', label: 'Rechazado', color: 'bg-destructive/10 text-black border-destructive/20' },
  'cancelled': { icon: '❌', label: 'Cancelado', color: 'bg-muted/50 text-black border-muted' },
  'archived_by_shopper': { icon: '📁', label: 'Archivado por shopper', color: 'bg-muted/50 text-black border-muted' },
  'deadline_expired': { icon: '⏰', label: 'Fecha límite vencida', color: 'bg-warning/10 text-black border-warning/20' }
};

export const getStatusInfo = (status: string): StatusInfo => {
  return STATUS_MAP[status] || { icon: '⏳', label: 'Estado desconocido', color: 'bg-muted/50 text-black border-muted' };
};

interface MatchStatusBadgeProps {
  status: string;
  className?: string;
}

export const MatchStatusBadge = ({ status, className = "text-xs" }: MatchStatusBadgeProps) => {
  const statusInfo = getStatusInfo(status);
  
  return (
    <Badge className={`${className} ${statusInfo.color} flex-shrink-0 border`}>
      {statusInfo.icon} {statusInfo.label}
    </Badge>
  );
};
