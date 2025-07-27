
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit } from "lucide-react";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import EditPackageModal from "@/components/EditPackageModal";
import ShopperPackagePriorityActions from "@/components/dashboard/shopper/ShopperPackagePriorityActions";
import ShopperPackageDetails from "@/components/dashboard/shopper/ShopperPackageDetails";
import ShopperPackageInfo from "@/components/dashboard/shopper/ShopperPackageInfo";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import UploadedDocumentsRegistry from "@/components/dashboard/UploadedDocumentsRegistry";
import EditDocumentModal from "@/components/dashboard/EditDocumentModal";
import ShippingInstructions from "@/components/dashboard/shopper/ShippingInstructions";
import ShippingInfoRegistry from "@/components/dashboard/ShippingInfoRegistry";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import { PackageShippingInstructions } from "@/components/dashboard/PackageShippingInstructions";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package, UserType, DocumentType } from "@/types";

interface CollapsiblePackageCardProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking', data: any) => void;
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
    pkg.status === 'quote_accepted' || pkg.status === 'quote_sent' || pkg.status === 'approved'
  );
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [editDocumentModal, setEditDocumentModal] = React.useState<{
    isOpen: boolean;
    documentType: 'purchase_confirmation' | 'tracking_info' | null;
  }>({
    isOpen: false,
    documentType: null
  });
  
  const { getStatusBadge } = useStatusHelpers();

  React.useEffect(() => {
    if (pkg.status === 'quote_accepted' || pkg.status === 'quote_sent' || pkg.status === 'approved') {
      setIsOpen(true);
    }
  }, [pkg.status]);

  const needsAction = viewMode === 'user' && (
    pkg.status === 'quote_sent' || 
    pkg.status === 'quote_accepted' || 
    (pkg.status === 'approved' && !pkg.purchase_confirmation)
  );

  const handleEditDocument = (type: 'purchase_confirmation' | 'tracking_info') => {
    setEditDocumentModal({ isOpen: true, documentType: type });
  };

  const handleCloseEditModal = () => {
    setEditDocumentModal({ isOpen: false, documentType: null });
  };

  const handleEditSubmit = (editedData: Package) => {
    if (onEditPackage) {
      onEditPackage(editedData);
    }
    setShowEditModal(false);
  };

  const renderActionButtons = () => {
    const canEdit = viewMode === 'user' && ['pending_approval', 'approved'].includes(pkg.status);
    
    return (
      <div className="flex flex-wrap gap-2">
        {viewMode === 'user' && canEdit && onEditPackage && (
          <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
        )}
        
        {viewMode === 'user' && pkg.status === 'matched' && (
          <Button size="sm" onClick={() => onQuote(pkg, 'user')}>
            Enviar Cotización
          </Button>
        )}
      </div>
    );
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
              {getStatusBadge(pkg.status, pkg.package_destination)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent>
            {/* Priority Actions Section - Always first */}
            {viewMode === 'user' && (
              <ShopperPackagePriorityActions 
                pkg={pkg}
                onQuote={onQuote}
              />
            )}
            
            {/* Mostrar instrucciones de envío cuando el pago ha sido aprobado */}
            {['pending_approval', 'approved', 'payment_confirmed'].includes(pkg.status) && (
              <ShippingInstructions pkg={pkg} />
            )}

            {/* Información de envío collapsible para in_transit y estados posteriores */}
            {['in_transit', 'out_for_delivery', 'delivered'].includes(pkg.status) && (
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" className="w-full justify-between mb-4">
                    📦 Información de Envío
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 mb-4">
                  <ShippingInstructions pkg={pkg} />
                  {pkg.status === 'approved' && viewMode === 'user' && (pkg as any).trips?.package_receiving_address && (
                    <PackageShippingInstructions 
                      travelerAddress={(pkg as any).trips.package_receiving_address}
                      matchedTripDates={(pkg as any).trips}
                    />
                  )}
                  <ShippingInfoRegistry pkg={pkg} />
                </CollapsibleContent>
              </Collapsible>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-3">
                {/* Shipping Instructions for earlier states */}
                {pkg.status === 'approved' && viewMode === 'user' && (pkg as any).trips?.package_receiving_address && !['in_transit', 'out_for_delivery', 'delivered'].includes(pkg.status) && (
                  <PackageShippingInstructions 
                    travelerAddress={(pkg as any).trips.package_receiving_address}
                    matchedTripDates={(pkg as any).trips}
                  />
                )}

                {/* Show upload documents after approval - Show individual sections based on completion */}
                {(pkg.status === 'payment_confirmed' || pkg.status === 'approved' || pkg.status === 'in_transit') && viewMode === 'user' && (!pkg.purchase_confirmation || !pkg.tracking_info) && (
                  <div className="bg-warning-muted border border-warning-border rounded-md p-2 mb-2">
                    <div className="mb-3">
                      <p className="text-sm font-medium text-warning">📋 Subir documentos de compra</p>
                      <p className="text-xs text-warning">Cada sección es independiente. Puedes subir la confirmación de compra y el tracking por separado.</p>
                    </div>
                    <UploadDocuments 
                      packageId={pkg.id}
                      currentStatus={pkg.status}
                      currentConfirmation={pkg.purchase_confirmation}
                      currentTracking={pkg.tracking_info}
                      onUpload={(type, data) => onUploadDocument(pkg.id, type as ('confirmation' | 'tracking'), data)}
                    />
                  </div>
                )}

                {/* Show traveler confirmation when package is received */}
                <TravelerConfirmationDisplay pkg={pkg} className="mb-4" />

                {/* Show shipping information registry when saved - only for non-collapsible states */}
                {!['in_transit', 'out_for_delivery', 'delivered'].includes(pkg.status) && (
                  <ShippingInfoRegistry pkg={pkg} className="mb-4" />
                )}

                <UploadedDocumentsRegistry
                  pkg={pkg} 
                  className="mb-4"
                  onEditDocument={handleEditDocument}
                />
                <ShopperPackageDetails pkg={pkg} />
                <ShopperPackageInfo pkg={pkg} onPackageUpdate={(updatedPkg) => {
                  // PaymentReceiptUpload ya actualizó la base de datos correctamente
                  // El sistema de tiempo real debería actualizar el estado automáticamente
                  // No necesitamos hacer nada adicional aquí
                  console.log('Payment receipt uploaded successfully:', updatedPkg);
                }} />
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
        onUpdate={(type, data) => {
          if (type === 'purchase_confirmation') {
            onUploadDocument(pkg.id, 'confirmation', data);
          } else if (type === 'tracking_info') {
            onUploadDocument(pkg.id, 'tracking', data);
          }
        }}
      />
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);
