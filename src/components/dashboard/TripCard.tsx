
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
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <p>
              <strong>Fecha de entrega:</strong> {new Date(trip.delivery_date).toLocaleDateString('es-GT')}
            </p>
            <p>
              <strong>Primer día paquetes:</strong> {new Date(trip.first_day_packages).toLocaleDateString('es-GT')}
            </p>
            <p>
              <strong>Último día paquetes:</strong> {new Date(trip.last_day_packages).toLocaleDateString('es-GT')}
            </p>
          </div>

          {/* Display package receiving address */}
          {trip.package_receiving_address && (
            <div className="bg-muted/50 border rounded-lg p-3">
              <div className="flex items-start space-x-2 mb-2">
                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm font-medium">Dirección para recibir paquetes:</p>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
                <p>{trip.package_receiving_address.street_address}</p>
                <p>{trip.package_receiving_address.city_area}</p>
                {trip.package_receiving_address.hotel_airbnb_name && (
                  <p>{trip.package_receiving_address.hotel_airbnb_name}</p>
                )}
                <div className="flex items-center space-x-1 mt-1">
                  <Phone className="h-3 w-3" />
                  <span>{trip.package_receiving_address.contact_number}</span>
                </div>
              </div>
            </div>
          )}

          {/* Edit button for early stage trips */}
          {canEdit && onEditTrip && (
            <div className="flex justify-end mt-3">
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar viaje
              </Button>
            </div>
          )}

          <p className="text-xs text-muted-foreground">
            Registrado el {new Date(trip.created_at).toLocaleDateString('es-GT')}
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
