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

interface CollapsibleTravelerPackageCardProps {
  pkg: any;
  getStatusBadge: (status: string) => JSX.Element;
  onQuote: (pkg: any, userType: 'traveler' | 'shopper') => void;
  onConfirmReceived: (packageId: number, photo?: string) => void;
  hasPendingAction?: boolean;
  autoExpand?: boolean;
}

const CollapsibleTravelerPackageCard = ({
  pkg,
  getStatusBadge,
  onQuote,
  onConfirmReceived,
  hasPendingAction = false,
  autoExpand = false
}: CollapsibleTravelerPackageCardProps) => {
  const [isOpen, setIsOpen] = useState(autoExpand);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  const handleConfirmReceived = (photo?: string) => {
    onConfirmReceived(pkg.id, photo);
  };

  const handleConfirmReceivedClick = () => {
    setShowConfirmationModal(true);
  };

  const getPackageName = () => {
    if (pkg.products && pkg.products.length > 0) {
      return pkg.products.length > 1 
        ? `Pedido con ${pkg.products.length} productos` 
        : pkg.products[0].itemDescription;
    }
    return pkg.itemDescription || 'Pedido';
  };

  const getPackageDescription = () => {
    if (pkg.products && pkg.products.length > 0) {
      const total = pkg.products.reduce((sum: number, product: any) => 
        sum + parseFloat(product.estimatedPrice || 0), 0
      ).toFixed(2);
      return `Total estimado: $${total}${pkg.deliveryDeadline ? ` • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}` : ''}`;
    }
    return `Precio estimado: $${pkg.estimatedPrice}${pkg.deliveryDeadline ? ` • Fecha límite: ${new Date(pkg.deliveryDeadline).toLocaleDateString('es-GT')}` : ''}`;
  };

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={hasPendingAction ? "ring-2 ring-primary/50 shadow-lg" : ""}>
        <CollapsibleTrigger asChild>
          <CardHeader className={`cursor-pointer transition-colors ${
            hasPendingAction 
              ? "bg-gradient-to-r from-primary/5 to-primary/10 hover:from-primary/10 hover:to-primary/15" 
              : "hover:bg-muted/50"
          }`}>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center space-x-2">
                  <div className="relative">
                    <Package className="h-5 w-5 text-primary" />
                    {hasPendingAction && (
                      <NotificationBadge 
                        count={1} 
                        className="absolute -top-2 -right-2 w-3 h-3 min-w-[12px] text-[10px]" 
                      />
                    )}
                  </div>
                  <span>{getPackageName()}</span>
                  {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </CardTitle>
                <CardDescription>{getPackageDescription()}</CardDescription>
              </div>
              {getStatusBadge(pkg.status)}
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-3">
            <TravelerPackagePriorityActions
              pkg={pkg}
              onQuote={onQuote}
              onConfirmReceived={handleConfirmReceivedClick}
            />

            <div className="space-y-3">
              {/* Traveler Package Timeline - Show for relevant statuses */}
              {['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status) && (
                <TravelerPackageTimeline currentStatus={pkg.status} />
              )}

              {/* Package details */}
              <TravelerPackageDetails pkg={pkg} />

              {/* Package info sections */}
              <TravelerPackageInfo pkg={pkg} />
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>

      <PackageReceiptConfirmation 
        isOpen={showConfirmationModal} 
        onClose={() => setShowConfirmationModal(false)} 
        onConfirm={handleConfirmReceived} 
        packageName={getPackageName()}
      />
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;