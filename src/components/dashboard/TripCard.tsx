
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Home, Phone, Edit } from "lucide-react";
import { useState } from "react";
import EditTripModal from "@/components/EditTripModal";

interface TripCardProps {
  trip: any;
  getStatusBadge: (status: string) => JSX.Element;
  onEditTrip?: (tripData: any) => void;
}

const TripCard = ({ trip, getStatusBadge, onEditTrip }: TripCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const canEdit = ['pending_approval', 'approved'].includes(trip.status);

  const handleEditSubmit = (editedData: any) => {
    if (onEditTrip) {
      onEditTrip(editedData);
    }
    setShowEditModal(false);
  };

  return (
    <>
    <Card key={trip.id}>
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-base">{trip.fromCity} → {trip.toCity}</CardTitle>
            <CardDescription className="text-xs">
              Llegada: {new Date(trip.arrivalDate).toLocaleDateString('es-GT')} • Espacio: {trip.availableSpace} kg
            </CardDescription>
          </div>
          {getStatusBadge(trip.status)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <p className="text-xs">
            <strong>Método de entrega:</strong> {trip.deliveryMethod}
          </p>

          {/* Display delivery address */}
          {trip.deliveryAddress && (
            <div className="bg-muted/50 border rounded p-2">
              <div className="flex items-start space-x-2 mb-1">
                <Home className="h-3 w-3 text-muted-foreground mt-0.5" />
                <p className="text-xs font-medium">Dirección de entrega registrada:</p>
              </div>
              <div className="text-xs text-muted-foreground ml-5">
                <p>{trip.deliveryAddress.streetAddress}</p>
                <p>{trip.deliveryAddress.cityArea}</p>
                {trip.deliveryAddress.hotelAirbnbName && (
                  <p>{trip.deliveryAddress.hotelAirbnbName}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{trip.deliveryAddress.contactNumber}</span>
                </div>
              </div>
            </div>
          )}

          {trip.additionalInfo && (
            <p className="text-xs">
              <strong>Información adicional:</strong> {trip.additionalInfo}
            </p>
          )}

          {/* Edit button for early stage trips */}
          {canEdit && onEditTrip && (
            <div className="flex justify-end mt-2">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowEditModal(true)}
                className="h-7 px-2 text-xs"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar viaje
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Registrado el {new Date(trip.createdAt).toLocaleDateString('es-GT')}
          </p>
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
    </>
  );
};

export default TripCard;
