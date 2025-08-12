import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Package2 } from "lucide-react";
import { Package } from "@/types";
import QuoteCountdown from "../QuoteCountdown";
import { useToast } from "@/hooks/use-toast";

interface ShopperPackagePriorityActionsProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: 'user' | 'admin') => void;
  onRefresh?: () => void;
  onDeletePackage?: (pkg: Package) => void;
}

const ShopperPackagePriorityActions = ({
  pkg,
  onQuote,
  onRefresh,
  onDeletePackage
}: ShopperPackagePriorityActionsProps) => {
  const { toast } = useToast();

  const handleQuoteExpire = () => {
    toast({
      title: "⏰ Cotización expirada",
      description: "Esta cotización ha expirado. Puedes solicitar una nueva al viajero.",
      variant: "destructive"
    });
    onRefresh?.();
  };
  // Always show instructions for all statuses

  // Debug logging to see why countdown might not appear
  console.log('🕒 QuoteCountdown Debug:', {
    packageId: pkg.id,
    status: pkg.status,
    quote_expires_at: pkg.quote_expires_at,
    hasQuoteExpiresAt: !!pkg.quote_expires_at,
    isQuoteExpired: pkg.quote_expires_at ? new Date(pkg.quote_expires_at) <= new Date() : 'N/A'
  });

  const isQuoteExpired = !!(pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date());

  const getActionConfig = () => {
    switch (pkg.status) {
      case 'quote_sent':
        return {
          icon: Clock,
          title: isQuoteExpired ? "Cotización expirada" : "¡Tienes una cotización pendiente!",
          description: isQuoteExpired 
            ? "Esta cotización expiró. El viajero debe enviar una nueva cotización." 
            : "Revisa y responde la cotización del viajero.",
          button: isQuoteExpired ? null : {
            text: "Ver y Responder Cotización",
            onClick: () => onQuote(pkg, 'user')
          }
        };
      case 'quote_expired':
        return {
          icon: Clock,
          title: "⏰ Cotización expirada",
          description: "La cotización para este paquete ha expirado. Puedes contactar al viajero para solicitar una nueva.",
          button: null
        };
      case 'matched':
        return {
          icon: Package2,
          title: "👥 Asignado a viajero",
          description: "Tu paquete fue asignado a un viajero. Pronto recibirás una cotización.",
          button: null
        };
      case 'approved':
        return {
          icon: Clock,
          title: "✅ Pedido aprobado",
          description: "Tu pedido fue aprobado y está pendiente de asignarse a un viajero disponible.",
          button: null
        };
      case 'quote_accepted':
        return {
          icon: CreditCard,
          title: "¡Cotización aceptada!",
          description: "Tu cotización fue aceptada. Ahora debes realizar el pago para que el viajero pueda comprar tu producto.",
          button: null
        };
      case 'payment_pending':
        return {
          icon: CreditCard,
          title: "💰 Realizar Pago",
          description: "Transfiere el pago a la cuenta de Favorón S.A. y sube tu comprobante abajo.",
          button: null
        };
      case 'payment_pending_approval':
        return {
          icon: Clock,
          title: "⏳ Verificando pago",
          description: "Tu comprobante de pago está siendo verificado. Te notificaremos cuando sea aprobado.",
          button: null
        };
      case 'payment_confirmed':
        return {
          icon: Package2,
          title: "¡Pago confirmado!",
          description: "Tu pago fue aprobado. El viajero procederá a comprar el producto.",
          button: null
        };
      case 'pending_purchase':
        return {
          icon: Package2,
          title: "🛒 Tu turno de comprar",
          description: "Completa la compra y sube el comprobante e información de seguimiento.",
          button: null
        };
      case 'purchase_confirmed':
        return {
          icon: Package2,
          title: "✅ Compra confirmada",
          description: "El viajero confirmó la compra. El producto está siendo enviado a su dirección.",
          button: null
        };
      case 'in_transit':
        return {
          icon: Package2,
          title: "📦 Producto en camino al viajero",
          description: "El producto fue comprado y está siendo enviado por la tienda a la dirección del viajero.",
          button: null
        };
      case 'pending_office_confirmation':
        return {
          icon: Clock,
          title: "📦 Esperando confirmación",
          description: "El viajero entregó el paquete en oficina. Esperando confirmación de recepción.",
          button: null
        };
      case 'ready_for_pickup':
        return {
          icon: Package2,
          title: "✅ Listo para recoger",
          description: "Tu paquete está en la oficina de Favorón, listo para ser recogido.",
          button: null
        };
      case 'ready_for_delivery':
        return {
          icon: Package2,
          title: "🚛 Listo para entrega",
          description: "Tu paquete está en la oficina de Favorón, listo para ser entregado a domicilio.",
          button: null
        };
      case 'delivered':
        return {
          icon: Package2,
          title: "🎉 Entregado",
          description: "¡Tu paquete ha sido entregado exitosamente!",
          button: null
        };
      case 'completed':
        return {
          icon: Package2,
          title: "✅ Completado",
          description: "¡Solicitud completada exitosamente!",
          button: null
        };
      default:
        return {
          icon: Package2,
          title: "📦 Estado del paquete",
          description: "Revisa el estado actual de tu solicitud.",
          button: null
        };
    }
  };

  const config = getActionConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className="space-y-4">
      {/* Countdown for active quotes */}
      {['quote_sent', 'quote_accepted', 'awaiting_payment', 'payment_pending_approval'].includes(pkg.status) && 
       pkg.quote_expires_at && 
       !isQuoteExpired && (
        <div className="mb-4">
          <QuoteCountdown 
            expiresAt={pkg.quote_expires_at} 
            onExpire={handleQuoteExpire}
            compact={true}
          />
        </div>
      )}
      
      <div className="p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
            <IconComponent className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <p className="text-sm font-medium text-primary">{config.title}</p>
            <p className="text-xs text-muted-foreground">{config.description}</p>
            {config.button && (
              <Button 
                size="sm"
                onClick={config.button.onClick}
                className="mt-3"
              >
                {config.button.text}
              </Button>
            )}
            {(isQuoteExpired || pkg.status === 'quote_expired') && (
              <div className="flex flex-wrap gap-2 mt-3">
                <Button size="sm" onClick={() => onQuote(pkg, 'user')}>
                  Solicitar re-cotización
                </Button>
                {onDeletePackage && (
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => {
                      if (window.confirm('¿Seguro que deseas eliminar este pedido? Esta acción no se puede deshacer.')) {
                        onDeletePackage(pkg);
                      }
                    }}
                  >
                    Eliminar pedido
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


export default ShopperPackagePriorityActions;
