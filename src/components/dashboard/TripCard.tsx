
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Phone } from "lucide-react";

interface TripCardProps {
  trip: any;
  getStatusBadge: (status: string) => JSX.Element;
}

const TripCard = ({ trip, getStatusBadge }: TripCardProps) => {
  return (
    <Card key={trip.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">{trip.fromCity} → {trip.toCity}</CardTitle>
            <CardDescription>
              Llegada: {new Date(trip.arrivalDate).toLocaleDateString('es-GT')} • Espacio: {trip.availableSpace} kg
            </CardDescription>
          </div>
          {getStatusBadge(trip.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <p className="text-sm">
            <strong>Método de entrega:</strong> {trip.deliveryMethod}
          </p>

          {/* Display delivery address */}
          {trip.deliveryAddress && (
            <div className="bg-muted/50 border rounded-lg p-3">
              <div className="flex items-start space-x-2 mb-2">
                <Home className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm font-medium">Dirección de entrega registrada:</p>
              </div>
              <div className="text-sm text-muted-foreground ml-6">
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
            <p className="text-sm">
              <strong>Información adicional:</strong> {trip.additionalInfo}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Registrado el {new Date(trip.createdAt).toLocaleDateString('es-GT')}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TripCard;
