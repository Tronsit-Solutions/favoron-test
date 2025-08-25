import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/utils/priceHelpers';
import { useTripPayments } from '@/hooks/useTripPayments';
import TripBankingConfirmationModal from '@/components/TripBankingConfirmationModal';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, Package, CheckCircle, Clock } from 'lucide-react';

interface TripPaymentSummaryProps {
  trip: any;
  userProfile: any;
}

export const TripPaymentSummary: React.FC<TripPaymentSummaryProps> = ({ 
  trip, 
  userProfile 
}) => {
  const { tripPayment, loading, isCreating, createPaymentOrder } = useTripPayments(trip.id);
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [packageCounts, setPackageCounts] = useState<{total: number, completed: number} | null>(null);

  const handlePaymentRequest = async (bankingInfo: any) => {
    try {
      await createPaymentOrder(bankingInfo);
      setShowBankingModal(false);
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  // Fetch package counts for this trip
  useEffect(() => {
    const fetchPackageCounts = async () => {
      try {
        const { data, error } = await supabase
          .from('packages')
          .select('status')
          .eq('matched_trip_id', trip.id)
          .not('status', 'in', '(rejected,cancelled)');

        if (error) throw error;

        const total = data?.length || 0;
        const completed = data?.filter(pkg => pkg.status === 'completed').length || 0;
        
        setPackageCounts({ total, completed });
      } catch (error) {
        console.error('Error fetching package counts:', error);
        setPackageCounts({ total: 0, completed: 0 });
      }
    };

    if (trip.id) {
      fetchPackageCounts();
    }
  }, [trip.id]);

  const handleCreateAccumulator = async () => {
    try {
      const { createOrUpdateTripPaymentAccumulator } = await import('@/hooks/useCreateTripPaymentAccumulator');
      const result = await createOrUpdateTripPaymentAccumulator(trip.id, userProfile.id);
      
      if (result.success) {
        // Force component re-render by updating a key prop or using a callback
        window.location.reload();
      } else {
        console.error('Failed to create accumulator:', result.error);
      }
    } catch (error) {
      console.error('Error creating accumulator:', error);
    }
  };

  if (loading) {
    return null;
  }

  // Si no hay tripPayment, verificar si todos los paquetes están completados
  if (!tripPayment) {
    if (!packageCounts) {
      return null; // Still loading package counts
    }

    const allPackagesCompleted = packageCounts.total > 0 && packageCounts.completed === packageCounts.total;

    return (
      <Card className="bg-muted/20 border">
        <CardContent className="p-3 text-center">
          <p className="text-xs text-muted-foreground mb-2">
            {packageCounts.completed} de {packageCounts.total} paquetes entregados en oficina. Podrás crear tu orden de cobro cuando todos estén entregados.
          </p>
          {allPackagesCompleted && (
            <Button 
              onClick={handleCreateAccumulator}
              size="sm"
              className="text-xs"
            >
              Inicializar pagos
            </Button>
          )}
        </CardContent>
      </Card>
    );
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
                        disabled={isCreating}
                      >
                        {isCreating ? 'Procesando...' : `Solicitar ${formatCurrency(tripPayment.accumulated_amount)}`}
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
        currentBankingInfo={{
          bank_account_holder: userProfile?.bank_account_holder,
          bank_name: userProfile?.bank_name,
          bank_account_type: userProfile?.bank_account_type,
          bank_account_number: userProfile?.bank_account_number
        }}
        title="Confirmar Datos Bancarios para Pago del Viaje"
        description={`Se creará una solicitud de pago por ${formatCurrency(tripPayment.accumulated_amount)} correspondiente a los tips de todos los paquetes entregados en este viaje.`}
      />
    </>
  );
};