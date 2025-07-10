import { MapPin } from "lucide-react";

interface TravelerPackageInfoProps {
  pkg: any;
}

const TravelerPackageInfo = ({ pkg }: TravelerPackageInfoProps) => {
  return (
    <div className="space-y-2">
      {/* Delivery address if confirmed */}
      {pkg.confirmed_delivery_address && (
        <div className="bg-muted/30 border rounded-lg p-2">
          <div className="flex items-start space-x-1.5 mb-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
            <p className="text-xs font-medium">Dirección de entrega confirmada:</p>
          </div>
          <div className="text-xs text-muted-foreground ml-4.5">
            <p>{pkg.confirmed_delivery_address.streetAddress}</p>
            <p>{pkg.confirmed_delivery_address.cityArea}</p>
            {pkg.confirmed_delivery_address.hotelAirbnbName && (
              <p>{pkg.confirmed_delivery_address.hotelAirbnbName}</p>
            )}
            <p>📞 {pkg.confirmed_delivery_address.contactNumber}</p>
          </div>
        </div>
      )}

      {/* Status messages */}
      <div className="bg-muted/30 border rounded-lg p-2">
        <div className="text-xs">
          {pkg.status === 'quote_sent' && (
            <div className="text-muted-foreground">
              Cotización enviada - Esperando respuesta del shopper
            </div>
          )}

          {pkg.status === 'quote_accepted' && (
            <div className="font-medium text-green-600">
              ✅ Cotización aceptada - Esperando confirmación de pago
            </div>
          )}

          {pkg.status === 'payment_confirmed' && (
            <div className="font-medium text-blue-600">
              💳 Pago confirmado - Esperando que el shopper envíe el paquete
            </div>
          )}

          {pkg.status === 'in_transit' && (
            <div className="font-medium text-orange-600">
              🚚 Paquete en tránsito - El shopper ya lo envió
            </div>
          )}

          {pkg.status === 'received_by_traveler' && (
            <div className="font-medium text-green-600">
              ✅ Paquete recibido y confirmado
              {pkg.traveler_confirmation?.confirmedAt && (
                <div className="text-muted-foreground mt-0.5">
                  Confirmado el: {new Date(pkg.traveler_confirmation.confirmedAt).toLocaleDateString('es-GT')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TravelerPackageInfo;