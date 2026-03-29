import React, { useState, useEffect, useMemo } from "react";
import { getTravelerStatusConfig } from "./traveler/TravelerPackageStatusBadge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, MessageCircle, FileText, Clock, ExternalLink, CreditCard, Trash2, X } from "lucide-react";
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
import { normalizeConfirmations } from "@/utils/confirmationHelpers";
import { useToast } from "@/hooks/use-toast";

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
  const [showStatusModal, setShowStatusModal] = useState(false);
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

  const [dismissing, setDismissing] = useState(false);
  const { toast } = useToast();

  const handleDismissAssignment = async () => {
    if (!pkg._assignmentId) return;
    setDismissing(true);
    try {
      const { error } = await supabase
        .from('package_assignments')
        .update({ dismissed_by_traveler: true } as any)
        .eq('id', pkg._assignmentId);
      if (error) throw error;
      toast({ title: "Asignación descartada", description: "Ya no verás este pedido en tu dashboard." });
      window.location.reload();
    } catch (err) {
      toast({ title: "Error", description: "No se pudo descartar", variant: "destructive" });
    } finally {
      setDismissing(false);
    }
  };

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
      <div className={`transition-all duration-200 w-full max-w-full min-w-0 box-border overflow-hidden rounded-md border-l-[3px] ${
        ['bid_lost', 'bid_expired', 'bid_cancelled'].includes(pkg._assignmentStatus) ? 'opacity-60 ' : ''
      }${hasPendingAction ? "border-l-primary bg-primary/5 ring-1 ring-inset ring-primary/20" : "border-l-muted-foreground/30 bg-muted/20 hover:bg-muted/30"}`}>
        <CollapsibleTrigger asChild>
          <div className={`cursor-pointer transition-all duration-200 w-full max-w-full min-w-0 overflow-hidden rounded-t-md ${
            hasPendingAction 
              ? "hover:bg-primary/10" 
              : "hover:bg-muted/40"
          } ${isMobile ? 'px-3 py-3' : 'px-4 py-4'}`}>
            
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
                    
                    {confirmationProgress && (
                      <Badge className="bg-blue-50 text-blue-600 text-[10px] px-1.5 py-0.5">
                        🔵 {confirmationProgress.confirmed}/{confirmationProgress.total} productos
                      </Badge>
                    )}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground hidden sm:block" /> : <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />}
                  </div>
                </div>


                {/* Status button - opens modal with full description */}
                {(() => {
                  const statusConfig = getTravelerStatusConfig(getEffectiveStatus(pkg));
                  return (
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start text-xs gap-1.5 h-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowStatusModal(true);
                      }}
                    >
                      <span>{statusConfig.emoji}</span>
                      <span className="truncate">{statusConfig.label}</span>
                      <span className="ml-auto text-muted-foreground">Ver detalle</span>
                    </Button>
                  );
                })()}

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
                        pkg._assignmentStatus === 'bid_submitted' ? (
                          <div className="font-medium text-green-700">✅ Cotización enviada — esperando al comprador</div>
                        ) : pkg._assignmentStatus === 'bid_won' ? (
                          <div className="font-medium text-green-700">🎉 ¡El shopper te eligió!</div>
                        ) : pkg._assignmentStatus === 'bid_lost' ? (
                          <div>
                            <div className="font-medium text-red-700">❌ Otro viajero fue seleccionado</div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs h-7 px-2" onClick={handleDismissAssignment} disabled={dismissing}>
                              <X className="h-3 w-3 mr-1" />
                              {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                            </Button>
                          </div>
                        ) : pkg._assignmentStatus === 'bid_expired' ? (
                          <div>
                            <div className="font-medium text-yellow-700">⏰ Asignación expirada</div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs h-7 px-2" onClick={handleDismissAssignment} disabled={dismissing}>
                              <X className="h-3 w-3 mr-1" />
                              {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                            </Button>
                          </div>
                        ) : pkg._assignmentStatus === 'bid_cancelled' ? (
                          <div>
                            <div className="font-medium text-muted-foreground">Asignación cancelada</div>
                            <Button size="sm" variant="ghost" className="mt-1 text-xs h-7 px-2" onClick={handleDismissAssignment} disabled={dismissing}>
                              <X className="h-3 w-3 mr-1" />
                              {dismissing ? 'Descartando...' : 'Descartar de mi dashboard'}
                            </Button>
                          </div>
                        ) : (
                          <div className="font-medium text-blue-600">🔗 Paquete emparejado - Envía tu cotización</div>
                        )
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
                    <div className="flex flex-col items-end text-right gap-1">
                      {pkg._isMultiAssignment && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-500/50 text-amber-600 bg-amber-50">
                          ⚡ Compitiendo
                        </Badge>
                      )}
                      <TravelerPackageStatusBadge status={pkg.status} pkg={pkg} />
                    </div>
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                  </div>
                </div>
              </>
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className={`pt-0 pb-2 ${isMobile ? 'px-3' : 'px-4'}`}>

            {isMobile ? (
              // Mobile optimized content layout
              <div className="space-y-4">
                {/* Mobile tabs - horizontal scroll for better UX */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-3 h-8 mb-3">
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
                      {normalizeConfirmations(pkg.purchase_confirmation).map((confirmation, idx) => (
                        <div key={idx} className="bg-card border rounded-lg p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="h-4 w-4 text-primary" />
                            <span className="font-medium text-sm">
                              Comprobante{normalizeConfirmations(pkg.purchase_confirmation).length > 1 ? ` (${idx + 1})` : ''}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mb-2">
                            {confirmation.filename || 'Archivo subido'}
                          </div>
                          {confirmation.filePath && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 text-xs w-full"
                              onClick={async () => {
                                const bucket = confirmation.bucket || 'purchase-confirmations';
                                try {
                                  const { data, error } = await supabase.storage
                                    .from(bucket)
                                    .createSignedUrl(confirmation.filePath!, 3600);
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
                      ))}

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
                    <TabsList className="grid w-full grid-cols-3 mb-3">
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
                        {normalizeConfirmations(pkg.purchase_confirmation).map((confirmation, idx) => (
                          <div key={idx} className="bg-card border rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="h-4 w-4 text-primary" />
                              <span className="font-medium text-sm">
                                Comprobante de Compra{normalizeConfirmations(pkg.purchase_confirmation).length > 1 ? ` (${idx + 1})` : ''}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2">
                              Archivo: {confirmation.filename || 'Comprobante subido'}
                            </div>
                            {confirmation.filePath && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={async () => {
                                  const bucket = confirmation.bucket || 'purchase-confirmations';
                                  try {
                                    const { data, error } = await supabase.storage
                                      .from(bucket)
                                      .createSignedUrl(confirmation.filePath!, 3600);
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
                        ))}

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
          </div>
        </CollapsibleContent>
      </div>

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
        <DialogContent className="max-w-[95vw] sm:max-w-4xl h-[90vh] sm:h-[85vh] flex flex-col overflow-hidden p-3 sm:p-6">
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

      {/* Status Detail Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Estado del paquete</DialogTitle>
          </DialogHeader>
          <TravelerPackageStatusBadge 
            status={getEffectiveStatus(pkg)} 
            pkg={pkg}
            showFullDescription={true}
          />
        </DialogContent>
      </Dialog>
      
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;
