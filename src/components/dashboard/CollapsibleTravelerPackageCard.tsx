
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, DollarSign, User, MapPin, CheckCircle } from "lucide-react";
import TravelerPackageTimeline from "./TravelerPackageTimeline";
import PackageReceiptConfirmation from "../PackageReceiptConfirmation";

interface CollapsibleTravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onConfirmReceived: (packageId: number, photo?: string) => void;
}

const CollapsibleTravelerPackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote,
  onConfirmReceived
}: CollapsibleTravelerPackageCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleConfirmReceived = (photo?: string) => {
    onConfirmReceived(pkg.id, photo);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <Package className="h-5 w-5 text-primary" />
                  <span>{pkg.itemDescription}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>
                  Precio estimado: ${pkg.estimatedPrice} • Fecha límite: {new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}
                </CardDescription>
              </div>
              {getStatusBadge(pkg.status)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            <div className="space-y-4">
              {/* Traveler Package Timeline - Show for relevant statuses */}
              {(['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status)) && (
                <TravelerPackageTimeline currentStatus={pkg.status} />
              )}

              {/* Package details */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start space-x-2 mb-2">
                  <Package className="h-4 w-4 text-blue-600 mt-0.5" />
                  <p className="text-sm font-medium text-blue-800">Detalles del pedido:</p>
                </div>
                <div className="text-sm text-blue-700 ml-6 space-y-1">
                  <p><strong>Origen:</strong> {pkg.purchaseOrigin}</p>
                  <p><strong>Destino:</strong> {pkg.packageDestination}</p>
                  <p><strong>Link:</strong> <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Ver producto</a></p>
                  {pkg.additionalNotes && (
                    <p><strong>Notas:</strong> {pkg.additionalNotes}</p>
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
                    Servicio: ${pkg.quote.price}
                    {pkg.quote.serviceFee && ` + Adicionales: $${pkg.quote.serviceFee}`}
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
                    ✅ Cotización aceptada - Esperando confirmación de pago
                  </div>
                )}

                {pkg.status === 'payment_confirmed' && (
                  <div className="text-sm text-blue-600 font-medium">
                    💳 Pago confirmado - Esperando que el shopper envíe el paquete
                  </div>
                )}

                {pkg.status === 'in_transit' && (
                  <div className="space-y-2">
                    <div className="text-sm text-orange-600 font-medium">
                      🚚 Paquete en tránsito - El shopper ya lo envió
                    </div>
                    <Button 
                      size="sm"
                      onClick={() => setShowConfirmationModal(true)}
                      className="flex items-center space-x-2"
                      variant="outline"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Confirmar que recibí el paquete</span>
                    </Button>
                  </div>
                )}

                {pkg.status === 'received_by_traveler' && (
                  <div className="text-sm text-green-600 font-medium">
                    ✅ Paquete recibido y confirmado
                    {pkg.travelerConfirmation?.confirmedAt && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Confirmado el: {new Date(pkg.travelerConfirmation.confirmedAt).toLocaleDateString('es-GT')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <PackageReceiptConfirmation
        isOpen={showConfirmationModal}
        onClose={() => setShowConfirmationModal(false)}
        onConfirm={handleConfirmReceived}
        packageName={pkg.itemDescription}
      />
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;
