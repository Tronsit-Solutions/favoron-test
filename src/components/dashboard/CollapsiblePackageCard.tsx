import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash2, Archive, Box, Activity, FileText, MessageCircle, CreditCard, Package, Truck, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import PackageRequestForm from "@/components/PackageRequestForm";
import ShopperPackagePriorityActions from "@/components/dashboard/shopper/ShopperPackagePriorityActions";
import ShopperPackageDetails from "@/components/dashboard/shopper/ShopperPackageDetails";
import { useIsMobile } from "@/hooks/use-mobile";

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
import { useAuth } from "@/hooks/useAuth";
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
  
  const { profile } = useAuth();
  const { getStatusBadge, getExpirationInfo } = useStatusHelpers();
  const expirationInfo = getExpirationInfo(pkg);
  const isMobile = useIsMobile();


  const needsAction = viewMode === 'user' && (
    pkg.status === 'quote_sent' || 
    pkg.status === 'quote_accepted' || 
    pkg.status === 'payment_pending' ||
    pkg.status === 'payment_pending_approval' ||
    pkg.status === 'pending_purchase'
    // Removed: 'approved' condition - approved packages are pending traveler assignment, no shopper action needed
  );

  const getStatusDescription = (pkg: any): string => {
    console.log('Package status:', pkg.status, 'Package:', pkg);
    
    switch (pkg.status) {
      case 'pending_approval':
        return 'Esperando aprobación del administrador';
      case 'approved':
        return 'Aprobado - Esperando emparejamiento con traveler';
      case 'matched':
        return 'Emparejado con traveler - Esperando cotización';
      case 'quote_sent':
        const isExpired = pkg.quote_expires_at && new Date(pkg.quote_expires_at) < new Date();
        if (isExpired) {
          return 'Cotización expirada';
        }
        return 'Cotización recibida - Revisa y acepta';
      case 'quote_accepted':
        return 'Cotización aceptada - Esperando confirmación de pago';
      case 'payment_pending':
        return 'Pago pendiente - Realiza el pago para continuar';
      case 'payment_pending_approval':
        return 'Pago enviado - Esperando aprobación';
      case 'payment_confirmed':
        return 'Pago confirmado - Traveler comprará el producto';
      case 'pending_purchase':
        return 'Pendiente de compra - Sube el comprobante';
      case 'purchased':
        return pkg.tracking_info ? 'Producto comprado - En camino' : 'Producto comprado - Esperando envío';
      case 'in_transit':
        return 'En tránsito hacia Guatemala';
      case 'received_by_traveler':
        return 'Recibido por traveler';
      case 'pending_office_confirmation':
        return 'Entregado - Esperando confirmación de oficina';
      case 'delivered_to_office':
        return 'Entregado en oficina - Listo para recojo';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'quote_rejected':
        return 'Cotización rechazada';
      case 'quote_expired':
        return 'Cotización expirada - Solicita nueva cotización';
      default:
        return `Estado: ${pkg.status}`;
    }
  };

  const handleDeleteDocument = (documentType: 'purchase_confirmation' | 'tracking_info') => {
    setEditDocumentModal({ isOpen: true, documentType });
  };

  const isShipmentReadyStatus = (pkg: any): boolean => {
    return pkg.status === 'purchased' || 
           pkg.status === 'in_transit' || 
           pkg.status === 'received_by_traveler' ||
           pkg.status === 'pending_office_confirmation' ||
           pkg.status === 'delivered_to_office' ||
           pkg.status === 'completed';
  };

  // Helper function to check if the package has valid quote
  const hasValidQuote = (pkg: any): boolean => {
    return pkg.quote && 
           pkg.quote.total_price && 
           (!pkg.quote_expires_at || new Date(pkg.quote_expires_at) > new Date());
  };

  // Helper function to get package name
  const getPackageName = () => {
    return pkg.item_description || 'Sin descripción';
  };

  // Helper function to get package description
  const getPackageDescription = () => {
    return `Precio: $${pkg.estimated_price}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`transition-all duration-200 w-full max-w-full overflow-hidden ${
        needsAction ? "ring-2 ring-primary/50 shadow-lg border-primary/20" : "hover:shadow-md"
      }`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer hover:bg-muted/50 transition-colors w-full overflow-hidden ${
            isMobile ? 'p-3' : 'p-4 sm:p-6'
          }`}>
            
            {/* Mobile optimized layout */}
            {isMobile ? (
              <div className="space-y-3 w-full">
                {/* Product name and status in single row */}
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Package className="h-4 w-4 text-primary flex-shrink-0" />
                    <CardTitle className="text-sm font-semibold leading-tight truncate">
                      {getPackageName()}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {needsAction && <NotificationBadge count={1} />}
                    {getStatusBadge(pkg.status)}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Description */}
                <CardDescription className="text-xs leading-tight text-muted-foreground">
                  <div className="space-y-1">
                    <span className="block">{getPackageDescription()}</span>
                    <span className="block">{getStatusDescription(pkg)}</span>
                  </div>
                </CardDescription>

                {/* Action buttons - stacked vertically on mobile */}
                <div className="space-y-2 w-full">
                  {pkg.status === 'quote_expired' && onRequestRequote && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestRequote(pkg);
                      }}
                      className="text-xs w-full flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      Solicitar Nueva Cotización
                    </Button>
                  )}
                  {onDeletePackage && [
                    'pending_approval',
                    'approved', 
                    'matched',
                    'quote_sent',
                    'quote_accepted',
                    'quote_rejected',
                    'quote_expired',
                    'payment_pending',
                    'payment_pending_approval'
                  ].includes(pkg.status) && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteDialog(true);
                      }}
                      className="text-xs w-full"
                    >
                      Eliminar pedido
                    </Button>
                  )}
                  
                  {/* Shopper Action Button - mobile optimized */}
                  {pkg.status === 'quote_sent' && (!pkg.quote_expires_at || (pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date())) ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuote(pkg, 'user');
                      }}
                      className="text-xs font-medium w-full"
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
                      className="text-xs font-medium w-full"
                    >
                      <CreditCard className="h-3 w-3 mr-1" />
                      Pagar
                    </Button>
                  ) : (pkg.status === 'pending_purchase' || 
                       (pkg.status === 'purchased' && !pkg.tracking_info) ||
                       (pkg.status === 'purchased' && pkg.tracking_info && typeof pkg.tracking_info === 'object' && !(pkg.tracking_info as any)?.tracking_url) ||
                       pkg.status === 'payment_pending_approval') ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShippingInfoModal(true);
                      }}
                      className="text-xs font-medium w-full"
                    >
                      📦 Subir comprobante compra
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : (
              // Desktop layout (original)
              <div className="flex flex-col gap-2 w-full min-w-0 overflow-hidden">
                {/* Title row */}
                <div className="flex items-start justify-between w-full min-w-0 gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base lg:text-lg w-full min-w-0 overflow-hidden">
                      <span className="truncate flex items-center gap-2 w-full">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate">
                          {pkg.item_description || 'Sin descripción'}
                        </span>
                      </span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {needsAction && (
                      <NotificationBadge count={1} />
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>
              
                {/* Description and Action buttons row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full min-w-0">
                  <CardDescription className="text-xs sm:text-sm min-w-0 flex-1">
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <span className="truncate max-w-full">Precio: ${pkg.estimated_price}</span>
                      <span className="truncate max-w-full text-muted-foreground">
                        {getStatusDescription(pkg)}
                      </span>
                    </div>
                  </CardDescription>
                  
                  {/* Action buttons - responsive layout */}
                  <div className="flex flex-col gap-2 w-full sm:w-auto sm:flex-row sm:gap-2 sm:flex-shrink-0">
                    {pkg.status === 'quote_expired' && onRequestRequote && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRequestRequote(pkg);
                      }}
                      className="text-xs sm:text-sm w-full sm:w-auto flex items-center gap-2"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span className="hidden sm:inline">Solicitar Nueva Cotización</span>
                      <span className="sm:hidden">Nueva Cotización</span>
                    </Button>
                    )}
                    {onDeletePackage && [
                      'pending_approval',
                      'approved', 
                      'matched',
                      'quote_sent',
                      'quote_accepted',
                      'quote_rejected',
                      'quote_expired',
                      'payment_pending',
                      'payment_pending_approval'
                    ].includes(pkg.status) && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowDeleteDialog(true);
                        }}
                        className="text-xs sm:text-sm w-full sm:w-auto"
                      >
                        <span className="hidden sm:inline">Eliminar pedido</span>
                        <span className="sm:hidden">Eliminar</span>
                      </Button>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 overflow-hidden">
                  {/* Shopper Action Button - Different for different statuses */}
                  {pkg.status === 'quote_sent' && (!pkg.quote_expires_at || (pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date())) ? (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        onQuote(pkg, 'user');
                      }}
                      className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full truncate"
                    >
                      <span className="truncate">Ver y Aceptar Cotización</span>
                    </Button>
                  ) : pkg.status === 'payment_pending' ? (
                    <Button
                      size="sm"
                      variant="default"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPaymentModal(true);
                      }}
                      className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full"
                    >
                      <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Pagar</span>
                    </Button>
                  ) : (pkg.status === 'pending_purchase' || 
                       (pkg.status === 'purchased' && !pkg.tracking_info) ||
                       (pkg.status === 'purchased' && pkg.tracking_info && typeof pkg.tracking_info === 'object' && !(pkg.tracking_info as any)?.tracking_url) ||
                       pkg.status === 'payment_pending_approval') && (
                    <Button
                      size="sm"
                      variant="success"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowShippingInfoModal(true);
                      }}
                      className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full"
                    >
                      📦 <span className="ml-1 truncate">Subir comprobante compra</span>
                    </Button>
                  )}
   
                  {/* Badge showing admin notes if any */}
                  {((pkg as any).admin_notes || (pkg as any).estimated_price_note) && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-[10px] sm:text-xs cursor-help flex-shrink-0">
                            ℹ️ Nota admin
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-80">
                          <div className="space-y-1">
                            {(pkg as any).admin_notes && (
                              <p><strong>Nota:</strong> {(pkg as any).admin_notes}</p>
                            )}
                            {(pkg as any).estimated_price_note && (
                              <p><strong>Precio estimado:</strong> {(pkg as any).estimated_price_note}</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}

                   {/* Package Actions Dropdown */}
                   {onDeletePackage && viewMode === 'user' && (
                     <DropdownMenu>
                       <DropdownMenuTrigger asChild>
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-auto w-auto p-1 rounded-full"
                           onClick={(e) => e.stopPropagation()}
                         >
                           <MoreHorizontal className="h-4 w-4" />
                         </Button>
                       </DropdownMenuTrigger>
                       <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                         {onEditPackage && [
                           'pending_approval',
                           'approved', 
                           'matched',
                           'quote_sent',
                           'quote_rejected',
                           'quote_expired'
                         ].includes(pkg.status) && (
                           <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                             <Edit className="mr-2 h-4 w-4" />
                             Editar pedido
                           </DropdownMenuItem>
                         )}
                         {onArchivePackage && (
                           <DropdownMenuItem onClick={() => onArchivePackage(pkg)}>
                             <Archive className="mr-2 h-4 w-4" />
                             Archivar
                           </DropdownMenuItem>
                         )}
                       </DropdownMenuContent>
                     </DropdownMenu>
                   )}
                </div>
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className={`pt-0 pb-1 overflow-hidden ${isMobile ? 'px-2' : 'px-4'}`}>
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
                      <Package className="h-3 w-3" />
                      <span className="text-[10px]">Producto</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="estado" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <Activity className="h-3 w-3" />
                      <span className="text-[10px]">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="documentos" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <FileText className="h-3 w-3" />
                      <span className="text-[10px]">Docs</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="chat" 
                      className="flex flex-col items-center gap-1 px-2 py-2 text-xs data-[state=active]:bg-background"
                    >
                      <MessageCircle className="h-3 w-3" />
                      <span className="text-[10px]">Chat</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-3 max-h-64 overflow-y-auto">
                    <TabsContent value="producto" className="mt-0">
                      <ShopperPackageDetails pkg={pkg} />
                      {pkg.rejection_reason && (
                        <div className="mt-3">
                          <RejectionReasonDisplay rejectionReason={pkg.rejection_reason as any} />
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="estado" className="mt-0">
                      <PackageStatusTimeline currentStatus={pkg.status} />
                    </TabsContent>
                    
                    <TabsContent value="documentos" className="mt-0">
                      <UploadedDocumentsRegistry 
                        pkg={pkg} 
                        onEditDocument={handleDeleteDocument}
                      />
                    </TabsContent>
                    
                    <TabsContent value="chat" className="mt-0">
                      <PackageTimeline pkg={pkg} />
                    </TabsContent>
                  </div>
                </Tabs>
              </div>
              
              {/* Right Column: Package Actions and Info */}
              <div className="md:col-span-3 space-y-3 order-1 md:order-2 px-0 md:px-3">
                
                {/* Traveler Confirmation Section */}
                <TravelerConfirmationDisplay pkg={pkg} />
                
                {/* Priority Actions Section */}
                <div className="bg-white rounded-lg border border-muted/50 shadow-sm">
                  <div className="p-3 border-b border-muted/50">
                    <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                      <Box className="h-4 w-4 text-primary" />
                      Acciones Requeridas
                    </h3>
                  </div>
                  <div className="p-3">
                    <ShopperPackagePriorityActions
                      pkg={pkg}
                      onQuote={onQuote}
                    />
                  </div>
                </div>
                
                {/* Quote Information */}
                {hasValidQuote(pkg) && (
                  <div className="bg-white rounded-lg border border-muted/50 shadow-sm">
                    <div className="p-3 border-b border-muted/50">
                      <h3 className="text-sm font-medium text-foreground">Información de Cotización</h3>
                    </div>
                    <div className="p-3">
                      <PackageQuoteInfo 
                        quote={pkg.quote as any}
                        quoteExpiresAt={pkg.quote_expires_at}
                        deliveryMethod={pkg.delivery_method}
                        shopperTrustLevel={(pkg as any).shopper_trust_level}
                        adminTipAmount={pkg.admin_assigned_tip}
                      />
                    </div>
                  </div>
                )}
                
                {/* Shipping Instructions - For later stages */}
                {isShipmentReadyStatus(pkg) && (
                  <Collapsible open={shippingInfoOpen} onOpenChange={setShippingInfoOpen}>
                    <div className="bg-white rounded-lg border border-muted/50 shadow-sm">
                      <CollapsibleTrigger asChild>
                        <div className="p-3 border-b border-muted/50 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              Información de Envío
                            </h3>
                            {shippingInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 space-y-3">
                          <ShippingInstructions pkg={pkg} />
                          <ShippingInfoRegistry pkg={pkg} />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Edit Package Modal */}
      {showEditModal && onEditPackage && (
        <PackageRequestForm
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={(data) => {
            onEditPackage(data);
            setShowEditModal(false);
          }}
          initialData={pkg}
          
        />
      )}

      {/* Edit Document Modal */}
      {editDocumentModal.isOpen && pkg && (
        <EditDocumentModal
          isOpen={editDocumentModal.isOpen}
          onClose={() => setEditDocumentModal({ isOpen: false, documentType: null })}
          pkg={pkg}
          documentType={editDocumentModal.documentType}
          onUpdate={(type, data) => {
            onUploadDocument(pkg.id, type === 'purchase_confirmation' ? 'confirmation' : 'tracking', data);
            setEditDocumentModal({ isOpen: false, documentType: null });
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El pedido será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (onDeletePackage) {
                  onDeletePackage(pkg);
                  setShowDeleteDialog(false);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {showPaymentModal && (
        <ShopperPaymentInfoModal
          pkg={pkg}
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          onUploadComplete={() => setShowPaymentModal(false)}
        />
      )}

      {/* Shipping Info Modal */}
      {showShippingInfoModal && (
        <ShippingInfoModal
          pkg={pkg}
          isOpen={showShippingInfoModal}
          onClose={() => setShowShippingInfoModal(false)}
        />
      )}
    </Collapsible>
  );
};

export default React.memo(CollapsiblePackageCard);