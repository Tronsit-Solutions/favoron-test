
import { Badge } from "@/components/ui/badge";
import { Package, Trip } from "@/types";

export const useStatusHelpers = () => {
  // Helper functions to detect expiration states
  const isQuoteExpired = (pkg: any): boolean => {
    if (!pkg.quote_expires_at) return false;
    return new Date(pkg.quote_expires_at) < new Date();
  };

  const getExpirationInfo = (pkg: any) => {
    const quoteExp = isQuoteExpired(pkg);
    
    if (quoteExp && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status)) {
      const expiredAt = new Date(pkg.quote_expires_at);
      const hoursAgo = Math.floor((Date.now() - expiredAt.getTime()) / (1000 * 60 * 60));
      return {
        type: 'quote_expired',
        message: `Cotización expirada hace ${hoursAgo}h`,
        hoursAgo
      };
    }
    
    return null;
  };

  const getStatusBadge = (
    status: string,
    packageDestinationOrOptions?: string | { 
      packageDestination?: string; 
      isQuoteExpired?: boolean; 
      rejectionReason?: string;
      pkg?: any; // Add package object for expiration detection
      context?: 'package' | 'trip'; // Add context to differentiate between package and trip
    }
  ) => {
    const isObj = typeof packageDestinationOrOptions === 'object' && packageDestinationOrOptions !== null;
    const packageDestination = (isObj
      ? (packageDestinationOrOptions as { packageDestination?: string }).packageDestination
      : (packageDestinationOrOptions as string | undefined));
    const isQuoteExpiredFlag = isObj
      ? !!(packageDestinationOrOptions as { isQuoteExpired?: boolean }).isQuoteExpired
      : false;
    const rejectionReason = isObj
      ? (packageDestinationOrOptions as { rejectionReason?: string }).rejectionReason
      : undefined;
    const pkg = isObj
      ? (packageDestinationOrOptions as { pkg?: any }).pkg
      : undefined;
    const context = isObj
      ? (packageDestinationOrOptions as { context?: 'package' | 'trip' }).context
      : undefined;

    // Check for real-time expiration states
    let effectiveStatus = status;
    
    if (pkg) {
      if (pkg.quote_expires_at && new Date(pkg.quote_expires_at) < new Date() &&
          ['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status)) {
        effectiveStatus = 'quote_expired';
      }
    } else if (status === 'quote_sent' && isQuoteExpiredFlag) {
      effectiveStatus = 'quote_expired';
    }
    
    // Handle re-approved packages (approved after rejection)
    const isReapproved = status === 'approved' && rejectionReason;

    const statusConfig = {
      pending_approval: { label: "Pendiente de aprobación", variant: "warning" as const },
      approved: { 
        label: isReapproved 
          ? "Re-aprobado" 
          : context === 'trip' 
            ? "Aprobado" 
            : "Pendiente de asignar a un viajero", 
        variant: isReapproved ? "warning" as const : "success" as const 
      },
      matched: { label: "Emparejado", variant: "success" as const },
      quote_sent: { label: "Cotización Enviada", variant: "warning" as const },
      quote_accepted: { label: "Pendiente Pago", variant: "destructive" as const },
      quote_rejected: { 
        label: pkg?.quote_rejection ? "Cotización Rechazada por Shopper" : 
               pkg?.traveler_rejection ? "Cotización Rechazada por Viajero" : 
               "Cotización Rechazada", 
        variant: "destructive" as const 
      },
      quote_expired: { label: "⏰ Cotización Expirada", variant: "destructive" as const },
      payment_pending_approval: { label: "Pago Pendiente de Aprobación", variant: "warning" as const },
      payment_pending: { label: "Pago Pendiente", variant: "warning" as const },
      pending_purchase: { label: "Cotización Pagada", variant: "success" as const },
      in_transit: { label: "En Tránsito", variant: "warning" as const },
      received_by_traveler: { label: "Recibido por viajero", variant: "success" as const },
      pending_office_confirmation: { label: "🔒 Esperando confirmación", variant: "warning" as const },
      delivered_to_office: { label: "Entregado en oficina", variant: "success" as const },
      ready_for_pickup: { label: "📦 Listo para recoger", variant: "default" as const },
      ready_for_delivery: { label: "🚛 Listo para entrega", variant: "default" as const },
      out_for_delivery: { 
        label: packageDestination ? `En reparto en ${packageDestination}` : "En reparto", 
        variant: "warning" as const 
      },
      active: { label: "Activo", variant: "success" as const },
      completed: { label: "Completado", variant: "success" as const },
      completed_paid: { label: "Completado y pagado", variant: "success" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const },
      cancelled: { label: "Cancelado", variant: "muted" as const },
      deadline_expired: { label: "⏰ Fecha límite vencida", variant: "warning" as const },
      expired: { label: "Expirado", variant: "secondary" as const }
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
      payment_pending: "hsl(var(--warning))",
      pending_purchase: "hsl(var(--success))",
      in_transit: "hsl(var(--info))",
      received_by_traveler: "hsl(var(--success))",
      pending_office_confirmation: "hsl(var(--warning))",
      delivered_to_office: "hsl(var(--success))",
      ready_for_pickup: "hsl(var(--info))",
      ready_for_delivery: "hsl(var(--info))",
      out_for_delivery: "hsl(var(--warning))",
      active: "hsl(var(--success))",
      completed: "hsl(var(--success))",
      rejected: "hsl(var(--destructive))",
      cancelled: "hsl(var(--muted-foreground))",
      deadline_expired: "hsl(var(--warning))"
    };

    return colorMap[status as keyof typeof colorMap] || "hsl(var(--muted-foreground))";
  };

  return {
    getStatusBadge,
    hasActionRequired,
    getStatusColor,
    isQuoteExpired,
    getExpirationInfo
  };
};
