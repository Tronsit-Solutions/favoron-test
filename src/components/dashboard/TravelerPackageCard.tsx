
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, DollarSign, User, Package } from "lucide-react";

interface TravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
}

const TravelerPackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote
}: TravelerPackageCardProps) => {
  return (
    <Card key={pkg.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg flex items-center space-x-2">
              <Package className="h-5 w-5 text-primary" />
              <span>
                {pkg.products && pkg.products.length > 0 
                  ? `${pkg.products.length > 1 ? `${pkg.products.length} productos` : pkg.products[0].itemDescription}`
                  : pkg.itemDescription || 'Pedido'
                }
              </span>
            </CardTitle>
            <CardDescription>
              {pkg.products && pkg.products.length > 0 ? (
                <>
                  Total estimado: ${pkg.products.reduce((sum: number, product: any) => sum + parseFloat(product.estimatedPrice || 0), 0).toFixed(2)}
                  {pkg.deliveryDeadline && (
                    <> • Fecha límite: {new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}</>
                  )}
                </>
              ) : (
                <>
                  Precio estimado: ${pkg.estimatedPrice}
                  {pkg.deliveryDeadline && (
                    <> • Fecha límite: {new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}</>
                  )}
                </>
              )}
            </CardDescription>
          </div>
          {getStatusBadge(pkg.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Package details */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 mb-2">
              <Package className="h-4 w-4 text-blue-600 mt-0.5" />
              <p className="text-sm font-medium text-blue-800">Detalles del pedido:</p>
            </div>
            <div className="text-sm text-blue-700 ml-6 space-y-3">
              <div>
                <p><strong>Origen:</strong> {pkg.purchaseOrigin}</p>
                <p><strong>Destino:</strong> {pkg.packageDestination}</p>
              </div>
              
              {/* Display all products */}
              <div className="space-y-2">
                <p className="font-medium">Productos solicitados:</p>
                {pkg.products ? (
                  pkg.products.map((product: any, index: number) => (
                    <div key={index} className="bg-white/50 border border-blue-100 rounded p-2 space-y-1">
                      <p><strong>Producto {index + 1}:</strong> {product.itemDescription}</p>
                      <p><strong>Precio estimado:</strong> ${product.estimatedPrice}</p>
                      <p><strong>Link:</strong> <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">Ver producto</a></p>
                    </div>
                  ))
                ) : (
                  // Fallback for old single-product format
                  <div className="bg-white/50 border border-blue-100 rounded p-2 space-y-1">
                    <p><strong>Producto:</strong> {pkg.itemDescription}</p>
                    <p><strong>Precio estimado:</strong> ${pkg.estimatedPrice}</p>
                    {pkg.itemLink && (
                      <p><strong>Link:</strong> <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline break-all">Ver producto</a></p>
                    )}
                  </div>
                )}
              </div>

              {pkg.additionalNotes && (
                <div>
                  <p><strong>Notas adicionales:</strong> {pkg.additionalNotes}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shopper information */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <div className="flex items-start space-x-2 mb-2">
              <User className="h-4 w-4 text-green-600 mt-0.5" />
              <p className="text-sm font-medium text-green-800">Información del shopper:</p>
            </div>
            <div className="text-sm text-green-700 ml-6">
              <p>Solicitante: Usuario #{pkg.userId}</p>
              <p>Creado el: {new Date(pkg.createdAt).toLocaleDateString('es-GT')}</p>
            </div>
          </div>

          {/* Show quote information if sent */}
          {pkg.quote && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm font-medium text-yellow-800 mb-1">Tu cotización enviada:</p>
              <p className="text-sm text-yellow-700">
                Servicio: ${parseFloat(pkg.quote.price || 0).toFixed(2)}
                {parseFloat(pkg.quote.serviceFee || 0) > 0 && ` + Adicionales: $${parseFloat(pkg.quote.serviceFee || 0).toFixed(2)}`}
              </p>
              {pkg.quote.message && (
                <p className="text-sm text-yellow-600 mt-1">Mensaje: "{pkg.quote.message}"</p>
              )}
              <p className="text-xs text-yellow-600 mt-2">
                Estado: {pkg.status === 'quote_accepted' ? 'Aceptada ✅' : 'Esperando respuesta ⏳'}
              </p>
            </div>
          )}

          {/* Delivery address if confirmed */}
          {pkg.confirmedDeliveryAddress && (
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
              <div className="flex items-start space-x-2 mb-2">
                <MapPin className="h-4 w-4 text-purple-600 mt-0.5" />
                <p className="text-sm font-medium text-purple-800">Dirección de entrega confirmada:</p>
              </div>
              <div className="text-sm text-purple-700 ml-6">
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
          <div className="flex flex-wrap gap-2">
            {pkg.status === 'matched' && (
              <Button 
                size="sm"
                onClick={() => onQuote(pkg, 'traveler')}
                className="flex items-center space-x-2"
              >
                <DollarSign className="h-4 w-4" />
                <span>Enviar Cotización</span>
              </Button>
            )}

            {pkg.status === 'quote_sent' && (
              <div className="text-sm text-muted-foreground">
                Cotización enviada - Esperando respuesta del shopper
              </div>
            )}

            {pkg.status === 'quote_accepted' && (
              <div className="text-sm text-green-600 font-medium">
                ✅ Cotización aceptada - Esperando confirmación de dirección
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TravelerPackageCard;
