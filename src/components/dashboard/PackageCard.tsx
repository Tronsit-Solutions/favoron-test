
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";

interface PackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onConfirmAddress: (pkg: any) => void;
  onUploadDocument: (packageId: number, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: any) => void;
  viewMode?: 'shopper' | 'traveler';
}

const PackageCard = ({ 
  pkg, 
  getStatusBadge, 
  onQuote, 
  onConfirmAddress, 
  onUploadDocument,
  onEditPackage,
  viewMode = 'shopper'
}: PackageCardProps) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
  };

  const renderTravelerAddress = () => {
    if (!pkg.travelerAddress) return null;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
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

  const renderDeliveryAddress = () => {
    if (!pkg.confirmedDeliveryAddress) return null;
    
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
          <p className="text-sm font-medium text-green-800">Dirección de envío confirmada:</p>
        </div>
        <div className="text-sm text-green-700 ml-6">
          <p>{pkg.confirmedDeliveryAddress.streetAddress}</p>
          <p>{pkg.confirmedDeliveryAddress.cityArea}</p>
          {pkg.confirmedDeliveryAddress.hotelAirbnbName && (
            <p>{pkg.confirmedDeliveryAddress.hotelAirbnbName}</p>
          )}
          <p>📞 {pkg.confirmedDeliveryAddress.contactNumber}</p>
        </div>
      </div>
    );
  };

  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;
    
    const totalPrice = parseFloat(pkg.quote.totalPrice || 0);
    
    return (
      <div className="bg-shopper-hover border border-shopper/20 rounded-lg p-3">
        <p className="text-sm font-medium text-shopper mb-1">Cotización recibida:</p>
        <p className="text-sm font-medium text-shopper text-lg">
          Total: ${totalPrice.toFixed(2)}
        </p>
        <p className="text-xs text-shopper mt-1">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {pkg.quote.message && (
          <p className="text-sm text-shopper mt-2">"{pkg.quote.message}"</p>
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

  // Special layout for payment pending state
  if (pkg.status === 'quote_accepted' && viewMode === 'shopper') {
    return (
      <Card key={pkg.id} className="border-orange-200 bg-orange-50/30">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
            <CardTitle className="text-lg">
              {pkg.products && pkg.products.length > 0 
                ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                : pkg.itemDescription
              }
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
        <CardContent>
          {/* PAYMENT SECTION - PROMINENT AND VISIBLE */}
          <div className="mb-6">
            <PaymentUpload 
              packageId={pkg.id}
              onUpload={handlePaymentUpload}
            />
          </div>
          
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
                  <div className="bg-shopper-hover border border-shopper/20 rounded-lg p-2">
                    <p className="text-sm font-medium text-shopper">
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
              
              {renderQuoteInfo()}
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
            </div>
          </div>
        </CardContent>
        
        {/* Edit Modal */}
        <EditPackageModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={handleEditSubmit}
          packageData={pkg}
        />
      </Card>
    );
  }

  return (
    <Card key={pkg.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg">
              {pkg.products && pkg.products.length > 0 
                ? `${pkg.products.length} producto${pkg.products.length > 1 ? 's' : ''}: ${pkg.products[0].itemDescription}${pkg.products.length > 1 ? ' y más...' : ''}`
                : pkg.itemDescription
              }
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
                <div className="bg-shopper-hover border border-shopper/20 rounded-lg p-2">
                  <p className="text-sm font-medium text-shopper">
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

            {/* Show delivery address if confirmed (for later stages) */}
            {renderDeliveryAddress()}

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
      
      {/* Edit Modal */}
      <EditPackageModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        packageData={pkg}
      />
    </Card>
  );
};

export default PackageCard;
