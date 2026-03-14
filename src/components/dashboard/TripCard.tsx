import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, CheckCircle, MoreHorizontal, MapPin, User, Pencil, Star, FileText, Eye } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";
import TravelerDeliveryConfirmationModal from "@/components/TravelerDeliveryConfirmationModal";
import TravelerSurveyModal from "@/components/dashboard/TravelerSurveyModal";
import { TripEditSelectionModal } from "./TripEditSelectionModal";
import { TripTipsModal } from "./TripTipsModal";
import { TripDetailModal } from "./TripDetailModal";
import { TripDate } from "./TripDate";
import { ReceptionWindow } from "./ReceptionWindow";
import { useTripPayments } from "@/hooks/useTripPayments";
import { formatCurrency } from "@/utils/priceHelpers";

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
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showEditSelectionModal, setShowEditSelectionModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);

  const { tripPayment, isCreating, createPaymentOrder, refreshTripPayment } = useTripPayments(trip.id);


  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  
  const allPackagesCompleted = packages.length > 0 && packages.every(pkg => 
    ['delivered_to_office', 'received_by_traveler'].includes(pkg.status)
  );
  
  const hasDeliveredPackages = packages.some(pkg => 
    ['delivered_to_office', 'received_by_traveler', 'completed', 'pending_office_confirmation'].includes(pkg.status)
  );
  
  const canConfirmDelivery = trip.status === 'active' && allPackagesCompleted;
  const isOwner = currentUser?.id === trip.user_id;

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

  // Show tips button when user is owner AND (has delivered packages OR has accumulator)
  const shouldShowTipsButton = isOwner;

  // Show survey button when all packages delivered and feedback not completed
  const shouldShowSurveyButton = tripPayment?.all_packages_delivered && 
    tripPayment?.payment_order_created &&
    !trip.traveler_feedback_completed && 
    isOwner;

  return (
    <>
    <Card key={trip.id} className="w-full max-w-full min-w-0 box-border overflow-hidden">
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
      <CardHeader className="pb-2 md:pb-3 relative">
        {/* Three dots menu - absolute top right */}
        <div className="absolute top-2 right-2 z-10">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-muted/50"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {canEdit && (
                <DropdownMenuItem onClick={() => setShowEditSelectionModal(true)}>
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar viaje
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => setShowDetailModal(true)}>
                <Eye className="h-4 w-4 mr-2" />
                Ver detalle
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex flex-row gap-2">
          {/* Left column: main content */}
          <div className="flex flex-col gap-2 flex-1 min-w-0 pr-8">
            {/* Trip Route */}
            <CardTitle className="text-base md:text-lg font-semibold leading-tight break-words">
              {trip.from_city} → {trip.to_city}
            </CardTitle>

            {/* Trip ID - Clickable */}
            <div 
              onClick={() => setShowDetailModal(true)}
              className="flex items-center gap-3 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors"
            >
              <span className="font-mono text-muted-foreground/70">ID: {trip.id.slice(0, 8)}</span>
            </div>

            {/* Survey + Delivery Actions */}
            {(shouldShowSurveyButton || (canConfirmDelivery && travelerProfile)) && (
              <div className="flex flex-wrap gap-2">
                {shouldShowSurveyButton && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowSurveyModal(true)}
                    className="h-8 px-3 text-xs bg-yellow-400 text-yellow-900 hover:bg-yellow-500 border-yellow-400"
                  >
                    <Star className="h-3 w-3 mr-1" />
                    Califica tu experiencia
                  </Button>
                )}

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
            )}

            {/* Status Badge - aligned right */}
            <div className="flex items-center justify-end">
              {getStatusBadge(trip.status)}
            </div>
          </div>

          {/* Right column: Tips button floating */}
          {shouldShowTipsButton && (
            <div className="flex-shrink-0 flex items-end pb-1">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowTipsModal(true)}
                className="h-auto px-2.5 py-3 text-xs border-green-300 text-green-700 hover:bg-green-50 hover:border-green-400 flex flex-col gap-1.5 items-center"
                title="Ver tips acumulados"
              >
                <FileText className="h-4 w-4" />
                <span className="text-[10px] leading-tight">Tips</span>
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
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
    
    {/* Tips Modal */}
    <TripTipsModal
      isOpen={showTipsModal}
      onClose={() => setShowTipsModal(false)}
      trip={trip}
      tripPayment={tripPayment}
      isCreating={isCreating}
      createPaymentOrder={createPaymentOrder}
      currentUser={currentUser}
      refreshTripPayment={refreshTripPayment}
    />


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
