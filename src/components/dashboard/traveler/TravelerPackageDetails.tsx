import { Package } from "lucide-react";
import PurchaseConfirmationViewer from "@/components/admin/PurchaseConfirmationViewer";

interface TravelerPackageDetailsProps {
  pkg: any;
}

const TravelerPackageDetails = ({ pkg }: TravelerPackageDetailsProps) => {
  return (
    <div className="bg-gradient-to-br from-traveler-muted to-traveler-muted/50 border border-traveler-border rounded-lg p-3">
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-shrink-0 w-5 h-5 bg-traveler/10 rounded-full flex items-center justify-center">
          <Package className="h-3 w-3 text-traveler" />
        </div>
        <h3 className="text-sm font-medium text-foreground">Detalles del pedido</h3>
      </div>
      
      <div className="space-y-2">
        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-1.5">
          <div className="bg-card/50 border border-border/50 rounded p-1.5">
            <p className="text-xs text-muted-foreground">Origen</p>
            <p className="text-xs font-medium text-foreground">{pkg.purchase_origin}</p>
          </div>
          <div className="bg-card/50 border border-border/50 rounded p-1.5">
            <p className="text-xs text-muted-foreground">Destino</p>
            <p className="text-xs font-medium text-foreground">{pkg.package_destination}</p>
          </div>
        </div>
        
        {/* Products section - Compact version */}
        <div className="space-y-1">
          <h4 className="text-xs font-medium text-foreground">Productos ({pkg.products ? pkg.products.length : 1})</h4>
          <div className="space-y-1">
            {pkg.products ? pkg.products.map((product: any, index: number) => (
              <div key={index} className="bg-card border border-border rounded p-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate flex-1 mr-2">
                    {product.itemDescription}
                  </span>
                  <span className="font-bold text-primary">${product.estimatedPrice}</span>
                </div>
              </div>
            )) : (
              // Fallback for old single-product format
              <div className="bg-card border border-border rounded p-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground truncate flex-1 mr-2">
                    {pkg.item_description}
                  </span>
                  <span className="font-bold text-primary">${pkg.estimated_price}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Additional notes */}
        {pkg.additional_notes && (
          <div className="bg-card/30 border border-border/50 rounded p-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Notas adicionales</p>
            <p className="text-xs text-foreground">{pkg.additional_notes}</p>
          </div>
        )}

        {/* Purchase confirmation */}
        {pkg.purchase_confirmation && (
          <div className="bg-card/30 border border-border/50 rounded p-1.5">
            <p className="text-xs font-medium text-muted-foreground mb-1">Comprobante de Compra</p>
            <PurchaseConfirmationViewer 
              purchaseConfirmation={pkg.purchase_confirmation} 
              packageId={pkg.id}
              className="scale-90 origin-top-left"
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelerPackageDetails;