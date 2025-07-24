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
  console.log('🏦 TripPaymentSummary - userProfile:', userProfile);
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
          <CardTitle className="flex items-center gap-1 text-sm font-medium">
            <Banknote className="h-4 w-4" />
            Resumen de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 pt-0 pb-2 px-3">
          <div className="grid grid-cols-2 gap-1">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <Package className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">Paquetes</span>
              </div>
              <div className="text-sm font-medium">
                {tripPayment.delivered_packages_count} / {tripPayment.total_packages_count}
              </div>
              <Badge variant={isAllPackagesDelivered ? "default" : "secondary"} className="text-xs py-0 px-1 h-5">
                {isAllPackagesDelivered ? "✓" : "..."}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <span className="font-bold text-xs">Q</span>
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-sm font-medium">
                {formatCurrency(tripPayment.accumulated_amount)}
              </div>
              {hasAccumulatedAmount && (
                <Badge variant="outline" className="text-xs py-0 px-1 h-5">
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
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Listo</span>
                      </div>
                      <Button 
                        onClick={() => setShowBankingModal(true)}
                        className="w-full h-7 text-xs py-0"
                        size="sm"
                      >
                        Solicitar {formatCurrency(tripPayment.accumulated_amount)}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        Pendiente entrega
                      </span>
                    </div>
                  )}
                </>
              ) : tripPayment.payment_status === 'completed' ? (
                <div className="text-center py-0.5">
                  <Badge variant="default" className="mb-0.5 text-xs py-0 px-1 h-5 bg-green-600">
                    Pagado
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Completado
                  </p>
                </div>
              ) : (
                <div className="text-center py-0.5">
                  <Badge variant="default" className="mb-0.5 text-xs py-0 px-1 h-5">
                    Solicitado
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    En proceso
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasAccumulatedAmount && (
            <div className="text-center text-muted-foreground text-xs">
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