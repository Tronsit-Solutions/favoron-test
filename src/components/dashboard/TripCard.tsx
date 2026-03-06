import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, CheckCircle, MoreHorizontal, Banknote, Receipt, MapPin, User, Calendar, Pencil, Star } from "lucide-react";
import { useState, useEffect } from "react";
import EditTripModal from "@/components/EditTripModal";
import TravelerDeliveryConfirmationModal from "@/components/TravelerDeliveryConfirmationModal";
import TravelerSurveyModal from "@/components/dashboard/TravelerSurveyModal";
import { TripEditSelectionModal } from "./TripEditSelectionModal";
import { TripPaymentSummary } from "./TripPaymentSummary";
import { TripDetailModal } from "./TripDetailModal";
import { TripDate } from "./TripDate";
import { ReceptionWindow } from "./ReceptionWindow";
import { useTripPayments } from "@/hooks/useTripPayments";
import { formatCurrency } from "@/utils/priceHelpers";
import TripBankingConfirmationModal from "@/components/TripBankingConfirmationModal";
import { ReceiptViewerModal } from "@/components/ui/receipt-viewer-modal";

interface TripCardProps {
  trip: any;
  getStatusBadge: (status: string) => JSX.Element;
  onEditTrip?: (tripData: any) => void;
  packages?: any[];
  travelerProfile?: any;
  onDeliveryConfirmed?: () => void;
  currentUser?: any;
}

const TripCard = ({ trip, getStatusBadge, onEditTrip, packages = [], travelerProfile, onDeliveryConfirmed, currentUser }: TripCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBankingModal, setShowBankingModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditSelectionModal, setShowEditSelectionModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{receipt_url: string, receipt_filename?: string} | null>(null);

  // Hook para obtener datos del trip payment accumulator
  const { tripPayment, isCreating, createPaymentOrder } = useTripPayments(trip.id);

  // Use payment receipt from trip payment accumulator
  useEffect(() => {
    if (tripPayment?.payment_receipt_url) {
      const raw = tripPayment.payment_receipt_url;
      // Normalize old entries that might be just filenames
      const normalized = raw && !raw.includes('/') && !raw.startsWith('http')
        ? `payment-receipts/${raw}`
        : raw;
      
      setPaymentReceipt({
        receipt_url: normalized,
        receipt_filename: tripPayment.payment_receipt_filename
      });
    } else {
      setPaymentReceipt(null);
    }
  }, [tripPayment]);

  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  
  // Verificar si todos los paquetes del viaje están completados (comprados, recibidos, etc.)
  const allPackagesCompleted = packages.length > 0 && packages.every(pkg => 
    ['delivered_to_office', 'received_by_traveler'].includes(pkg.status)
  );
  
  // Verificar si hay al menos 1 paquete entregado o completado
  const hasDeliveredPackages = packages.some(pkg => 
    ['delivered_to_office', 'received_by_traveler', 'completed', 'pending_office_confirmation'].includes(pkg.status)
  );
  
  const canConfirmDelivery = trip.status === 'active' && allPackagesCompleted;

  const handleEditSubmit = (editedData: any) => {
    if (onEditTrip) {
      onEditTrip(editedData);
    }
    setShowEditModal(false);
  };

  const handleDeliveryConfirmed = () => {
    setShowDeliveryModal(false);
    if (onDeliveryConfirmed) {
      onDeliveryConfirmed();
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

  // Verificar si se debe mostrar el botón de crear orden de pago
  const shouldShowPaymentButton = tripPayment && 
    tripPayment.all_packages_delivered && 
    !tripPayment.payment_order_created && 
    tripPayment.accumulated_amount > 0 &&
    currentUser?.id === trip.user_id;

  // Show survey button when all packages delivered and feedback not completed
  const shouldShowSurveyButton = tripPayment?.all_packages_delivered && 
    tripPayment?.payment_order_created &&
    !trip.traveler_feedback_completed && 
    currentUser?.id === trip.user_id;

  // Debug log para Anika
  if (trip.from_city === "Miami" || trip.to_city === "Guatemala City" || tripPayment?.accumulated_amount > 0) {
    console.log('🔍 DEBUG TripCard - Anika trip check:', {
      tripId: trip.id,
      fromCity: trip.from_city,
      toCity: trip.to_city,
      tripPayment: tripPayment ? {
        accumulated_amount: tripPayment.accumulated_amount,
        all_packages_delivered: tripPayment.all_packages_delivered,
        payment_order_created: tripPayment.payment_order_created,
        delivered_packages_count: tripPayment.delivered_packages_count,
        total_packages_count: tripPayment.total_packages_count
      } : null,
      packages: packages.map(pkg => ({
        id: pkg.id,
        status: pkg.status,
        item_description: pkg.item_description
      })),
      shouldShowPaymentButton,
      currentUserId: currentUser?.id,
      tripUserId: trip.user_id,
      isOwner: currentUser?.id === trip.user_id
    });
  }

  // Filtrar paquetes completados para el desglose
  const completedPackages = packages.filter(pkg => 
    pkg.matched_trip_id === trip.id && pkg.status === 'completed'
  );

  return (
    <>
    <Card key={trip.id} className="max-w-full overflow-hidden">
      {/* Rejection Reason Display */}
      {trip.status === 'rejected' && trip.rejection_reason && (
        <div className="bg-red-50 border-b border-red-200 px-4 py-3">
          <div className="flex items-start gap-2">
            <div className="text-red-600 text-sm">
              <p className="font-medium">Viaje rechazado:</p>
              <p className="text-red-700">{trip.rejection_reason}</p>
            </div>
          </div>
        </div>
      )}
      <CardHeader className="pb-2 md:pb-3">
        <div className="flex flex-col gap-2">{/* Trip Route - Mobile Optimized */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg font-semibold leading-tight break-words">
                {trip.from_city} → {trip.to_city}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {trip.status === 'completed_paid' && paymentReceipt?.receipt_url && currentUser?.id === trip.user_id && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReceiptModal(true)}
                  className="h-8 w-8 p-0 hover:bg-muted/50 text-green-600"
                  title="Ver comprobante de pago"
                >
                  <Receipt className="h-4 w-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowEditSelectionModal(true)}
                  className="h-8 w-8 p-0 hover:bg-muted/50"
                  title="Editar viaje"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowDetailModal(true)}
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Trip Information - Horizontal Layout - Clickable */}
          <div 
            onClick={() => setShowDetailModal(true)}
            className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors"
          >
            {/* Recipient Name */}
            {trip.package_receiving_address?.recipientName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="font-medium">{trip.package_receiving_address.recipientName}</span>
              </div>
            )}
            
            {/* Address */}
            {(trip.package_receiving_address?.streetAddress || trip.package_receiving_address?.cityArea) && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3 shrink-0" />
                <span>
                  {[
                    trip.package_receiving_address.streetAddress,
                    trip.package_receiving_address.streetAddress2,
                    trip.package_receiving_address.cityArea,
                    trip.package_receiving_address.postalCode
                  ].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
            
            {/* Phone */}
            {trip.package_receiving_address?.contactNumber && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{trip.package_receiving_address.contactNumber}</span>
              </div>
            )}
            
            {/* Reception Window */}
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3 shrink-0" />
              <span>
                {(() => {
                  const dateFirst = new Date(trip.first_day_packages);
                  const dateLast = new Date(trip.last_day_packages);
                  return `${new Date(dateFirst.getUTCFullYear(), dateFirst.getUTCMonth(), dateFirst.getUTCDate()).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })} - ${new Date(dateLast.getUTCFullYear(), dateLast.getUTCMonth(), dateLast.getUTCDate()).toLocaleDateString('es-GT', { day: 'numeric', month: 'short' })}`;
                })()}
              </span>
            </div>
          </div>

          {shouldShowPaymentButton && (
            <div className="flex justify-start">
              <Button
                size="sm"
                variant="default"
                onClick={() => setShowBankingModal(true)}
                disabled={isCreating}
                className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 text-white hover-scale"
              >
                <Banknote className="h-3 w-3 mr-1" />
                <span className="font-medium">
                  {isCreating ? 'Procesando...' : `Solicitar ${formatCurrency(tripPayment.accumulated_amount)}`}
                </span>
              </Button>
            </div>
          )}

          {/* Survey button */}
          {shouldShowSurveyButton && (
            <div className="flex justify-start">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowSurveyModal(true)}
                className="h-8 px-3 text-xs"
              >
                <Star className="h-3 w-3 mr-1" />
                Califica tu experiencia
              </Button>
            </div>
          )}

          {/* Action Buttons - Better organized */}
          <div className="flex flex-wrap gap-2">
              {/* Delivery confirmation button */}
              {canConfirmDelivery && travelerProfile && (
                <Button 
                  size="sm"
                  variant="default"
                  onClick={() => setShowDeliveryModal(true)}
                  className="h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 hover-scale"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  <span className="whitespace-nowrap">Confirmar entrega</span>
                </Button>
              )}
              
            </div>

            {/* Creation Date and Status Badge */}
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground/70">
                Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
              </div>
              <div className="flex-shrink-0">
                {getStatusBadge(trip.status)}
              </div>
            </div>
          </div>
        </CardHeader>
      {hasDeliveredPackages && (
        <CardContent className="pt-0 pb-2">
          <div className="space-y-2">
            {/* Mostrar resumen de pagos si el usuario es el viajero del trip */}
            {(() => {
              const shouldShow = currentUser?.id === trip.user_id;
              return shouldShow;
            })() && (
              <div className="bg-muted/30 rounded-lg p-2 animate-fade-in">
                <TripPaymentSummary trip={trip} userProfile={travelerProfile || currentUser} />
              </div>
            )}
          </div>
        </CardContent>
      )}
    </Card>

    {/* Edit Modal */}
    <EditTripModal
      isOpen={showEditModal}
      onClose={() => setShowEditModal(false)}
      onSubmit={handleEditSubmit}
      tripData={trip}
    />

    {/* Delivery Confirmation Modal */}
    <TravelerDeliveryConfirmationModal
      isOpen={showDeliveryModal}
      onClose={() => setShowDeliveryModal(false)}
      trip={trip}
      packages={packages}
      travelerProfile={travelerProfile}
      onConfirmDelivery={handleDeliveryConfirmed}
    />

    {/* Trip Detail Modal */}
    <TripDetailModal
      isOpen={showDetailModal}
      onClose={() => setShowDetailModal(false)}
      trip={trip}
      getStatusBadge={getStatusBadge}
      packages={packages}
      onEditTrip={onEditTrip}
      currentUser={currentUser}
    />
    
    <TripBankingConfirmationModal
      isOpen={showBankingModal}
      onClose={() => setShowBankingModal(false)}
      onConfirm={handlePaymentRequest}
      amount={tripPayment?.accumulated_amount || 0}
      currentBankingInfo={{
        bank_account_holder: currentUser?.bank_account_holder,
        bank_name: currentUser?.bank_name,
        bank_account_type: currentUser?.bank_account_type,
        bank_account_number: currentUser?.bank_account_number
      }}
      title="Confirmar Datos Bancarios para Pago del Viaje"
      description={`Se creará una solicitud de pago por ${formatCurrency(tripPayment?.accumulated_amount || 0)} correspondiente a los tips de todos los paquetes entregados en este viaje.`}
      tripId={trip.id}
      travelerId={trip.user_id}
    />

    {/* Payment Receipt Modal */}
    {paymentReceipt?.receipt_url && (
      <ReceiptViewerModal
        isOpen={showReceiptModal}
        onClose={() => setShowReceiptModal(false)}
        receiptUrl={paymentReceipt.receipt_url}
        title="Comprobante de Pago"
        filename={paymentReceipt.receipt_filename}
      />
    )}

    {/* Trip Edit Selection Modal */}
    <TripEditSelectionModal
      isOpen={showEditSelectionModal}
      onClose={() => setShowEditSelectionModal(false)}
      onSelectOption={(option) => {
        setShowEditSelectionModal(false);
        setShowEditModal(true);
      }}
      hasActivePackages={packages.length > 0}
    />

    {/* Traveler Survey Modal */}
    <TravelerSurveyModal
      isOpen={showSurveyModal}
      onClose={() => setShowSurveyModal(false)}
      tripId={trip.id}
      onCompleted={onDeliveryConfirmed}
    />
    </>
  );
};

export default TripCard;
