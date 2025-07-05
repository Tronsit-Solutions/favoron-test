
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, Calendar, Clock, MapPin, Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";

interface CollapsiblePackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onConfirmAddress: (pkg: any) => void;
  onUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: any) => void;
  viewMode?: 'shopper' | 'traveler';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote, 
  onConfirmAddress, 
  onUploadDocument,
  onEditPackage,
  viewMode = 'shopper'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
  };

  const renderTravelerAddress = () => {
    if (!pkg.travelerAddress) return null;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <Package className="h-4 w-4 text-green-600 mt-0.5" />
          <p className="text-sm font-medium text-green-800">Dirección del viajero para envío:</p>
        </div>
        <div className="text-sm text-green-700 ml-6">
          <p>{pkg.travelerAddress.streetAddress}</p>
          <p>{pkg.travelerAddress.cityArea}</p>
          {pkg.travelerAddress.hotelAirbnbName && (
            <p>{pkg.travelerAddress.hotelAirbnbName}</p>
          )}
          <p>📞 {pkg.travelerAddress.contactNumber}</p>
        </div>
      </div>
    );
  };

  // NEW: Render key shipping dates for shopper after payment confirmation
  const renderShippingDates = () => {
    if (!pkg.matchedTripDates || viewMode !== 'shopper' || pkg.status !== 'payment_confirmed') return null;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-blue-600 mt-0.5" />
          <p className="text-sm font-medium text-blue-800">Fechas importantes para tu envío:</p>
        </div>
        <div className="text-sm text-blue-700 ml-6 space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span><strong>Primer día para enviar:</strong> {new Date(pkg.matchedTripDates.firstDayPackages).toLocaleDateString('es-GT')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span><strong>Último día para enviar:</strong> {new Date(pkg.matchedTripDates.lastDayPackages).toLocaleDateString('es-GT')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span><strong>Entrega en oficina Favorón:</strong> {new Date(pkg.matchedTripDates.deliveryDate).toLocaleDateString('es-GT')}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;
    
    // Calculate total with Favorón fee (40%)
    const basePrice = parseFloat(pkg.quote.price || 0);
    const additionalFee = parseFloat(pkg.quote.serviceFee || 0);
    const subtotal = basePrice + additionalFee;
    const totalWithFavoronFee = pkg.quote.totalPrice ? parseFloat(pkg.quote.totalPrice) : subtotal * 1.4;
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-blue-800">Cotización recibida:</p>
          <p className="text-lg font-bold text-blue-900">${totalWithFavoronFee.toFixed(2)}</p>
        </div>
        <p className="text-xs text-blue-600">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {pkg.quote.message && (
          <p className="text-sm text-blue-600 mt-2 italic">"{pkg.quote.message}"</p>
        )}
      </div>
    );
  };

  const renderActionButtons = () => {
    const canEdit = viewMode === 'shopper' && ['pending_approval', 'approved'].includes(pkg.status);
    
    return (
      <div className="flex flex-wrap gap-2">
        {/* Shopper actions */}
        {viewMode === 'shopper' && (
          <>
            {pkg.status === 'quote_sent' && pkg.quote && (
              <Button 
                size="sm"
                onClick={() => onQuote(pkg, 'shopper')}
              >
                Ver y Responder Cotización
              </Button>
            )}
            
            {/* Edit button for early stage packages */}
            {canEdit && onEditPackage && (
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowEditModal(true)}
              >
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            )}
          </>
        )}

        {/* Traveler actions - only for sending quotes */}
        {viewMode === 'traveler' && pkg.status === 'matched' && (
          <Button 
            size="sm"
            onClick={() => onQuote(pkg, 'traveler')}
          >
            Enviar Cotización
          </Button>
        )}
      </div>
    );
  };

  const handleEditSubmit = (editedData: any) => {
    if (onEditPackage) {
      onEditPackage(editedData);
    }
    setShowEditModal(false);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <span>
                    {pkg.products && pkg.products.length > 0 
                      ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                      : pkg.itemDescription
                    }
                  </span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>
                  {pkg.products && pkg.products.length > 0 
                    ? `Total estimado: $${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`
                    : `Precio estimado: ${pkg.estimatedPrice} • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}`
                  }
                </CardDescription>
              </div>
              {getStatusBadge(pkg.status)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* PRIORITY ACTIONS SECTION - Always visible at top */}
            {(pkg.status === 'quote_sent' || pkg.status === 'quote_accepted' || pkg.status === 'payment_confirmed') && viewMode === 'shopper' && (
              <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-primary/10 border-l-4 border-primary rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 space-y-3">
                    {pkg.status === 'quote_sent' && pkg.quote && (
                      <>
                        <p className="text-sm font-medium text-primary">¡Tienes una cotización pendiente!</p>
                        <p className="text-xs text-muted-foreground">Revisa y responde la cotización del viajero.</p>
                        <Button 
                          size="sm"
                          onClick={() => onQuote(pkg, 'shopper')}
                          className="mt-2"
                        >
                          Ver y Responder Cotización
                        </Button>
                      </>
                    )}
                    {pkg.status === 'quote_accepted' && (
                      <>
                        <p className="text-sm font-medium text-primary">¡Cotización aceptada! Sube tu comprobante de pago</p>
                        <p className="text-xs text-muted-foreground">El viajero está esperando la confirmación de tu pago.</p>
                      </>
                    )}
                    {pkg.status === 'payment_confirmed' && (
                      <>
                        <p className="text-sm font-medium text-primary">¡Pago confirmado! Envía el paquete</p>
                        <p className="text-xs text-muted-foreground">Compra y envía el paquete al viajero usando la dirección proporcionada.</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {/* Multiple products display */}
                {pkg.products && pkg.products.length > 0 ? (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Productos solicitados ({pkg.products.length}):</p>
                    {pkg.products.map((product: any, index: number) => (
                      <div key={index} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">Producto #{index + 1}</span>
                          <span className="text-sm text-muted-foreground">${product.estimatedPrice}</span>
                        </div>
                        <p className="text-sm">{product.itemDescription}</p>
                        {product.itemLink && (
                          <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                            Ver producto
                          </a>
                        )}
                      </div>
                    ))}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                      <p className="text-sm font-medium text-blue-800">
                        Total estimado: ${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ) : (
                  // Single product display (backward compatibility)
                  <p className="text-sm">
                    <strong>Link del producto:</strong>{' '}
                    <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      Ver producto
                    </a>
                  </p>
                )}
                
                {/* Show quote information */}
                {renderQuoteInfo()}

                {/* Show traveler address if payment is confirmed */}
                {pkg.status === 'payment_confirmed' && renderTravelerAddress()}

                {/* NEW: Show shipping dates after payment confirmation */}
                {renderShippingDates()}

                {/* Action buttons based on view mode and status */}
                {renderActionButtons()}

                {pkg.additionalNotes && (
                  <p className="text-sm">
                    <strong>Notas adicionales:</strong> {pkg.additionalNotes}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
                </p>
              </div>

              <div className="space-y-4">
                <PackageStatusTimeline currentStatus={pkg.status} />
                
                {/* Show payment upload component after quote acceptance - PROMINENT */}
                {pkg.status === 'quote_accepted' && viewMode === 'shopper' && (
                  <div className="order-first md:order-none bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-blue-800">💳 Subir comprobante de pago</p>
                      <p className="text-xs text-blue-600">Sube tu comprobante para que el viajero proceda con la compra.</p>
                    </div>
                    <PaymentUpload 
                      packageId={pkg.id}
                      onUpload={handlePaymentUpload}
                    />
                  </div>
                )}
                
                {/* Show upload documents after payment confirmation */}
                {pkg.status === 'payment_confirmed' && viewMode === 'shopper' && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-orange-800">📋 Subir documentos de compra</p>
                      <p className="text-xs text-orange-600">¿Ya compraste el producto? Sube el comprobante y tracking aquí.</p>
                    </div>
                    <UploadDocuments 
                      packageId={pkg.id}
                      currentStatus={pkg.status}
                      onUpload={(type, data) => onUploadDocument(pkg.id, type, data)}
                    />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
      
      {/* Edit Modal */}
      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        packageData={pkg}
      />
    </Collapsible>
  );
};

export default CollapsiblePackageCard;
