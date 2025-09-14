import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, CheckCircle, MoreHorizontal, Banknote } from "lucide-react";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";
import TravelerDeliveryConfirmationModal from "@/components/TravelerDeliveryConfirmationModal";
import { TripPaymentSummary } from "./TripPaymentSummary";
import { TripDetailModal } from "./TripDetailModal";
import { TripDate } from "./TripDate";
import { ReceptionWindow } from "./ReceptionWindow";
import { useTripPayments } from "@/hooks/useTripPayments";
import { formatCurrency } from "@/utils/priceHelpers";
import TripBankingConfirmationModal from "@/components/TripBankingConfirmationModal";

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

  // Hook para obtener datos del trip payment accumulator
  const { tripPayment, isCreating, createPaymentOrder } = useTripPayments(trip.id);

  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  
  // Verificar si todos los paquetes del viaje están completados (comprados, recibidos, etc.)
  const allPackagesCompleted = packages.length > 0 && packages.every(pkg => 
    ['delivered_to_office', 'received_by_traveler'].includes(pkg.status)
  );
  
  // Verificar si hay al menos 1 paquete entregado
  const hasDeliveredPackages = packages.some(pkg => 
    ['delivered_to_office', 'received_by_traveler'].includes(pkg.status)
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
    <Card key={trip.id} className="mx-4 md:mx-0 max-w-full overflow-hidden">
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
      <CardHeader className="pb-3 md:pb-6">
        <div className="flex flex-col gap-4">
          {/* Trip Route and Status - Mobile Optimized */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg font-semibold leading-tight break-words">
                {trip.from_city} → {trip.to_city}
              </CardTitle>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {getStatusBadge(trip.status)}
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

          {/* Trip Details - Reorganized for better mobile experience */}
          <div className="space-y-3">
            {/* Date and Reception Window */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TripDate arrivalDate={trip.arrival_date} />
              </div>
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <div className="flex items-center gap-1 text-muted-foreground">
                <ReceptionWindow firstDay={trip.first_day_packages} lastDay={trip.last_day_packages} />
              </div>
            </div>

            {/* Payment Request Button - More prominent */}
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

            {/* Action Buttons - Better organized */}
            <div className="flex flex-wrap gap-2">
              {/* Edit button for early stage trips */}
              {canEdit && onEditTrip && (
                <Button 
                  size="sm"
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="h-8 px-3 text-xs hover-scale"
                >
                  <Edit className="h-3 w-3 mr-1" />
                  <span>Editar viaje</span>
                </Button>
              )}
              
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

            {/* Creation Date - Less prominent */}
            <div className="text-xs text-muted-foreground/70">
              Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
            </div>
          </div>
        </div>
      </CardHeader>
      {hasDeliveredPackages && (
        <CardContent className="pt-0">
          <div className="space-y-4">
            {/* Mostrar resumen de pagos si el usuario es el viajero del trip */}
            {(() => {
              const shouldShow = currentUser?.id === trip.user_id;
              return shouldShow;
            })() && (
              <div className="bg-muted/30 rounded-lg p-3 animate-fade-in">
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
    </>
  );
};

export default TripCard;
