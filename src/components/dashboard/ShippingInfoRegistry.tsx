
import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, CheckCircle, Truck, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import AddressDisplay from "@/components/ui/address-display";
import { formatDateUTC } from "@/lib/formatters";

interface ShippingInfoRegistryProps {
  pkg: Package;
  className?: string;
}

const ShippingInfoRegistry = ({
  pkg,
  className = ""
}: ShippingInfoRegistryProps) => {
  // Solo mostrar si hay información de envío guardada Y el pago ha sido aprobado por el admin
  if (!pkg.traveler_address && !pkg.matched_trip_dates) {
    return null;
  }

  // CRÍTICO: Esta información solo debe ser visible en estados avanzados
  if (!['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status)) {
    return null;
  }
  
  const address = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dirección de Entrega */}
      {address && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección de Entrega
            </CardTitle>
          </CardHeader>
          <CardContent>
            <AddressDisplay
              address={{
                streetAddress: address.streetAddress,
                streetAddress2: address.streetAddress2,
                cityArea: address.cityArea,
                hotelAirbnbName: address.hotelAirbnbName,
                contactNumber: address.contactNumber,
                recipientName: address.recipientName,
                additionalInstructions: address.additionalInstructions,
                country: address.country,
                postalCode: address.postalCode
              }}
              title="Información de envío"
              variant="info"
            />
          </CardContent>
        </Card>
      )}

      {/* Fechas Importantes */}
      {tripDates && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fechas Importantes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-info-muted border-info-border border rounded-lg p-4">
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Primer día para recibir paquetes:</p>
                  <p className="text-sm font-semibold text-primary">{formatDateUTC(tripDates.first_day_packages)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Último día para recibir paquetes:</p>
                  <p className="text-sm font-semibold text-primary">{formatDateUTC(tripDates.last_day_packages)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Fecha de entrega en oficina de Favoron:</p>
                  <p className="text-sm font-semibold text-success">{formatDateUTC(tripDates.delivery_date)}</p>
                  
                  <Alert className="mt-3">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Podrás recoger tu paquete entre 1 y 2 días después de la entrega del viajero.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Próximos pasos - Solo mostrar cuando está pending_purchase */}
      {pkg.status === 'pending_purchase' && (
        <Alert>
          <Truck className="h-4 w-4" />
          <AlertDescription>
            <strong>Próximo paso:</strong> Compra el producto y envíalo a la dirección mostrada.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ShippingInfoRegistry;
