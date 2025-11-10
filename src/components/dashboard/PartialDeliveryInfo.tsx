import { Package as PackageType } from "@/types";
import { MapPin, Calendar, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface PartialDeliveryInfoProps {
  pkg: PackageType;
}

export const PartialDeliveryInfo = ({ pkg }: PartialDeliveryInfoProps) => {
  // Parse matched_trip_dates
  const tripDates = pkg.matched_trip_dates as any;
  const travelerAddress = pkg.traveler_address as any;

  if (!tripDates && !travelerAddress) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          Información de entrega aún no disponible. El viajero proporcionará estos datos pronto.
        </AlertDescription>
      </Alert>
    );
  }

  // Mask address - only show city and country
  const getMaskedAddress = () => {
    if (!travelerAddress) return null;
    
    const city = travelerAddress.city || travelerAddress.ciudad || '***';
    const country = travelerAddress.country || travelerAddress.pais || '***';
    
    return `${city}, ${country}`;
  };

  const maskedAddress = getMaskedAddress();

  return (
    <div className="space-y-3">
      <Alert className="bg-blue-50/50 border-blue-200">
        <AlertCircle className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-xs text-blue-900">
          Esta es información parcial. Los detalles completos estarán disponibles después de completar el pago.
        </AlertDescription>
      </Alert>

      {/* Partial Address */}
      {maskedAddress && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            Ubicación de Entrega
          </h4>
          <div className="bg-muted/30 rounded-md p-2.5 space-y-1">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Ciudad: </span>
              {maskedAddress}
            </p>
            <p className="text-xs text-muted-foreground italic">
              La dirección completa estará disponible después del pago
            </p>
          </div>
        </div>
      )}

      {/* Reception Window */}
      {tripDates && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Ventana de Recepción
          </h4>
          <div className="bg-muted/30 rounded-md p-2.5 space-y-2">
            {tripDates.packageReceptionStart && tripDates.packageReceptionEnd && (
              <div>
                <p className="text-xs font-medium text-foreground mb-1">
                  Fechas para enviar el paquete:
                </p>
                <p className="text-xs text-muted-foreground">
                  Desde: {new Date(tripDates.packageReceptionStart).toLocaleDateString('es-GT', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
                <p className="text-xs text-muted-foreground">
                  Hasta: {new Date(tripDates.packageReceptionEnd).toLocaleDateString('es-GT', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
            
            {tripDates.officeDeliveryDate && (
              <div className="pt-2 border-t border-muted/50">
                <p className="text-xs font-medium text-foreground mb-1">
                  Fecha estimada de entrega en oficina:
                </p>
                <p className="text-xs text-muted-foreground">
                  {new Date(tripDates.officeDeliveryDate).toLocaleDateString('es-GT', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Important Note */}
      <Alert className="bg-amber-50/50 border-amber-200">
        <AlertCircle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-xs text-amber-900">
          <strong>Importante:</strong> Asegúrate de que el paquete llegue dentro de la ventana de recepción para que el viajero pueda llevarlo.
        </AlertDescription>
      </Alert>
    </div>
  );
};
