import React from "react";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

interface PackageShippingInstructionsProps {
  travelerAddress: any;
  matchedTripDates: any;
}

export const PackageShippingInstructions = ({ travelerAddress, matchedTripDates }: PackageShippingInstructionsProps) => {
  return (
    <TooltipProvider>
    <div className="bg-background border border-border rounded-md p-1.5 mb-2">
      <div className="flex items-center space-x-2 mb-2">
        <div className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center">
          <span className="text-xs">📦</span>
        </div>
        <div>
          <h3 className="text-sm font-bold text-foreground">Instrucciones para el envío</h3>
          <p className="text-xs text-foreground">Tu pago ha sido confirmado. Envía el producto a esta dirección:</p>
        </div>
      </div>
      
      {/* Fechas importantes */}
      {matchedTripDates && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-md p-1 mb-1.5">
          <div className="flex items-center space-x-1 mb-1">
            <span className="text-blue-600 text-xs">📅</span>
            <span className="text-xs font-medium text-blue-800">Fechas importantes</span>
          </div>
          
          <div className="space-y-0.5 text-xs">
            <div className="flex items-center justify-between py-0.5 px-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-green-600">📥</span>
                <span className="text-gray-700">Primer día para recibir paquetes:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.first_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-0.5 px-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-orange-600">📤</span>
                <span className="text-gray-700">Último día para recibir paquetes:</span>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.last_day_packages).toLocaleDateString('es-GT')}
              </span>
            </div>
            
            <div className="flex items-center justify-between py-0.5 px-1 bg-white/60 rounded text-xs">
              <div className="flex items-center space-x-1">
                <span className="text-purple-600">🏢</span>
                <span className="text-gray-700">Entrega en oficina:</span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-auto p-0 hover:bg-transparent">
                      <Info className="h-3 w-3 text-gray-500 cursor-help" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs">Día en que el viajero entregará los paquetes en la oficina de Favorón</p>
                  </TooltipContent>
                </Tooltip>
              </div>
              <span className="font-semibold text-gray-800">
                {new Date(matchedTripDates.delivery_date).toLocaleDateString('es-GT')}
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Dirección de envío */}
      <div className="bg-background/80 rounded-md p-1.5 border border-border mb-1.5">
        <div className="text-xs space-y-1.5">
          <div>
            <span className="font-medium text-primary text-xs">📍 Dirección de envío:</span>
          </div>
          
          <div className="space-y-1">
            {/* Destinatario */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">👤 Destinatario:</span>
              <span className="text-foreground font-semibold text-xs ml-1">
                {travelerAddress?.recipientName || 'Nombre no especificado'}
              </span>
              {!travelerAddress?.recipientName && (
                <p className="text-muted-foreground text-xs">⚠️ Contactar administración</p>
              )}
            </div>
            
            {/* Dirección */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">🏠 Dirección:</span>
              <span className="text-foreground font-medium text-xs ml-1">{travelerAddress?.streetAddress}</span>
              {travelerAddress?.streetAddress2 && (
                <span className="text-foreground font-medium text-xs block ml-3">{travelerAddress.streetAddress2}</span>
              )}
            </div>
            
            {/* Ciudad y Código Postal */}
            <div className="flex space-x-4">
              <div>
                <span className="font-medium text-muted-foreground text-xs">🌆 Ciudad:</span>
                <span className="text-foreground text-xs ml-1">{travelerAddress?.cityArea}</span>
              </div>
              {travelerAddress?.postalCode && (
                <div>
                  <span className="font-medium text-muted-foreground text-xs">CP:</span>
                  <span className="text-foreground font-mono text-xs ml-1">{travelerAddress.postalCode}</span>
                </div>
              )}
            </div>
            
            {/* Hotel/Airbnb */}
            {travelerAddress?.hotelAirbnbName && (
              <div>
                <span className="font-medium text-muted-foreground text-xs">🏨 Hotel:</span>
                <span className="text-foreground font-medium text-xs ml-1">{travelerAddress.hotelAirbnbName}</span>
              </div>
            )}
            
            {/* Contacto */}
            <div>
              <span className="font-medium text-muted-foreground text-xs">📞 Contacto:</span>
              <span className="text-foreground font-semibold text-xs ml-1">{travelerAddress?.contactNumber}</span>
            </div>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-muted-foreground">
        Una vez enviado el producto, sube los documentos de compra y tracking abajo.
      </p>
    </div>
    </TooltipProvider>
  );
};