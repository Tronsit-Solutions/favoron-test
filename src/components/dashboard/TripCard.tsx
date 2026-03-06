import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, CheckCircle, MoreHorizontal, Receipt, MapPin, User, Calendar, Pencil, Star } from "lucide-react";
import { useState, useEffect } from "react";
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
import { getActiveTipFromPackage } from "@/utils/tipHelpers";
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
  const [showTipsModal, setShowTipsModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showEditSelectionModal, setShowEditSelectionModal] = useState(false);
  const [showSurveyModal, setShowSurveyModal] = useState(false);
  const [paymentReceipt, setPaymentReceipt] = useState<{receipt_url: string, receipt_filename?: string} | null>(null);

  const { tripPayment, isCreating, createPaymentOrder, refreshTripPayment } = useTripPayments(trip.id);

  useEffect(() => {
    if (tripPayment?.payment_receipt_url) {
      const raw = tripPayment.payment_receipt_url;
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
  const tipsAmount = tripPayment?.accumulated_amount ?? 0;

  // Show survey button when all packages delivered and feedback not completed
  const shouldShowSurveyButton = tripPayment?.all_packages_delivered && 
    tripPayment?.payment_order_created &&
    !trip.traveler_feedback_completed && 
    isOwner;

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
        <div className="flex flex-col gap-2">
          {/* Trip Route */}
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-base md:text-lg font-semibold leading-tight break-words">
                {trip.from_city} → {trip.to_city}
              </CardTitle>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {trip.status === 'completed_paid' && paymentReceipt?.receipt_url && isOwner && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowReceiptModal(true)}
                  className="h-10 w-10 p-0 hover:bg-muted/50 text-green-600"
                  title="Ver comprobante de pago"
                >
                  <Receipt className="h-5 w-5" />
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

          {/* Trip Information - Clickable */}
          <div 
            onClick={() => setShowDetailModal(true)}
            className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground cursor-pointer hover:bg-muted/30 rounded-lg p-2 transition-colors"
          >
            {trip.package_receiving_address?.recipientName && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="font-medium">{trip.package_receiving_address.recipientName}</span>
              </div>
            )}
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
            {trip.package_receiving_address?.contactNumber && (
              <div className="flex items-center gap-1">
                <Phone className="h-3 w-3 shrink-0" />
                <span>{trip.package_receiving_address.contactNumber}</span>
              </div>
            )}
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

          {/* Survey + Delivery Actions */}
          {(shouldShowSurveyButton || (canConfirmDelivery && travelerProfile)) && (
            <div className="flex flex-wrap gap-2">
              {shouldShowSurveyButton && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSurveyModal(true)}
                  className="h-8 px-3 text-xs"
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

          {/* Creation Date, Status Badge, and Tips */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground/70">
              Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {shouldShowTipsButton && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowTipsModal(true)}
                  className="h-10 px-3 bg-green-100 hover:bg-green-200 rounded-full text-xs gap-1"
                >
                  <span className="text-base">🫰</span>
                  <span className="font-medium text-green-800">{formatCurrency(tipsAmount)}</span>
                </Button>
              )}
              {getStatusBadge(trip.status)}
            </div>
          </div>
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
