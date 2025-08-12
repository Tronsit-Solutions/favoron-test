// Re-export from organized lib for backward compatibility
export { getStatusColor } from '@/lib/styles';
export { getStatusLabel } from '@/lib/formatters';

import React from "react";
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending_approval: { label: 'Pendiente de aprobación', variant: 'secondary' },
    approved: { label: 'Aprobado', variant: 'secondary' },
    matched: { label: 'Emparejado', variant: 'default' },
    quote_sent: { label: 'Cotización enviada', variant: 'default' },
    quote_expired: { label: 'Cotización expirada', variant: 'warning' },
    quote_accepted: { label: 'Esperando pago', variant: 'destructive' },
    purchased: { label: 'Comprado', variant: 'default' },
    in_transit: { label: 'En tránsito', variant: 'default' },
    pending_office_confirmation: { label: 'Esperando confirmación', variant: 'secondary' },
    delivered_to_office: { label: 'Entregado en oficina', variant: 'default' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    
    // Trip statuses
    active: { label: 'Activo', variant: 'default' },
    completed: { label: 'Completado', variant: 'default' },
  };

  const config = statusConfig[status as keyof typeof statusConfig] || { 
    label: status, 
    variant: 'secondary' as const 
  };

  return React.createElement(Badge, { 
    variant: config.variant as any 
  }, config.label);
};