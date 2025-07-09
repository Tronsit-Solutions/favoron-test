import { User, MapPin, DollarSign } from "lucide-react";
interface TravelerPackageInfoProps {
  pkg: any;
}
const TravelerPackageInfo = ({
  pkg
}: TravelerPackageInfoProps) => {
  return <>
      {/* Shopper information */}
      

      {/* Show quote information if sent */}
      {pkg.quote && <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4" />
            <p className="text-sm font-medium">💰 Información de compensación</p>
          </div>
          
          {/* Traveler compensation - most prominent */}
          <div className="bg-background border rounded-md p-3">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm font-semibold">Tu ganancia:</p>
                <p className="text-xl font-bold">
                  ${parseFloat(pkg.quote.price || 0).toFixed(2)}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Por este Favorón</p>
              </div>
            </div>
          </div>

          {/* Total price breakdown */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t">
            <div className="flex justify-between">
              <span>Total que paga el shopper:</span>
              <span className="font-medium">${parseFloat(pkg.quote.totalPrice || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Tu compensación:</span>
              <span className="font-medium">${parseFloat(pkg.quote.price || 0).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Servicio Favorón + Seguro:</span>
              <span className="font-medium">${(parseFloat(pkg.quote.totalPrice || 0) - parseFloat(pkg.quote.price || 0)).toFixed(2)}</span>
            </div>
          </div>

          {pkg.quote.message && <div className="border-t pt-2">
              <p className="text-xs text-muted-foreground">Mensaje: "{pkg.quote.message}"</p>
            </div>}
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Estado: {pkg.status === 'quote_accepted' ? '✅ Aceptada' : '⏳ Esperando respuesta'}
          </div>
        </div>}

      {/* Delivery address if confirmed */}
      {pkg.confirmed_delivery_address && <div className="bg-muted/30 border rounded-lg p-2">
          <div className="flex items-start space-x-1.5 mb-1">
            <MapPin className="h-3 w-3 text-muted-foreground mt-0.5" />
            <p className="text-xs font-medium">Dirección de entrega confirmada:</p>
          </div>
          <div className="text-xs text-muted-foreground ml-4.5">
            <p>{pkg.confirmed_delivery_address.streetAddress}</p>
            <p>{pkg.confirmed_delivery_address.cityArea}</p>
            {pkg.confirmed_delivery_address.hotelAirbnbName && <p>{pkg.confirmed_delivery_address.hotelAirbnbName}</p>}
            <p>📞 {pkg.confirmed_delivery_address.contactNumber}</p>
          </div>
        </div>}

      {/* Action buttons for travelers */}
      <div className="flex flex-wrap gap-1">
        {pkg.status === 'quote_sent' && <div className="text-xs text-muted-foreground">
            Cotización enviada - Esperando respuesta del shopper
          </div>}

        {pkg.status === 'quote_accepted' && <div className="text-xs font-medium">
            ✅ Cotización aceptada - Esperando confirmación de pago
          </div>}

        {pkg.status === 'payment_confirmed' && <div className="text-xs font-medium">
            💳 Pago confirmado - Esperando que el shopper envíe el paquete
          </div>}

        {pkg.status === 'in_transit' && <div className="text-xs font-medium">
            🚚 Paquete en tránsito - El shopper ya lo envió
          </div>}

        {pkg.status === 'received_by_traveler' && <div className="text-xs font-medium">
          ✅ Paquete recibido y confirmado
          {pkg.traveler_confirmation?.confirmedAt && <div className="text-xs text-muted-foreground mt-0.5">
              Confirmado el: {new Date(pkg.traveler_confirmation.confirmedAt).toLocaleDateString('es-GT')}
            </div>}
          </div>}
      </div>
    </>;
};
export default TravelerPackageInfo;