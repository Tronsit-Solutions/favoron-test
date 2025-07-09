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
  onQuote: (pkg: any, userType: 'user') => void;
  onConfirmReceived: (packageId: string, photo?: string) => void;
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
            <div className="flex justify-between items-center gap-3">
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
                  <CardTitle className="text-lg font-semibold truncate flex items-center gap-2">
                    <span className="truncate">{getPackageName()}</span>
                  </CardTitle>
                  <CardDescription className="text-sm mt-1 truncate">{getPackageDescription()}</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {getStatusBadge(pkg.status)}
                {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 pb-4">
            <TravelerPackagePriorityActions
              pkg={pkg}
              onQuote={onQuote}
              onConfirmReceived={handleConfirmReceivedClick}
            />

            <div className="space-y-4">
              {/* Traveler Package Timeline - Show for relevant statuses */}
              {['quote_accepted', 'payment_confirmed', 'in_transit'].includes(pkg.status) && (
                <div className="bg-muted/30 rounded-lg p-3">
                  <TravelerPackageTimeline currentStatus={pkg.status} />
                </div>
              )}

              {/* Compact Package details and info in a grid */}
              <div className="grid gap-4 md:grid-cols-2">
                <TravelerPackageDetails pkg={pkg} />
                <TravelerPackageInfo pkg={pkg} />
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
      />
    </Collapsible>
  );
};

export default CollapsibleTravelerPackageCard;