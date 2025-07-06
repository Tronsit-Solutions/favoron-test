
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";
import OrderStepsFlow from "@/components/dashboard/OrderStepsFlow";
import AddressDisplay from "@/components/ui/address-display";
import StatusAlert from "@/components/ui/status-alert";

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
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  
  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
    setShowPaymentUpload(false);
  };

  const renderTravelerAddress = () => {
    if (!pkg.travelerAddress) return null;
    
    return (
      <AddressDisplay
        address={pkg.travelerAddress}
        title="Dirección del viajero para envío:"
        variant="success"
      />
    );
  };

  const renderDeliveryAddress = () => {
    if (!pkg.confirmedDeliveryAddress) return null;
    
    return (
      <AddressDisplay
        address={pkg.confirmedDeliveryAddress}
        title="Dirección de envío confirmada:"
        variant="success"
      />
    );
  };

  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;
    
    const totalPrice = parseFloat(pkg.quote.totalPrice || 0);
    
    return (
      <StatusAlert variant="info" title="Cotización recibida">
        <div className="space-y-2">
          <p className="text-lg font-semibold">
            Total: ${totalPrice.toFixed(2)}
          </p>
          <p className="text-xs opacity-90">
            Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
          </p>
          {pkg.quote.message && (
            <p className="italic">"{pkg.quote.message}"</p>
          )}
        </div>
      </StatusAlert>
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
                variant="shopper"
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
      <Card key={pkg.id} className="border-warning-border bg-warning-muted/30">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
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
            <div className="ml-4">
              {getStatusBadge(pkg.status)}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* PAYMENT SECTION - PROMINENT AND VISIBLE */}
          <div className="mb-6">
            <PaymentUpload 
              packageId={pkg.id}
              onUpload={handlePaymentUpload}
              currentPaymentReceipt={pkg.paymentReceipt}
              isPaymentApproved={pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered'}
            />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {/* Multiple products display */}
              {pkg.products && pkg.products.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-sm font-medium">Productos solicitados ({pkg.products.length}):</p>
                  <div className="space-y-3">
                    {pkg.products.map((product: any, index: number) => (
                      <Card key={index} className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium">Producto #{index + 1}</span>
                          <span className="text-sm text-muted-foreground">${product.estimatedPrice}</span>
                        </div>
                        <p className="text-sm mb-2">{product.itemDescription}</p>
                        {product.itemLink && (
                          <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                            Ver producto
                          </a>
                        )}
                      </Card>
                    ))}
                  </div>
                  <StatusAlert variant="info">
                    <p className="font-medium">
                      Total estimado: ${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}
                    </p>
                  </StatusAlert>
                </div>
              ) : (
                // Single product display (backward compatibility)
                <div className="text-sm">
                  <strong>Link del producto:</strong>{' '}
                  <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                    Ver producto
                  </a>
                </div>
              )}
              
              {renderQuoteInfo()}
              {renderActionButtons()}

              {pkg.additionalNotes && (
                <div className="text-sm">
                  <strong>Notas adicionales:</strong> {pkg.additionalNotes}
                </div>
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
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
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
          <div className="ml-4">
            {getStatusBadge(pkg.status)}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            {/* Multiple products display */}
            {pkg.products && pkg.products.length > 0 ? (
              <div className="space-y-3">
                <p className="text-sm font-medium">Productos solicitados ({pkg.products.length}):</p>
                <div className="space-y-3">
                  {pkg.products.map((product: any, index: number) => (
                    <Card key={index} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">Producto #{index + 1}</span>
                        <span className="text-sm text-muted-foreground">${product.estimatedPrice}</span>
                      </div>
                      <p className="text-sm mb-2">{product.itemDescription}</p>
                      {product.itemLink && (
                        <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                          Ver producto
                        </a>
                      )}
                    </Card>
                  ))}
                </div>
                <StatusAlert variant="info">
                  <p className="font-medium">
                    Total estimado: ${pkg.products.reduce((sum: number, p: any) => sum + parseFloat(p.estimatedPrice || 0), 0).toFixed(2)}
                  </p>
                </StatusAlert>
              </div>
            ) : (
              // Single product display (backward compatibility)
              <div className="text-sm">
                <strong>Link del producto:</strong>{' '}
                <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  Ver producto
                </a>
              </div>
            )}
            
            {/* Show quote information */}
            {renderQuoteInfo()}

            {/* New Step-by-Step Flow for Shoppers */}
            <OrderStepsFlow 
              pkg={pkg}
              viewMode={viewMode}
              onUploadDocument={onUploadDocument}
            />

            {/* Action buttons based on view mode and status */}
            {renderActionButtons()}

            {pkg.additionalNotes && (
              <div className="text-sm">
                <strong>Notas adicionales:</strong> {pkg.additionalNotes}
              </div>
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
};

export default PackageCard;
