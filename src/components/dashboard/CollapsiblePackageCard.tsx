
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
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import UploadedDocumentsRegistry from "@/components/dashboard/UploadedDocumentsRegistry";
import EditDocumentModal from "@/components/dashboard/EditDocumentModal";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package, UserType, DocumentType } from "@/types";

interface CollapsiblePackageCardProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: Package) => void;
  viewMode?: 'user';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  onQuote, 
  onConfirmAddress,
  onUploadDocument,
  onEditPackage,
  viewMode = 'user'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(
    // Auto-open when user needs to take action
    pkg.status === 'quote_accepted' || pkg.status === 'payment_confirmed' || pkg.status === 'quote_sent'
  );
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editDocumentModal, setEditDocumentModal] = React.useState<{
    isOpen: boolean;
    documentType: 'payment_receipt' | 'purchase_confirmation' | 'tracking_info' | null;
  }>({
    isOpen: false,
    documentType: null
  });
  
  const { getStatusBadge } = useStatusHelpers();

  // Auto-open when status changes to require action
  React.useEffect(() => {
    if (pkg.status === 'quote_accepted' || pkg.status === 'payment_confirmed' || pkg.status === 'quote_sent') {
      setIsOpen(true);
    }
  }, [pkg.status]);

  // Determine if package needs action (for users)
  const needsAction = viewMode === 'user' && (
    pkg.status === 'quote_sent' || // needs to accept/reject quote
    pkg.status === 'quote_accepted' || // needs to make payment
    (pkg.status === 'payment_confirmed' && !pkg.purchase_confirmation) // needs to upload documents
  );

  const handlePaymentUpload = (paymentData: any) => {
    onUploadDocument(pkg.id, 'payment_receipt', paymentData);
  };

  const handleEditDocument = (type: 'payment_receipt' | 'purchase_confirmation' | 'tracking_info') => {
    setEditDocumentModal({
      isOpen: true,
      documentType: type
    });
  };

  const handleCloseEditModal = () => {
    setEditDocumentModal({
      isOpen: false,
      documentType: null
    });
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
                    {(() => {
                      // Render payment instructions
                      return null;
                    })()}
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
                              Q{pkg.quote && typeof pkg.quote === 'object' ? parseFloat((pkg.quote as any).totalPrice || '0').toFixed(2) : '0.00'}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground">
                        Una vez realizado el pago, sube tu comprobante para continuar con el proceso.
                      </p>
                    </div>
                    
                    {/* Payment Upload */}
                    <PaymentUpload 
                      packageId={pkg.id}
                      onUpload={handlePaymentUpload}
                      currentPaymentReceipt={pkg.payment_receipt}
                      isPaymentApproved={['payment_confirmed', 'in_transit', 'delivered'].includes(pkg.status)}
                    />
                  </div>
                )}
                
                {/* Show shipping instructions after payment confirmation - PROMINENT IN LEFT COLUMN */}
                {pkg.status === 'payment_confirmed' && viewMode === 'user' && pkg.traveler_address && (
                  <div className="bg-gradient-subtle border border-primary/20 rounded-lg p-4 mb-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <span className="text-primary">📦</span>
                      <h3 className="text-base font-semibold text-foreground">Instrucciones de envío</h3>
                    </div>
                    
                    {/* Fechas importantes condensadas */}
                    {pkg.matched_trip_dates && (
                       <div className="bg-blue-50/50 border border-blue-200 rounded-md p-3 mb-3">
                         <div className="flex items-center space-x-1 mb-2">
                           <span className="text-blue-600 text-sm">📅</span>
                           <span className="font-medium text-blue-800 text-sm">Fechas importantes</span>
                         </div>
                         
                         <div className="space-y-1 text-xs">
                           <div className="flex items-center justify-between py-1 px-2 bg-white/60 rounded border-l-2 border-green-400">
                             <span className="text-gray-700">📥 Primer día:</span>
                             <span className="font-semibold text-gray-800">
                               {new Date((pkg.matched_trip_dates as any).first_day_packages).toLocaleDateString('es-GT')}
                             </span>
                           </div>
                           
                           <div className="flex items-center justify-between py-1 px-2 bg-white/60 rounded border-l-2 border-orange-400">
                             <span className="text-gray-700">📤 Último día:</span>
                             <span className="font-semibold text-gray-800">
                               {new Date((pkg.matched_trip_dates as any).last_day_packages).toLocaleDateString('es-GT')}
                             </span>
                           </div>
                           
                           <div className="flex items-center justify-between py-1 px-2 bg-white/60 rounded border-l-2 border-purple-400">
                             <span className="text-gray-700">🏢 Entrega:</span>
                             <span className="font-semibold text-gray-800">
                               {new Date((pkg.matched_trip_dates as any).delivery_date).toLocaleDateString('es-GT')}
                             </span>
                           </div>
                         </div>
                       </div>
                    )}
                    
                    <div className="bg-background/80 rounded-md p-3 border border-border">
                      <div className="text-sm space-y-2">
                        {/* NOMBRE DEL DESTINATARIO - Compacto */}
                        <div className="bg-primary/10 border border-primary/20 rounded-md p-2">
                           <div className="flex items-center space-x-2">
                             <span className="text-primary text-sm">👤</span>
                             <div className="flex-1 min-w-0">
                               <span className="font-medium text-primary text-sm">Destinatario:</span>
                               <p className="text-foreground font-semibold text-sm truncate">
                                 {(pkg as any)?.trips?.package_receiving_address?.recipientName || 'Nombre no especificado'}
                               </p>
                             </div>
                           </div>
                         </div>
                         
                         {/* Dirección condensada */}
                         <div className="space-y-1 text-xs">
                           <div className="flex items-start space-x-2">
                             <span className="text-muted-foreground">🏠</span>
                             <div className="flex-1 min-w-0">
                               <p className="text-foreground font-medium">{(pkg as any)?.trips?.package_receiving_address?.streetAddress}</p>
                               <p className="text-muted-foreground">{(pkg as any)?.trips?.package_receiving_address?.cityArea}</p>
                               {(pkg as any)?.trips?.package_receiving_address?.postalCode && (
                                 <p className="text-muted-foreground font-mono">{(pkg as any)?.trips?.package_receiving_address?.postalCode}</p>
                               )}
                             </div>
                           </div>
                           
                           {/* Hotel/Airbnb si existe */}
                           {(pkg as any)?.trips?.package_receiving_address?.hotelAirbnbName && (
                             <div className="flex items-center space-x-2 bg-blue-50 border border-blue-200 rounded-md p-2">
                               <span className="text-blue-700">🏨</span>
                               <p className="text-blue-800 font-medium text-xs">{(pkg as any)?.trips?.package_receiving_address?.hotelAirbnbName}</p>
                             </div>
                           )}
                           
                           {/* Contacto */}
                           <div className="flex items-center space-x-2 bg-green-50 border border-green-200 rounded-md p-2">
                             <span className="text-green-700">📞</span>
                             <p className="text-green-800 font-semibold text-xs">{(pkg as any)?.trips?.package_receiving_address?.contactNumber}</p>
                           </div>
                         </div>
                      </div>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Sube los documentos de compra y tracking abajo una vez enviado.
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
                      onUpload={(type, data) => onUploadDocument(pkg.id, type as DocumentType, data)}
                    />
                  </div>
                )}

                {/* Show traveler confirmation when package is received */}
                <TravelerConfirmationDisplay pkg={pkg} className="mb-4" />

                <UploadedDocumentsRegistry
                  pkg={pkg} 
                  className="mb-4"
                  onEditDocument={handleEditDocument}
                />
                <ShopperPackageDetails pkg={pkg} />
                <ShopperPackageInfo pkg={pkg} />
                {renderActionButtons()}
              </div>

              <div className="space-y-4">
                <PackageStatusTimeline currentStatus={pkg.status} />
                
                {/* Package Chat Timeline - Always visible for shoppers */}
                <div className="mt-6">
                  <PackageTimeline pkg={pkg} />
                </div>
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

      <EditDocumentModal
        isOpen={editDocumentModal.isOpen}
        onClose={handleCloseEditModal}
        documentType={editDocumentModal.documentType}
        pkg={pkg}
        onUpdate={(type, data) => onUploadDocument(pkg.id, type, data)}
      />
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);
