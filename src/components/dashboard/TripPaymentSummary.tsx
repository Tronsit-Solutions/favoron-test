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
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Banknote className="h-5 w-5" />
            Resumen de Pagos del Viaje
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Package className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Paquetes</span>
              </div>
              <div className="text-lg font-semibold">
                {tripPayment.delivered_packages_count} / {tripPayment.total_packages_count}
              </div>
              <Badge variant={isAllPackagesDelivered ? "default" : "secondary"} className="mt-1">
                {isAllPackagesDelivered ? "Todos entregados" : "En progreso"}
              </Badge>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Banknote className="h-4 w-4" />
                <span className="text-sm text-muted-foreground">Total Acumulado</span>
              </div>
              <div className="text-lg font-semibold">
                {formatCurrency(tripPayment.accumulated_amount)}
              </div>
              {hasAccumulatedAmount && (
                <Badge variant="outline" className="mt-1">
                  Tips acumulados
                </Badge>
              )}
            </div>
          </div>

          {hasAccumulatedAmount && (
            <div className="border-t pt-4">
              {!tripPayment.payment_order_created ? (
                <>
                  {isAllPackagesDelivered ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm">Todos los paquetes han sido entregados</span>
                      </div>
                      <Button 
                        onClick={() => setShowBankingModal(true)}
                        className="w-full"
                      >
                        Solicitar Pago de {formatCurrency(tripPayment.accumulated_amount)}
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">
                        Entrega todos los paquetes para solicitar el pago
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-2">
                  <Badge variant="default" className="mb-2">
                    Pago solicitado
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Tu solicitud de pago por {formatCurrency(tripPayment.accumulated_amount)} está siendo procesada
                  </p>
                </div>
              )}
            </div>
          )}

          {!hasAccumulatedAmount && (
            <div className="text-center text-muted-foreground text-sm">
              No hay tips acumulados aún. Entrega paquetes para generar ingresos.
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