
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Edit, FileText, CheckCircle, DollarSign, Package, Upload } from "lucide-react";
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
  const [showPaymentUpload, setShowPaymentUpload] = useState(false);
  const [showPurchaseUpload, setShowPurchaseUpload] = useState(false);
  const [showTrackingForm, setShowTrackingForm] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');
  const [trackingNotes, setTrackingNotes] = useState('');
  
  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
    setShowPaymentUpload(false);
  };

  const handlePurchaseUpload = () => {
    // Simulate file upload for purchase confirmation
    const purchaseData = {
      filename: `purchase_confirmation_${pkg.id}_${Date.now()}.pdf`,
      uploadedAt: new Date().toISOString(),
      type: 'confirmation'
    };
    onUploadDocument(pkg.id, 'confirmation', purchaseData);
    setShowPurchaseUpload(false);
  };

  const handleTrackingSubmit = () => {
    if (!trackingNumber.trim()) return;
    
    const trackingData = {
      trackingNumber: trackingNumber.trim(),
      trackingUrl: trackingUrl.trim() || null,
      notes: trackingNotes.trim() || null,
      timestamp: new Date().toISOString()
    };
    onUploadDocument(pkg.id, 'tracking', trackingData);
    setShowTrackingForm(false);
    setTrackingNumber('');
    setTrackingUrl('');
    setTrackingNotes('');
  };

  const openTrackingForm = () => {
    if (pkg.trackingInfo) {
      // Pre-fill form with existing data when editing
      setTrackingNumber(pkg.trackingInfo.trackingNumber || '');
      setTrackingUrl(pkg.trackingInfo.trackingUrl || '');
      setTrackingNotes(pkg.trackingInfo.notes || '');
    }
    setShowTrackingForm(true);
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
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm font-medium text-blue-800 mb-1">Cotización recibida:</p>
        <p className="text-sm font-medium text-blue-800 text-lg">
          Total: ${totalPrice.toFixed(2)}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {pkg.quote.message && (
          <p className="text-sm text-blue-600 mt-2">"{pkg.quote.message}"</p>
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
              currentPaymentReceipt={pkg.paymentReceipt}
              isPaymentApproved={pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered'}
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

            {/* Shopper Actions - Always show action cards for transparency */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">Información enviada por ti:</p>
              
              {/* Payment Receipt Card - Always visible */}
              <Card className={pkg.paymentReceipt ? "border-green-200 bg-green-50/30" : "border-gray-200 bg-gray-50/30"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <DollarSign className={`h-4 w-4 ${pkg.paymentReceipt ? 'text-green-600' : 'text-gray-400'}`} />
                    <span>Comprobante de Pago</span>
                    {pkg.paymentReceipt && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pkg.paymentReceipt ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-green-700">
                          📄 {pkg.paymentReceipt.filename || 'payment_receipt.pdf'}
                        </p>
                        <p className="text-xs text-green-600">
                          Subido: {new Date(pkg.paymentReceipt.uploadedAt).toLocaleDateString('es-GT')}
                        </p>
                        {(pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered') && (
                          <p className="text-xs text-blue-600 font-medium">✅ Aprobado por administrador</p>
                        )}
                      </div>
                      {!(pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered') && (
                        <Button size="sm" variant="outline" onClick={() => setShowPaymentUpload(true)}>
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </Button>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">No se ha subido comprobante de pago</p>
                      <Button size="sm" variant="outline" onClick={() => setShowPaymentUpload(true)}>
                        <Upload className="h-3 w-3 mr-1" />
                        Subir
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Purchase Confirmation Card - Always visible */}
              <Card className={pkg.purchaseConfirmation ? "border-blue-200 bg-blue-50/30" : "border-gray-200 bg-gray-50/30"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <FileText className={`h-4 w-4 ${pkg.purchaseConfirmation ? 'text-blue-600' : 'text-gray-400'}`} />
                    <span>Comprobante de Compra</span>
                    {pkg.purchaseConfirmation && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pkg.purchaseConfirmation ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs text-blue-700">
                          📄 {pkg.purchaseConfirmation.filename || 'purchase_confirmation.pdf'}
                        </p>
                        <p className="text-xs text-blue-600">
                          Subido: {new Date(pkg.purchaseConfirmation.uploadedAt).toLocaleDateString('es-GT')}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => setShowPurchaseUpload(true)}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">No se ha subido comprobante de compra</p>
                      <Button size="sm" variant="outline" onClick={() => handlePurchaseUpload()}>
                        <Upload className="h-3 w-3 mr-1" />
                        Subir
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tracking Information Card - Always visible */}
              <Card className={pkg.trackingInfo ? "border-orange-200 bg-orange-50/30" : "border-gray-200 bg-gray-50/30"}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Package className={`h-4 w-4 ${pkg.trackingInfo ? 'text-orange-600' : 'text-gray-400'}`} />
                    <span>Información de Seguimiento</span>
                    {pkg.trackingInfo && <CheckCircle className="h-4 w-4 text-green-600" />}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {pkg.trackingInfo ? (
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-orange-700">
                          📦 <span className="font-mono">{pkg.trackingInfo.trackingNumber}</span>
                        </p>
                        <p className="text-xs text-orange-600">
                          Agregado: {new Date(pkg.trackingInfo.timestamp).toLocaleDateString('es-GT')}
                        </p>
                        {pkg.trackingInfo.trackingUrl && (
                          <a 
                            href={pkg.trackingInfo.trackingUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-xs text-primary hover:underline block"
                          >
                            🔗 Seguir paquete
                          </a>
                        )}
                        {pkg.trackingInfo.notes && (
                          <p className="text-xs text-orange-600">
                            Notas: {pkg.trackingInfo.notes}
                          </p>
                        )}
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openTrackingForm()}>
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-600">No se ha agregado información de seguimiento</p>
                      <Button size="sm" variant="outline" onClick={() => openTrackingForm()}>
                        <Upload className="h-3 w-3 mr-1" />
                        Agregar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Inline Forms for Actions */}
            {/* Payment Upload Form */}
            {showPaymentUpload && (
              <div className="mt-4">
                <PaymentUpload 
                  packageId={pkg.id}
                  onUpload={handlePaymentUpload}
                  currentPaymentReceipt={pkg.paymentReceipt}
                  isPaymentApproved={pkg.status === 'payment_confirmed' || pkg.status === 'in_transit' || pkg.status === 'delivered'}
                />
              </div>
            )}

            {/* Tracking Form */}
            {showTrackingForm && (
              <Card className="mt-4 border-orange-200 bg-orange-50/30">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center space-x-2">
                    <Package className="h-4 w-4 text-orange-600" />
                    <span>Agregar/Editar Información de Seguimiento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="trackingNumber">Número de seguimiento *</Label>
                    <Input
                      id="trackingNumber"
                      value={trackingNumber}
                      onChange={(e) => setTrackingNumber(e.target.value)}
                      placeholder="Ej: 1234567890"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trackingUrl">URL de seguimiento (opcional)</Label>
                    <Input
                      id="trackingUrl"
                      value={trackingUrl}
                      onChange={(e) => setTrackingUrl(e.target.value)}
                      placeholder="https://tracking.carrier.com/track/..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="trackingNotes">Notas adicionales</Label>
                    <Textarea
                      id="trackingNotes"
                      value={trackingNotes}
                      onChange={(e) => setTrackingNotes(e.target.value)}
                      placeholder="Información adicional sobre el envío..."
                      rows={3}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleTrackingSubmit} 
                      disabled={!trackingNumber.trim()}
                      size="sm"
                    >
                      Guardar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowTrackingForm(false);
                        setTrackingNumber('');
                        setTrackingUrl('');
                        setTrackingNotes('');
                      }}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

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
