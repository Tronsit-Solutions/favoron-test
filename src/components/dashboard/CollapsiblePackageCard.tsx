
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
    
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-800 mb-1">Cotización recibida:</p>
        <p className="text-sm text-blue-700">
          Servicio: ${pkg.quote.price}
          {pkg.quote.serviceFee && ` + Adicionales: $${pkg.quote.serviceFee}`}
        </p>
        {pkg.quote.message && (
          <p className="text-sm text-blue-600 mt-1">"{pkg.quote.message}"</p>
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
                
                {/* Show payment upload component after quote acceptance - LEFT SIDE AND PROMINENT */}
                {pkg.status === 'quote_accepted' && viewMode === 'shopper' && (
                  <div className="order-first md:order-none">
                    <PaymentUpload 
                      packageId={pkg.id}
                      onUpload={handlePaymentUpload}
                    />
                  </div>
                )}
                
                {/* Show upload documents after payment confirmation */}
                {pkg.status === 'payment_confirmed' && viewMode === 'shopper' && (
                  <UploadDocuments 
                    packageId={pkg.id}
                    currentStatus={pkg.status}
                    onUpload={(type, data) => onUploadDocument(pkg.id, type, data)}
                  />
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
