import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, CheckCircle } from "lucide-react";

interface ShippingInfoRegistryProps {
  pkg: Package;
  className?: string;
}

const ShippingInfoRegistry = ({ pkg, className = "" }: ShippingInfoRegistryProps) => {
  // Solo mostrar si hay información de envío guardada
  if (!pkg.traveler_address && !pkg.matched_trip_dates) {
    return null;
  }

  const address = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center space-x-2">
        <CheckCircle className="h-4 w-4 text-success" />
        <h4 className="text-sm font-medium text-foreground">Información de envío guardada</h4>
      </div>

      {/* Dirección del viajero */}
      {address && (
        <Card className="border-success/30 bg-success/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-success">
              <MapPin className="h-4 w-4" />
              <span>Dirección de envío del viajero</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-muted-foreground font-medium">Destinatario:</span>
                  <p className="text-foreground font-semibold">
                    {address.recipientName || "Nombre no especificado"}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium">Teléfono:</span>
                  <p className="text-foreground font-semibold">{address.contactNumber}</p>
                </div>
              </div>

              <div>
                <span className="text-muted-foreground font-medium">Dirección completa:</span>
                <div className="text-foreground">
                  <p className="font-medium">{address.streetAddress}</p>
                  {address.streetAddress2 && <p>{address.streetAddress2}</p>}
                  <p>{address.cityArea}</p>
                  {address.postalCode && (
                    <p className="font-mono">Código Postal: {address.postalCode}</p>
                  )}
                </div>
              </div>

              {address.accommodationType && (
                <div>
                  <span className="text-muted-foreground font-medium">Tipo de alojamiento:</span>
                  <p className="text-foreground capitalize">{address.accommodationType}</p>
                </div>
              )}

              {address.hotelAirbnbName && address.hotelAirbnbName !== "-" && (
                <div>
                  <span className="text-muted-foreground font-medium">Hotel/Airbnb:</span>
                  <p className="text-foreground font-medium">{address.hotelAirbnbName}</p>
                </div>
              )}

              {address.additionalInstructions && (
                <div>
                  <span className="text-muted-foreground font-medium">Instrucciones adicionales:</span>
                  <p className="text-foreground">{address.additionalInstructions}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fechas importantes */}
      {tripDates && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2 text-primary">
              <Calendar className="h-4 w-4" />
              <span>Fechas importantes del viaje</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">📥 Primer día para recibir paquetes:</span>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.first_day_packages).toLocaleDateString("es-GT", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">📤 Último día para recibir paquetes:</span>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.last_day_packages).toLocaleDateString("es-GT", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">🏢 Entrega en Guatemala:</span>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.delivery_date).toLocaleDateString("es-GT", {
                    month: "short",
                    day: "numeric",
                    year: "numeric"
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ShippingInfoRegistry;