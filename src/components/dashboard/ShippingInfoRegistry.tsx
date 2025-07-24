import { Package } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, Calendar, CheckCircle, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface ShippingInfoRegistryProps {
  pkg: Package;
  className?: string;
}

const ShippingInfoRegistry = ({ pkg, className = "" }: ShippingInfoRegistryProps) => {
  const [isOpen, setIsOpen] = useState(false);
  
  // Solo mostrar si hay información de envío guardada
  if (!pkg.traveler_address && !pkg.matched_trip_dates) {
    return null;
  }

  const address = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;

  return (
    <div className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <div className="flex items-center justify-between cursor-pointer p-3 bg-success/5 border border-success/30 rounded-lg hover:bg-success/10 transition-colors">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4 text-success" />
              <h4 className="text-sm font-medium text-foreground">Información de envío guardada</h4>
            </div>
            {isOpen ? <ChevronUp className="h-4 w-4 text-success" /> : <ChevronDown className="h-4 w-4 text-success" />}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          {/* Información de envío completa */}
          {(address || tripDates) && (
            <Card className="border-success/30 bg-success/5 mt-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center space-x-2 text-success">
                  <MapPin className="h-4 w-4" />
                  <span>Información de envío y fechas del viaje</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-4 text-xs">
                  {/* Dirección del viajero */}
                  {address && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-success text-sm">📦 Dirección de envío del viajero</h5>
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

                  {/* Fechas importantes */}
                  {tripDates && (
                    <div className="space-y-2">
                      <h5 className="font-semibold text-success text-sm flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>📅 Fechas importantes del viaje</span>
                      </h5>
                      <div className="space-y-1">
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
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ShippingInfoRegistry;