import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { formatCurrency } from '@/utils/priceHelpers';
import { getActiveTipFromPackage } from '@/utils/tipHelpers';
import { supabase } from '@/integrations/supabase/client';
import { Banknote, Package, CheckCircle, Clock, AlertTriangle, Lock, Download, FileText } from 'lucide-react';
import TripBankingConfirmationModal from '@/components/TripBankingConfirmationModal';
import { TripPaymentAccumulator } from '@/hooks/useTripPayments';
import { useSignedUrl } from '@/hooks/useSignedUrl';
import { parseStorageRef } from '@/lib/storageUrls';
import { toast } from 'sonner';

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

const ALL_ACTIVE_STATUSES = [
  'quote_sent', 'payment_pending', 'quote_accepted', 'paid',
  'pending_purchase', 'purchase_confirmed', 'shipped',
  'in_transit', 'received_by_traveler', 'pending_office_confirmation',
  'delivered_to_office', 'completed', 'ready_for_pickup', 'ready_for_delivery',
];

const DELIVERED_STATUSES = ['completed', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery'];

const STATUS_LABELS: Record<string, string> = {
  quote_sent: 'Cotización enviada',
  payment_pending: 'Pago pendiente',
  quote_accepted: 'Cotización aceptada',
  paid: 'Pagado',
  pending_purchase: 'Pendiente de compra',
  purchase_confirmed: 'Compra confirmada',
  shipped: 'Enviado',
  in_transit: 'En tránsito',
  received_by_traveler: 'Recibido por viajero',
  pending_office_confirmation: 'Pendiente oficina',
  delivered_to_office: 'En oficina',
  completed: 'Completado',
  ready_for_pickup: 'Listo para recoger',
  ready_for_delivery: 'Listo para entrega',
};

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
  const [totalTipsFromPackages, setTotalTipsFromPackages] = useState(0);
  const [creatingAccumulator, setCreatingAccumulator] = useState(false);
  const [downloadingFile, setDownloadingFile] = useState(false);
  const [boostInfo, setBoostInfo] = useState<{ amount: number; type: string; value: number; pending: boolean } | null>(null);

  // Resolve receipt URL
  const rawReceiptUrl = tripPayment?.payment_receipt_url || null;
  const normalizedReceiptUrl = rawReceiptUrl && !rawReceiptUrl.includes('/') && !rawReceiptUrl.startsWith('http')
    ? `payment-receipts/${rawReceiptUrl}`
    : rawReceiptUrl;
  const receiptFilename = tripPayment?.payment_receipt_filename || undefined;
  const { url: signedReceiptUrl, loading: loadingReceipt } = useSignedUrl(normalizedReceiptUrl);
  const receiptDisplayUrl = signedReceiptUrl || normalizedReceiptUrl;
  const isReceiptImage = receiptFilename?.match(/\.(jpg|jpeg|png|gif|webp)$/i) || normalizedReceiptUrl?.match(/\.(jpg|jpeg|png|gif|webp)$/i);
  const isReceiptPDF = receiptFilename?.match(/\.(pdf)$/i) || normalizedReceiptUrl?.match(/\.(pdf)$/i);

  const fetchPackageDetails = useCallback(async () => {
    if (!isOpen || !trip.id) return;
    setLoadingPackages(true);
    try {
      const { data, error } = await supabase
        .from('packages')
        .select('id, item_description, quote, status, admin_assigned_tip, incident_flag, products_data, office_delivery, quote_expires_at')
        .eq('matched_trip_id', trip.id)
        .in('status', ALL_ACTIVE_STATUSES);

      if (error) throw error;

      const PRE_PAYMENT_STATUSES = ['quote_sent', 'quote_accepted', 'payment_pending'];
      const now = new Date();
      const activeData = (data || []).filter(p => {
        // Exclude packages with expired quotes in pre-payment states
        if (PRE_PAYMENT_STATUSES.includes(p.status) && p.quote_expires_at && new Date(p.quote_expires_at) < now) {
          return false;
        }
        return true;
      });

      const pkgsWithoutIncident = activeData.filter(p => !p.incident_flag);
      const pkgsWithIncident = activeData.filter(p => p.incident_flag);

      const details: PackageTipInfo[] = pkgsWithoutIncident.map((pkg: any) => ({
        id: pkg.id,
        description: pkg.item_description || 'Paquete',
        tip: getActiveTipFromPackage(pkg),
        status: pkg.status,
        hasIncident: false,
      }));

      const totalTips = details.reduce((sum, pkg) => sum + pkg.tip, 0);
      const deliveredCount = pkgsWithoutIncident.filter(p => DELIVERED_STATUSES.includes(p.status)).length;

      setPackageDetails(details);
      setTotalTipsFromPackages(totalTips);
      setPackageCounts({
        total: pkgsWithoutIncident.length,
        delivered: deliveredCount,
        withIncident: pkgsWithIncident.length,
      });

      // Fetch boost info
      const existingBoost = tripPayment?.boost_amount ? Number(tripPayment.boost_amount) : 0;
      if (existingBoost > 0) {
        setBoostInfo({ amount: existingBoost, type: '', value: 0, pending: false });
      } else if (trip.boost_code) {
        try {
          const { data: boostCode } = await supabase
            .from('boost_codes')
            .select('boost_type, boost_value, max_boost_amount')
            .eq('code', trip.boost_code)
            .eq('is_active', true)
            .maybeSingle();

          if (boostCode) {
            let estimatedAmount = 0;
            if (boostCode.boost_type === 'percentage') {
              estimatedAmount = totalTips * (Number(boostCode.boost_value) / 100);
              if (boostCode.max_boost_amount && estimatedAmount > Number(boostCode.max_boost_amount)) {
                estimatedAmount = Number(boostCode.max_boost_amount);
              }
            } else {
              estimatedAmount = Number(boostCode.boost_value);
            }
            setBoostInfo({
              amount: estimatedAmount,
              type: boostCode.boost_type,
              value: Number(boostCode.boost_value),
              pending: true,
            });
          } else {
            setBoostInfo(null);
          }
        } catch {
          setBoostInfo(null);
        }
      } else {
        setBoostInfo(null);
      }
    } catch (err) {
      console.error('Error fetching package details for tips modal:', err);
    } finally {
      setLoadingPackages(false);
    }
  }, [isOpen, trip.id, trip.boost_code, tripPayment?.boost_amount]);

  useEffect(() => {
    fetchPackageDetails();
  }, [fetchPackageDetails]);

  const handleRequestPayment = async () => {
    // If no accumulator exists, create one first
    if (!tripPayment) {
      setCreatingAccumulator(true);
      try {
        const { createOrUpdateTripPaymentAccumulator } = await import('@/hooks/useCreateTripPaymentAccumulator');
        const result = await createOrUpdateTripPaymentAccumulator(trip.id, currentUser.id);
        if (result.success) {
          refreshTripPayment();
        }
      } catch (error) {
        console.error('Error creating accumulator:', error);
      } finally {
        setCreatingAccumulator(false);
      }
    }
    setShowBankingModal(true);
  };

  const handlePaymentRequest = async (bankingInfo: any) => {
    try {
      await createPaymentOrder(bankingInfo);
      setShowBankingModal(false);
    } catch (error) {
      console.error('Error requesting payment:', error);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!normalizedReceiptUrl) return;
    setDownloadingFile(true);
    try {
      let blob: Blob | null = null;
      const effectiveUrl = signedReceiptUrl || receiptDisplayUrl;
      if (effectiveUrl && /^https?:\/\//i.test(effectiveUrl)) {
        const response = await fetch(effectiveUrl, { cache: 'no-store' });
        if (response.ok) blob = await response.blob();
      }
      if (!blob) {
        const ref = parseStorageRef(normalizedReceiptUrl);
        if (ref) {
          const { data, error } = await supabase.storage.from(ref.bucket).download(ref.filePath);
          if (!error && data) blob = data;
        }
      }
      if (!blob) throw new Error('No se pudo obtener el archivo');
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = receiptFilename || 'comprobante';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success("Archivo descargado exitosamente");
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error("Error al descargar el archivo");
    } finally {
      setDownloadingFile(false);
    }
  };

  const isAllDelivered = packageCounts.total > 0 && packageCounts.delivered === packageCounts.total;
  const hasAccumulator = !!tripPayment;
  const boostAmount = boostInfo?.amount ?? 0;
  const totalWithBoost = totalTipsFromPackages + boostAmount;
  const accumulatedAmount = tripPayment?.accumulated_amount ? Number(tripPayment.accumulated_amount) + (tripPayment?.boost_amount ? Number(tripPayment.boost_amount) : 0) : totalWithBoost;
  const paymentAlreadyRequested = tripPayment?.payment_order_created === true;
  const canRequestPayment = isAllDelivered && totalTipsFromPackages > 0 && !paymentAlreadyRequested;
  const progressPercent = packageCounts.total > 0 ? (packageCounts.delivered / packageCounts.total) * 100 : 0;
  const pendingCount = packageCounts.total - packageCounts.delivered;
  const isDelivered = (status: string) => DELIVERED_STATUSES.includes(status);

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

          {/* Total tips from shoppers */}
          <div className="bg-muted/40 rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Total tips de shoppers</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(totalTipsFromPackages)}</p>
            {tripPayment?.payment_status === 'completed' && (
              <Badge className="mt-1 bg-green-600 text-white">Pagado</Badge>
            )}
            {tripPayment?.payment_status === 'pending' && (
              <Badge className="mt-1" variant="default">Cobro solicitado</Badge>
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Paquetes asignados</p>
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
                        {STATUS_LABELS[pkg.status] || pkg.status}
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

          {/* Action Section - Always visible */}
          <div className="pt-2 space-y-2">
            {paymentAlreadyRequested ? (
              <div className="text-center text-sm text-muted-foreground">
                Ya se solicitó el cobro de este viaje.
              </div>
            ) : (
              <>
                <Button
                  onClick={handleRequestPayment}
                  disabled={!canRequestPayment || isCreating || creatingAccumulator}
                  className="w-full bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {!canRequestPayment && <Lock className="h-4 w-4 mr-2" />}
                  {canRequestPayment && <Banknote className="h-4 w-4 mr-2" />}
                  {isCreating || creatingAccumulator
                    ? 'Procesando...'
                    : `Solicitar cobro ${formatCurrency(totalTipsFromPackages)}`}
                </Button>

                {!isAllDelivered && packageCounts.total > 0 && (
                  <div className="flex items-center gap-2 text-amber-600 text-xs justify-center">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {pendingCount === 1
                        ? 'Falta 1 paquete por entregar en oficina'
                        : `Faltan ${pendingCount} paquetes por entregar en oficina`}
                    </span>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Payment Receipt Section */}
          {normalizedReceiptUrl && (
            <div className="space-y-2 border-t pt-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Comprobante de pago</p>
              {loadingReceipt ? (
                <div className="bg-muted/30 rounded-lg p-6 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto mb-2"></div>
                  <p className="text-xs text-muted-foreground">Cargando comprobante...</p>
                </div>
              ) : receiptDisplayUrl ? (
                <div className="space-y-2">
                  {isReceiptImage ? (
                    <img
                      src={receiptDisplayUrl}
                      alt="Comprobante de pago"
                      className="w-full h-auto rounded-lg border border-border max-h-[300px] object-contain bg-muted/20 cursor-pointer"
                      onClick={() => window.open(receiptDisplayUrl, '_blank')}
                      loading="lazy"
                    />
                  ) : isReceiptPDF ? (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground mb-2">Archivo PDF</p>
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-lg p-4 text-center">
                      <FileText className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">Archivo adjunto</p>
                    </div>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full"
                    onClick={handleDownloadReceipt}
                    disabled={downloadingFile}
                  >
                    <Download className="h-3.5 w-3.5 mr-1.5" />
                    {downloadingFile ? 'Descargando...' : 'Descargar comprobante'}
                  </Button>
                </div>
              ) : null}
            </div>
          )}
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
