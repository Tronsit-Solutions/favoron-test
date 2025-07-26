import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Package } from "lucide-react";
import { NotificationBadge } from "@/components/ui/notification-badge";
import TravelerPackageTimeline from "./TravelerPackageTimeline";
import PackageReceiptConfirmation from "../PackageReceiptConfirmation";
import TravelerPackagePriorityActions from "./traveler/TravelerPackagePriorityActions";
import TravelerPackageDetails from "./traveler/TravelerPackageDetails";
import TravelerPackageInfo from "./traveler/TravelerPackageInfo";
import { PackageTimeline } from "@/components/chat/PackageTimeline";
import { TravelerConfirmationDisplay } from "./TravelerConfirmationDisplay";
import { useIsMobile } from "@/hooks/use-mobile";

import { useAuth } from "@/hooks/useAuth";

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
  const isMobile = useIsMobile();
  
  const { user } = useAuth();

  const handleConfirmReceived = (photo?: string) => {
    onConfirmReceived(pkg.id, photo);
  };

  const handleConfirmReceivedClick = () => {
    setShowConfirmationModal(true);
  };

  const handleConfirmOfficeDeliveryClick = () => {
    // Solo actualizar el status del paquete sin modal bancario
    if (onConfirmOfficeDelivery) {
      onConfirmOfficeDelivery(pkg.id);
    }
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
      return `Total estimado: $${total}${pkg.delivery_deadline ? ` • Fecha límite: ${new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}` : ''}`;
    }
    return `Precio estimado: $${pkg.estimated_price}${pkg.delivery_deadline ? ` • Fecha límite: ${new Date(pkg.delivery_deadline).toLocaleDateString('es-GT')}` : ''}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={`transition-all duration-200 ${hasPendingAction ? "ring-2 ring-primary/50 shadow-lg border-primary/20" : "hover:shadow-md"}`}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer transition-all duration-200 py-4 ${
            hasPendingAction 
              ? "bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 border-blue-200" 
              : "hover:bg-muted/30"
          }`}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="relative flex-shrink-0">
                  <Package className="h-5 w-5 text-primary" />
                  {hasPendingAction && (
                    <NotificationBadge 
                      count={1} 
                      className="absolute -top-2 -right-2 w-3 h-3 min-w-[12px] text-[10px]" 
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-base sm:text-lg font-semibold leading-tight">
                    <span className="block sm:truncate">{getPackageName()}</span>
                  </CardTitle>
                  <CardDescription className="text-xs sm:text-sm mt-1 leading-tight">
                    <span className="block sm:truncate">{getPackageDescription()}</span>
                  </CardDescription>
                </div>
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
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className={`pt-0 pb-2 ${isMobile ? 'px-2' : ''}`}>
            <TravelerPackagePriorityActions
              pkg={pkg}
              onQuote={onQuote}
              onConfirmReceived={handleConfirmReceivedClick}
              onConfirmOfficeDelivery={handleConfirmOfficeDeliveryClick}
            />

            <div className={isMobile ? "space-y-3" : "grid gap-3 lg:grid-cols-2"}>
              <div className="space-y-2">
                {/* Traveler Package Timeline - Show for relevant statuses */}
                {['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status) && (
                  <div className="bg-muted/30 rounded-lg p-2">
                    <TravelerPackageTimeline currentStatus={pkg.status} />
                  </div>
                )}

                {/* Package details and info */}
                <TravelerPackageDetails pkg={pkg} />
                <TravelerPackageInfo pkg={pkg} />
                
                {/* Show traveler's own confirmation photo */}
                <TravelerConfirmationDisplay 
                  pkg={pkg} 
                  onConfirmReceived={handleConfirmReceived}
                />
              </div>

              <div className="space-y-2">
                {/* Package Chat Timeline - Show only after payment confirmation */}
                {['payment_confirmed', 'in_transit', 'delivered', 'received_by_traveler'].includes(pkg.status) && (
                  <div className="mt-3">
                    <PackageTimeline pkg={pkg} />
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

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