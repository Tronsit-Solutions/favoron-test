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
  
  // Calcular valores correctos usando cityArea de confirmed_delivery_address
  const confirmedAddress = pkg.confirmed_delivery_address as any;
  const cityArea = confirmedAddress?.cityArea;
  
  const correctServiceFee = calculateServiceFee(travelerTip, pkg.profiles?.trust_level);
  const correctDeliveryFee = getDeliveryFee(
    pkg.delivery_method || 'pickup',
    pkg.profiles?.trust_level,
    cityArea
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
      {pkg.profiles?.trust_level === 'prime' && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="bg-purple-600 text-white">
                USUARIO PRIME
              </Badge>
              <span className="text-sm font-medium text-purple-900">
                Beneficios aplicados
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-xs text-muted-foreground">Comisión Favorón</p>
              <p className="font-semibold text-purple-700">20% (vs 40% estándar)</p>
            </div>
            <div className="bg-white rounded p-2 border border-purple-100">
              <p className="text-xs text-muted-foreground">Envío</p>
              <p className="font-semibold text-purple-700">
                {pkg.delivery_method === 'pickup' 
                  ? 'Pickup (Q0)' 
                  : correctDeliveryFee === 0
                    ? 'Gratis en Guatemala'
                    : `Q${correctDeliveryFee} (vs Q60 estándar)`
                }
              </p>
            </div>
          </div>
        </div>
      )}
      
      
      {!hasIssue && pkg.profiles?.trust_level === 'prime' && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-700">✓ Cotización correcta para usuario Prime</p>
              <p className="text-sm text-green-600 mt-1">
                Service Fee: 20% (Q{correctServiceFee.toFixed(2)}) • 
                Delivery: {correctDeliveryFee === 0 ? 'Gratis' : `Q${correctDeliveryFee.toFixed(2)}`} •
                Total: Q{correctTotal.toFixed(2)}
              </p>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};
