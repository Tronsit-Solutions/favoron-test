import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Calendar, CheckCircle } from "lucide-react";
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
    <div className={className}>
      {/* Información de envío compacta */}
      {(address || tripDates) && (
        <Card className="border-success/30 bg-success/5 max-w-md">
          <CardContent className="p-3">
            <div className="space-y-3 text-xs">
              {/* Dirección del viajero */}
              {address && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-success text-sm flex items-center space-x-1">
                    <MapPin className="h-3 w-3" />
                    <span>Dirección de envío</span>
                  </h5>
                  <div className="space-y-1.5 bg-white/60 rounded p-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Para:</span>
                      <span className="text-foreground font-semibold text-right">
                        {address.recipientName || "N/A"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground font-medium">Tel:</span>
                      <span className="text-foreground font-semibold">{address.contactNumber}</span>
                    </div>
                    <div className="border-t pt-1.5">
                      <div className="text-foreground">
                        <p className="font-medium">{address.streetAddress}</p>
                        {address.streetAddress2 && <p className="text-xs">{address.streetAddress2}</p>}
                        <p className="text-xs">{address.cityArea}</p>
                        {address.postalCode && <p className="text-xs font-mono">CP: {address.postalCode}</p>}
                      </div>
                    </div>
                    {address.hotelAirbnbName && address.hotelAirbnbName !== "-" && (
                      <div className="border-t pt-1.5">
                        <span className="text-muted-foreground font-medium">Hotel/Airbnb:</span>
                        <p className="text-foreground font-medium">{address.hotelAirbnbName}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fechas importantes */}
              {tripDates && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-success text-sm flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>Fechas importantes</span>
                  </h5>
                  <div className="space-y-1 bg-white/60 rounded p-2">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">📥 Primer día:</span>
                      <span className="font-semibold text-foreground text-xs">
                        {new Date(tripDates.first_day_packages).toLocaleDateString("es-GT", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs">📤 Último día:</span>
                      <span className="font-semibold text-foreground text-xs">
                        {new Date(tripDates.last_day_packages).toLocaleDateString("es-GT", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between items-center border-t pt-1">
                      <span className="text-muted-foreground text-xs">🏢 Entrega GT:</span>
                      <span className="font-semibold text-foreground text-xs">
                        {new Date(tripDates.delivery_date).toLocaleDateString("es-GT", {
                          month: "short",
                          day: "numeric"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Próximos pasos */}
              <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700 border border-blue-200">
                💡 <strong>Próximo:</strong> Compra el producto y envíalo a la dirección mostrada.
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
export default ShippingInfoRegistry;