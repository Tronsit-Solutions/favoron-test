import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash2, Archive, Box, Activity, FileText, MessageCircle, CreditCard } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PackageRequestForm from "@/components/PackageRequestForm";
import ShopperPackagePriorityActions from "@/components/dashboard/shopper/ShopperPackagePriorityActions";
import ShopperPackageDetails from "@/components/dashboard/shopper/ShopperPackageDetails";

import PackageQuoteInfo from "@/components/dashboard/PackageQuoteInfo";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import UploadedDocumentsRegistry from "@/components/dashboard/UploadedDocumentsRegistry";
import EditDocumentModal from "@/components/dashboard/EditDocumentModal";
import ShippingInstructions from "@/components/dashboard/shopper/ShippingInstructions";
import ShippingInfoRegistry from "@/components/dashboard/ShippingInfoRegistry";
import { TravelerConfirmationDisplay } from "@/components/dashboard/TravelerConfirmationDisplay";
import ShopperPaymentInfoModal from "@/components/dashboard/shopper/ShopperPaymentInfoModal";
import RejectionReasonDisplay from "@/components/admin/RejectionReasonDisplay";
import ShippingInfoModal from "@/components/dashboard/ShippingInfoModal";

import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package as PackageType, UserType, DocumentType } from "@/types";
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
  pkg: PackageType;
  onQuote: (pkg: PackageType, userType: UserType) => void;
  onConfirmAddress: (pkg: PackageType) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking', data: any) => void;
  onEditPackage?: (packageData: PackageType) => void;
  onDeletePackage?: (pkg: PackageType) => void;
  onArchivePackage?: (pkg: PackageType) => void;
  onRequestRequote?: (pkg: PackageType) => void;
  viewMode?: 'user';
  
}

const CollapsiblePackageCard = ({ 
  pkg, 
  onQuote, 
  onConfirmAddress,
  onUploadDocument,
  onEditPackage,
  onDeletePackage,
  onArchivePackage,
  onRequestRequote,
  viewMode = 'user'
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("producto");
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [shippingInfoOpen, setShippingInfoOpen] = React.useState(false);
  const [showPaymentModal, setShowPaymentModal] = React.useState(false);
  const [editDocumentModal, setEditDocumentModal] = React.useState<{
    isOpen: boolean;
    documentType: 'purchase_confirmation' | 'tracking_info' | null;
  }>({
    isOpen: false,
    documentType: null
  });
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showShippingInfoModal, setShowShippingInfoModal] = React.useState(false);
  
  const { getStatusBadge, getExpirationInfo } = useStatusHelpers();
  const expirationInfo = getExpirationInfo(pkg);


  const needsAction = viewMode === 'user' && (
    pkg.status === 'quote_sent' || 
    pkg.status === 'quote_accepted' || 
    pkg.status === 'payment_pending' ||
    pkg.status === 'payment_pending_approval' ||
    pkg.status === 'pending_purchase'
    // Removed: 'approved' condition - approved packages are pending traveler assignment, no shopper action needed
  );

  const handleEditDocument = (type: 'purchase_confirmation' | 'tracking_info') => {
    setEditDocumentModal({ isOpen: true, documentType: type });
  };

  const handleCloseEditModal = () => {
    setEditDocumentModal({ isOpen: false, documentType: null });
  };

  const handleEditSubmit = (editedData: any) => {
    if (onEditPackage) {
      // Transform editedData from PackageRequestForm format to database update format
      const updateData: Partial<PackageType> = {
        package_destination: editedData.destination,
        purchase_origin: editedData.origin,
        delivery_method: editedData.deliveryMethod,
        delivery_deadline: editedData.deliveryDeadline instanceof Date 
          ? editedData.deliveryDeadline.toISOString() 
          : editedData.deliveryDeadline,
        additional_notes: editedData.notes || null,
        confirmed_delivery_address: editedData.address || null,
        // Transform products array to products_data format
        products_data: editedData.products?.map((product: any) => ({
          itemDescription: product.itemDescription,
          itemLink: product.itemLink,
          estimatedPrice: product.estimatedPrice?.toString(),
          quantity: product.quantity?.toString()
        })) || null
      };
      
      // Call onEditPackage with the package ID and update data
      onEditPackage({ id: pkg.id, ...updateData } as any);
    }
    setShowEditModal(false);
  };

  const handleDeletePackage = () => {
    if (onDeletePackage) {
      onDeletePackage(pkg);
    }
    setShowDeleteDialog(false);
  };

  const handleArchivePackage = () => {
    if (onArchivePackage) {
      onArchivePackage(pkg);
    }
  };



  // Determine if package actions dropdown should be shown
  const canEdit = viewMode === 'user' && ['pending_approval', 'approved'].includes(pkg.status);
  const canShowPackageActions = viewMode === 'user' && (
    (canEdit && onEditPackage) ||
    (onDeletePackage && [
      'pending_approval',
      'approved', 
      'matched',
      'quote_sent',
      'quote_accepted',
      'quote_rejected',
      'quote_expired',
      'payment_pending',
      'payment_pending_approval'
    ].includes(pkg.status)) ||
    (onArchivePackage && [
      'completed',
      'delivered',
      'delivered_to_office',
      'cancelled',
      'rejected'
    ].includes(pkg.status))
  );

  // Determine if this is an archivable status
  const isArchivable = [
    'completed',
    'delivered', 
    'delivered_to_office',
    'cancelled',
    'rejected'
  ].includes(pkg.status);

  const renderActionButtons = () => {
    return (
      <div className="flex flex-wrap gap-2 w-full">
        {/* Action buttons moved to dropdown menu */}
      </div>
    );
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="w-full max-w-full overflow-hidden min-w-0 box-border mobile-content">
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors p-3 sm:p-4 lg:p-6 w-full">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-3 w-full min-w-0">
              <div className="flex-1 min-w-0">
                <CardTitle className="text-sm sm:text-base lg:text-lg flex flex-col sm:flex-row sm:items-center gap-2 w-full min-w-0">
                  <div className="flex items-center justify-between w-full min-w-0">
                    <span className="truncate pr-1 flex-1 min-w-0 text-sm sm:text-base lg:text-lg">
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
                {/* Shopper Action Button - Different for different statuses */}
                {pkg.status === 'quote_sent' && (!pkg.quote_expires_at || (pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date())) ? (
                  <Button
                    size="sm"
                    variant="success"
                    onClick={(e) => {
                      e.stopPropagation();
                      onQuote(pkg, 'user');
                    }}
                    className="mr-2 text-xs font-medium flex-shrink-0"
                  >
                    Ver y Aceptar Cotización
                  </Button>
                ) : pkg.status === 'payment_pending' ? (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowPaymentModal(true);
                    }}
                    className="mr-2 text-xs font-medium flex-shrink-0"
                  >
                    <CreditCard className="h-3 w-3 mr-1" />
                    Pagar
                  </Button>
                ) : pkg.status === 'pending_purchase' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowShippingInfoModal(true);
                    }}
                    className="mr-2 text-xs font-medium flex-shrink-0"
                  >
                    Ver Info de Envío
                  </Button>
                ) : null}
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
                      {canEdit && onEditPackage && (
                        <DropdownMenuItem
                          className="text-muted-foreground focus:text-foreground hover:bg-muted cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditModal(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                      )}
                      {isArchivable ? (
                        <>
                          <DropdownMenuItem
                            className="text-muted-foreground focus:text-foreground hover:bg-muted cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleArchivePackage();
                            }}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Archivar
                          </DropdownMenuItem>
                          {pkg.status === 'rejected' && (
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
                          )}
                        </>
                      ) : (
                        <>
                          {onDeletePackage && (
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
                          )}
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="p-1 sm:p-3 overflow-hidden">
            {/* Main Content Layout - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-0 overflow-hidden">
              
              {/* Left Column: Horizontal Tabs */}
              <div className="md:col-span-2 bg-muted/30 rounded-lg border border-muted/50 order-2 md:order-1 overflow-hidden">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 bg-muted/50 rounded-none rounded-t-lg h-auto p-1">
                    <TabsTrigger 
                      value="producto" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <Box className="h-4 w-4" />
                      <span className="hidden sm:inline">Producto</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="estado" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <Activity className="h-4 w-4" />
                      <span className="hidden sm:inline">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documentos" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <FileText className="h-4 w-4" />
                      <span className="hidden sm:inline">Docs</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <MessageCircle className="h-4 w-4" />
                      <span className="hidden sm:inline">Chat</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="producto" className="mt-0 px-1 py-2 sm:p-2">
                    <div className="bg-card border rounded-lg px-1 py-1 sm:p-2 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-muted-foreground">Detalles del Producto</h4>
                        {canEdit && onEditPackage && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEditModal(true);
                            }}
                            className="h-7 w-7 p-0 hover:bg-muted"
                          >
                            <Edit className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="max-w-full overflow-hidden">
                        <ShopperPackageDetails pkg={pkg} />
                      </div>
                      
                      {/* Rejection Reason */}
                      {['rejected', 'quote_rejected'].includes(pkg.status) && (
                        (() => {
                          const reason = (pkg?.quote_rejection as any)?.reason 
                            || (pkg?.admin_rejection as any)?.reason 
                            || (pkg as any)?.rejection_reason;
                          if (!reason) return null;
                          const wantsRequote = (pkg?.quote_rejection as any)?.wants_requote ?? (pkg as any)?.wants_requote;
                          const additionalComments = (pkg?.quote_rejection as any)?.additional_notes ?? (pkg as any)?.additional_notes;
                          return (
                            <div className="mt-2 sm:mt-4 max-w-full overflow-hidden">
                              <RejectionReasonDisplay 
                                rejectionReason={reason}
                                wantsRequote={wantsRequote}
                                additionalComments={additionalComments}
                              />
                            </div>
                          );
                        })()
                      )}

                    </div>
                  </TabsContent>

                  <TabsContent value="estado" className="mt-0 px-1 py-2 sm:p-2">
                    <div className="bg-card border rounded-lg px-1 py-1 sm:p-2 shadow-sm w-full max-w-full overflow-hidden min-w-0">
                      <div className="w-full max-w-full overflow-x-auto overflow-y-hidden min-w-0">
                        <PackageStatusTimeline 
                          currentStatus={pkg.status}
                          deliveryMethod={pkg.delivery_method}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="documentos" className="mt-0 px-1 py-2 sm:p-2">
                    <div className="bg-card border rounded-lg px-1 py-1 sm:p-2 shadow-sm">
                      <div className="max-w-full overflow-hidden">
                        <UploadedDocumentsRegistry 
                          pkg={pkg}
                          onEditDocument={handleEditDocument}
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="chat" className="mt-0 px-1 py-2 sm:p-2">
                    <div className="bg-card border rounded-lg px-1 py-1 sm:p-2 shadow-sm">
                      <PackageTimeline pkg={pkg} />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Right Column: Information & Communication */}
              <div className="md:col-span-3 space-y-1 sm:space-y-2 px-1 py-0.5 md:p-2 bg-card/50 rounded-lg border border-card/80 order-1 md:order-2 overflow-hidden">
                
                {/* Traveler Confirmation Section */}
                {(pkg.status === 'received_by_traveler' ||
                  pkg.status === 'delivered' ||
                  pkg.status === 'pending_office_confirmation') && (
                  <div className="bg-card border rounded-lg px-1 py-1 sm:p-2 shadow-sm max-w-full overflow-hidden">
                    <div className="flex items-center gap-2 mb-2 sm:mb-4">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <h3 className="text-sm font-medium text-primary">Confirmación del Viajero</h3>
                    </div>
                    <div className="max-w-full overflow-hidden">
                      <TravelerConfirmationDisplay pkg={pkg} />
                    </div>
                  </div>
                )}
                
                {/* Required Actions Section */}
                <div className="bg-card border-2 border-warning/20 rounded-lg px-1 py-1 sm:p-2 shadow-sm max-w-full overflow-hidden">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-warning rounded-full animate-pulse"></div>
                    <h3 className="text-sm font-medium text-warning">Acciones Requeridas</h3>
                  </div>
                  
                  {/* Priority Actions */}
                  <div className="mb-4">
                     <ShopperPackagePriorityActions 
                       pkg={pkg} 
                       onQuote={onQuote}
                       onDeletePackage={onDeletePackage}
                       onRequestRequote={onRequestRequote}
                       onShowTimeline={(packageId) => {
                         setActiveTab("estado");
                         setIsOpen(true);
                       }}
                     />
                  </div>

                  {/* Shipping Instructions */}
                  {['pending_purchase', 'payment_confirmed'].includes(pkg.status) && (
                    <div className="mb-4">
                      <ShippingInstructions pkg={pkg} />
                    </div>
                  )}

                  {/* Quote Information */}
                  {pkg.quote && !pkg.wants_requote && !['payment_confirmed', 'paid', 'pending_purchase', 'purchased', 'shipped', 'matched', 'in_transit', 'received_by_traveler', 'delivered', 'pending_office_confirmation'].includes(pkg.status) && (
                    <div className="mb-4">
                      <PackageQuoteInfo 
                        quote={pkg.quote as any}
                        quoteExpiresAt={pkg.quote_expires_at}
                      />
                    </div>
                  )}


                  {/* Document Upload */}
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
                    <div className="mb-4">
                      <UploadDocuments 
                        packageId={pkg.id}
                        currentStatus={pkg.status}
                        currentConfirmation={pkg.purchase_confirmation}
                        currentTracking={pkg.tracking_info}
                        onUpload={(type, data) => onUploadDocument(pkg.id, type, data)}
                      />
                    </div>
                  )}
                </div>


                {/* Collapsible Shipping Information Section for later states only */}
                {['in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'delivered', 'completed'].includes(pkg.status) && (
                  <div className="bg-card border rounded-lg p-4 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
                      <h3 className="text-sm font-medium text-muted-foreground">Información de Envío</h3>
                    </div>
                    
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
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
      
      {/* Edit Modal */}
      <PackageRequestForm
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSubmit={handleEditSubmit}
        editMode={true}
        initialData={pkg}
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

      {/* Shopper Payment Info Modal */}
      <ShopperPaymentInfoModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        pkg={pkg}
        onUploadComplete={(updatedPkg) => {
          // Update the package state if parent component needs it
          setShowPaymentModal(false);
        }}
      />

      {/* Shipping Info Modal */}
      <ShippingInfoModal
        isOpen={showShippingInfoModal}
        onClose={() => setShowShippingInfoModal(false)}
        pkg={pkg}
        onDocumentUpload={(type, data) => onUploadDocument(pkg.id, type, data)}
      />
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);
