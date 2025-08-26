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
import PaymentReceiptUpload from "@/components/dashboard/shopper/PaymentReceiptUpload";
import PackageQuoteInfo from "@/components/dashboard/PackageQuoteInfo";
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
          <CardContent className="w-full max-w-full">
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 min-h-[400px]">
              
              {/* Acciones y Archivos del Usuario - Siempre a la izquierda */}
              <div className="lg:w-80 lg:flex-shrink-0 border rounded-lg p-4 bg-muted/20 h-fit lg:mr-auto">
                <h3 className="text-sm font-semibold text-muted-foreground mb-3">⚡ Acciones Requeridas</h3>
                
                {/* Priority Actions Section */}
                <div className="mb-4">
                  <ShopperPackagePriorityActions 
                    pkg={pkg} 
                    onQuote={onQuote}
                    onDeletePackage={onDeletePackage}
                    onRequestRequote={onRequestRequote}
                  />
                </div>

                {/* Quote Information Section - Moved from Product Information */}
                {pkg.quote && (
                  <div className="mb-4">
                    <PackageQuoteInfo 
                      quote={pkg.quote as any}
                      quoteExpiresAt={pkg.quote_expires_at}
                    />
                  </div>
                )}

                {/* Payment Receipt Upload and Timeline Section */}
                {(pkg.status === 'quote_sent' ||
                  pkg.status === 'quote_accepted' || 
                  pkg.status === 'payment_pending' || 
                  pkg.status === 'payment_confirmed' ||
                  pkg.status === 'paid' ||
                  pkg.status === 'pending_purchase' ||
                  pkg.status === 'purchased' ||
                  pkg.status === 'shipped' ||
                  pkg.status === 'matched' ||
                  pkg.status === 'in_transit' ||
                  pkg.status === 'received_by_traveler' ||
                  pkg.status === 'delivered' ||
                  pkg.status === 'pending_office_confirmation') && (
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <PaymentReceiptUpload 
                      pkg={pkg}
                      onUploadComplete={() => {}}
                    />
                    <PackageStatusTimeline 
                      currentStatus={pkg.status}
                      deliveryMethod={pkg.delivery_method}
                    />
                  </div>
                )}

                {/* Document Upload Section */}
                {(pkg.status === 'payment_confirmed' || 
                  pkg.status === 'paid' ||
                  pkg.status === 'pending_purchase' ||
                  pkg.status === 'purchased' ||
                  pkg.status === 'shipped' ||
                  pkg.status === 'matched' ||
                  pkg.status === 'in_transit' ||
                  pkg.status === 'received_by_traveler' ||
                  pkg.status === 'delivered' ||
                  pkg.status === 'pending_office_confirmation') && (
                  <UploadDocuments 
                    packageId={pkg.id}
                    currentStatus={pkg.status}
                    currentConfirmation={pkg.purchase_confirmation}
                    currentTracking={pkg.tracking_info}
                    onUpload={(type, data) => onUploadDocument(pkg.id, type, data)}
                  />
                )}

                {/* Uploaded Documents Registry */}
                <UploadedDocumentsRegistry 
                  pkg={pkg}
                  onEditDocument={handleEditDocument}
                />

                {/* Traveler Confirmation Display */}
                {(pkg.status === 'matched' || 
                  pkg.status === 'in_transit' || 
                  pkg.status === 'received_by_traveler' ||
                  pkg.status === 'delivered' ||
                  pkg.status === 'pending_office_confirmation') && (
                  <TravelerConfirmationDisplay pkg={pkg} />
                )}

                {/* Edit Actions */}
                {renderActionButtons()}
              </div>

              {/* Contenido Principal */}
              <div className="flex-1 space-y-4">
                {/* Información del Producto */}
                <div className="border rounded-lg p-4 bg-muted/20 h-fit">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">📦 Información del Producto</h3>
                  
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Contenido principal del producto */}
                    <div className="flex-1">
                      <ShopperPackageDetails pkg={pkg} />
                      
                      {/* Show rejection reason if package was rejected */}
                      {['rejected', 'quote_rejected'].includes(pkg.status) && pkg.rejection_reason && (
                        <div className="mt-4">
                          <RejectionReasonDisplay 
                            rejectionReason={pkg.rejection_reason}
                            wantsRequote={pkg.wants_requote}
                            additionalComments={pkg.additional_notes}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Comunicación */}
              <div className="space-y-4">
                {/* Timeline y Chat integrados */}
                <div className="border rounded-lg p-4 bg-muted/20 h-fit">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">💬 Comunicación</h3>
                  <PackageTimeline pkg={pkg} />
                </div>

                {/* Shipping Information - Conditional Display */}
                {(['pending_purchase', 'payment_confirmed'].includes(pkg.status) || 
                  ['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status)) && (
                  <div className="border rounded-lg p-4 bg-muted/20 h-fit">
                    <h3 className="text-sm font-semibold text-muted-foreground mb-3">🚚 Información de Envío</h3>
                    
                    {/* Always show for pending_purchase and payment_confirmed */}
                    {['pending_purchase', 'payment_confirmed'].includes(pkg.status) && (
                      <ShippingInstructions pkg={pkg} />
                    )}
                    
                    {/* Collapsible for in_transit and later states */}
                    {['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status) && (
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between mb-3"
                          onClick={() => setShippingInfoOpen(!shippingInfoOpen)}
                        >
                          Ver detalles de envío
                          {shippingInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </Button>
                        {shippingInfoOpen && (
                          <div className="space-y-4">
                            <ShippingInstructions pkg={pkg} />
                            <ShippingInfoRegistry pkg={pkg} />
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Show shipping information registry for non-collapsible states */}
                    {!['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status) && (
                      <ShippingInfoRegistry pkg={pkg} />
                    )}
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
