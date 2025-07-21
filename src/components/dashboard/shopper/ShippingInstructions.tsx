import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Phone, User, Clock, Package, Truck } from "lucide-react";
import { Package as PackageType } from "@/types";

interface ShippingInstructionsProps {
  pkg: PackageType;
}

const ShippingInstructions = ({ pkg }: ShippingInstructionsProps) => {
  // Solo mostrar si el pago ha sido aprobado
  if (pkg.status !== 'payment_confirmed' || !pkg.traveler_address) {
    return null;
  }

  const address = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <Truck className="h-4 w-4 text-green-600" />
          </div>
          <div>
            <CardTitle className="text-green-800 text-lg">
              ✅ ¡Pago Aprobado! - Información de Envío
            </CardTitle>
            <p className="text-green-600 text-sm">
              Tu pago ha sido aprobado. Envía el paquete a la siguiente dirección:
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Información del destinatario */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <User className="h-4 w-4" />
            Destinatario (Viajero)
          </h4>
           <div className="space-y-2">
             <p className="text-sm">
               <strong>Nombre:</strong> {address.recipientName || 'No especificado'}
             </p>
             <p className="text-sm flex items-center gap-2">
               <Phone className="h-3 w-3" />
               <strong>Teléfono:</strong> {address.contactNumber}
             </p>
           </div>
        </div>

        {/* Dirección de envío */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Dirección de Envío
          </h4>
          <div className="space-y-1">
            <p className="text-sm font-medium">{address.streetAddress}</p>
            {address.streetAddress2 && (
              <p className="text-sm text-gray-600">{address.streetAddress2}</p>
            )}
            <p className="text-sm text-gray-600">
              {address.cityArea} {address.postalCode && `• CP: ${address.postalCode}`}
            </p>
            {address.hotelAirbnbName && address.hotelAirbnbName !== '-' && (
              <p className="text-sm text-gray-600">
                <strong>Hotel/Airbnb:</strong> {address.hotelAirbnbName}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <strong>Tipo:</strong> {address.accommodationType || 'No especificado'}
            </p>
          </div>
        </div>

        {/* Fechas importantes */}
        {tripDates && (
          <div className="bg-white rounded-lg p-4 border">
            <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Fechas del Viaje
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">
                  <strong>Envío desde:</strong>
                </p>
                <p>{new Date(tripDates.first_day_packages).toLocaleDateString('es-GT')}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Envío hasta:</strong>
                </p>
                <p>{new Date(tripDates.last_day_packages).toLocaleDateString('es-GT')}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Viajero llega:</strong>
                </p>
                <p>{new Date(tripDates.arrival_date).toLocaleDateString('es-GT')}</p>
              </div>
              <div>
                <p className="text-gray-600">
                  <strong>Entrega en Guatemala:</strong>
                </p>
                <p>{new Date(tripDates.delivery_date).toLocaleDateString('es-GT')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Información del paquete */}
        <div className="bg-white rounded-lg p-4 border">
          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Package className="h-4 w-4" />
            Detalles del Paquete
          </h4>
          <div className="space-y-2">
            <p className="text-sm">
              <strong>Producto:</strong> {pkg.item_description}
            </p>
            <p className="text-sm">
              <strong>Precio Total:</strong> Q{(pkg.quote as any)?.totalPrice || 'N/A'}
            </p>
            {pkg.item_link && (
              <p className="text-sm">
                <strong>Link:</strong>{' '}
                <a 
                  href={pkg.item_link} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Ver producto
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Instrucciones importantes */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-semibold text-yellow-800 mb-2">
            📋 Instrucciones Importantes
          </h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Envía el paquete a la dirección exacta mostrada arriba</li>
            <li>• Asegúrate de que el paquete llegue entre las fechas indicadas</li>
            <li>• Incluye el número de pedido #{pkg.id} en el envío</li>
            <li>• Contacta al viajero si necesitas coordinar la entrega</li>
          </ul>
        </div>

        {/* Estado del paquete */}
        <div className="flex items-center justify-between">
          <Badge className="bg-green-100 text-green-800">
            Pago Aprobado - Listo para Enviar
          </Badge>
          <span className="text-xs text-gray-500">
            Aprobado el {new Date().toLocaleDateString('es-GT')}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ShippingInstructions;