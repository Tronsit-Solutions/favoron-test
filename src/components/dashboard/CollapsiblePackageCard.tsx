import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Edit, MoreHorizontal, Trash2, Box, Activity, FileText, MessageCircle, CreditCard, Package, Truck, RefreshCw, MapPin, DollarSign, Ban, Phone, Clock, XCircle, Send, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PackageStatusTimeline from "@/components/PackageStatusTimeline";
import UploadDocuments from "@/components/UploadDocuments";
import EditPackageModal from "@/components/dashboard/EditPackageModal";
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
import { OfficeAddressModal } from "@/components/ui/office-address-modal";
import { PartialDeliveryInfo } from "@/components/dashboard/PartialDeliveryInfo";
import QuoteCountdown from "@/components/dashboard/QuoteCountdown";
import { useStatusHelpers } from "@/hooks/useStatusHelpers";
import { useAuth } from "@/hooks/useAuth";
import { useFavoronCompanyInfo } from "@/hooks/useFavoronCompanyInfo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Package as PackageType, UserType, DocumentType } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

import { canCancelPackage, requiresRefundForCancellation } from "@/lib/permissions";
import { PackageCancellationModal } from "@/components/dashboard/PackageCancellationModal";
import { ProductStatusModal } from "@/components/ProductStatusModal";
import { Badge } from "@/components/ui/badge";
import { TripChangeAlertBadge } from "@/components/dashboard/TripChangeAlertBadge";
import TravelerRatingModal from "@/components/dashboard/TravelerRatingModal";
import PlatformReviewModal from "@/components/dashboard/PlatformReviewModal";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
interface CollapsiblePackageCardProps {
  pkg: PackageType;
  onQuote: (pkg: PackageType, userType: UserType) => void;
  onConfirmAddress: (pkg: PackageType) => void;
  onUploadDocument: (packageId: string, type: 'confirmation' | 'tracking' | 'payment_receipt', data: any) => void;
  onEditPackage?: (packageData: PackageType) => void;
  onDeletePackage?: (pkg: PackageType) => void;
  
  onRequestRequote?: (pkg: PackageType) => void;
  viewMode?: 'user';
  // External control props (for URL navigation from notifications)
  forceOpen?: boolean;
  forceTab?: string;
  onExternalControlHandled?: () => void;
}
const CollapsiblePackageCard = ({
  pkg,
  onQuote,
  onConfirmAddress,
  onUploadDocument,
  onEditPackage,
  onDeletePackage,
  
  onRequestRequote,
  viewMode = 'user',
  forceOpen,
  forceTab,
  onExternalControlHandled
}: CollapsiblePackageCardProps) => {
  const [isOpen, setIsOpen] = React.useState(forceOpen || false);
  const [activeTab, setActiveTab] = React.useState(forceTab || "producto");
  
  // Handle external control changes (e.g., from URL params)
  React.useEffect(() => {
    if (forceOpen && !isOpen) {
      setIsOpen(true);
    }
    if (forceTab && activeTab !== forceTab) {
      setActiveTab(forceTab);
    }
    if ((forceOpen || forceTab) && onExternalControlHandled) {
      // Notify parent that we've handled the external control
      onExternalControlHandled();
    }
  }, [forceOpen, forceTab]);
  const [showEditModal, setShowEditModal] = React.useState(false);
  const [shippingInfoOpen, setShippingInfoOpen] = React.useState(false);
  const [quoteInfoOpen, setQuoteInfoOpen] = React.useState(false);
  const [deliveryInfoOpen, setDeliveryInfoOpen] = React.useState(false);
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
  const [showOfficeModal, setShowOfficeModal] = React.useState(false);
  const [showProductStatusModal, setShowProductStatusModal] = React.useState(false);
  const [showCancellationModal, setShowCancellationModal] = React.useState(false);
  const [isResubmitting, setIsResubmitting] = React.useState(false);
  const [showTravelerRatingFromPreview, setShowTravelerRatingFromPreview] = React.useState(false);
  const [showPlatformReviewFromPreview, setShowPlatformReviewFromPreview] = React.useState(false);
  const [chatModalOpen, setChatModalOpen] = React.useState(false);
  const [showStatusModal, setShowStatusModal] = React.useState(false);

  const { data: existingRating } = useQuery({
    queryKey: ['traveler-rating', pkg.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('traveler_ratings')
        .select('id')
        .eq('package_id', pkg.id)
        .maybeSingle();
      return data;
    },
    enabled: pkg.status === 'completed' && pkg.feedback_completed !== true
  });

  const { data: existingPlatformReview } = useQuery({
    queryKey: ['platform-review', pkg.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('platform_reviews')
        .select('id')
        .eq('package_id', pkg.id)
        .maybeSingle();
      return data;
    },
    enabled: pkg.status === 'completed' && pkg.feedback_completed !== true
  });

  const needsFeedback = pkg.status === 'completed' && pkg.feedback_completed !== true && (!existingRating || !existingPlatformReview);
  const feedbackStep = !existingRating ? 'traveler' : 'platform';
  const {
    profile
  } = useAuth();
  const {
    getStatusBadge,
    getExpirationInfo
  } = useStatusHelpers();
  const expirationInfo = getExpirationInfo(pkg);
  const isMobile = useIsMobile();
  const { companyInfo } = useFavoronCompanyInfo();

  // Chat is available after payment
  const CHAT_AVAILABLE_STATUSES = ['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
  const isChatAvailable = CHAT_AVAILABLE_STATUSES.includes(pkg.status);

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatModalOpen(true);
  };
  const needsAction = viewMode === 'user' && (pkg.status === 'quote_sent' || pkg.status === 'quote_accepted' || pkg.status === 'payment_pending' || pkg.status === 'payment_pending_approval' || pkg.status === 'pending_purchase'
  // Removed: 'approved' condition - approved packages are pending traveler assignment, no shopper action needed
  );
  
  // Helper to check if we should show office pickup address
  const shouldShowOfficeAddress = 
    pkg.status === 'ready_for_pickup' || 
    (pkg.status === 'delivered_to_office' && pkg.delivery_method === 'pickup');
  const getStatusDescription = (pkg: any): string => {
    console.log('Package status:', pkg.status, 'Package:', pkg);
    switch (pkg.status) {
      case 'pending_approval':
        return 'Esperando aprobación del administrador';
      case 'approved':
        return "Aprobado - Esperando match con un viajero";
      case 'matched':
        return "Match con viajero - Esperando cotización";
      case 'quote_sent':
        const isExpired = pkg.quote_expires_at && new Date(pkg.quote_expires_at) < new Date();
        if (isExpired) {
          return 'Cotización expirada';
        }
        return 'Cotización recibida - Revisa y acepta';
      case 'quote_accepted':
      case 'payment_pending': {
        const isExpiredPayment = pkg.quote_expires_at && new Date(pkg.quote_expires_at) < new Date();
        if (isExpiredPayment) {
          return 'Cotización expirada - Solicita nueva cotización';
        }
        return pkg.status === 'quote_accepted' 
          ? 'Cotización aceptada - Esperando confirmación de pago'
          : 'Pago pendiente - Realiza el pago para continuar';
      }
      case 'payment_pending_approval':
        return 'Pago enviado - Esperando aprobación';
      case 'pending_purchase':
        return "Pago confirmado - Procede a realizar tu compra";
      case 'in_transit':
        // Check if there are multiple products and if any are received
        if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
          const receivedCount = pkg.products_data.filter((p: any) => p.receivedByTraveler === true).length;
          const totalCount = pkg.products_data.length;
          
          if (receivedCount > 0 && receivedCount < totalCount) {
            return `${receivedCount}/${totalCount} productos recibidos`;
          }
        }
        return 'Tu paquete está en camino. El viajero confirmará cuando lo reciba';
      case 'received_by_traveler':
        return "Recibido por viajero";
      case 'pending_office_confirmation':
        return 'Entregado - Esperando confirmación de oficina';
      case 'delivered_to_office':
        return pkg.delivery_method === 'delivery' 
          ? 'Recibirás tu paquete en tu domicilio' 
          : 'Ya puedes recoger el paquete';
      case 'completed':
        return 'Completado';
      case 'cancelled':
        return 'Cancelado';
      case 'quote_rejected':
        return 'Cotización rechazada';
      case 'quote_expired':
        return 'Cotización expirada - Solicita nueva cotización';
      case 'rejected':
        return 'Solicitud rechazada - Revisa el motivo y haz ajustes';
      case 'deadline_expired':
        return 'Fecha límite vencida - Reprograma tu fecha de entrega';
      default:
        return `Estado: ${pkg.status}`;
    }
  };
  const handleDeleteDocument = (documentType: 'purchase_confirmation' | 'tracking_info') => {
    setEditDocumentModal({
      isOpen: true,
      documentType
    });
  };
  const isShipmentReadyStatus = (pkg: any): boolean => {
    return pkg.status === 'in_transit' || pkg.status === 'received_by_traveler' || pkg.status === 'pending_office_confirmation' || pkg.status === 'delivered_to_office' || pkg.status === 'completed';
  };

  // Helper to check if partial delivery info should be shown (payment_pending and later)
  const shouldShowPartialDeliveryInfo = (pkg: any): boolean => {
    const eligibleStatuses = [
      'payment_pending',
      'payment_pending_approval', 
      'pending_purchase',
      'in_transit',
      'received_by_traveler',
      'pending_office_confirmation',
      'delivered_to_office',
      'completed'
    ];
    return eligibleStatuses.includes(pkg.status);
  };

  // Helper function to check if the package has valid quote
  const hasValidQuote = (pkg: any): boolean => {
    // If there's no quote at all, return false
    if (!pkg.quote) return false;
    
    // States where payment was already confirmed - always show quote
    const paidStates = ['payment_pending_approval', 'pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
    if (paidStates.includes(pkg.status)) return true;
    
    // For quote_accepted and payment_pending, check if quote hasn't expired
    if (['quote_accepted', 'payment_pending'].includes(pkg.status)) {
      return pkg.quote && (!pkg.quote_expires_at || new Date(pkg.quote_expires_at) > new Date());
    }
    
    // For earlier states, check if quote hasn't expired
    return pkg.quote && (!pkg.quote_expires_at || new Date(pkg.quote_expires_at) > new Date());
  };

  // Helper function to render package name with cancelled products styled
  const renderPackageName = () => {
    const products = (pkg.products_data as any[]) || [];
    
    // If no products or single product, show item_description with cancelled style if needed
    if (products.length <= 1) {
      const isCancelled = products[0]?.cancelled === true;
      const name = pkg.item_description || 'Sin descripción';
      
      if (isCancelled) {
        return (
          <>
            <span className="text-muted-foreground line-through">{name}</span>
            <span className="text-destructive ml-1">(cancelado)</span>
          </>
        );
      }
      return <>{name}</>;
    }
    
    // For multiple products: render each with cancelled styling
    const productElements = products.map((product, idx) => {
      const name = product.itemDescription?.substring(0, 20) || `Producto ${idx + 1}`;
      const isCancelled = product.cancelled === true;
      
      return (
        <React.Fragment key={idx}>
          {idx > 0 && ', '}
          {isCancelled ? (
            <>
              <span className="text-muted-foreground line-through">{name}</span>
              <span className="text-destructive text-xs ml-0.5">(cancelado)</span>
            </>
          ) : (
            <span>{name}</span>
          )}
        </React.Fragment>
      );
    });
    
    return <>Pedido de {products.length} productos: {productElements}</>;
  };

  // Helper function to get package name (text only, for non-JSX contexts)
  const getPackageName = () => {
    return pkg.item_description || 'Sin descripción';
  };

  // Helper function to get package description
  const getPackageDescription = () => {
    return `Precio: $${pkg.estimated_price}`;
  };
  // Determine if delete/cancel is available for this package
  const canDeleteSimple = canCancelPackage(pkg, pkg.user_id); // Pre-payment cancellation
  const canDeleteWithRefund = canCancelPackage(pkg, pkg.user_id, undefined, { withRefund: true }); // Post-payment with refund
  const needsRefund = requiresRefundForCancellation(pkg);
  const canDelete = canDeleteSimple || canDeleteWithRefund;

  // Calculate product confirmation counts
  const productsArray = (pkg.products_data as any[]) || [];
  const hasMultipleProducts = productsArray.length > 1;
  const confirmedProductsCount = productsArray.filter((p: any) => p.receivedByTraveler).length;
  const totalProductsCount = productsArray.length;
  const shouldShowProductStatusButton = 
    hasMultipleProducts && 
    confirmedProductsCount > 0 &&
    ['in_transit', 'received_by_traveler'].includes(pkg.status);

  // Check if package is fully cancelled (all products cancelled)
  const isCancelledPackage = pkg.status === 'cancelled';

  // Active statuses where trip change alerts should be shown
  const ACTIVE_PACKAGE_STATUSES_FOR_ALERTS = [
    'matched', 'quote_sent', 'quote_accepted', 'payment_pending_approval',
    'pending_purchase', 'in_transit', 'received_by_traveler', 
    'pending_office_confirmation', 'delivered_to_office'
  ];
  
  // Card content wrapper
  const cardContent = (
    <Card className={`relative transition-all duration-200 w-full max-w-full min-w-0 overflow-visible hover:shadow-md ${pkg.status === 'delivered_to_office' ? 'bg-green-50 border-2 border-green-500 ring-2 ring-green-200 shadow-lg' : ''} ${isCancelledPackage ? 'bg-muted/50 border-destructive/30 opacity-80' : ''}`}>
      {needsAction && <NotificationBadge count={1} className="absolute -top-2 -left-2 z-10" />}
      <CollapsibleTrigger asChild={!(isMobile && viewMode === 'user')}>
        <CardHeader className={`w-full max-w-full min-w-0 overflow-hidden relative ${isMobile ? 'px-3 py-3 cursor-default' : 'px-4 py-4 sm:px-6 sm:py-6 cursor-pointer hover:bg-muted/50 transition-colors'}`}>
            
            {/* Three dots menu - positioned absolutely in top-right corner */}
            {viewMode === 'user' && <DropdownMenu>
                <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="absolute top-2 right-2 h-7 w-7 p-0 z-20 hover:bg-muted rounded-full" onClick={e => e.stopPropagation()}>
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">Opciones del paquete</span>
            </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-background border shadow-lg z-50" onClick={e => e.stopPropagation()}>
                  {onEditPackage && ['pending_approval', 'approved', 'matched', 'quote_sent', 'quote_rejected', 'quote_expired', 'rejected'].includes(pkg.status) && <DropdownMenuItem onClick={() => setShowEditModal(true)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Editar pedido
                    </DropdownMenuItem>}
                  {onDeletePackage && canDeleteSimple && !needsRefund && <DropdownMenuItem onClick={e => {
                e.stopPropagation();
                setShowDeleteDialog(true);
              }} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar pedido
                  </DropdownMenuItem>}
                  {onDeletePackage && needsRefund && canDeleteWithRefund && <DropdownMenuItem onClick={e => {
                e.stopPropagation();
                setShowCancellationModal(true);
              }} className="text-destructive focus:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar con reembolso
                  </DropdownMenuItem>}
                  {onDeletePackage && !canDelete && <DropdownMenuItem disabled className="opacity-50">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Cancelar pedido
                    <span className="ml-2 text-xs">(No disponible)</span>
                  </DropdownMenuItem>}
                </DropdownMenuContent>
              </DropdownMenu>}
            
            {/* Mobile optimized layout */}
            {isMobile ? <div className="flex w-full">
              {/* Left: all content */}
              <div className="flex-1 min-w-0 space-y-3">
                {/* Product name and status in single row */}
                <div className="flex items-start gap-2 w-full pr-10">
                  <Package className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <CardTitle className="font-semibold leading-tight text-base sm:text-lg break-words line-clamp-2 text-left">
                      {renderPackageName()}
                    </CardTitle>
                  </div>
                </div>
                
                {/* Timer positioned below title for better mobile layout */}
                {pkg.quote_expires_at && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status) && new Date(pkg.quote_expires_at) > new Date() && (
                  <div className="-mt-1">
                    <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />
                  </div>
                )}

                {/* Package ID */}
                <CardDescription className="text-xs leading-tight text-muted-foreground max-w-full text-left">
                  <div className="space-y-1 max-w-full pl-5">
                    <span className="block break-words max-w-full text-muted-foreground">ID: {pkg.id.substring(0, 8)}</span>
                  </div>
                </CardDescription>
                <div className="pl-5 flex items-center gap-2 justify-start">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowStatusModal(true);
                    }}
                    className="text-xs h-7 px-2 gap-1 border-muted-foreground/30 text-muted-foreground hover:bg-muted/50"
                  >
                    {getStatusBadge(pkg.status, { pkg, isQuoteExpired: !!expirationInfo })}
                    <span>Ver detalle</span>
                  </Button>
                </div>

                {/* Quick Edit Button for actionable states - Mobile */}
                {viewMode === 'user' && onEditPackage && ['rejected', 'quote_rejected', 'quote_expired', 'deadline_expired'].includes(pkg.status) && (
                  <div className="pl-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                      }}
                      className="text-xs h-7 px-3 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar y reenviar
                    </Button>
                  </div>
                )}

                {/* Trip Change Alert Badge - Mobile (compact) */}
                {viewMode === 'user' && pkg.matched_trip_id && ACTIVE_PACKAGE_STATUSES_FOR_ALERTS.includes(pkg.status) && (
                  <div className="pl-5">
                    <TripChangeAlertBadge packageId={pkg.id} compact />
                  </div>
                )}

                {/* Product Status Button - Mobile */}
                {shouldShowProductStatusButton && (
                  <div className="pl-5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowProductStatusModal(true);
                      }}
                      className="text-xs w-full flex items-center justify-between gap-2"
                    >
                      <span className="flex items-center gap-1.5">
                        <Package className="h-3.5 w-3.5" />
                        Ver productos
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {confirmedProductsCount}/{totalProductsCount}
                      </Badge>
                    </Button>
                  </div>
                )}

                {/* Cancelled Package Banner - Mobile */}
                {isCancelledPackage && viewMode === 'user' && (
                  <div className="pl-5">
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                        <Ban className="h-4 w-4" />
                        <span className="text-sm">Este pedido ha sido cancelado</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">
                        {(() => {
                          const wasPaid = !!pkg.payment_receipt;
                          const hasRefundOrder = (pkg.quote as any)?.cancellations?.length > 0 || 
                            (pkg.products_data as any[])?.some((p: any) => p.refundOrderId);
                          
                          if (wasPaid && hasRefundOrder) {
                            return "Todos los productos fueron cancelados. Tu reembolso está siendo procesado.";
                          } else if (wasPaid) {
                            return "Este pedido fue cancelado. Si tienes preguntas sobre reembolsos, contacta a soporte.";
                          } else {
                            return "Este pedido fue cancelado antes de completar el pago.";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Rejected Package Banner - Mobile */}
                {pkg.status === 'rejected' && viewMode === 'user' && (
                  <div className="pl-5">
                    <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-orange-700 font-medium mb-2">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Solicitud Rechazada</span>
                      </div>
                      <p className="text-xs text-orange-700 mb-2">
                        <strong>Motivo:</strong> {pkg.rejection_reason || (pkg.admin_rejection as any)?.reason || 'No especificado'}
                      </p>
                      {(pkg.admin_rejection as any)?.timestamp && (
                        <p className="text-xs text-orange-500 mb-3">
                          Rechazado el: {format(new Date((pkg.admin_rejection as any).timestamp), 'dd MMM yyyy HH:mm', { locale: es })}
                        </p>
                      )}
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowEditModal(true);
                          }}
                          className="flex-1 text-xs"
                        >
                          <Edit className="h-3.5 w-3.5 mr-2" />
                          Editar Solicitud
                        </Button>
                        <Button 
                          size="sm"
                          onClick={async (e) => {
                            e.stopPropagation();
                            setIsResubmitting(true);
                            const { error } = await supabase
                              .from('packages')
                              .update({ 
                                status: 'pending_approval',
                                rejection_reason: null,
                                admin_rejection: null 
                              })
                              .eq('id', pkg.id);
                            
                            setIsResubmitting(false);
                            if (error) {
                              toast.error('Error al re-enviar la solicitud');
                            } else {
                              toast.success('Solicitud re-enviada para aprobación');
                            }
                          }}
                          disabled={isResubmitting}
                          className="flex-1 text-xs bg-orange-600 hover:bg-orange-700"
                        >
                          <Send className="h-3.5 w-3.5 mr-2" />
                          {isResubmitting ? 'Enviando...' : 'Re-enviar'}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Office Pickup Address Section - Mobile */}
                {shouldShowOfficeAddress && companyInfo && (
                  <div className="pl-5">
                    <div className="bg-success/10 border-2 border-success/30 rounded-lg p-3">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-success flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-success text-sm mb-1">📦 Dirección de recolección:</p>
                          <p className="text-sm text-foreground">{companyInfo.address_line_1}</p>
                          {companyInfo.address_line_2 && (
                            <p className="text-sm text-foreground">{companyInfo.address_line_2}</p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            {companyInfo.city}, {companyInfo.country} {companyInfo.postal_code}
                          </p>
                          {companyInfo.phone_number && (
                            <a 
                              href={`tel:${companyInfo.phone_number}`}
                              className="flex items-center gap-1.5 text-sm text-primary mt-2 hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Phone className="h-3.5 w-3.5" />
                              {companyInfo.phone_number}
                            </a>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="mt-3 w-full text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowOfficeModal(true);
                        }}
                      >
                        <Clock className="h-3.5 w-3.5 mr-1.5" />
                        Ver horarios de atención
                      </Button>
                    </div>
                  </div>
                )}

                {/* Action buttons - stacked vertically on mobile */}
                {!isCancelledPackage && (
                <div className="space-y-2 w-full max-w-full pl-5">
                  {/* Botón re-cotización para cotizaciones expiradas (status quote_expired O cotización expirada en quote_sent/payment_pending/quote_accepted) */}
                  {(pkg.status === 'quote_expired' || 
                    ((pkg.status === 'quote_sent' || pkg.status === 'payment_pending' || pkg.status === 'quote_accepted') && 
                     pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date())) && 
                   onRequestRequote && (
                    <Button size="sm" variant="shopper" onClick={e => {
                        e.stopPropagation();
                        onRequestRequote(pkg);
                      }} className="text-xs w-full flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        Solicitar Nueva Cotización
                      </Button>
                  )}
                  
                  {/* Shopper Action Button - mobile optimized */}
                  {pkg.status === 'quote_sent' && (!pkg.quote_expires_at || pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date()) ? <Button size="sm" variant="success" onClick={e => {
                e.stopPropagation();
                onQuote(pkg, 'user');
              }} className="text-xs font-medium w-full">
                      Ver y Aceptar Cotización
                    </Button> : pkg.status === 'payment_pending' && (!pkg.quote_expires_at || new Date(pkg.quote_expires_at) > new Date()) ? <Button size="sm" variant="default" onClick={e => {
                e.stopPropagation();
                setShowPaymentModal(true);
              }} className="text-xs font-medium w-full">
                      <CreditCard className="h-3 w-3 mr-1" />
                      Pagar
                    </Button> : pkg.status === 'pending_purchase' || pkg.status === 'in_transit' && (!pkg.purchase_confirmation || !pkg.tracking_info) ? <Button size="sm" variant="success" onClick={e => {
                e.stopPropagation();
                setShowShippingInfoModal(true);
              }} className="text-xs font-medium w-full">
                      📦 Subir comprobante compra
                     </Button> : pkg.status === 'delivered_to_office' ? (
                      pkg.delivery_method === 'delivery' ? (
                        <div className="text-xs font-medium w-full p-3 bg-success/10 border border-success/20 rounded-md">
                          <div className="flex items-center gap-2">
                            <Truck className="h-4 w-4 text-success flex-shrink-0" />
                            <span className="text-foreground">Tu paquete será entregado a domicilio</span>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="success" onClick={e => {
                          e.stopPropagation();
                          setShowOfficeModal(true);
                        }} className="text-xs font-medium w-full">
                          <MapPin className="h-3 w-3 mr-1" />
                          Recolectar paquete
                        </Button>
                      )
                    ) : null}
                  
                  {/* Calificar button - mobile */}
                  {needsFeedback && (
                    <Button size="sm" variant="outline" onClick={e => {
                      e.stopPropagation();
                      if (feedbackStep === 'traveler') {
                        setShowTravelerRatingFromPreview(true);
                      } else {
                        setShowPlatformReviewFromPreview(true);
                      }
                    }} className="text-xs font-medium w-full bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500">
                      <Star className="h-3 w-3 mr-1" />
                      {feedbackStep === 'traveler' ? 'Calificar viajero' : 'Calificar Favorón'}
                    </Button>
                  )}
                </div>
                )}
              </div> :
          // Desktop layout (original)
          <div className="flex flex-col gap-2 w-full min-w-0 overflow-hidden">
                {/* Title row */}
                <div className="flex items-start justify-between w-full min-w-0 gap-2">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm sm:text-base lg:text-lg w-full min-w-0 overflow-hidden">
                      <span className="truncate flex items-center gap-2 w-full">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                        <span className="truncate">
                          {renderPackageName()}
                        </span>
                      </span>
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    {shouldShowProductStatusButton && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowProductStatusModal(true);
                        }}
                        className="flex items-center gap-1.5"
                      >
                        <Package className="h-3.5 w-3.5" />
                        <span>Ver productos</span>
                        <Badge variant="secondary" className="ml-1">
                          {confirmedProductsCount}/{totalProductsCount}
                        </Badge>
                      </Button>
                    )}
                    {pkg.quote_expires_at && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(pkg.status) && new Date(pkg.quote_expires_at) > new Date() && <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />}
                    
                  </div>
                </div>
              
                {/* Description and Action buttons row */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full min-w-0">
                  <CardDescription className="text-xs sm:text-sm min-w-0 flex-1">
                    <div className="flex flex-col gap-1 w-full min-w-0">
                      <span className="truncate max-w-full text-muted-foreground">
                        ID: #{pkg.id.substring(0, 6)}
                      </span>
                      <span className="truncate max-w-full text-muted-foreground">
                        {getStatusDescription(pkg)}
                      </span>
                    </div>
                  </CardDescription>

                  {/* Quick Edit Button for actionable states - Desktop */}
                  {viewMode === 'user' && onEditPackage && ['rejected', 'quote_rejected', 'quote_expired', 'deadline_expired'].includes(pkg.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditModal(true);
                      }}
                      className="text-xs h-7 px-3 border-primary/30 text-primary hover:bg-primary/10"
                    >
                      <Edit className="h-3 w-3 mr-1.5" />
                      Editar y reenviar
                    </Button>
                  )}

                  {/* Trip Change Alert Badge - Desktop (compact) */}
                  {viewMode === 'user' && pkg.matched_trip_id && ACTIVE_PACKAGE_STATUSES_FOR_ALERTS.includes(pkg.status) && (
                    <TripChangeAlertBadge packageId={pkg.id} compact />
                  )}
                </div>
                
                {/* Cancelled Package Banner - Desktop */}
                {isCancelledPackage && viewMode === 'user' ? (
                  <div className="w-full">
                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-destructive font-medium mb-1">
                            <Ban className="h-4 w-4" />
                            <span className="text-sm">Este pedido ha sido cancelado</span>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const wasPaid = !!pkg.payment_receipt;
                              const hasRefundOrder = (pkg.quote as any)?.cancellations?.length > 0 || 
                                (pkg.products_data as any[])?.some((p: any) => p.refundOrderId);
                              
                              if (wasPaid && hasRefundOrder) {
                                return "Todos los productos fueron cancelados. Tu reembolso está siendo procesado.";
                              } else if (wasPaid) {
                                return "Este pedido fue cancelado. Si tienes preguntas sobre reembolsos, contacta a soporte.";
                              } else {
                                return "Este pedido fue cancelado antes de completar el pago.";
                              }
                            })()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : pkg.status === 'rejected' && viewMode === 'user' ? (
                  /* Rejected Package Banner - Desktop */
                  <div className="w-full">
                    <div className="bg-orange-50 border border-orange-300 rounded-lg p-3">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 text-orange-700 font-medium mb-1">
                            <XCircle className="h-4 w-4" />
                            <span className="text-sm">Solicitud Rechazada</span>
                          </div>
                          <p className="text-xs text-orange-700 mb-1">
                            <strong>Motivo:</strong> {pkg.rejection_reason || (pkg.admin_rejection as any)?.reason || 'No especificado'}
                          </p>
                          {(pkg.admin_rejection as any)?.timestamp && (
                            <p className="text-xs text-orange-500">
                              Rechazado el: {format(new Date((pkg.admin_rejection as any).timestamp), 'dd MMM yyyy HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowEditModal(true);
                            }}
                            className="text-xs"
                          >
                            <Edit className="h-3.5 w-3.5 mr-2" />
                            Editar
                          </Button>
                          <Button 
                            size="sm"
                            onClick={async (e) => {
                              e.stopPropagation();
                              setIsResubmitting(true);
                              const { error } = await supabase
                                .from('packages')
                                .update({ 
                                  status: 'pending_approval',
                                  rejection_reason: null,
                                  admin_rejection: null 
                                })
                                .eq('id', pkg.id);
                              
                              setIsResubmitting(false);
                              if (error) {
                                toast.error('Error al re-enviar la solicitud');
                              } else {
                                toast.success('Solicitud re-enviada para aprobación');
                              }
                            }}
                            disabled={isResubmitting}
                            className="text-xs bg-orange-600 hover:bg-orange-700"
                          >
                            <Send className="h-3.5 w-3.5 mr-2" />
                            {isResubmitting ? 'Enviando...' : 'Re-enviar'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : shouldShowOfficeAddress && companyInfo ? (
                  /* Office Pickup Address Section - Desktop */
                  <div className="w-full">
                    <div className="bg-success/10 border-2 border-success/30 rounded-lg p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3 flex-1">
                          <MapPin className="h-5 w-5 text-success flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-success mb-1">📦 Dirección de recolección:</p>
                            <p className="text-sm text-foreground">{companyInfo.address_line_1}</p>
                            {companyInfo.address_line_2 && (
                              <p className="text-sm text-foreground">{companyInfo.address_line_2}</p>
                            )}
                            <p className="text-sm text-muted-foreground">
                              {companyInfo.city}, {companyInfo.country} {companyInfo.postal_code}
                            </p>
                            {companyInfo.phone_number && (
                              <a 
                                href={`tel:${companyInfo.phone_number}`}
                                className="flex items-center gap-1.5 text-sm text-primary mt-2 hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Phone className="h-4 w-4" />
                                {companyInfo.phone_number}
                              </a>
                            )}
                          </div>
                        </div>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowOfficeModal(true);
                          }}
                        >
                          <Clock className="h-4 w-4 mr-1.5" />
                          Ver horarios
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="flex flex-col sm:flex-row gap-2 w-full min-w-0 overflow-hidden">
                  {/* Shopper Action Button - Different for different statuses */}
                  {pkg.status === 'quote_sent' && (!pkg.quote_expires_at || pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date()) ? <Button size="sm" variant="success" onClick={e => {
                e.stopPropagation();
                onQuote(pkg, 'user');
              }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full truncate">
                      <span className="truncate">Ver y Aceptar Cotización</span>
                    </Button> : pkg.status === 'payment_pending' && (!pkg.quote_expires_at || new Date(pkg.quote_expires_at) > new Date()) ? <Button size="sm" variant="default" onClick={e => {
                e.stopPropagation();
                setShowPaymentModal(true);
              }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full">
                      <CreditCard className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">Pagar</span>
                    </Button> : (pkg.status === 'pending_purchase' || (pkg.status === 'in_transit' && (!pkg.purchase_confirmation || !pkg.tracking_info))) ? <Button size="sm" variant="success" onClick={e => {
                e.stopPropagation();
                setShowShippingInfoModal(true);
              }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full">
                      <span className="truncate">Ver dirección y comprar</span>
                     </Button> : pkg.status === 'delivered_to_office' ? (
                      pkg.delivery_method === 'delivery' ? (
                        <div className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full p-2 bg-success/10 border border-success/20 rounded-md">
                          <div className="flex items-center gap-2">
                            <Truck className="h-3 w-3 text-success flex-shrink-0" />
                            <span className="truncate text-foreground">Será entregado a domicilio</span>
                          </div>
                        </div>
                      ) : (
                        <Button size="sm" variant="success" onClick={e => {
                          e.stopPropagation();
                          setShowOfficeModal(true);
                        }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full">
                          <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                          <span className="truncate">Recoger paquete</span>
                        </Button>
                      )
                    ) : (pkg.status === 'quote_expired' || 
                      ((pkg.status === 'quote_sent' || pkg.status === 'payment_pending' || pkg.status === 'quote_accepted') && 
                       pkg.quote_expires_at && new Date(pkg.quote_expires_at) <= new Date())) && onRequestRequote ? (
                      <Button size="sm" variant="shopper" onClick={e => {
                        e.stopPropagation();
                        onRequestRequote(pkg);
                      }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full flex items-center gap-2">
                        <RefreshCw className="h-3 w-3" />
                        <span className="truncate">Solicitar Nueva Cotización</span>
                      </Button>
                    ) : null}
                  
                  {/* Calificar button - desktop */}
                  {needsFeedback && (
                    <Button size="sm" variant="outline" onClick={e => {
                      e.stopPropagation();
                      if (feedbackStep === 'traveler') {
                        setShowTravelerRatingFromPreview(true);
                      } else {
                        setShowPlatformReviewFromPreview(true);
                      }
                    }} className="text-xs font-medium flex-shrink-0 w-full sm:w-auto max-w-full bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500">
                      <Star className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{feedbackStep === 'traveler' ? 'Calificar viajero' : 'Calificar Favorón'}</span>
                    </Button>
                  )}

                  {/* Show upload tracking button for purchased items without tracking */}
   
                  {/* Badge showing admin notes if any */}
                  {((pkg as any).admin_notes || (pkg as any).estimated_price_note) && <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="px-2 py-1 bg-muted text-muted-foreground rounded text-[10px] sm:text-xs cursor-help flex-shrink-0">
                            ℹ️ Nota admin
                          </span>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-80">
                          <div className="space-y-1">
                            {(pkg as any).admin_notes && <p><strong>Nota:</strong> {(pkg as any).admin_notes}</p>}
                            {(pkg as any).estimated_price_note && <p><strong>Precio estimado:</strong> {(pkg as any).estimated_price_note}</p>}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>}

                  {/* Chat shortcut + Status badge aligned with action buttons */}
                  <div className="flex items-center gap-2 ml-auto flex-shrink-0">
                    {isChatAvailable && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 rounded-full" onClick={handleChatClick}>
                              <MessageCircle className="h-6 w-6 text-primary" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent side="bottom">
                            <p>Abrir chat</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {getStatusBadge(pkg.status)}
                  </div>

                 </div>
                )}
               </div>}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className={`pt-0 pb-1 overflow-hidden ${isMobile ? 'px-2' : 'px-4'}`}>
            {/* Main Content Layout - 2 Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2 md:gap-0 overflow-hidden min-w-0">
              
              {/* Left Column: Horizontal Tabs */}
              <div className="md:col-span-2 bg-muted/30 rounded-lg border border-muted/50 order-2 md:order-1 overflow-hidden min-w-0 max-w-full">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-full">
                  <TabsList className="!grid w-full max-w-full min-w-0 grid-cols-3 bg-muted/50 rounded-none rounded-t-lg h-auto p-1 overflow-hidden">
                    <TabsTrigger value="producto" className="flex flex-col items-center gap-1 px-2 py-2 text-xs min-w-0 !whitespace-normal text-center truncate data-[state=active]:bg-background">
                      <Package className="h-3 w-3" />
                      <span className="text-[10px]">Producto</span>
                    </TabsTrigger>
                    <TabsTrigger value="estado" className="flex flex-col items-center gap-1 px-2 py-2 text-xs min-w-0 !whitespace-normal text-center truncate data-[state=active]:bg-background">
                      <Activity className="h-3 w-3" />
                      <span className="text-[10px]">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger value="documentos" className="flex flex-col items-center gap-1 px-2 py-2 text-xs min-w-0 !whitespace-normal text-center truncate data-[state=active]:bg-background">
                      <FileText className="h-3 w-3" />
                      <span className="text-[10px]">Docs</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <div className="p-3 max-h-64 overflow-y-auto max-w-full min-w-0 overflow-x-hidden">
                    <TabsContent value="producto" className="mt-0">
                      <ShopperPackageDetails pkg={pkg} />
                      {pkg.status === 'rejected' && pkg.rejection_reason && <div className="mt-3">
                          <RejectionReasonDisplay rejectionReason={pkg.rejection_reason as any} />
                        </div>}
                    </TabsContent>
                    
                    <TabsContent value="estado" className="mt-0">
                      <PackageStatusTimeline currentStatus={pkg.status} />
                    </TabsContent>
                    
                    <TabsContent value="documentos" className="mt-0">
                      <UploadedDocumentsRegistry pkg={pkg} onEditDocument={handleDeleteDocument} />
                    </TabsContent>
                    
                  </div>
                </Tabs>
              </div>
              
              {/* Right Column: Package Actions and Info */}
              <div className="md:col-span-3 space-y-3 order-1 md:order-2 px-0 md:px-3 min-w-0 max-w-full">
                
                {/* Traveler Confirmation Section */}
                <TravelerConfirmationDisplay pkg={pkg} />
                
                {/* Quote Information */}
                {hasValidQuote(pkg) && <Collapsible open={quoteInfoOpen} onOpenChange={setQuoteInfoOpen}>
                    <div className="bg-white rounded-lg border border-muted/50 shadow-sm">
                      <CollapsibleTrigger asChild>
                        <div className="p-3 border-b border-muted/50 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <DollarSign className="h-4 w-4 text-primary" />
                              Cotización del Pedido
                            </h3>
                            {quoteInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3">
                          <PackageQuoteInfo 
                            quote={pkg.quote as any} 
                            quoteExpiresAt={pkg.quote_expires_at} 
                            packageStatus={pkg.status}
                            travelerInfo={{
                              firstName: (pkg as any).trips?.profiles?.first_name,
                              lastName: (pkg as any).trips?.profiles?.last_name,
                              avatarUrl: (pkg as any).trips?.profiles?.avatar_url,
                            }}
                            tripInfo={{
                              fromCity: (pkg as any).trips?.from_city,
                              toCity: (pkg as any).trips?.to_city,
                              deliveryDate: (pkg as any).trips?.delivery_date,
                            }}
                          />
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>}

                {/* Delivery Information - Shows partial info before payment, full info after */}
                {shouldShowPartialDeliveryInfo(pkg) && (
                  <Collapsible open={deliveryInfoOpen} onOpenChange={setDeliveryInfoOpen}>
                    <div className="bg-white rounded-lg border border-muted/50 shadow-sm">
                      <CollapsibleTrigger asChild>
                        <div className="p-3 border-b border-muted/50 cursor-pointer hover:bg-muted/30 transition-colors">
                          <div className="flex items-center justify-between">
                            <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
                              <Truck className="h-4 w-4 text-primary" />
                              Información de Entrega
                            </h3>
                            {deliveryInfoOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </div>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="p-3 space-y-3">
                          {/* Show partial info for payment_pending and payment_pending_approval */}
                          {['payment_pending', 'payment_pending_approval'].includes(pkg.status) ? (
                            <PartialDeliveryInfo pkg={pkg} />
                          ) : (
                            /* Show full info for pending_purchase and later stages */
                            <>
                              <ShippingInstructions pkg={pkg} />
                              <ShippingInfoRegistry pkg={pkg} />
                            </>
                          )}
                        </div>
                      </CollapsibleContent>
                    </div>
                  </Collapsible>
                )}
                
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
                      onDeletePackage={onDeletePackage}
                      onRequestRequote={onRequestRequote}
                    />
                  </div>
                </div>
                
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
  );

  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        {cardContent}
      </Collapsible>

      {/* Edit Package Modal */}
      {showEditModal && onEditPackage && (
        <EditPackageModal 
          isOpen={showEditModal} 
          onClose={() => setShowEditModal(false)} 
          pkg={pkg}
          onSave={(updatedData) => {
            onEditPackage({ ...pkg, ...updatedData } as PackageType);
          }}
        />
      )}

      {/* Edit Document Modal */}
      {editDocumentModal.isOpen && pkg && <EditDocumentModal isOpen={editDocumentModal.isOpen} onClose={() => setEditDocumentModal({
        isOpen: false,
        documentType: null
      })} pkg={pkg} documentType={editDocumentModal.documentType} onUpdate={(type, data) => {
        onUploadDocument(pkg.id, type === 'purchase_confirmation' ? 'confirmation' : 'tracking', data);
        setEditDocumentModal({
          isOpen: false,
          documentType: null
        });
      }} />}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent onClick={e => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cancelar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción cancelará tu solicitud de paquete. No se podrá deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={e => e.stopPropagation()}>No cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={(e) => {
                e.stopPropagation();
                console.log('🗑️ Delete dialog confirmed for package:', pkg.id);
                if (onDeletePackage) {
                  onDeletePackage(pkg);
                }
                setShowDeleteDialog(false);
              }} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sí, cancelar pedido
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Payment Modal */}
      {showPaymentModal && <ShopperPaymentInfoModal pkg={pkg} isOpen={showPaymentModal} onClose={() => setShowPaymentModal(false)} onUploadComplete={updatedPkg => {
        // The PaymentReceiptUpload component already updates the package in Supabase
        // We just need to call onUploadDocument to trigger any additional state updates
        if (onUploadDocument && updatedPkg.payment_receipt) {
          onUploadDocument(pkg.id, 'payment_receipt', updatedPkg.payment_receipt);
        }
        setShowPaymentModal(false);
      }} />}

      {/* Shipping Info Modal */}
      {showShippingInfoModal && <ShippingInfoModal pkg={pkg} isOpen={showShippingInfoModal} onClose={() => setShowShippingInfoModal(false)} onDocumentUpload={(type, data) => onUploadDocument(pkg.id, type, data)} />}

      {/* Office Address Modal */}
      {showOfficeModal && <OfficeAddressModal isOpen={showOfficeModal} onClose={() => setShowOfficeModal(false)} mode="pickup" />}

      {/* Product Status Modal */}
      {showProductStatusModal && (
        <ProductStatusModal
          isOpen={showProductStatusModal}
          onClose={() => setShowProductStatusModal(false)}
          products={productsArray}
          packageId={pkg.id}
          itemDescription={pkg.item_description}
        />
      )}

      {/* Traveler Rating Modal from preview */}
      {showTravelerRatingFromPreview && (
        <TravelerRatingModal
          open={showTravelerRatingFromPreview}
          onOpenChange={setShowTravelerRatingFromPreview}
          pkg={pkg}
          onSuccess={() => setShowPlatformReviewFromPreview(true)}
        />
      )}

      {/* Platform Review Modal after traveler rating */}
      {showPlatformReviewFromPreview && (
        <PlatformReviewModal
          open={showPlatformReviewFromPreview}
          onOpenChange={setShowPlatformReviewFromPreview}
          packageId={pkg.id}
        />
      )}

      {/* Package Cancellation Modal with Refund */}
      {showCancellationModal && (
        <PackageCancellationModal
          isOpen={showCancellationModal}
          onClose={() => setShowCancellationModal(false)}
          packageId={pkg.id}
          quote={(pkg.quote as any) || {}}
          products={productsArray}
          onCancellationComplete={() => {
            if (onDeletePackage) {
              onDeletePackage(pkg);
            }
          }}
        />
      )}

      {/* Chat Modal */}
      <Dialog open={chatModalOpen} onOpenChange={setChatModalOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat - {pkg.item_description || 'Paquete'}</span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 min-h-0 overflow-hidden">
            <PackageTimeline 
              pkg={pkg} 
              className="h-full"
            />
          </div>
        </DialogContent>
      </Dialog>
      {/* Status Detail Modal (Mobile) */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">Estado del paquete</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {getStatusBadge(pkg.status, { pkg, isQuoteExpired: !!expirationInfo })}
            </div>
            <p className="text-sm text-muted-foreground">{getStatusDescription(pkg)}</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
export default React.memo(CollapsiblePackageCard);