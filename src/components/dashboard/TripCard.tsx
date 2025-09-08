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
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3 md:gap-0">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-base md:text-lg font-semibold leading-tight mb-2 break-words">
              {trip.from_city} → {trip.to_city}
            </CardTitle>
            <CardDescription className="flex flex-col md:flex-row md:items-center gap-1 md:gap-2 text-xs md:text-sm text-black">
              <TripDate arrivalDate={trip.arrival_date} />
              <span className="hidden md:inline">•</span>
              <ReceptionWindow firstDay={trip.first_day_packages} lastDay={trip.last_day_packages} />
            </CardDescription>
          </div>
          <div className="flex items-center justify-end gap-2 flex-shrink-0">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetailModal(true)}
              className="h-8 w-8 md:h-8 md:px-2 p-0 md:p-auto"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {getStatusBadge(trip.status)}
          </div>
        </div>
      </CardHeader>
      {hasDeliveredPackages && (
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-0">
              <span className="text-xs text-muted-foreground order-2 md:order-1">
                Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
              </span>
              
              <div className="flex flex-wrap gap-2 order-1 md:order-2">
                {/* Edit button for early stage trips */}
                {canEdit && onEditTrip && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="h-8 px-3 text-xs flex-shrink-0"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    <span>Editar</span>
                  </Button>
                )}
                
                {/* Delivery confirmation button */}
                {canConfirmDelivery && travelerProfile && (
                  <Button 
                    size="sm"
                    variant="default"
                    onClick={() => setShowDeliveryModal(true)}
                    className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 flex-shrink-0"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="whitespace-nowrap">Confirmar entrega</span>
                  </Button>
                )}

                {/* Botón de crear orden de pago */}
                {shouldShowPaymentButton && (
                  <Button 
                    size="sm"
                    variant="default"
                    onClick={() => setShowBankingModal(true)}
                    disabled={isCreating}
                    className="h-8 px-3 text-xs bg-green-600 hover:bg-green-700 flex-shrink-0"
                  >
                    <Banknote className="h-3 w-3 mr-1" />
                    <span className="whitespace-nowrap">
                      {isCreating ? 'Procesando...' : `Solicitar ${formatCurrency(tripPayment.accumulated_amount)}`}
                    </span>
                  </Button>
                )}
              </div>
            </div>

            {/* Mostrar resumen de pagos si el usuario es el viajero del trip */}
            {(() => {
              const shouldShow = currentUser?.id === trip.user_id;
              console.log('🔍 TripCard - Payment summary condition check:', {
                tripId: trip.id,
                currentUserId: currentUser?.id,
                tripUserId: trip.user_id,
                shouldShow,
                tripDetails: { from_city: trip.from_city, to_city: trip.to_city, departure_date: trip.departure_date }
              });
              return shouldShow;
            })() && (
              <div className="mt-3 pt-3 border-t border-border/50">
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
    />
    </>
  );
};

export default TripCard;
