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
  if (!['quote_sent', 'quote_accepted', 'awaiting_payment', 'payment_confirmed'].includes(pkg.status)) {
    return null;
  }

  const getActionConfig = () => {
    switch (pkg.status) {
      case 'quote_sent':
        return {
          icon: Clock,
          title: "¡Tienes una cotización pendiente!",
          description: "Revisa y responde la cotización del viajero.",
          button: {
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
  );
};

export default ShopperPackagePriorityActions;