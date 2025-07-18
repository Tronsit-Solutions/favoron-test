
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Phone, Edit, CheckCircle } from "lucide-react";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";
import TravelerDeliveryConfirmationModal from "@/components/TravelerDeliveryConfirmationModal";
import { TripPaymentSummary } from "./TripPaymentSummary";

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

  const canEdit = ['pending_approval', 'approved'].includes(trip.status);
  
  // Verificar si todos los paquetes del viaje están completados (comprados, recibidos, etc.)
  const allPackagesCompleted = packages.length > 0 && packages.every(pkg => 
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
    <Card key={trip.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{trip.from_city} → {trip.to_city}</CardTitle>
            <CardDescription>
              Llegada: {new Date(trip.arrival_date).toLocaleDateString('es-GT')} • 
              Salida: {new Date(trip.departure_date).toLocaleDateString('es-GT')}
            </CardDescription>
          </div>
          {getStatusBadge(trip.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="grid grid-cols-1 gap-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Entrega:</span>
              <span>{new Date(trip.delivery_date).toLocaleDateString('es-GT')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paquetes:</span>
              <span>{new Date(trip.first_day_packages).toLocaleDateString('es-GT')} - {new Date(trip.last_day_packages).toLocaleDateString('es-GT')}</span>
            </div>
          </div>

          {/* Display package receiving address */}
          {trip.package_receiving_address && (
            <div className="bg-muted/30 border rounded p-2">
              <div className="flex items-center space-x-1 mb-1">
                <Home className="h-3 w-3 text-muted-foreground" />
                <span className="text-xs font-medium">Dirección:</span>
              </div>
              <div className="text-xs text-muted-foreground space-y-0.5">
                <div className="font-medium">{trip.package_receiving_address.recipientName}</div>
                <div>{trip.package_receiving_address.streetAddress}</div>
                <div className="flex items-center justify-between">
                  <span>{trip.package_receiving_address.cityArea} {trip.package_receiving_address.postalCode && `CP: ${trip.package_receiving_address.postalCode}`}</span>
                  <div className="flex items-center space-x-1">
                    <Phone className="h-3 w-3" />
                    <span>{trip.package_receiving_address.contactNumber}</span>
                  </div>
                </div>
                {trip.package_receiving_address.hotelAirbnbName && (
                  <div className="text-xs italic">{trip.package_receiving_address.hotelAirbnbName}</div>
                )}
              </div>
            </div>
          )}

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
    </>
  );
};

export default TripCard;
