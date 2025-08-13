import { Badge } from "@/components/ui/badge";
import { Package, Trip } from "@/types";

export const useStatusHelpers = () => {
  const getStatusBadge = (
    status: string,
    packageDestinationOrOptions?: string | { packageDestination?: string; isQuoteExpired?: boolean; rejectionReason?: string }
  ) => {
    const isObj = typeof packageDestinationOrOptions === 'object' && packageDestinationOrOptions !== null;
    const packageDestination = (isObj
      ? (packageDestinationOrOptions as { packageDestination?: string }).packageDestination
      : (packageDestinationOrOptions as string | undefined));
    const isQuoteExpired = isObj
      ? !!(packageDestinationOrOptions as { isQuoteExpired?: boolean }).isQuoteExpired
      : false;
    const rejectionReason = isObj
      ? (packageDestinationOrOptions as { rejectionReason?: string }).rejectionReason
      : undefined;

    const effectiveStatus = status === 'quote_sent' && isQuoteExpired ? 'quote_expired' : status;
    
    // Handle re-approved packages (approved after rejection)
    const isReapproved = status === 'approved' && rejectionReason;

    const statusConfig = {
      pending_approval: { label: "Pendiente", variant: "warning" as const },
      approved: { label: isReapproved ? "Re-aprobado" : "Aprobado", variant: isReapproved ? "warning" as const : "success" as const },
      matched: { label: "Emparejado", variant: "success" as const },
      quote_sent: { label: "Cotización Enviada", variant: "warning" as const },
      quote_accepted: { label: "Cotización Aceptada", variant: "success" as const },
      quote_rejected: { label: "Cotización Rechazada", variant: "destructive" as const },
      quote_expired: { label: "Cotización Expirada", variant: "warning" as const },
      payment_pending_approval: { label: "Pago Pendiente de Aprobación", variant: "warning" as const },
      payment_confirmed: { label: "Pago Confirmado", variant: "success" as const },
      payment_pending: { label: "Pago Pendiente", variant: "warning" as const },
      pending_purchase: { label: "Pendiente de Compra", variant: "warning" as const },
      in_transit: { label: "En Tránsito", variant: "warning" as const },
      received_by_traveler: { label: "Recibido por viajero", variant: "success" as const },
      pending_office_confirmation: { label: "🔒 Esperando confirmación", variant: "warning" as const },
      delivered_to_office: { label: "Entregado en oficina", variant: "success" as const },
      out_for_delivery: { 
        label: packageDestination ? `En reparto en ${packageDestination}` : "En reparto", 
        variant: "warning" as const 
      },
      active: { label: "Activo", variant: "success" as const },
      completed: { label: "Completado", variant: "success" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const }
    };

    const config = statusConfig[effectiveStatus as keyof typeof statusConfig] || 
                   { label: effectiveStatus, variant: "secondary" as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hasActionRequired = (pkg: Package, userType: 'traveler' | 'shopper'): boolean => {
    if (userType === 'traveler') {
      return pkg.status === 'matched' || pkg.status === 'in_transit';
    } else {
      return pkg.status === 'quote_sent' || pkg.status === 'quote_accepted' || pkg.status === 'pending_purchase' || pkg.status === 'quote_expired';
    }
  };

  const getStatusColor = (status: string): string => {
    const colorMap = {
      pending_approval: "hsl(var(--muted-foreground))",
      approved: "hsl(var(--success))",
      matched: "hsl(var(--info))",
      quote_sent: "hsl(var(--warning))",
      quote_accepted: "hsl(var(--success))",
      quote_rejected: "hsl(var(--destructive))",
      quote_expired: "hsl(var(--warning))",
      payment_pending_approval: "hsl(var(--warning))",
      payment_confirmed: "hsl(var(--success))",
      payment_pending: "hsl(var(--warning))",
      pending_purchase: "hsl(var(--warning))",
      in_transit: "hsl(var(--info))",
      received_by_traveler: "hsl(var(--success))",
      pending_office_confirmation: "hsl(var(--warning))",
      delivered_to_office: "hsl(var(--success))",
      out_for_delivery: "hsl(var(--warning))",
      active: "hsl(var(--success))",
      completed: "hsl(var(--success))",
      rejected: "hsl(var(--destructive))"
    };

    return colorMap[status as keyof typeof colorMap] || "hsl(var(--muted-foreground))";
  };

  return {
    getStatusBadge,
    hasActionRequired,
    getStatusColor
  };
};