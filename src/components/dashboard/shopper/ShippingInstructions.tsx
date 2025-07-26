import { Package as PackageType } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Calendar, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ShippingInstructionsProps {
  pkg: PackageType;
}

const ShippingInstructions = ({ pkg }: ShippingInstructionsProps) => {
  // Solo mostrar si el pago ha sido confirmado
  const pkgWithTrips = pkg as any;
  
  console.log('🔍 ShippingInstructions Debug - pkg.status:', pkg.status);
  console.log('🔍 ShippingInstructions Debug - saved traveler_address:', pkg.traveler_address);
  console.log('🔍 ShippingInstructions Debug - saved matched_trip_dates:', pkg.matched_trip_dates);
  
  // Use saved traveler address first, fallback to trip data if not saved yet
  const address = pkg.traveler_address || pkgWithTrips.trips?.package_receiving_address;
  const tripDates = pkg.matched_trip_dates as any;
  
  if (!['pending_purchase', 'payment_confirmed'].includes(pkg.status) || !address) {
    return null;
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between p-3 bg-success/5 border border-success/30 rounded-lg">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-4 w-4 text-success" />
          <div>
            <h4 className="text-sm font-medium text-foreground">¡Pago Aprobado! - Información de Envío</h4>
            <p className="text-xs text-success-foreground">Compra el producto y envíalo a esta dirección</p>
          </div>
        </div>
      </div>
      
      <Card className="border-success/30 bg-success/5 mt-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center space-x-2 text-success">
            <MapPin className="h-4 w-4" />
            <span>Información de envío y fechas del viaje</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4 text-xs">
            {/* Fechas importantes */}
            {tripDates && (
              <div className="space-y-2">
                <h5 className="font-semibold text-success text-sm flex items-center space-x-1">
                  <Calendar className="h-4 w-4" />
                  <span>📅 Fechas importantes</span>
                </h5>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">📥 Primer día para recibir:</span>
                    <span className="font-semibold text-foreground">
                      {new Date(tripDates.first_day_packages).toLocaleDateString("es-GT", {
                        month: "short",
                        day: "numeric",
                        year: "numeric"
                      })}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">📤 Último día para recibir:</span>
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
              </div>
            )}
            
            {/* Dirección de envío */}
            {address && (
              <div className="space-y-2">
                <h5 className="font-semibold text-success text-sm">📦 Dirección de envío</h5>
                <div className="space-y-1">
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
              </div>
            )}
            
            {/* Información de entrega en Guatemala */}
            {tripDates?.messenger_pickup_info && (
              <div className="space-y-2">
                <h5 className="font-semibold text-success text-sm">🚚 Entrega en Guatemala</h5>
                <div className="text-xs space-y-1">
                  {tripDates.delivery_method === 'mensajero' ? (
                    <div>
                      <p className="text-foreground"><strong>Método:</strong> Entrega por mensajero</p>
                      <p className="text-foreground"><strong>Dirección:</strong> {tripDates.messenger_pickup_info.address}</p>
                      <p className="text-foreground"><strong>Contacto:</strong> {tripDates.messenger_pickup_info.contactNumber}</p>
                      {tripDates.messenger_pickup_info.instructions && (
                        <p className="text-foreground"><strong>Instrucciones:</strong> {tripDates.messenger_pickup_info.instructions}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-foreground">
                      El viajero entregará los paquetes directamente en la oficina de Favorón.
                    </p>
                  )}
                </div>
              </div>
            )}
            
            <div className="mt-2 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
              💡 <strong>Próximos pasos:</strong> Compra el producto y envíalo a la dirección mostrada. Luego sube los documentos de compra y tracking.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingInstructions;