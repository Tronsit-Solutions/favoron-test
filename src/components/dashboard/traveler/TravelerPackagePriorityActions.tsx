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

  // Calculate tip/compensation for traveler
  const getTravelerTip = () => {
    if (pkg.quote?.price) {
      return parseFloat(pkg.quote.price).toFixed(2);
    }
    return null;
  };

  const travelerTip = getTravelerTip();

  return (
    <div className="mb-4 space-y-3">
      {/* Tip/Compensation display - most important for travelers */}
      {travelerTip && (
        <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-semibold text-success mb-1">💰 Tu compensación</p>
                <p className="text-2xl font-bold text-success">${travelerTip}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-success/80">Ganancia por este Favorón</p>
            </div>
          </div>
        </div>
      )}

      {/* Action section */}
      <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 border border-primary/20 rounded-lg">
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
    </div>
  );
};

export default TravelerPackagePriorityActions;