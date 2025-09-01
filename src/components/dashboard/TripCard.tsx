import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Phone, Edit, CheckCircle, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";
import TravelerDeliveryConfirmationModal from "@/components/TravelerDeliveryConfirmationModal";
import { TripPaymentSummary } from "./TripPaymentSummary";
import { TripDetailModal } from "./TripDetailModal";
import { TripDate } from "./TripDate";
import { ReceptionWindow } from "./ReceptionWindow";

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

  return (
    <>
    <Card key={trip.id} className="w-full max-w-full overflow-hidden">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex justify-between items-start min-w-0">
          <div className="flex-1 min-w-0 pr-2">
            <CardTitle className="text-lg">{trip.from_city} → {trip.to_city}</CardTitle>
            <CardDescription className="flex flex-col sm:flex-row sm:items-center gap-2 mt-2 w-full">
              <TripDate arrivalDate={trip.arrival_date} />
              <span className="hidden sm:inline text-muted-foreground">•</span>
              <ReceptionWindow firstDay={trip.first_day_packages} lastDay={trip.last_day_packages} />
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowDetailModal(true)}
              className="h-8 px-2"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
            {getStatusBadge(trip.status)}
          </div>
        </div>
      </CardHeader>
      {hasDeliveredPackages && (
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
              </span>
              
              <div className="flex gap-2">
                {/* Edit button for early stage trips */}
                {canEdit && onEditTrip && (
                  <Button 
                    size="sm"
                    variant="outline"
                    onClick={() => setShowEditModal(true)}
                    className="h-6 px-2"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    <span className="text-xs">Editar</span>
                  </Button>
                )}
                
                {/* Delivery confirmation button */}
                {canConfirmDelivery && travelerProfile && (
                  <Button 
                    size="sm"
                    variant="default"
                    onClick={() => setShowDeliveryModal(true)}
                    className="h-6 px-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    <span className="text-xs">Confirmar entrega</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Mostrar resumen de pagos si el usuario es el viajero del trip */}
            {currentUser?.id === trip.user_id && (
              <div className="mt-4">
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
    </>
  );
};

export default TripCard;
