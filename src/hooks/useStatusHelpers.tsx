import { Badge } from "@/components/ui/badge";
import { Package, Trip } from "@/types";

export const useStatusHelpers = () => {
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending_approval: { label: "Pendiente", variant: "secondary" as const },
      approved: { label: "Aprobado", variant: "default" as const },
      matched: { label: "Emparejado", variant: "secondary" as const },
      quote_sent: { label: "Cotización Enviada", variant: "outline" as const },
      quote_accepted: { label: "Cotización Aceptada", variant: "default" as const },
      quote_rejected: { label: "Cotización Rechazada", variant: "destructive" as const },
      payment_confirmed: { label: "Pago Confirmado", variant: "default" as const },
      payment_pending: { label: "Pago Pendiente", variant: "secondary" as const },
      in_transit: { label: "En Tránsito", variant: "outline" as const },
      received_by_traveler: { label: "Recibido", variant: "default" as const },
      delivered_to_office: { label: "Entregado", variant: "default" as const },
      active: { label: "Activo", variant: "default" as const },
      completed: { label: "Completado", variant: "default" as const },
      rejected: { label: "Rechazado", variant: "destructive" as const }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || 
                   { label: status, variant: "secondary" as const };

    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const hasActionRequired = (pkg: Package, userType: 'traveler' | 'shopper'): boolean => {
    if (userType === 'traveler') {
      return pkg.status === 'matched' || pkg.status === 'in_transit';
    } else {
      return pkg.status === 'quote_sent' || pkg.status === 'quote_accepted' || pkg.status === 'payment_confirmed';
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
      payment_confirmed: "hsl(var(--success))",
      payment_pending: "hsl(var(--warning))",
      in_transit: "hsl(var(--info))",
      received_by_traveler: "hsl(var(--success))",
      delivered_to_office: "hsl(var(--success))",
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