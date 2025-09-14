import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package, MessageCircle, FileText, Clock, ExternalLink, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NotificationBadge } from "@/components/ui/notification-badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import TravelerPackageTimeline from "./TravelerPackageTimeline";
import PackageReceiptConfirmation from "../PackageReceiptConfirmation";
import TravelerPackagePriorityActions from "./traveler/TravelerPackagePriorityActions";
import TravelerPackageDetails from "./traveler/TravelerPackageDetails";
import TravelerPackageInfo from "./traveler/TravelerPackageInfo";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import { TravelerConfirmationDisplay } from "./TravelerConfirmationDisplay";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

interface CollapsibleTravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'user' | 'admin') => void;
  onConfirmReceived: (packageId: string, photo?: string) => void;
  onConfirmOfficeDelivery?: (packageId: string) => void;
  hasPendingAction?: boolean;
  autoExpand?: boolean;
}

const CollapsibleTravelerPackageCard = ({ 
  pkg,
  getStatusBadge,
  onQuote,
  onConfirmReceived,
  onConfirmOfficeDelivery,
  hasPendingAction = false,
  autoExpand = false
}: CollapsibleTravelerPackageCardProps) => {
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
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
  
  const { user } = useAuth();

  const handleConfirmReceived = (photo?: string) => {
    console.log('🎯 handleConfirmReceived called for package:', pkg.id, pkg.item_description, 'photo:', !!photo);
    onConfirmReceived(pkg.id, photo);
  };

  const handleConfirmReceivedClick = () => {
    console.log('🎯 handleConfirmReceivedClick called for package:', pkg.id, pkg.item_description);
    setShowConfirmationModal(true);
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
    if (pkg.products && pkg.products.length > 0) {
      return pkg.products.length > 1 
        ? `Pedido con ${pkg.products.length} productos` 
        : pkg.products[0].itemDescription;
    }
    return pkg.item_description || 'Pedido';
  };

  const getPackageDescription = () => {
    if (pkg.products && pkg.products.length > 0) {
      const total = pkg.products.reduce((sum: number, product: any) => 
        sum + parseFloat(product.estimatedPrice || 0), 0
      ).toFixed(2);
      return `Total: $${total}${pkg.delivery_deadline ? ` • Fecha límite: ${new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}` : ''}`;
    }
    return `Precio: $${pkg.estimated_price}${pkg.delivery_deadline ? ` • Fecha límite: ${new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}` : ''}`;
  };

  const getTipAmount = () => {
    // First try to get tip from products_data, fallback to admin_assigned_tip
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      return pkg.products_data.reduce((sum: number, product: any) => {
        return sum + parseFloat(product.adminAssignedTip || '0');
      }, 0);
    }
    return parseFloat(pkg.admin_assigned_tip || '0');
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`transition-all duration-200 ${hasPendingAction ? "ring-2 ring-primary/50 shadow-lg border-primary/20" : "hover:shadow-md"}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer transition-all duration-200 ${
            hasPendingAction 
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200" 
              : "hover:bg-muted/30"
          } ${isMobile ? 'p-3' : 'py-4'}`}>
            
            {/* Mobile optimized header layout */}
            {isMobile ? (
              <div className="space-y-3">
                {/* Product name and status in single row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className="relative flex-shrink-0">
                      <Package className="h-4 w-4 text-primary" />
                      {hasPendingAction && (
                        <NotificationBadge 
                          count={1} 
                          className="absolute -top-1 -right-1 w-2.5 h-2.5 min-w-[10px] text-[8px]" 
                        />
                      )}
                    </div>
                    <CardTitle className="text-sm font-semibold leading-tight truncate">
                      {getPackageName()}
                    </CardTitle>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {getStatusBadge(pkg.status)}
                    {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground hidden sm:block" /> : <ChevronDown className="h-4 w-4 text-muted-foreground hidden sm:block" />}
                  </div>
                </div>

                {/* Description */}
                <CardDescription className="text-xs leading-tight text-muted-foreground">
                  {getPackageDescription()}
                </CardDescription>

                {/* Status message - mobile optimized */}
                <div className="text-xs">
                  {pkg.status === 'matched' && (
                    <div className="text-blue-600 bg-blue-50 p-2 rounded-md">
                      🔗 Paquete emparejado - Envía tu cotización
                    </div>
                  )}
                  {pkg.status === 'quote_sent' && (
                    <div className="text-muted-foreground bg-muted/50 p-2 rounded-md">
                      📝 Cotización enviada - Esperando respuesta del shopper
                    </div>
                  )}
                  {pkg.status === 'quote_accepted' && (
                    <div className="text-green-600 bg-green-50 p-2 rounded-md">
                      ✅ Cotización aceptada - Esperando pago
                    </div>
                  )}
                  {pkg.status === 'payment_confirmed' && (
                    <div className="text-blue-600 bg-blue-50 p-2 rounded-md">
                      💳 Pago confirmado - Esperando envío
                    </div>
                  )}
                  {pkg.status === 'in_transit' && (
                    <div className="text-orange-600 bg-orange-50 p-2 rounded-md">
                      🚚 En tránsito - Confirma cuando recibas
                    </div>
                  )}
                  {pkg.status === 'received_by_traveler' && (
                    <div className="text-green-600 bg-green-50 p-2 rounded-md">
                      ✅ Paquete recibido
                      {pkg.traveler_confirmation?.confirmedAt && (
                        <div className="text-muted-foreground mt-1 text-[10px]">
                          {new Date(pkg.traveler_confirmation.confirmedAt).toLocaleDateString('es-GT')}
                        </div>
                      )}
                    </div>
                  )}
                  {pkg.status === 'pending_office_confirmation' && (
                    <div className="text-amber-600 bg-amber-50 p-2 rounded-md">
                      ⏳ Entregado - Esperando confirmación de oficina
                    </div>
                  )}
                  {pkg.status === 'delivered_to_office' && (
                    <div className="text-green-600 bg-green-50 p-2 rounded-md">
                      🏢 Entregado en oficina - Listo para recojo
                    </div>
                  )}
                  {pkg.status === 'completed' && (
                    <div className="text-green-600 bg-green-50 p-2 rounded-md">
                      ✅ Completado - Paquete entregado exitosamente
                    </div>
                  )}
                  {pkg.status === 'cancelled' && (
                    <div className="text-red-600 bg-red-50 p-2 rounded-md">
                      ❌ Cancelado
                    </div>
                  )}
                  {pkg.status === 'pending_approval' && (
                    <div className="text-amber-600 bg-amber-50 p-2 rounded-md">
                      ⏳ Pendiente de aprobación
                    </div>
                  )}
                  {pkg.status === 'approved' && (
                    <div className="text-blue-600 bg-blue-50 p-2 rounded-md">
                      👍 Aprobado - Esperando emparejamiento
                    </div>
                  )}
                </div>

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
                    <span className="flex-1">{getPackageName()}</span>
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

                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <CardDescription className="text-xs sm:text-sm leading-tight">
                      <span className="block sm:truncate">{getPackageDescription()}</span>
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex flex-col items-end text-right">
                      {getStatusBadge(pkg.status)}
                      
                      {/* Status message */}
                      <div className="text-xs mt-1 max-w-48">
                        {pkg.status === 'quote_sent' && (
                          <div className="text-muted-foreground">
                            Cotización enviada - Esperando respuesta del shopper
                          </div>
                        )}
                        {pkg.status === 'quote_accepted' && (
                          <div className="font-medium text-green-600">
                            ✅ Cotización aceptada - Esperando confirmación de pago
                          </div>
                        )}
                        {pkg.status === 'payment_confirmed' && (
                          <div className="font-medium text-blue-600">
                            💳 Pago confirmado - Esperando que el shopper envíe el paquete
                          </div>
                        )}
                        {pkg.status === 'in_transit' && (
                          <div className="font-medium text-orange-600">
                            🚚 En tránsito
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
                      </div>
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
                <Tabs defaultValue="producto" className="w-full">
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
                    {['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status) ? (
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
                    {['quote_accepted', 'pending_purchase', 'payment_confirmed', 'in_transit', 'delivered', 'received_by_traveler', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status) ? (
                      <div className="bg-muted/30 rounded-lg">
                        <PackageTimeline pkg={pkg} />
                      </div>
                    ) : (
                      <div className="text-sm text-muted-foreground p-3 bg-muted/30 rounded-lg text-center">
                        <MessageCircle className="h-6 w-6 mx-auto mb-2 text-muted-foreground/50" />
                        <p>Chat disponible tras aceptar cotización</p>
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
                  <Tabs defaultValue="producto" className="w-full">
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
                      {['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status) && (
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
                      {['quote_accepted', 'pending_purchase', 'payment_confirmed', 'in_transit', 'delivered', 'received_by_traveler', 'delivered_to_office', 'ready_for_pickup', 'ready_for_delivery', 'completed'].includes(pkg.status) ? (
                        <PackageTimeline pkg={pkg} />
                      ) : (
                        <div className="text-sm text-muted-foreground p-4 bg-muted/30 rounded-lg">
                          El chat estará disponible una vez que se acepte la cotización.
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
      
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;
