import { Package as PackageIcon, MapPin } from "lucide-react";
import { Package } from "@/types";
import PaymentReceiptUpload from "./PaymentReceiptUpload";
interface ShopperPackageInfoProps {
  pkg: Package;
  onPackageUpdate?: (updatedPkg?: Package) => void;
}
const ShopperPackageInfo = ({
  pkg,
  onPackageUpdate
}: ShopperPackageInfoProps) => {
  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;

    // Calculate total with Favorón fee (40%)
    const quote = pkg.quote as any;
    const basePrice = parseFloat(quote?.price || '0');
    const additionalFee = parseFloat(quote?.serviceFee || '0');
    const subtotal = basePrice + additionalFee;
    const totalWithFavoronFee = quote?.totalPrice ? parseFloat(quote.totalPrice) : subtotal * 1.4;
    return <div className="bg-info-muted border border-info-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-info">Cotización recibida:</p>
          <p className="text-lg font-bold text-info">Q{totalWithFavoronFee.toFixed(2)}</p>
        </div>
        <p className="text-xs text-info">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {quote?.message && <p className="text-sm text-info mt-2 italic">"{quote.message}"</p>}
      </div>;
  };
  const renderTravelerAddress = () => {
    if (!pkg.traveler_address || pkg.status !== 'payment_confirmed') return null;
    
    const address = pkg.traveler_address as any;
    const tripDates = pkg.matched_trip_dates as any;
    
    return (
      <div className="bg-success-muted border border-success-border rounded-lg p-4 mt-4">
        <div className="flex items-center space-x-2 mb-3">
          <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center">
            <span className="text-sm">📦</span>
          </div>
          <div>
            <h3 className="text-base font-bold text-success">¡Pago Aprobado! - Información de Envío</h3>
            <p className="text-sm text-success-foreground">
              Tu pago ha sido confirmado. Aquí tienes toda la información para el envío:
            </p>
          </div>
        </div>
        
        {/* Fechas importantes */}
        {tripDates && (
          <div className="bg-background border border-border rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-primary text-sm">📅</span>
              <span className="text-sm font-semibold text-foreground">Fechas Importantes</span>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-green-600">📥</span>
                  <span className="text-muted-foreground">Primer día para recibir paquetes:</span>
                </div>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.first_day_packages).toLocaleDateString('es-GT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-orange-600">📤</span>
                  <span className="text-muted-foreground">Último día para recibir paquetes:</span>
                </div>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.last_day_packages).toLocaleDateString('es-GT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div className="flex items-center space-x-2">
                  <span className="text-purple-600">🏢</span>
                  <span className="text-muted-foreground">Entrega en Guatemala:</span>
                </div>
                <span className="font-semibold text-foreground">
                  {new Date(tripDates.delivery_date).toLocaleDateString('es-GT', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
          </div>
        )}
        
        {/* Dirección de envío */}
        <div className="bg-background border border-border rounded-md p-3 mb-3">
          <div className="text-sm space-y-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="font-semibold text-primary text-base">📍 Dirección de Envío</span>
            </div>
            
            <div className="grid gap-3">
              {/* Destinatario */}
              <div className="flex items-start space-x-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">👤 Destinatario:</span>
                <div>
                  <p className="text-foreground font-semibold">
                    {address?.recipientName || 'Nombre no especificado'}
                  </p>
                  {!address?.recipientName && (
                    <p className="text-destructive text-xs">
                      ⚠️ Contactar administración para obtener el nombre del destinatario
                    </p>
                  )}
                </div>
              </div>
              
              {/* Tipo de alojamiento */}
              {address?.accommodationType && (
                <div className="flex items-start space-x-2">
                  <span className="text-muted-foreground font-medium min-w-[80px]">🏠 Tipo:</span>
                  <p className="text-foreground capitalize">{address.accommodationType}</p>
                </div>
              )}
              
              {/* Dirección completa */}
              <div className="flex items-start space-x-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">📍 Dirección:</span>
                <div>
                  <p className="text-foreground font-medium">{address?.streetAddress}</p>
                  {address?.streetAddress2 && (
                    <p className="text-foreground">{address.streetAddress2}</p>
                  )}
                  <p className="text-foreground">{address?.cityArea}</p>
                  {address?.postalCode && (
                    <p className="text-foreground font-mono">Código Postal: {address.postalCode}</p>
                  )}
                </div>
              </div>
              
              {/* Hotel/Airbnb */}
              {address?.hotelAirbnbName && address.hotelAirbnbName !== '-' && (
                <div className="flex items-start space-x-2">
                  <span className="text-muted-foreground font-medium min-w-[80px]">🏨 Hotel/Airbnb:</span>
                  <p className="text-foreground font-medium">{address.hotelAirbnbName}</p>
                </div>
              )}
              
              {/* Contacto */}
              <div className="flex items-start space-x-2">
                <span className="text-muted-foreground font-medium min-w-[80px]">📞 Contacto:</span>
                <p className="text-foreground font-semibold">{address?.contactNumber}</p>
              </div>
              
              {/* Instrucciones adicionales */}
              {address?.additionalInstructions && (
                <div className="flex items-start space-x-2">
                  <span className="text-muted-foreground font-medium min-w-[80px]">ℹ️ Instrucciones:</span>
                  <p className="text-foreground">{address.additionalInstructions}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Información de entrega en Guatemala */}
        {tripDates?.messenger_pickup_info && (
          <div className="bg-info-muted border border-info-border rounded-md p-3">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-info text-sm">🚚</span>
              <span className="text-sm font-semibold text-info">Entrega en Guatemala</span>
            </div>
            
            <div className="text-sm space-y-2">
              {tripDates.delivery_method === 'mensajero' ? (
                <div>
                  <p className="text-info-foreground"><strong>Método:</strong> Entrega por mensajero</p>
                  <p className="text-info-foreground"><strong>Dirección:</strong> {tripDates.messenger_pickup_info.address}</p>
                  <p className="text-info-foreground"><strong>Contacto:</strong> {tripDates.messenger_pickup_info.contactNumber}</p>
                  {tripDates.messenger_pickup_info.instructions && (
                    <p className="text-info-foreground"><strong>Instrucciones:</strong> {tripDates.messenger_pickup_info.instructions}</p>
                  )}
                </div>
              ) : (
                <p className="text-info-foreground">
                  El viajero entregará los paquetes directamente en la oficina de Favorón.
                </p>
              )}
            </div>
          </div>
        )}
        
        <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
          💡 <strong>Próximos pasos:</strong> Una vez enviado el producto, sube los documentos de compra y tracking en la sección correspondiente.
        </div>
      </div>
    );
  };

  const renderPaymentUpload = () => {
    if (!['quote_accepted', 'awaiting_payment'].includes(pkg.status)) return null;
    return (
      <div className="mt-4">
        <PaymentReceiptUpload 
          pkg={pkg} 
          onUploadComplete={(updatedPkg) => {
            // Actualizar solo este paquete específico sin hacer refresh completo
            onPackageUpdate?.(updatedPkg);
          }} 
        />
      </div>
    );
  };

  return <>
      {renderQuoteInfo()}
      {renderPaymentUpload()}
      {pkg.status === 'payment_confirmed' && renderTravelerAddress()}
    </>;
};
export default ShopperPackageInfo;