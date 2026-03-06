import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, MessageCircle, FileText, Clock, ExternalLink, CreditCard, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import TravelerPackageTimeline from "./TravelerPackageTimeline";
import PackageReceiptConfirmation from "../PackageReceiptConfirmation";
import { ProductReceiptConfirmation } from "../ProductReceiptConfirmation";
import TravelerPackagePriorityActions from "./traveler/TravelerPackagePriorityActions";
import TravelerPackageDetails from "./traveler/TravelerPackageDetails";
import TravelerPackageInfo from "./traveler/TravelerPackageInfo";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import { TravelerConfirmationDisplay } from "./TravelerConfirmationDisplay";
import { TravelerPackageStatusBadge } from "./traveler/TravelerPackageStatusBadge";
import QuoteCountdown from "./QuoteCountdown";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { usePackageActions } from "@/hooks/usePackageActions";

interface CollapsibleTravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
  onConfirmReceived: (packageId: string, photo?: string) => void;
  onConfirmOfficeDelivery?: (packageId: string) => void;
  onDismissExpiredPackage?: (packageId: string) => void;
  updatePackage: (id: string, updates: any) => Promise<any>;
  hasPendingAction?: boolean;
  autoExpand?: boolean;
}

const CollapsibleTravelerPackageCard = ({ 
  pkg,
  getStatusBadge,
  onQuote,
  onConfirmReceived,
  onConfirmOfficeDelivery,
  onDismissExpiredPackage,
  updatePackage,
  hasPendingAction = false,
  autoExpand = false
}: CollapsibleTravelerPackageCardProps) => {
  const { handleConfirmProductReceived } = usePackageActions();
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [showProductConfirmationModal, setShowProductConfirmationModal] = useState(false);
  const [documentModal, setDocumentModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    type: 'image' | 'pdf' | 'tracking';
    data?: any;
  }>({
    isOpen: false,
    title: '',
    url: '',
    type: 'image'
  });
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState("producto");
  
  const { user } = useAuth();

  // Chat is available after payment
  const CHAT_AVAILABLE_STATUSES = ['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'completed'];
  const isChatAvailable = CHAT_AVAILABLE_STATUSES.includes(pkg.status);

  const [chatModalOpen, setChatModalOpen] = useState(false);

  const handleChatClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setChatModalOpen(true);
  };

  // Auto-reconciliation: detect if package needs status correction
  const needsReconciliation = useMemo(() => {
    if (pkg.status !== 'in_transit' || !pkg.products_data?.length) return false;
    
    // Check if all products are confirmed or cancelled
    const allResolved = pkg.products_data.every(
      (p: any) => p.receivedByTraveler || p.cancelled
    );
    
    return allResolved;
  }, [pkg.status, pkg.products_data]);

  // Auto-reconcile on mount if needed
  useEffect(() => {
    if (needsReconciliation && updatePackage) {
      console.log('🔄 Auto-reconciling package status:', pkg.id);
      updatePackage(pkg.id, {
        status: 'received_by_traveler',
        traveler_confirmation: {
          confirmedAt: new Date().toISOString(),
          allProductsConfirmed: true,
          autoReconciled: true
        }
      });
    }
  }, [needsReconciliation, pkg.id, updatePackage]);

  // Helper to detect if quote is expired (either by status OR by expired timer)
  const isQuoteExpired = (p: any): boolean => {
    if (p.status === 'quote_expired') return true;
    // Check if timer has expired but backend hasn't updated status yet
    if ((p.status === 'quote_sent' || p.status === 'payment_pending') && 
        p.quote_expires_at && 
        new Date(p.quote_expires_at).getTime() <= Date.now()) {
      return true;
    }
    return false;
  };

  // Get effective status (accounting for expired timer)
  const getEffectiveStatus = (p: any): string => {
    if (isQuoteExpired(p)) return 'quote_expired';
    return p.status;
  };

  const handleConfirmReceived = (photo?: string) => {
    console.log('🎯 handleConfirmReceived called for package:', pkg.id, pkg.item_description, 'photo:', !!photo);
    onConfirmReceived(pkg.id, photo);
  };

  const handleConfirmReceivedClick = () => {
    console.log('🎯 handleConfirmReceivedClick called for package:', pkg.id, pkg.item_description);
    
    // Check if multi-product package
    const hasMultipleProducts = pkg.products_data && pkg.products_data.length > 1;
    
    if (hasMultipleProducts) {
      setShowProductConfirmationModal(true);
    } else {
      setShowConfirmationModal(true);
    }
  };

  const handleConfirmOfficeDeliveryClick = () => {
    // Solo actualizar el status del paquete sin modal bancario
    if (onConfirmOfficeDelivery) {
      onConfirmOfficeDelivery(pkg.id);
    }
  };

  const openDocumentModal = (title: string, url: string, type: 'image' | 'pdf' | 'tracking', data?: any) => {
    setDocumentModal({
      isOpen: true,
      title,
      url,
      type,
      data
    });
  };

  const closeDocumentModal = () => {
    setDocumentModal({
      isOpen: false,
      title: '',
      url: '',
      type: 'image'
    });
  };

  const getPackageName = () => {
    const isPersonalOrder = pkg.products_data?.[0]?.requestType === 'personal';
    const prefix = isPersonalOrder ? 'Pedido personal: ' : '';
    
    if (pkg.products && pkg.products.length > 0) {
      return pkg.products.length > 1 
        ? `${prefix}Pedido con ${pkg.products.length} productos` 
        : `${prefix}${pkg.products[0].itemDescription}`;
    }
    return `${prefix}${pkg.item_description || 'Pedido'}`;
  };

  // Render package name with cancelled products styled with strikethrough
  const renderPackageName = () => {
    const products = pkg.products_data || [];
    const isPersonalOrder = products[0]?.requestType === 'personal';
    const prefix = isPersonalOrder ? 'Pedido personal: ' : '';
    
    // Single product or no products_data
    if (products.length <= 1) {
      const isCancelled = products[0]?.cancelled === true;
      const name = pkg.item_description || 'Pedido';
      
      if (isCancelled) {
        return (
          <>
            {prefix}
            <span className="text-muted-foreground line-through">{name}</span>
            <span className="text-destructive ml-1">(cancelado)</span>
          </>
        );
      }
      return <>{prefix}{name}</>;
    }
    
    // Multiple products with cancellation styling
    const productElements = products.map((product: any, idx: number) => {
      const name = product.itemDescription?.substring(0, 25) || `Producto ${idx + 1}`;
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
    
    return <>{prefix}Pedido de {products.length} productos: {productElements}</>;
  };


  const getTipAmount = () => {
    // First try to get tip from products_data, fallback to admin_assigned_tip
    // Exclude cancelled products from tip calculation
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      return pkg.products_data.reduce((sum: number, product: any) => {
        if (product.cancelled) return sum; // Skip cancelled products
        return sum + parseFloat(product.adminAssignedTip || '0');
      }, 0);
    }
    return parseFloat(pkg.admin_assigned_tip || '0');
  };

  // Check if package has cancelled products
  const getCancelledProductsInfo = () => {
    if (!pkg.products_data || !Array.isArray(pkg.products_data)) return null;
    const cancelled = pkg.products_data.filter((p: any) => p.cancelled);
    if (cancelled.length === 0) return null;
    return {
      count: cancelled.length,
      total: pkg.products_data.length
    };
  };

  const cancelledInfo = getCancelledProductsInfo();

  // Helper to get product confirmation progress
  const getProductConfirmationProgress = () => {
    if (!pkg.products_data || pkg.products_data.length <= 1) return null;
    if (pkg.status !== 'in_transit') return null;
    
    const confirmed = pkg.products_data.filter((p: any) => p.receivedByTraveler).length;
    const total = pkg.products_data.length;
    
    if (confirmed === 0) return null;
    
    return { confirmed, total };
  };

  const confirmationProgress = getProductConfirmationProgress();

  const handleConfirmProduct = async (productIndex: number, photo: string) => {
    await handleConfirmProductReceived(pkg.id, productIndex, photo, updatePackage, pkg);
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={`transition-all duration-200 w-full max-w-full min-w-0 overflow-hidden rounded-md border-l-[3px] ${hasPendingAction ? "border-l-primary bg-primary/5 ring-1 ring-primary/20" : "border-l-muted-foreground/30 bg-muted/20 hover:bg-muted/30"}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer transition-all duration-200 w-full max-w-full min-w-0 overflow-hidden ${
            hasPendingAction 
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200" 
              : "hover:bg-muted/30"
          } ${isMobile ? 'px-2 py-3' : 'px-4 py-4'}`}>
            
            {/* Mobile optimized header layout */}
            {isMobile ? (
              <div className="space-y-3 w-full max-w-full">
                {/* Product name and status in single row */}
                <div className="flex items-start justify-between gap-2 w-full max-w-full">
                  <div className="flex items-center gap-2 flex-1 min-w-0 max-w-full overflow-hidden">
                    <div className="relative flex-shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                      {hasPendingAction && (
                        <NotificationBadge 
                          count={1} 
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 min-w-[10px] text-[8px]" 
                        />
                      )}
                    </div>
                    <CardTitle className="text-xs sm:text-sm font-semibold leading-tight break-words line-clamp-2 max-w-full">
                      {renderPackageName()}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-1 flex-shrink-0 flex-wrap">
                    {isChatAvailable && (
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 rounded-full" onClick={handleChatClick}>
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </Button>
                    )}
                    <TravelerPackageStatusBadge status={getEffectiveStatus(pkg)} pkg={pkg} />
                    {confirmationProgress && (
                      <Badge className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5">
                        🔵 {confirmationProgress.confirmed}/{confirmationProgress.total} productos
                      </Badge>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground hidden sm:block" /> : <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />}
                  </div>
                </div>


                {/* Status message - mobile optimized */}
                <div className="text-xs w-full">
                  <TravelerPackageStatusBadge 
                    status={getEffectiveStatus(pkg)} 
                    pkg={pkg}
                    showFullDescription={true}
                  />
                </div>

                {/* Dismiss button for expired quotes - mobile */}
                {isQuoteExpired(pkg) && onDismissExpiredPackage && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDismissExpiredPackage(pkg.id);
                    }}
                    className="w-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Descartar de mis viajes
                  </Button>
                )}

                {/* Priority action button - full width on mobile */}
                <div className="w-full">
                  <TravelerPackagePriorityActions
                    pkg={pkg}
                    onQuote={onQuote}
                    onConfirmReceived={handleConfirmReceivedClick}
                    onConfirmOfficeDelivery={handleConfirmOfficeDeliveryClick}
                  />
                </div>
              </div>
            ) : (
              // Desktop layout (unchanged)
              <>
                {/* Product Name at the top */}
                <div className="mb-3">
                  <CardTitle className="text-lg font-semibold leading-tight flex items-center gap-3">
                    <div className="relative flex-shrink-0">
                      <Package className="h-5 w-5 text-primary" />
                      {hasPendingAction && (
                        <NotificationBadge 
                          count={1} 
                          className="absolute -top-2 -right-2 w-3 h-3 min-w-[12px] text-[10px]" 
                        />
                      )}
                    </div>
                    <span className="flex-1">{renderPackageName()}</span>
                  </CardTitle>
                </div>

                {/* Priority Action Button */}
                <div className="mb-3">
                  <TravelerPackagePriorityActions
                    pkg={pkg}
                    onQuote={onQuote}
                    onConfirmReceived={handleConfirmReceivedClick}
                    onConfirmOfficeDelivery={handleConfirmOfficeDeliveryClick}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                  <div className="flex-1 min-w-0">
                    
                    {/* Status message moved here - below price/tip on left side */}
                    <div className="text-xs mt-2 text-left">
                      {pkg.status === 'matched' && (
                        <div className="font-medium text-blue-600">
                          🔗 Paquete emparejado - Envía tu cotización
                        </div>
                      )}
                     {pkg.status === 'quote_sent' && (
                         <div className="space-y-2">
                           <div className="text-muted-foreground">
                             📝 Cotización enviada - Esperando respuesta del shopper
                           </div>
                           {pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date() && (
                             <div className="flex flex-col gap-2">
                               <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />
                               <p className="text-xs text-amber-600">
                                 ⚠️ Si el shopper no acepta en este tiempo, el paquete se removerá de tu viaje automáticamente.
                               </p>
                             </div>
                           )}
                         </div>
                       )}
                      {pkg.status === 'payment_pending' && (
                        <div className="space-y-2">
                          <div className="font-medium text-amber-600">
                            💰 Pendiente de pago - El shopper aceptó la cotización
                          </div>
                          {pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date() && (
                            <div className="flex flex-col gap-2">
                              <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />
                              <p className="text-xs text-amber-600">
                                ⚠️ Si el shopper no paga en este tiempo, el paquete se removerá de tu viaje automáticamente.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {pkg.status === 'quote_accepted' && (
                        <div className="space-y-2">
                          <div className="font-medium text-green-600">
                            ✅ Cotización aceptada - Esperando pago del shopper
                          </div>
                          {pkg.quote_expires_at && new Date(pkg.quote_expires_at) > new Date() && (
                            <div className="flex flex-col gap-2">
                              <QuoteCountdown expiresAt={pkg.quote_expires_at} micro={true} />
                              <p className="text-xs text-amber-600">
                                ⚠️ Si el shopper no paga en este tiempo, el paquete se removerá de tu viaje automáticamente.
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                      {pkg.status === 'pending_purchase' && (
                        <div className="font-medium text-blue-600">
                          💳 Pago confirmado - El cliente ya pagó la cotización y pronto subirá el comprobante de compra
                        </div>
                      )}
                      {pkg.status === 'in_transit' && (
                        <div className="font-medium text-orange-600">
                          🚚 En tránsito - Confirma cuando recibas
                        </div>
                      )}
                      {pkg.status === 'received_by_traveler' && (
                        <div className="font-medium text-green-600">
                          ✅ Paquete recibido y confirmado
                          {pkg.traveler_confirmation?.confirmedAt && (
                            <div className="text-muted-foreground mt-0.5">
                              Confirmado el: {new Date(pkg.traveler_confirmation.confirmedAt).toLocaleDateString('es-GT')}
                            </div>
                          )}
                        </div>
                      )}
                      {pkg.status === 'pending_office_confirmation' && (
                        <div className="space-y-1">
                          <div className="font-medium text-amber-600">
                            ⏳ Esperando confirmación de oficina
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Has declarado la entrega. Podrás crear tu orden de cobro una vez que Favorón confirme la recepción.
                          </div>
                        </div>
                      )}
                      {pkg.status === 'delivered_to_office' && (
                        <div className="space-y-1">
                          <div className="font-medium text-green-600">
                            ✅ Entrega confirmada por Favorón
                          </div>
                          <div className="text-xs text-muted-foreground">
                            El paquete está listo para que el shopper lo recoja.
                          </div>
                        </div>
                      )}
                      {pkg.status === 'completed' && (
                        <div className="font-medium text-green-600">
                          ✅ Completado - Paquete entregado exitosamente
                        </div>
                      )}
                      {pkg.status === 'cancelled' && (
                        <div className="font-medium text-red-600">
                          ❌ Cancelado
                        </div>
                      )}
                      {isQuoteExpired(pkg) && (
                        <div className="space-y-2">
                          <div className="font-medium text-amber-600">
                            ⏰ Cotización expirada - El shopper no pagó a tiempo
                          </div>
                          {onDismissExpiredPackage && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onDismissExpiredPackage(pkg.id);
                              }}
                              className="text-xs border-amber-300 text-amber-700 hover:bg-amber-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Descartar de mis viajes
                            </Button>
                          )}
                        </div>
                      )}
                      {pkg.status === 'pending_approval' && (
                        <div className="font-medium text-amber-600">
                          ⏳ Pendiente de aprobación
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isChatAvailable && (
                      <Button variant="ghost" size="sm" className="h-10 w-10 p-0 bg-primary/10 hover:bg-primary/20 rounded-full" onClick={handleChatClick}>
                        <MessageCircle className="h-6 w-6 text-primary" />
                      </Button>
                    )}
                    <div className="flex flex-col items-end text-right">
                      <TravelerPackageStatusBadge status={pkg.status} pkg={pkg} />
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </>
            )}
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className={`pt-0 pb-1 ${isMobile ? 'px-2' : 'px-4'}`}>

            {isMobile ? (
              // Mobile optimized content layout
              <div className="space-y-4">
                {/* Mobile tabs - horizontal scroll for better UX */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-4 h-8 mb-3">
                    <TabsTrigger value="producto" className="flex items-center gap-1 text-xs px-1 py-1">
                      <Package className="h-3 w-3" />
                      <span className="hidden xs:inline">Producto</span>
                    </TabsTrigger>
                    <TabsTrigger value="estado" className="flex items-center gap-1 text-xs px-1 py-1">
                      <Clock className="h-3 w-3" />
                      <span className="hidden xs:inline">Estado</span>
                    </TabsTrigger>
                    <TabsTrigger value="docs" className="flex items-center gap-1 text-xs px-1 py-1">
                      <FileText className="h-3 w-3" />
                      <span className="hidden xs:inline">Docs</span>
                    </TabsTrigger>
                    <TabsTrigger value="chat" className="flex items-center gap-1 text-xs px-1 py-1">
                      <MessageCircle className="h-3 w-3" />
                      <span className="hidden xs:inline">Chat</span>
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="producto" className="mt-0">
                    <div className="bg-muted/30 rounded-lg p-3">
                      <TravelerPackageDetails pkg={pkg} />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="estado" className="mt-0">
                    {['quote_accepted', 'pending_purchase', 'in_transit'].includes(pkg.status) ? (
                      <div className="bg-muted/30 rounded-lg p-3">
                        <TravelerPackageTimeline currentStatus={pkg.status} />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                        <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                        <p>Estado disponible después de aceptar cotización</p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="docs" className="mt-0">
                    <div className="space-y-2">
                      {/* Comprobante de Compra */}
                      {pkg.purchase_confirmation ? (
                        <div className="bg-card border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Comprobante</span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {pkg.purchase_confirmation.filename || 'Archivo subido'}
                          </div>
                          {pkg.purchase_confirmation.filePath && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs w-full"
                              onClick={async () => {
                                try {
                                  const { data, error } = await supabase.storage
                                    .from('purchase-confirmations')
                                    .createSignedUrl(pkg.purchase_confirmation.filePath, 3600);
                                  if (!error && data?.signedUrl) {
                                    openDocumentModal('Comprobante de Compra', data.signedUrl, 'image');
                                  }
                                } catch (e) {
                                  console.error('Error generating signed URL', e);
                                }
                              }}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver
                            </Button>
                          )}
                        </div>
                      ) : null}

                      {/* Información de Seguimiento */}
                      {pkg.tracking_info?.trackingNumber ? (
                        <div className="bg-card border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <Package className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">Seguimiento</span>
                          </div>
                          <div className="text-xs space-y-1">
                            <div className="truncate">
                              <span className="text-muted-foreground">Número:</span>
                              <span className="ml-1 font-mono">{pkg.tracking_info.trackingNumber}</span>
                            </div>
                            {pkg.tracking_info.shippingCompany && (
                              <div className="truncate">
                                <span className="text-muted-foreground">Empresa:</span>
                                <span className="ml-1">{pkg.tracking_info.shippingCompany}</span>
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs w-full mt-2"
                              onClick={() => openDocumentModal('Información de Seguimiento', '', 'tracking', pkg.tracking_info)}
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Ver Detalles
                            </Button>
                          </div>
                        </div>
                      ) : null}

                      {/* Estado cuando no hay documentos */}
                      {!pkg.purchase_confirmation && !pkg.tracking_info?.trackingNumber && (
                        <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                          <FileText className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                          <p>Sin documentos</p>
                          <p className="text-xs mt-1">Aparecerán cuando el shopper los suba</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="chat" className="mt-0">
                    {['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'completed'].includes(pkg.status) ? (
                      <div className="bg-muted/30 rounded-lg">
                        <PackageTimeline pkg={pkg} />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                        <MessageCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                        <p>Chat disponible después del pago</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Traveler Confirmation - Mobile optimized */}
                <div className="bg-muted/30 rounded-lg p-3">
                  <TravelerConfirmationDisplay 
                    pkg={pkg} 
                    onConfirmReceived={handleConfirmReceived}
                  />
                </div>
              </div>
            ) : (
              // Desktop layout (unchanged)
              <div className="grid gap-4 lg:grid-cols-5">
                {/* Left section with tabs */}
                <div className="lg:col-span-3">
                  <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-4 mb-3">
                      <TabsTrigger value="producto" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5">
                        <Package className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Producto</span>
                      </TabsTrigger>
                      <TabsTrigger value="estado" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Estado</span>
                      </TabsTrigger>
                      <TabsTrigger value="docs" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Docs</span>
                      </TabsTrigger>
                      <TabsTrigger value="chat" className="flex items-center gap-1.5 text-xs sm:text-sm px-2 py-1.5">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">Chat</span>
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="producto" className="mt-0">
                      <TravelerPackageDetails pkg={pkg} />
                    </TabsContent>
                    
                    <TabsContent value="estado" className="mt-0">
                      {['quote_accepted', 'pending_purchase', 'in_transit'].includes(pkg.status) && (
                        <div className="bg-muted/30 rounded-lg p-3">
                          <TravelerPackageTimeline currentStatus={pkg.status} />
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="docs" className="mt-0">
                      <div className="space-y-3">
                        {/* Comprobante de Compra */}
                        {pkg.purchase_confirmation && (
                          <div className="bg-card border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Comprobante de Compra</span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              Archivo: {pkg.purchase_confirmation.filename || 'Comprobante subido'}
                            </div>
                            {pkg.purchase_confirmation.filePath && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={async () => {
                                  try {
                                    const { data, error } = await supabase.storage
                                      .from('purchase-confirmations')
                                      .createSignedUrl(pkg.purchase_confirmation.filePath, 3600);
                                    if (!error && data?.signedUrl) {
                                      openDocumentModal('Comprobante de Compra', data.signedUrl, 'image');
                                    }
                                  } catch (e) {
                                    console.error('Error generating signed URL', e);
                                  }
                                }}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver Documento
                              </Button>
                            )}
                          </div>
                        )}

                        {/* Información de Seguimiento */}
                        {pkg.tracking_info && pkg.tracking_info.trackingNumber && (
                          <div className="bg-card border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Package className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">Información de Seguimiento</span>
                            </div>
                            <div className="space-y-1 text-xs">
                              <div>
                                <span className="text-muted-foreground">Número de seguimiento:</span>
                                <span className="ml-1 font-mono">{pkg.tracking_info.trackingNumber}</span>
                              </div>
                              {pkg.tracking_info.shippingCompany && (
                                <div>
                                  <span className="text-muted-foreground">Empresa:</span>
                                  <span className="ml-1">{pkg.tracking_info.shippingCompany}</span>
                                </div>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs mt-2"
                                onClick={() => openDocumentModal('Información de Seguimiento', '', 'tracking', pkg.tracking_info)}
                              >
                                <ExternalLink className="h-3 w-3 mr-1" />
                                Ver Detalles
                              </Button>
                            </div>
                          </div>
                        )}

                        {/* Estado cuando no hay documentos */}
                        {!pkg.purchase_confirmation && !pkg.tracking_info?.trackingNumber && !pkg.payment_receipt && (
                          <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                            <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground/50" />
                            <p>No hay documentos disponibles aún.</p>
                            <p className="text-xs mt-1">Los documentos aparecerán aquí cuando el shopper los suba.</p>
                          </div>
                        )}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="chat" className="mt-0">
                      {['pending_purchase', 'in_transit', 'received_by_traveler', 'pending_office_confirmation', 'delivered_to_office', 'out_for_delivery', 'completed'].includes(pkg.status) ? (
                        <PackageTimeline pkg={pkg} />
                      ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg text-center">
                          <MessageCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                          <p>El chat estará disponible una vez que el shopper realice el pago.</p>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
                </div>
                
                {/* Right section */}
                <div className="lg:col-span-2 space-y-3">
                  {/* Traveler Confirmation Display */}
                  <TravelerConfirmationDisplay 
                    pkg={pkg} 
                    onConfirmReceived={handleConfirmReceived}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>

      {/* Document Modal */}
      <Dialog open={documentModal.isOpen} onOpenChange={closeDocumentModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>{documentModal.title}</DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            {documentModal.type === 'tracking' ? (
              <div className="w-full max-w-md space-y-4 p-4 mx-auto">
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Número de seguimiento:</span>
                    <span className="text-sm font-mono">
                      {documentModal.data?.trackingNumber || 'No disponible'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Empresa de envío:</span>
                    <span className="text-sm">
                      {documentModal.data?.shippingCompany || 'No especificada'}
                    </span>
                  </div>
                  
                  <div className="flex items-start justify-between border-b pb-2">
                    <span className="text-sm text-muted-foreground">Link de seguimiento:</span>
                    <div className="text-right">
                      {documentModal.data?.trackingUrl ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => window.open(documentModal.data.trackingUrl, '_blank')}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Abrir seguimiento
                        </Button>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No proporcionado</span>
                      )}
                    </div>
                  </div>

                  {documentModal.data?.notes && (
                    <div className="border-b pb-2">
                      <span className="text-sm text-muted-foreground">Notas:</span>
                      <p className="text-sm mt-1">{documentModal.data.notes}</p>
                    </div>
                  )}

                  {documentModal.data?.timestamp && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Fecha de registro:</span>
                      <span className="text-sm">
                        {new Date(documentModal.data.timestamp).toLocaleDateString('es-GT')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : documentModal.type === 'image' ? (
              <div className="flex justify-center">
                <img 
                  src={documentModal.url} 
                  alt={documentModal.title}
                  className="max-w-full max-h-[70vh] object-contain rounded border"
                />
              </div>
            ) : (
              <div className="bg-gray-100 p-8 text-center rounded">
                <FileText className="h-16 w-16 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-700 mb-4">Vista previa de PDF no disponible</p>
                <Button onClick={() => window.open(documentModal.url, '_blank')}>
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Abrir en nueva pestaña
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <PackageReceiptConfirmation 
        isOpen={showConfirmationModal} 
        onClose={() => setShowConfirmationModal(false)} 
        onConfirm={handleConfirmReceived} 
        packageName={getPackageName()}
        packageId={pkg.id}
      />

      <ProductReceiptConfirmation
        isOpen={showProductConfirmationModal}
        onClose={() => setShowProductConfirmationModal(false)}
        packageId={pkg.id}
        packageName={getPackageName()}
        products={pkg.products_data || []}
        onConfirmProduct={handleConfirmProduct}
      />

      {/* Chat Modal */}
      <Dialog open={chatModalOpen} onOpenChange={setChatModalOpen}>
        <DialogContent className="max-w-4xl h-[85vh] flex flex-col overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <MessageCircle className="h-5 w-5" />
              <span>Chat - {getPackageName()}</span>
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
      
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;
