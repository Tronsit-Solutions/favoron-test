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
    <div className="bg-green-50/50 border border-green-200 rounded-md p-2 mb-3">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
          <span className="text-sm">✅</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-green-800">¡Pago Aprobado!</h3>
          <p className="text-xs text-green-700">
            Tu pago ha sido confirmado. Envía el producto a esta dirección:
          </p>
        </div>
      </div>
      
      {/* Fechas importantes */}
      {tripDates && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-md p-1.5 mb-2">
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-blue-600 text-xs">📅</span>
            <span className="text-xs font-medium text-blue-800">Fechas importantes</span>
          </div>
          
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-green-600">📥</span>
                <span className="text-gray-700">Envío desde:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(tripDates.first_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-orange-600">📤</span>
                <span className="text-gray-700">Envío hasta:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(tripDates.last_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-purple-600">🏢</span>
                <span className="text-gray-700">Entrega en Guatemala:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(tripDates.delivery_date).toLocaleDateString('es-GT')}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Dirección de envío */}
      <div className="bg-background/80 rounded-md p-2 border border-border mb-2">
        <div className="text-xs space-y-2">
          <div>
            <span className="font-medium text-primary text-sm">📍 Dirección de envío:</span>
          </div>
          
          <div className="space-y-1">
            {/* Destinatario */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">👤 Destinatario:</span>
              <p className="text-foreground font-semibold text-xs">
                {address.recipientName || 'No especificado'}
              </p>
            </div>
            
            {/* Dirección */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">🏠 Dirección:</span>
              <p className="text-foreground font-medium text-xs">{address.streetAddress}</p>
              {address.streetAddress2 && (
                <p className="text-foreground font-medium text-xs">{address.streetAddress2}</p>
              )}
            </div>
            
            {/* Ciudad y Código Postal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-muted-foreground text-xs">🌆 Ciudad:</span>
                <p className="text-foreground text-xs">{address.cityArea}</p>
              </div>
              {address.postalCode && (
                <div>
                  <span className="font-medium text-muted-foreground text-xs">CP:</span>
                  <p className="text-foreground font-mono text-xs">{address.postalCode}</p>
                </div>
              )}
            </div>
            
            {/* Hotel/Airbnb */}
            {address.hotelAirbnbName && address.hotelAirbnbName !== '-' && (
              <div>
                <span className="font-medium text-muted-foreground text-xs">🏨 Hotel:</span>
                <p className="text-foreground font-medium text-xs">{address.hotelAirbnbName}</p>
              </div>
            )}
            
            {/* Tipo de alojamiento */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">🏠 Tipo:</span>
              <p className="text-foreground text-xs">{address.accommodationType || 'No especificado'}</p>
            </div>
            
            {/* Contacto */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">📞 Contacto:</span>
              <p className="text-foreground font-semibold text-xs">{address.contactNumber}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Información del producto */}
      <div className="bg-background/80 rounded-md p-2 border border-border mb-2">
        <div className="text-xs space-y-1">
          <div>
            <span className="font-medium text-primary text-sm">📦 Producto:</span>
          </div>
          <p className="text-foreground font-medium text-xs">{pkg.item_description}</p>
          <p className="text-foreground text-xs">
            <span className="font-medium">Cotización:</span> Q{(pkg.quote as any)?.price || 'N/A'}
          </p>
          {pkg.item_link && (
            <p className="text-xs">
              <a 
                href={pkg.item_link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                🔗 Ver producto
              </a>
            </p>
          )}
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        💡 Incluye el número de pedido #{pkg.id} en el envío. Una vez enviado, sube los documentos de compra y tracking.
      </p>
    </div>
  );
};

export default ShippingInstructions;