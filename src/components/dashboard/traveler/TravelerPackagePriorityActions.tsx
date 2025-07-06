import { Button } from "@/components/ui/button";
import { DollarSign, CheckCircle } from "lucide-react";

interface TravelerPackagePriorityActionsProps {
  pkg: any;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onConfirmReceived: () => void;
}

const TravelerPackagePriorityActions = ({
  pkg,
  onQuote,
  onConfirmReceived
}: TravelerPackagePriorityActionsProps) => {
  if (pkg.status !== 'matched' && pkg.status !== 'in_transit') return null;

  return (
    <div className="mb-2 p-2 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
      <div className="flex items-start space-x-1.5">
        <div className="flex-shrink-0 w-5 h-5 bg-primary/20 rounded-full flex items-center justify-center">
          {pkg.status === 'matched' ? (
            <DollarSign className="h-2.5 w-2.5 text-primary" />
          ) : (
            <CheckCircle className="h-2.5 w-2.5 text-primary" />
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          {pkg.status === 'matched' && (
            <>
              <p className="text-sm font-bold text-primary">¿Te interesa este pedido?</p>
              <p className="text-xs text-muted-foreground">Haz tu cotización y gana dinero con este Favorón.</p>
              <Button 
                size="sm" 
                onClick={() => onQuote(pkg, 'traveler')} 
                className="flex items-center space-x-1 bg-primary hover:bg-primary/90 text-white font-semibold px-3"
              >
                <DollarSign className="h-3 w-3" />
                <span>Cotizar</span>
              </Button>
            </>
          )}
          {pkg.status === 'in_transit' && (
            <>
              <p className="text-xs font-medium text-primary">¡Paquete listo para confirmar!</p>
              <p className="text-xs text-muted-foreground">¿Ya recibiste el paquete del shopper?</p>
              <Button 
                size="sm" 
                onClick={onConfirmReceived} 
                className="flex items-center space-x-1" 
                variant="outline"
              >
                <CheckCircle className="h-3 w-3" />
                <span>Confirmar que recibí el paquete</span>
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelerPackagePriorityActions;