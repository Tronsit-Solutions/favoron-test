import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Clock, CreditCard, Package2 } from "lucide-react";
import { Package } from "@/types";

interface ShopperPackagePriorityActionsProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: 'user' | 'admin') => void;
}

const ShopperPackagePriorityActions = ({
  pkg,
  onQuote
}: ShopperPackagePriorityActionsProps) => {
  if (!['quote_sent', 'quote_accepted', 'awaiting_payment', 'payment_pending_approval', 'pending_purchase', 'payment_confirmed'].includes(pkg.status)) {
    return null;
  }

  // Debug logging to see why countdown might not appear
  console.log('🕒 QuoteCountdown Debug:', {
    packageId: pkg.id,
    status: pkg.status,
    quote_expires_at: pkg.quote_expires_at,
    hasQuoteExpiresAt: !!pkg.quote_expires_at,
    isQuoteExpired: pkg.quote_expires_at ? new Date(pkg.quote_expires_at) <= new Date() : 'N/A'
  });

  const isQuoteExpired = pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date();

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
      case 'quote_accepted':
        return {
          icon: CreditCard,
          title: "¡Cotización aceptada! Ahora debes realizar el pago",
          description: "Transfiere a la cuenta de Favorón S.A. y sube tu comprobante de pago abajo.",
          button: null
        };
      case 'awaiting_payment':
        return {
          icon: CreditCard,
          title: "💰 Realizar Pago",
          description: "Tu cotización fue aceptada. Ahora necesitas realizar el pago para que el viajero pueda comprar tu producto.",
          button: null
        };
      case 'payment_pending_approval':
        return {
          icon: Clock,
          title: "⏳ Comprobante de pago subido",
          description: "El administrador está verificando tu pago. Te notificaremos cuando sea aprobado.",
          button: null
        };
      case 'pending_purchase':
        return {
          icon: Package2,
          title: "¡Pago aprobado! Hora de comprar",
          description: "Tu pago fue confirmado. Compra el producto y sube la confirmación de compra abajo.",
          button: null
        };
      case 'payment_confirmed':
        return {
          icon: Package2,
          title: "¡Pago confirmado! Envía el paquete",
          description: "Compra y envía el paquete al viajero usando la dirección proporcionada.",
          button: null
        };
      default:
        return null;
    }
  };

  const config = getActionConfig();
  if (!config) return null;

  const IconComponent = config.icon;

  return (
    <div className="space-y-3">
      {/* Simple countdown text - outside the box */}
      {['quote_sent', 'quote_accepted', 'awaiting_payment', 'payment_pending_approval'].includes(pkg.status) && pkg.quote_expires_at && !isQuoteExpired && (
        <SimpleCountdown expiresAt={pkg.quote_expires_at} />
      )}
      
      <div className="mb-3 p-2 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
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
                className="mt-2"
              >
                {config.button.text}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Simple countdown component as text
const SimpleCountdown = ({ expiresAt }: { expiresAt: string | Date }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const expireTime = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const difference = expireTime - now;

      if (difference <= 0) {
        setTimeLeft("Expirado");
        return;
      }

      const hours = Math.floor(difference / (1000 * 60 * 60));
      const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((difference % (1000 * 60)) / 1000);

      setTimeLeft(`${hours}h ${minutes}m ${seconds}s restantes`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <p className="text-sm text-foreground">
      ⏰ Tiempo para responder: {timeLeft}
    </p>
  );
};

export default ShopperPackagePriorityActions;