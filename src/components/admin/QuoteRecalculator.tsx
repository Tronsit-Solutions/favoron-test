import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { calculateServiceFee, getDeliveryFee } from "@/lib/pricing";

interface QuoteRecalculatorProps {
  pkg: any;
  onRecalculated?: () => void;
}

export const QuoteRecalculator = ({ pkg, onRecalculated }: QuoteRecalculatorProps) => {
  const [recalculating, setRecalculating] = useState(false);
  
  // Calcular lo que DEBERÍA ser según trust level actual
  const travelerTip = parseFloat(pkg.quote?.price || '0');
  const currentServiceFee = parseFloat(pkg.quote?.serviceFee || '0');
  const currentDeliveryFee = parseFloat(pkg.quote?.deliveryFee || '0');
  const currentTotal = parseFloat(pkg.quote?.totalPrice || '0');
  
  // Calcular valores correctos
  const correctServiceFee = calculateServiceFee(travelerTip, pkg.profiles?.trust_level);
  const correctDeliveryFee = getDeliveryFee(
    pkg.delivery_method || 'pickup',
    pkg.profiles?.trust_level,
    pkg.package_destination
  );
  const correctTotal = travelerTip + correctServiceFee + correctDeliveryFee;
  
  // Detectar si hay discrepancia
  const serviceFeeWrong = Math.abs(currentServiceFee - correctServiceFee) > 0.5;
  const deliveryFeeWrong = Math.abs(currentDeliveryFee - correctDeliveryFee) > 0.5;
  const totalWrong = Math.abs(currentTotal - correctTotal) > 0.5;
  
  const hasIssue = serviceFeeWrong || deliveryFeeWrong || totalWrong;
  
  const handleRecalculate = async () => {
    setRecalculating(true);
    
    try {
      const updatedQuote = {
        ...pkg.quote,
        serviceFee: correctServiceFee.toFixed(2),
        deliveryFee: correctDeliveryFee.toFixed(2),
        totalPrice: correctTotal.toFixed(2),
        recalculated_at: new Date().toISOString(),
        recalculated_reason: `Corregido para trust level: ${pkg.profiles?.trust_level}`
      };
      
      const { error } = await supabase
        .from('packages')
        .update({
          quote: updatedQuote,
          admin_actions_log: [
            ...(pkg.admin_actions_log || []),
            {
              action: 'quote_recalculated',
              admin_id: (await supabase.auth.getUser()).data.user?.id,
              timestamp: new Date().toISOString(),
              details: {
                previous_total: currentTotal.toFixed(2),
                new_total: correctTotal.toFixed(2),
                trust_level: pkg.profiles?.trust_level,
                reason: 'Manual recalculation for correct trust level pricing'
              }
            }
          ]
        })
        .eq('id', pkg.id);
      
      if (error) throw error;
      
      toast.success('Cotización recalculada correctamente');
      onRecalculated?.();
    } catch (error) {
      console.error('Error recalculating quote:', error);
      toast.error('Error al recalcular cotización');
    } finally {
      setRecalculating(false);
    }
  };
  
  if (!pkg.quote) return null;
  
  return (
    <div className="space-y-3">
      {hasIssue && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold">⚠️ Cotización incorrecta detectada</p>
              <div className="text-sm space-y-1">
                {serviceFeeWrong && (
                  <p>
                    • Service Fee: Q{currentServiceFee.toFixed(2)} → 
                    <span className="font-bold text-green-600"> Q{correctServiceFee.toFixed(2)}</span>
                    {pkg.profiles?.trust_level === 'prime' && ' (Prime: 20%)'}
                  </p>
                )}
                {deliveryFeeWrong && (
                  <p>
                    • Delivery Fee: Q{currentDeliveryFee.toFixed(2)} → 
                    <span className="font-bold text-green-600"> Q{correctDeliveryFee.toFixed(2)}</span>
                    {pkg.profiles?.trust_level === 'prime' && ' (Prime: gratis en Guate)'}
                  </p>
                )}
                {totalWrong && (
                  <p className="font-semibold">
                    • Total: Q{currentTotal.toFixed(2)} → 
                    <span className="font-bold text-green-600"> Q{correctTotal.toFixed(2)}</span>
                  </p>
                )}
              </div>
              <Button
                size="sm"
                onClick={handleRecalculate}
                disabled={recalculating}
                className="mt-2"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? 'animate-spin' : ''}`} />
                {recalculating ? 'Recalculando...' : 'Recalcular Cotización'}
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
      
      {!hasIssue && pkg.profiles?.trust_level === 'prime' && (
        <Alert>
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-700">✓ Cotización correcta para usuario Prime</p>
              <p className="text-sm text-muted-foreground mt-1">
                Service Fee: 20% • Delivery: {pkg.delivery_method === 'pickup' ? 'N/A' : correctDeliveryFee === 0 ? 'Gratis' : `Q${correctDeliveryFee}`}
              </p>
            </div>
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              PRIME
            </Badge>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
