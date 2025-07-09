
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PaymentUpload from "@/components/PaymentUpload";
import EditPackageModal from "@/components/EditPackageModal";
import ShopperPackagePriorityActions from "@/components/dashboard/shopper/ShopperPackagePriorityActions";
import ShopperPackageDetails from "@/components/dashboard/shopper/ShopperPackageDetails";
import ShopperPackageInfo from "@/components/dashboard/shopper/ShopperPackageInfo";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { usePackageActions } from "@/hooks/usePackageActions";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package, UserType, DocumentType } from "@/types";

interface CollapsiblePackageCardProps {
  pkg: Package;
  packages: Package[];
  setPackages: (packages: Package[]) => void;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onEditPackage?: (packageData: Package) => void;
  viewMode?: 'user';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  packages,
  setPackages,
  onQuote, 
  onConfirmAddress,
  onEditPackage,
  viewMode = 'user'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [showEditModal, setShowEditModal] = React.useState(false);
  
  const { getStatusBadge } = useStatusHelpers();
  const { handleUploadDocument } = usePackageActions(packages, setPackages);

  // Determine if package needs action (for users)
  const needsAction = viewMode === 'user' && (
    pkg.status === 'quote_sent' || // needs to accept/reject quote
    pkg.status === 'quote_accepted' || // needs to make payment
    (pkg.status === 'payment_confirmed' && !pkg.purchase_confirmation) // needs to upload documents
  );

  const handlePaymentUpload = (paymentData: any) => {
    handleUploadDocument(pkg.id.toString(), 'payment_receipt', paymentData);
  };

  // Removed individual render functions - now handled by dedicated components

  const renderActionButtons = () => {
    const canEdit = viewMode === 'user' && ['pending_approval', 'approved'].includes(pkg.status);
    
    return (
      <div className="flex flex-wrap gap-2">
        {viewMode === 'user' && canEdit && onEditPackage && (
          <Button 
            size="sm"
            variant="outline"
            onClick={() => setShowEditModal(true)}
          >
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        
        {viewMode === 'user' && pkg.status === 'matched' && (
          <Button 
            size="sm"
            onClick={() => onQuote(pkg, 'user')}
          >
            Enviar Cotización
          </Button>
        )}
      </div>
    );
  };

  const handleEditSubmit = (editedData: Package) => {
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
                    {pkg.item_description || 'Sin descripción'}
                  </span>
                  {needsAction && (
                    <NotificationBadge count={1} className="ml-2" />
                  )}
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>
                  Precio estimado: ${pkg.estimated_price} • Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}
                </CardDescription>
              </div>
              {getStatusBadge(pkg.status)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* Priority Actions Section */}
            {viewMode === 'user' && (
              <ShopperPackagePriorityActions 
                pkg={pkg}
                onQuote={onQuote}
              />
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {/* Show payment instructions and upload component after quote acceptance - PROMINENT IN LEFT COLUMN */}
                {pkg.status === 'quote_accepted' && viewMode === 'user' && (
                  <div className="space-y-4 mb-4">
                    {/* Payment Instructions */}
                    <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 shadow-sm">
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-primary mb-2">💵 Instrucciones de pago</p>
                        <p className="text-xs text-muted-foreground mb-3">
                          Por favor realiza el pago correspondiente a tu cotización a la siguiente cuenta:
                        </p>
                      </div>
                      
                      <div className="bg-background/80 rounded-md p-3 border border-border mb-4">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between">
                            <span className="font-medium">Nombre de la cuenta:</span>
                            <span className="text-black font-semibold">Favorón S.A.</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Número de cuenta:</span>
                            <span className="text-black font-semibold font-mono">84V050N</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-medium">Banco:</span>
                            <span className="text-black font-semibold">Banco Industrial</span>
                          </div>
                          <div className="flex justify-between border-t border-border pt-2 mt-2">
                            <span className="font-medium">Monto:</span>
                            <span className="text-black font-bold text-lg">
                              ${pkg.quote && typeof pkg.quote === 'object' ? parseFloat((pkg.quote as any).totalPrice || '0').toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Una vez realizado el pago, sube tu comprobante para continuar con el proceso.
                      </p>
                    </div>
                    
                    {/* Payment Upload */}
                    <div className="bg-info-muted border border-info-border rounded-lg p-4">
                      <div className="mb-3">
                        <p className="text-sm font-medium text-info">📄 Subir comprobante de pago</p>
                        <p className="text-xs text-info">Adjunta tu comprobante de transferencia aquí.</p>
                      </div>
                      <PaymentUpload 
                        packageId={pkg.id}
                        onUpload={handlePaymentUpload}
                      />
                    </div>
                  </div>
                )}
                
                {/* Show shipping instructions after payment confirmation - PROMINENT IN LEFT COLUMN */}
                {pkg.status === 'payment_confirmed' && viewMode === 'user' && pkg.traveler_address && (
                  <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4 mb-4 shadow-sm">
                    <div className="mb-4">
                      <p className="text-sm font-semibold text-primary mb-2">📦 Instrucciones para el envío</p>
                      <p className="text-xs text-muted-foreground mb-3">
                        Tu pago ha sido confirmado. Por favor envía el producto a la siguiente dirección:
                      </p>
                    </div>
                    
                    {/* Fechas importantes integradas */}
                    {pkg.matched_trip_dates && (
                      <div className="bg-info-muted border border-info-border rounded-lg p-3 mb-4">
                        <div className="flex items-start space-x-2 mb-2">
                          <span className="text-sm font-medium text-info">📅 Fechas importantes para tu envío:</span>
                        </div>
                        <div className="text-sm text-info space-y-1">
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span><strong>Primer día para recibir paquetes:</strong> {new Date((pkg.matched_trip_dates as any).firstDayPackages).toLocaleDateString('es-GT')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>⏰</span>
                            <span><strong>Último día para recibir paquetes:</strong> {new Date((pkg.matched_trip_dates as any).lastDayPackages).toLocaleDateString('es-GT')}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span>📍</span>
                            <span><strong>Entrega en oficina Favorón:</strong> {new Date((pkg.matched_trip_dates as any).deliveryDate).toLocaleDateString('es-GT')}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-background/80 rounded-md p-3 border border-border mb-4">
                      <div className="text-sm space-y-2">
                        <div>
                          <span className="font-medium text-primary">Dirección de envío:</span>
                        </div>
                        <div className="ml-4 space-y-1 text-muted-foreground">
                          <p>{(pkg.traveler_address as any)?.streetAddress}</p>
                          <p>{(pkg.traveler_address as any)?.cityArea}</p>
                          {(pkg.traveler_address as any)?.hotelAirbnbName && (
                            <p className="font-medium">{(pkg.traveler_address as any).hotelAirbnbName}</p>
                          )}
                          <p className="flex items-center">
                            <span className="mr-1">📞</span>
                            {(pkg.traveler_address as any)?.contactNumber}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Una vez enviado el producto, sube los documentos de compra y tracking abajo.
                    </p>
                  </div>
                )}

                {/* Show upload documents after payment confirmation - PROMINENT IN LEFT COLUMN */}
                {pkg.status === 'payment_confirmed' && viewMode === 'user' && (
                  <div className="bg-warning-muted border border-warning-border rounded-lg p-4 mb-4">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-warning">📋 Subir documentos de compra</p>
                      <p className="text-xs text-warning">¿Ya compraste el producto? Sube el comprobante y tracking aquí.</p>
                    </div>
                    <UploadDocuments 
                      packageId={pkg.id}
                      currentStatus={pkg.status}
                      onUpload={(type, data) => handleUploadDocument(pkg.id, type as DocumentType, data)}
                    />
                  </div>
                )}

                <ShopperPackageDetails pkg={pkg} />
                <ShopperPackageInfo pkg={pkg} />
                {renderActionButtons()}
              </div>

              <div className="space-y-4">
                <PackageStatusTimeline currentStatus={pkg.status} />
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

export default React.memo(CollapsiblePackageCard);
