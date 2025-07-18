import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/priceHelpers';
import { useTripPayments } from '@/hooks/useTripPayments';
import TripBankingConfirmationModal from '@/components/TripBankingConfirmationModal';
import { useState } from 'react';
import { Banknote, Package, CheckCircle, Clock } from 'lucide-react';

interface TripPaymentSummaryProps {
  trip: any;
  userProfile: any;
}

export const TripPaymentSummary: React.FC<TripPaymentSummaryProps> = ({ 
  trip, 
  userProfile 
}) => {
  const { tripPayment, loading, createPaymentOrder } = useTripPayments(trip.id);
  const [showBankingModal, setShowBankingModal] = useState(false);

  const handlePaymentRequest = async (bankingInfo: any) => {
    try {
      await createPaymentOrder(bankingInfo);
      setShowBankingModal(false);
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  if (loading || !tripPayment) {
    return null;
  }

  const isAllPackagesDelivered = tripPayment.delivered_packages_count === tripPayment.total_packages_count;
  const hasAccumulatedAmount = tripPayment.accumulated_amount > 0;

  return (
    <>
      <Card className="bg-muted/20 border">
        <CardHeader className="pb-1 pt-2">
          <CardTitle className="flex items-center gap-1 text-xs font-medium">
            <Banknote className="h-3 w-3" />
            Resumen de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 pb-2 px-3">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Package className="h-2.5 w-2.5" />
                <span className="text-[10px] text-muted-foreground">Paquetes</span>
              </div>
              <div className="text-xs font-medium">
                {tripPayment.delivered_packages_count} / {tripPayment.total_packages_count}
              </div>
              <Badge variant={isAllPackagesDelivered ? "default" : "secondary"} className="text-[9px] py-0 px-1 h-4">
                {isAllPackagesDelivered ? "✓" : "..."}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="font-bold text-[9px]">Q</span>
                <span className="text-[10px] text-muted-foreground">Total</span>
              </div>
              <div className="text-xs font-medium">
                {formatCurrency(tripPayment.accumulated_amount)}
              </div>
              {hasAccumulatedAmount && (
                <Badge variant="outline" className="text-[9px] py-0 px-1 h-4">
                  Tips
                </Badge>
              )}
            </div>
          </div>

          {hasAccumulatedAmount && (
            <div className="border-t pt-1">
              {!tripPayment.payment_order_created ? (
                <>
                  {isAllPackagesDelivered ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-2.5 w-2.5" />
                        <span className="text-[10px]">Listo</span>
                      </div>
                      <Button 
                        onClick={() => setShowBankingModal(true)}
                        className="w-full h-6 text-[10px] py-0"
                        size="sm"
                      >
                        Solicitar {formatCurrency(tripPayment.accumulated_amount)}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-2.5 w-2.5" />
                      <span className="text-[10px]">
                        Pendiente entrega
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-0.5">
                  <Badge variant="default" className="mb-0.5 text-[9px] py-0 px-1 h-4">
                    Solicitado
                  </Badge>
                  <p className="text-[10px] text-muted-foreground">
                    En proceso
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasAccumulatedAmount && (
            <div className="text-center text-muted-foreground text-[10px]">
              Sin tips aún
            </div>
          )}
        </CardContent>
      </Card>

      <TripBankingConfirmationModal
        isOpen={showBankingModal}
        onClose={() => setShowBankingModal(false)}
        onConfirm={handlePaymentRequest}
        amount={tripPayment.accumulated_amount}
        currentBankingInfo={userProfile}
        title="Confirmar Datos Bancarios para Pago del Viaje"
        description={`Se creará una solicitud de pago por ${formatCurrency(tripPayment.accumulated_amount)} correspondiente a los tips de todos los paquetes entregados en este viaje.`}
      />
    </>
  );
};