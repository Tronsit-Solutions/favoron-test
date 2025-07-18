import React from "react";

interface PackageShippingInstructionsProps {
  travelerAddress: any;
  matchedTripDates: any;
}

export const PackageShippingInstructions = ({ travelerAddress, matchedTripDates }: PackageShippingInstructionsProps) => {
  return (
    <div className="bg-background border border-border rounded-md p-2 mb-3">
      <div className="flex items-center space-x-2 mb-3">
        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-sm">📦</span>
        </div>
        <div>
          <h3 className="text-base font-bold text-foreground">Instrucciones para el envío</h3>
          <p className="text-xs text-foreground">
            Tu pago ha sido confirmado. Envía el producto a esta dirección:
          </p>
        </div>
      </div>
      
      {/* Fechas importantes */}
      {matchedTripDates && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-md p-1.5 mb-2">
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-blue-600 text-xs">📅</span>
            <span className="text-xs font-medium text-blue-800">Fechas importantes</span>
          </div>
          
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-green-600">📥</span>
                <span className="text-gray-700">Primer día:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.first_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-orange-600">📤</span>
                <span className="text-gray-700">Último día:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.last_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-purple-600">🏢</span>
                <span className="text-gray-700">Entrega oficina:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.delivery_date).toLocaleDateString('es-GT')}
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
          
          {/* Destinatario */}
          <div className="bg-primary/10 border border-primary/20 rounded-md p-2">
            <span className="font-medium text-primary text-xs">👤 Destinatario:</span>
            <p className="text-foreground font-semibold text-sm">
              {travelerAddress?.recipientName || 'Nombre no especificado'}
            </p>
            {!travelerAddress?.recipientName && (
              <p className="text-muted-foreground text-xs mt-1">
                ⚠️ Contactar administración para obtener el nombre del destinatario
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            {/* Dirección */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">🏠 Dirección:</span>
              <p className="text-foreground font-medium text-xs">{travelerAddress?.streetAddress}</p>
            </div>
            
            {/* Ciudad y Código Postal */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium text-muted-foreground text-xs">🌆 Ciudad:</span>
                <p className="text-foreground text-xs">{travelerAddress?.cityArea}</p>
              </div>
              {travelerAddress?.postalCode && (
                <div>
                  <span className="font-medium text-muted-foreground text-xs">Código Postal:</span>
                  <p className="text-foreground font-mono text-xs">{travelerAddress.postalCode}</p>
                </div>
              )}
            </div>
            
            {/* Hotel/Airbnb */}
            {travelerAddress?.hotelAirbnbName && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-1.5">
                <span className="font-medium text-blue-700 text-xs">🏨 Hotel:</span>
                <p className="text-blue-800 font-medium text-xs">{travelerAddress.hotelAirbnbName}</p>
              </div>
            )}
            
            {/* Contacto */}
            <div className="bg-green-50 border border-green-200 rounded-md p-1.5">
              <span className="font-medium text-green-700 text-xs">📞 Contacto:</span>
              <p className="text-green-800 font-semibold text-xs">{travelerAddress?.contactNumber}</p>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Una vez enviado el producto, sube los documentos de compra y tracking abajo.
      </p>
    </div>
  );
};