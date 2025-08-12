
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
import RejectionReasonDisplay from "@/components/admin/RejectionReasonDisplay";

import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package, UserType, DocumentType } from "@/types";

interface CollapsiblePackageCardProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking', data: any) => void;
  onEditPackage?: (packageData: Package) => void;
  onDeletePackage?: (pkg: Package) => void;
  viewMode?: 'user';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  onQuote, 
  onConfirmAddress,
  onUploadDocument,
  onEditPackage,
  onDeletePackage,
  viewMode = 'user'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(
    pkg.status === 'quote_accepted' || pkg.status === 'quote_sent' || pkg.status === 'approved'
  );
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [shippingInfoOpen, setShippingInfoOpen] = React.useState(false);
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
              <div className="mb-6">
                <ShopperPackagePriorityActions 
                  pkg={pkg}
                  onQuote={onQuote}
                  onDeletePackage={onDeletePackage}
                />
              </div>
            )}
            
            {/* Mostrar instrucciones de envío solo cuando el pago está en proceso o confirmado */}
            {['pending_purchase', 'payment_confirmed'].includes(pkg.status) && (
              <div className="mb-6">
                <ShippingInstructions pkg={pkg} />
              </div>
            )}

            {/* Información de envío collapsible para in_transit y estados posteriores */}
            {['in_transit', 'out_for_delivery', 'delivered'].includes(pkg.status) && (
              <div className="mb-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-between"
                  onClick={() => setShippingInfoOpen(!shippingInfoOpen)}
                >
                  📦 Información de Envío
                  {shippingInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
                {shippingInfoOpen && (
                  <div className="space-y-4 mt-4 p-4 border rounded-md bg-muted/20">
                    <ShippingInstructions pkg={pkg} />
                    <ShippingInfoRegistry pkg={pkg} />
                  </div>
                )}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-6">


                {/* Show traveler confirmation when package is received */}
                <TravelerConfirmationDisplay pkg={pkg} />

                {/* Show shipping information registry when saved - only for non-collapsible states */}
                {!['in_transit', 'out_for_delivery', 'delivered'].includes(pkg.status) && (
                  <ShippingInfoRegistry pkg={pkg} className="mb-4" />
                )}

                <UploadedDocumentsRegistry
                  pkg={pkg} 
                  className="mb-4"
                  onEditDocument={handleEditDocument}
                />
                
                {/* Show rejection reason if package was rejected */}
                {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejection_reason && (
                  <RejectionReasonDisplay 
                    rejectionReason={pkg.rejection_reason}
                    wantsRequote={pkg.wants_requote}
                    additionalComments={pkg.additional_notes}
                    className="mb-4"
                  />
                )}
                
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
