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
    <div className="mb-4 p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="flex-shrink-0 w-6 h-6 bg-primary/20 rounded-full flex items-center justify-center">
            {pkg.status === 'matched' ? (
              <DollarSign className="h-3 w-3 text-primary" />
            ) : (
              <CheckCircle className="h-3 w-3 text-primary" />
            )}
          </div>
          <div className="flex-1">
            {pkg.status === 'matched' && (
              <div>
                <p className="text-sm font-semibold text-primary mb-1">¿Te interesa este pedido?</p>
                <p className="text-xs text-muted-foreground">Haz tu cotización y gana dinero con este Favorón.</p>
              </div>
            )}
            {pkg.status === 'in_transit' && (
              <div>
                <p className="text-sm font-semibold text-primary mb-1">¡Paquete listo para confirmar!</p>
                <p className="text-xs text-muted-foreground">¿Ya recibiste el paquete del shopper?</p>
              </div>
            )}
          </div>
        </div>
        <div className="flex-shrink-0">
          {pkg.status === 'matched' && (
            <Button 
              size="sm" 
              onClick={() => onQuote(pkg, 'traveler')} 
              className="bg-primary hover:bg-primary/90 text-white font-semibold px-4 py-2 h-8"
            >
              <DollarSign className="h-3 w-3 mr-1" />
              Cotizar
            </Button>
          )}
          {pkg.status === 'in_transit' && (
            <Button 
              size="sm" 
              onClick={onConfirmReceived} 
              variant="outline"
              className="font-medium px-4 py-2 h-8 border-primary/30 text-primary hover:bg-primary/10"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Confirmar recibido
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelerPackagePriorityActions;