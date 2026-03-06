import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/priceHelpers';
import { getActiveTipFromPackage } from '@/utils/tipHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, Package, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import TripBankingConfirmationModal from '@/components/TripBankingConfirmationModal';
import { TripPaymentAccumulator } from '@/hooks/useTripPayments';

interface TripTipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trip: any;
  tripPayment: TripPaymentAccumulator | null;
  isCreating: boolean;
  createPaymentOrder: (bankingInfo: any) => Promise<any>;
  currentUser: any;
  refreshTripPayment: () => void;
}

interface PackageTipInfo {
  id: string;
  description: string;
  tip: number;
  status: string;
  hasIncident: boolean;
}

export const TripTipsModal: React.FC<TripTipsModalProps> = ({
  isOpen,
  onClose,
  trip,
  tripPayment,
  isCreating,
  createPaymentOrder,
  currentUser,
  refreshTripPayment,
}) => {
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [packageDetails, setPackageDetails] = useState<PackageTipInfo[]>([]);
  const [packageCounts, setPackageCounts] = useState({ total: 0, delivered: 0, withIncident: 0 });
  const [loadingPackages, setLoadingPackages] = useState(true);

  const deliveredStatuses = ['completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'];

  const fetchPackageDetails = useCallback(async () => {
    if (!isOpen || !trip.id) return;
    setLoadingPackages(true);
    try {
      const eligibleStatuses = ['in_transit', 'received_by_traveler', 'delivered_to_office', 'completed', 'delivered', 'ready_for_pickup', 'ready_for_delivery', 'pending_office_confirmation'];
      const { data, error } = await supabase
        .from('packages')
        .select('id, item_description, quote, status, admin_assigned_tip, incident_flag, products_data, office_delivery')
        .eq('matched_trip_id', trip.id)
        .in('status', eligibleStatuses);

      if (error) throw error;

      const pkgsWithoutIncident = (data || []).filter(p => !p.incident_flag);
      const pkgsWithIncident = (data || []).filter(p => p.incident_flag);

      const details: PackageTipInfo[] = pkgsWithoutIncident.map((pkg: any) => ({
        id: pkg.id,
        description: pkg.item_description || 'Paquete',
        tip: getActiveTipFromPackage(pkg),
        status: pkg.status,
        hasIncident: false,
      }));

      const deliveredCount = pkgsWithoutIncident.filter(p => deliveredStatuses.includes(p.status)).length;

      setPackageDetails(details);
      setPackageCounts({
        total: pkgsWithoutIncident.length,
        delivered: deliveredCount,
        withIncident: pkgsWithIncident.length,
      });
    } catch (err) {
      console.error('Error fetching package details for tips modal:', err);
    } finally {
      setLoadingPackages(false);
    }
  }, [isOpen, trip.id]);

  useEffect(() => {
    fetchPackageDetails();
  }, [fetchPackageDetails]);

  const handleCreateAccumulator = async () => {
    try {
      const { createOrUpdateTripPaymentAccumulator } = await import('@/hooks/useCreateTripPaymentAccumulator');
      const result = await createOrUpdateTripPaymentAccumulator(trip.id, currentUser.id);
      if (result.success) {
        refreshTripPayment();
        fetchPackageDetails();
      }
    } catch (error) {
      console.error('Error creating accumulator:', error);
    }
  };

  const handlePaymentRequest = async (bankingInfo: any) => {
    try {
      await createPaymentOrder(bankingInfo);
      setShowBankingModal(false);
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  const isAllDelivered = tripPayment?.all_packages_delivered === true;
  const hasAccumulator = !!tripPayment;
  const accumulatedAmount = tripPayment?.accumulated_amount ?? 0;
  const canRequestPayment = hasAccumulator && isAllDelivered && !tripPayment.payment_order_created && accumulatedAmount > 0;
  const progressPercent = packageCounts.total > 0 ? (packageCounts.delivered / packageCounts.total) * 100 : 0;

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Completado',
      delivered_to_office: 'En oficina',
      ready_for_pickup: 'Listo para recoger',
      ready_for_delivery: 'Listo para entrega',
      in_transit: 'En tránsito',
      received_by_traveler: 'Recibido',
      pending_office_confirmation: 'Pendiente oficina',
    };
    return labels[status] || status;
  };

  const isDelivered = (status: string) => deliveredStatuses.includes(status);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              Tips del Viaje
            </DialogTitle>
            <DialogDescription>
              {trip.from_city} → {trip.to_city}
            </DialogDescription>
          </DialogHeader>

          {/* Accumulated Total */}
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total acumulado</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(accumulatedAmount)}</p>
            {tripPayment?.payment_status === 'completed' && (
              <Badge className="mt-1 bg-green-600 text-white">Pagado</Badge>
            )}
            {tripPayment?.payment_status === 'pending' && (
              <Badge className="mt-1" variant="default">Solicitado</Badge>
            )}
          </div>

          {/* Delivery Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <Package className="h-3.5 w-3.5" />
                Progreso de entrega
              </span>
              <span className="font-medium">{packageCounts.delivered} / {packageCounts.total}</span>
            </div>
            <Progress value={progressPercent} className="h-2" />
            {packageCounts.withIncident > 0 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                {packageCounts.withIncident} paquete(s) con incidencia excluido(s)
              </p>
            )}
          </div>

          {/* Package Breakdown */}
          {!loadingPackages && packageDetails.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desglose por paquete</p>
              <div className="divide-y divide-border rounded-lg border overflow-hidden">
                {packageDetails.map((pkg) => (
                  <div key={pkg.id} className="flex items-center justify-between p-2.5 text-sm">
                    <div className="flex-1 min-w-0 mr-2">
                      <p className="truncate text-foreground">{pkg.description}</p>
                      <Badge
                        variant={isDelivered(pkg.status) ? 'default' : 'secondary'}
                        className="text-[10px] h-4 px-1 mt-0.5"
                      >
                        {isDelivered(pkg.status) ? (
                          <CheckCircle className="h-2.5 w-2.5 mr-0.5" />
                        ) : (
                          <Clock className="h-2.5 w-2.5 mr-0.5" />
                        )}
                        {getStatusLabel(pkg.status)}
                      </Badge>
                    </div>
                    <span className={`font-medium whitespace-nowrap ${isDelivered(pkg.status) ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {formatCurrency(pkg.tip)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Section */}
          <div className="pt-2 space-y-2">
            {!hasAccumulator && packageCounts.delivered > 0 && (
              <Button onClick={handleCreateAccumulator} className="w-full" size="sm">
                Inicializar pagos
              </Button>
            )}

            {canRequestPayment && (
              <Button
                onClick={() => setShowBankingModal(true)}
                disabled={isCreating}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <Banknote className="h-4 w-4 mr-2" />
                {isCreating ? 'Procesando...' : `Solicitar cobro ${formatCurrency(accumulatedAmount)}`}
              </Button>
            )}

            {hasAccumulator && !isAllDelivered && accumulatedAmount > 0 && !tripPayment.payment_order_created && (
              <div className="flex items-center gap-2 text-amber-600 text-xs justify-center">
                <Clock className="h-3.5 w-3.5" />
                <span>Podrás solicitar el cobro cuando todos los paquetes estén entregados en oficina</span>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <TripBankingConfirmationModal
        isOpen={showBankingModal}
        onClose={() => setShowBankingModal(false)}
        onConfirm={handlePaymentRequest}
        amount={accumulatedAmount}
        currentBankingInfo={{
          bank_account_holder: currentUser?.bank_account_holder,
          bank_name: currentUser?.bank_name,
          bank_account_type: currentUser?.bank_account_type,
          bank_account_number: currentUser?.bank_account_number,
        }}
        tripId={trip.id}
        travelerId={trip.user_id}
        title="Confirmar Datos Bancarios para Pago del Viaje"
        description={`Se creará una solicitud de pago por ${formatCurrency(accumulatedAmount)} correspondiente a los tips de todos los paquetes entregados en este viaje.`}
      />
    </>
  );
};
