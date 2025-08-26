
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash2 } from "lucide-react";
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package, UserType, DocumentType } from "@/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface CollapsiblePackageCardProps {
  pkg: Package;
  onQuote: (pkg: Package, userType: UserType) => void;
  onConfirmAddress: (pkg: Package) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking', data: any) => void;
  onEditPackage?: (packageData: Package) => void;
  onDeletePackage?: (pkg: Package) => void;
  onRequestRequote?: (pkg: Package) => void;
  viewMode?: 'user';
}

const CollapsiblePackageCard = ({ 
  pkg, 
  onQuote, 
  onConfirmAddress,
  onUploadDocument,
  onEditPackage,
  onDeletePackage,
  onRequestRequote,
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
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  
  const { getStatusBadge, getExpirationInfo } = useStatusHelpers();
  const expirationInfo = getExpirationInfo(pkg);

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

  const handleDeletePackage = () => {
    if (onDeletePackage) {
      onDeletePackage(pkg);
    }
    setShowDeleteDialog(false);
  };

  // Determine if package actions dropdown should be shown
  const canShowPackageActions = viewMode === 'user' && onDeletePackage && [
    'pending_approval',
    'approved', 
    'matched',
    'quote_sent',
    'quote_accepted',
    'quote_rejected',
    'quote_expired',
    'payment_pending',
    'payment_pending_approval'
  ].includes(pkg.status);

  const renderActionButtons = () => {
    const canEdit = viewMode === 'user' && ['pending_approval', 'approved'].includes(pkg.status);
    
    return (
      <div className="flex flex-wrap gap-2 w-full">
        {viewMode === 'user' && canEdit && onEditPackage && (
          <Button size="sm" variant="outline" onClick={() => setShowEditModal(true)} className="flex-1 sm:flex-none min-w-0">
            <Edit className="h-4 w-4 mr-1 flex-shrink-0" />
            <span className="truncate">Editar</span>
          </Button>
        )}
        
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="w-full max-w-full overflow-hidden">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3 sm:p-4 lg:p-6 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0">
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate pr-1 flex-1 min-w-0 text-xs sm:text-sm lg:text-base">
                      {pkg.item_description || 'Sin descripción'}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0 sm:hidden ml-2">
                      {needsAction && (
                        <NotificationBadge count={1} />
                      )}
                      {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  <div className="hidden sm:flex sm:items-center sm:gap-2">
                    {needsAction && (
                      <NotificationBadge count={1} />
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm mt-1 sm:mt-0 w-full min-w-0">
                  <div className="flex flex-col sm:flex-row sm:gap-2 w-full">
                    <span className="truncate">Precio: ${pkg.estimated_price}</span>
                    <span className="hidden sm:inline flex-shrink-0">•</span>
                    <span className="truncate">Fecha límite: {new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}</span>
                  </div>
                </CardDescription>
              </div>
              <div className="flex items-center gap-1 sm:gap-2 justify-between sm:justify-end w-full sm:w-auto flex-shrink-0 min-w-0">
                <div className="flex-shrink-0 min-w-0">
                  {expirationInfo ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger>
                          {getStatusBadge(pkg.status, { 
                            packageDestination: pkg.package_destination, 
                            isQuoteExpired: !!(pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date()),
                            pkg: pkg
                          })}
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{expirationInfo.message}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : (
                    getStatusBadge(pkg.status, { 
                      packageDestination: pkg.package_destination, 
                      isQuoteExpired: !!(pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date()),
                      pkg: pkg
                    })
                  )}
                </div>
                {canShowPackageActions && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-muted flex-shrink-0"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent 
                      align="end" 
                      className="bg-background border shadow-md z-50"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive hover:bg-destructive/10 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteDialog(true);
                        }}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Descartar pedido
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-3 sm:p-4 lg:p-6 w-full max-w-full">
            {/* Priority Actions Section - Always first */}
            {viewMode === 'user' && (
              <div className="mb-6">
                <ShopperPackagePriorityActions 
                  pkg={pkg}
                  onQuote={onQuote}
                  onDeletePackage={onDeletePackage}
                  onRequestRequote={onRequestRequote}
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
            {['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status) && (
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

            {/* Payment Upload Section - Prominent for payment_pending */}
            {pkg.status === 'payment_pending' && viewMode === 'user' && (
              <div className="mb-6">
                <ShopperPackageInfo pkg={pkg} onPackageUpdate={(updatedPkg) => {
                  console.log('Payment receipt uploaded successfully:', updatedPkg);
                }} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <div className="space-y-4 sm:space-y-6 order-2 lg:order-1">

                {/* Show traveler confirmation when package is received */}
                <TravelerConfirmationDisplay pkg={pkg} />

                {/* Show shipping information registry when saved - only for non-collapsible states */}
                {!['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status) && (
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
                {/* Show ShopperPackageInfo only if not payment_pending (already shown prominently above) */}
                {pkg.status !== 'payment_pending' && (
                  <ShopperPackageInfo pkg={pkg} onPackageUpdate={(updatedPkg) => {
                    console.log('Package updated successfully:', updatedPkg);
                  }} />
                )}
                {renderActionButtons()}
              </div>

              <div className="space-y-4 order-1 lg:order-2">
                <PackageStatusTimeline 
                  currentStatus={pkg.status} 
                  deliveryMethod={pkg.delivery_method}
                />
                
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Descartar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará permanentemente tu pedido de "{pkg.item_description}". 
              No podrás recuperarlo después de confirmarlo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePackage}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Descartar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);
