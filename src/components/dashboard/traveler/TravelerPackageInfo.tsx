import { User, MapPin } from "lucide-react";

interface TravelerPackageInfoProps {
  pkg: any;
}

const TravelerPackageInfo = ({ pkg }: TravelerPackageInfoProps) => {
  return (
    <>
      {/* Shopper information */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-2">
        <div className="flex items-start space-x-1.5 mb-1">
          <User className="h-3 w-3 text-green-600 mt-0.5" />
          <p className="text-xs font-medium text-green-800">Información del shopper:</p>
        </div>
        <div className="text-xs text-green-700 ml-4.5">
          <p>Solicitante: Usuario #{pkg.userId}</p>
          <p>Creado el: {new Date(pkg.createdAt).toLocaleDateString('es-GT')}</p>
        </div>
      </div>

      {/* Show quote information if sent */}
      {pkg.quote && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2">
          <p className="text-xs font-medium text-yellow-800 mb-1">Tu cotización enviada:</p>
          <p className="text-sm font-bold text-yellow-800">
            Total para el shopper: ${parseFloat(pkg.quote.totalPrice || 0).toFixed(2)}
          </p>
          <p className="text-xs text-yellow-600 mt-1">
            Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
          </p>
          {pkg.quote.message && (
            <p className="text-xs text-yellow-600 mt-1">Mensaje: "{pkg.quote.message}"</p>
          )}
          <p className="text-xs text-yellow-600 mt-1">
            Estado: {pkg.status === 'quote_accepted' ? 'Aceptada ✅' : 'Esperando respuesta ⏳'}
          </p>
        </div>
      )}

      {/* Delivery address if confirmed */}
      {pkg.confirmedDeliveryAddress && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-2">
          <div className="flex items-start space-x-1.5 mb-1">
            <MapPin className="h-3 w-3 text-purple-600 mt-0.5" />
            <p className="text-xs font-medium text-purple-800">Dirección de entrega confirmada:</p>
          </div>
          <div className="text-xs text-purple-700 ml-4.5">
            <p>{pkg.confirmedDeliveryAddress.streetAddress}</p>
            <p>{pkg.confirmedDeliveryAddress.cityArea}</p>
            {pkg.confirmedDeliveryAddress.hotelAirbnbName && (
              <p>{pkg.confirmedDeliveryAddress.hotelAirbnbName}</p>
            )}
            <p>📞 {pkg.confirmedDeliveryAddress.contactNumber}</p>
          </div>
        </div>
      )}

      {/* Action buttons for travelers */}
      <div className="flex flex-wrap gap-1">
        {pkg.status === 'quote_sent' && (
          <div className="text-xs text-muted-foreground">
            Cotización enviada - Esperando respuesta del shopper
          </div>
        )}

        {pkg.status === 'quote_accepted' && (
          <div className="text-xs text-green-600 font-medium">
            ✅ Cotización aceptada - Esperando confirmación de pago
          </div>
        )}

        {pkg.status === 'payment_confirmed' && (
          <div className="text-xs text-blue-600 font-medium">
            💳 Pago confirmado - Esperando que el shopper envíe el paquete
          </div>
        )}

        {pkg.status === 'in_transit' && (
          <div className="text-xs text-orange-600 font-medium">
            🚚 Paquete en tránsito - El shopper ya lo envió
          </div>
        )}

        {pkg.status === 'received_by_traveler' && (
          <div className="text-xs text-green-600 font-medium">
            ✅ Paquete recibido y confirmado
            {pkg.travelerConfirmation?.confirmedAt && (
              <div className="text-xs text-muted-foreground mt-0.5">
                Confirmado el: {new Date(pkg.travelerConfirmation.confirmedAt).toLocaleDateString('es-GT')}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};

export default TravelerPackageInfo;