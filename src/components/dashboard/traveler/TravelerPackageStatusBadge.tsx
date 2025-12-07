import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import QuoteCountdown from "../QuoteCountdown";

interface StatusConfig {
  emoji: string;
  label: string;
  description: string;
  bgColor: string;
  textColor: string;
  actionMessage?: string;
  showConfirmation?: boolean;
}

const TRAVELER_STATUS_MAP: Record<string, StatusConfig> = {
  pending_approval: {
    emoji: "⏳",
    label: "Pendiente de aprobación",
    description: "Pendiente de aprobación",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
  },
  approved: {
    emoji: "👍",
    label: "Aprobado",
    description: "Viaje aprobado - Pronto recibirás solicitudes.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  matched: {
    emoji: "🔗",
    label: "Emparejado",
    description: "Recibiste una solicitud - Revisa y acepta si estás de acuerdo.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
    actionMessage: "Revisa el pedido y acéptalo si te parece bien",
  },
  quote_sent: {
    emoji: "📝",
    label: "Cotización enviada",
    description: "Cotización enviada - El shopper debe aceptar la cotización.",
    bgColor: "bg-muted/50",
    textColor: "text-muted-foreground",
  },
  quote_accepted: {
    emoji: "✅",
    label: "Cotización aceptada",
    description: "El shopper aceptó la cotización pero aún está pendiente de pago",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  payment_confirmed: {
    emoji: "💳",
    label: "Pago confirmado",
    description: "Pago confirmado - El shopper pagó la cotización. Pronto subirá el recibo de compra y tracking del paquete.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  pending_purchase: {
    emoji: "🛍️",
    label: "Pendiente de compra",
    description: "Pago confirmado - El shopper pagó la cotización. Pronto subirá el recibo de compra y tracking del paquete.",
    bgColor: "bg-muted/50",
    textColor: "text-muted-foreground",
  },
  in_transit: {
    emoji: "🚚",
    label: "En tránsito",
    description: "En tránsito - Confirma cuando recibas el paquete.",
    bgColor: "bg-orange-50",
    textColor: "text-orange-600",
    actionMessage: "¿Ya recibiste el paquete?",
  },
  received_by_traveler: {
    emoji: "✅",
    label: "Paquete recibido",
    description: "Paquete recibido",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
    actionMessage: "Al llegar a tu destino, entrega el paquete en la oficina de Favorón.",
    showConfirmation: true,
  },
  pending_office_confirmation: {
    emoji: "⏳",
    label: "Entregado",
    description: "Entregado - Esperando confirmación de oficina",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    actionMessage: "🔒 Entrega pendiente de confirmación - Has declarado la entrega. Esperando que Favorón confirme la recepción para crear tu orden de pago.",
  },
  delivered_to_office: {
    emoji: "🏢",
    label: "Entregado en oficina",
    description: "Entregado en oficina.",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  ready_for_pickup: {
    emoji: "📦",
    label: "Listo para recoger",
    description: "El paquete está listo para que el shopper lo recoja en oficina.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  ready_for_delivery: {
    emoji: "🚛",
    label: "Listo para entrega",
    description: "El paquete está listo para ser enviado al domicilio del shopper.",
    bgColor: "bg-blue-50",
    textColor: "text-blue-600",
  },
  completed: {
    emoji: "✅",
    label: "Completado",
    description: "Completado - Paquete entregado exitosamente",
    bgColor: "bg-green-50",
    textColor: "text-green-600",
  },
  cancelled: {
    emoji: "❌",
    label: "Cancelado",
    description: "Cancelado",
    bgColor: "bg-red-50",
    textColor: "text-red-600",
  },
  quote_expired: {
    emoji: "⏰",
    label: "Cotización expirada",
    description: "La cotización expiró porque el shopper no pagó a tiempo.",
    bgColor: "bg-amber-50",
    textColor: "text-amber-600",
    actionMessage: "Puedes descartar este paquete de tu lista de viajes.",
  },
};

interface TravelerPackageStatusBadgeProps {
  status: string;
  pkg?: any;
  showFullDescription?: boolean;
  className?: string;
}

export const TravelerPackageStatusBadge = ({ 
  status, 
  pkg,
  showFullDescription = false,
  className = "" 
}: TravelerPackageStatusBadgeProps) => {
  const config = TRAVELER_STATUS_MAP[status] || {
    emoji: "⏳",
    label: "Estado desconocido",
    description: status,
    bgColor: "bg-muted/50",
    textColor: "text-muted-foreground",
  };

  // Check if office delivery was confirmed
  const isOfficeConfirmed = pkg?.office_delivery?.admin_confirmed_at;
  
  // Enhance received_by_traveler message if office confirmed
  if (status === 'received_by_traveler' && isOfficeConfirmed) {
    config.actionMessage = "✅ Entrega confirmada por Favorón - Favorón ha confirmado la recepción del paquete. Cuando todos tus paquetes estén confirmados podrás crear tu orden de cobro.";
  }

  // Add confirmation date if available
  let enhancedDescription = config.description;
  if (status === 'received_by_traveler' && config.showConfirmation && pkg?.traveler_confirmation?.confirmed_at) {
    const confirmDate = format(new Date(pkg.traveler_confirmation.confirmed_at), "d 'de' MMMM, yyyy", { locale: es });
    enhancedDescription = `${config.description} (${confirmDate})`;
  }

  if (!showFullDescription) {
    return (
      <Badge className={`${config.bgColor} ${config.textColor} border-0 ${className}`}>
        {config.emoji} {config.label}
      </Badge>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      <div className={`${config.bgColor} ${config.textColor} border border-current/20 rounded-lg p-3`}>
        <div className="flex items-start gap-2">
          <span className="text-lg">{config.emoji}</span>
          <div className="flex-1">
            <p className="font-semibold text-sm">{config.label}</p>
            <p className="text-xs mt-1 opacity-90">{enhancedDescription}</p>
          </div>
        </div>
      </div>
      
      {/* Show countdown timer for quote_sent status */}
      {status === 'quote_sent' && pkg?.quote_expires_at && new Date(pkg.quote_expires_at) > new Date() && (
        <div className="space-y-2 px-3">
          <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />
          <p className="text-xs text-amber-600">
            ⚠️ Si el shopper no acepta en este tiempo, el paquete se removerá de tu viaje automáticamente.
          </p>
        </div>
      )}
      
      {config.actionMessage && (
        <Alert className="hidden sm:block border-blue-200 bg-blue-50">
          <AlertDescription className="text-sm text-blue-800">
            💡 {config.actionMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export const getTravelerStatusConfig = (status: string): StatusConfig => {
  return TRAVELER_STATUS_MAP[status] || {
    emoji: "⏳",
    label: "Estado desconocido",
    description: status,
    bgColor: "bg-muted/50",
    textColor: "text-muted-foreground",
  };
};
