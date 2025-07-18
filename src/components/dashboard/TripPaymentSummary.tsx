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
      <Card className="bg-accent/50">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Banknote className="h-4 w-4" />
            Resumen de Pagos del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 pt-0">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Package className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">Paquetes</span>
              </div>
              <div className="text-sm font-semibold">
                {tripPayment.delivered_packages_count} / {tripPayment.total_packages_count}
              </div>
              <Badge variant={isAllPackagesDelivered ? "default" : "secondary"} className="text-xs py-0 px-1">
                {isAllPackagesDelivered ? "Completo" : "Progreso"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Banknote className="h-3 w-3" />
                <span className="text-xs text-muted-foreground">Total</span>
              </div>
              <div className="text-sm font-semibold">
                {formatCurrency(tripPayment.accumulated_amount)}
              </div>
              {hasAccumulatedAmount && (
                <Badge variant="outline" className="text-xs py-0 px-1">
                  Tips
                </Badge>
              )}
            </div>
          </div>

          {hasAccumulatedAmount && (
            <div className="border-t pt-2">
              {!tripPayment.payment_order_created ? (
                <>
                  {isAllPackagesDelivered ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span className="text-xs">Listo para solicitar pago</span>
                      </div>
                      <Button 
                        onClick={() => setShowBankingModal(true)}
                        className="w-full h-8 text-xs"
                        size="sm"
                      >
                        Solicitar {formatCurrency(tripPayment.accumulated_amount)}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-amber-600">
                      <Clock className="h-3 w-3" />
                      <span className="text-xs">
                        Entrega todos para solicitar pago
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-1">
                  <Badge variant="default" className="mb-1 text-xs py-0 px-1">
                    Solicitado
                  </Badge>
                  <p className="text-xs text-muted-foreground">
                    Pago por {formatCurrency(tripPayment.accumulated_amount)} en proceso
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasAccumulatedAmount && (
            <div className="text-center text-muted-foreground text-xs">
              Entrega paquetes para generar tips.
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