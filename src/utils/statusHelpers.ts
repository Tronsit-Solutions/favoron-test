
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
    payment_pending: { label: 'Pago pendiente', variant: 'warning' },
    payment_pending_approval: { label: 'Pago en revisión', variant: 'warning' },
    quote_accepted: { label: 'Cotización Aceptada - Pendiente Pago', variant: 'destructive' },
    paid: { label: 'Pagado', variant: 'default' },
    pending_purchase: { label: 'Pendiente de compra', variant: 'default' },
    purchased: { label: 'Comprado', variant: 'default' },
    in_transit: { label: 'En tránsito', variant: 'default' },
    received_by_traveler: { label: 'Recibido por viajero', variant: 'default' },
    pending_office_confirmation: { label: 'Esperando confirmación', variant: 'secondary' },
    delivered_to_office: { label: 'Entregado en oficina', variant: 'default' },
    ready_for_pickup: { label: 'Listo para recoger', variant: 'default' },
    ready_for_delivery: { label: 'Listo para entrega', variant: 'default' },
    out_for_delivery: { label: 'En camino', variant: 'default' },
    cancelled: { label: 'Cancelado', variant: 'destructive' },
    rejected: { label: 'Rechazado', variant: 'destructive' },
    deadline_expired: { label: 'Fecha límite vencida', variant: 'warning' },
    // Trip statuses
    active: { label: 'Activo', variant: 'default' },
    completed: { label: 'Completado', variant: 'default' },
    completed_paid: { label: 'Completado y pagado', variant: 'default' },
    archived_by_shopper: { label: 'Archivado', variant: 'secondary' },
  } as const;

  const config = (statusConfig as any)[status] || { 
    label: status, 
    variant: 'secondary' as const 
  };

  return React.createElement(Badge, { 
    variant: config.variant as any 
  }, config.label);
};
