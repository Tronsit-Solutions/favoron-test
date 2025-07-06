import React from "react";
import { Badge } from "@/components/ui/badge";

export const getStatusBadge = (status: string) => {
  const statusConfig = {
    pending_approval: { label: 'Pendiente de aprobación', variant: 'secondary' },
    approved: { label: 'Aprobado', variant: 'secondary' },
    matched: { label: 'Emparejado', variant: 'default' },
    quote_sent: { label: 'Cotización enviada', variant: 'default' },
    quote_accepted: { label: 'Esperando pago', variant: 'destructive' },
    payment_confirmed: { label: 'Pago confirmado', variant: 'default' },
    purchased: { label: 'Comprado', variant: 'default' },
    in_transit: { label: 'En tránsito', variant: 'default' },
    delivered: { label: 'Entregado', variant: 'default' },
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