import { Package, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface TravelerPackageDetailsProps {
  pkg: any;
}

const TravelerPackageDetails = ({ pkg }: TravelerPackageDetailsProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="bg-gradient-to-br from-traveler-muted to-traveler-muted/50 border border-traveler-border rounded-lg p-3">
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between space-x-2 mb-2">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0 w-5 h-5 bg-traveler/10 rounded-full flex items-center justify-center">
                <Package className="h-3 w-3 text-traveler" />
              </div>
              <h3 className="text-sm font-medium text-foreground">Detalles del pedido</h3>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent className="animate-accordion-down data-[state=closed]:animate-accordion-up">
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
            
            {/* Products section */}
            <div className="space-y-1.5">
              <h4 className="text-xs font-medium text-foreground">Productos solicitados</h4>
              <div className="space-y-1.5">
                {pkg.products ? pkg.products.map((product: any, index: number) => (
                  <div key={index} className="bg-card border border-border rounded p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">
                          Producto {index + 1}
                        </p>
                        <p className="text-xs text-muted-foreground">{product.itemDescription}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">${product.estimatedPrice}</p>
                      </div>
                    </div>
                    <a 
                      href={product.itemLink} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-xs text-primary hover:underline"
                    >
                      Ver producto →
                    </a>
                  </div>
                )) : (
                  // Fallback for old single-product format
                  <div className="bg-card border border-border rounded p-2">
                    <div className="flex items-start justify-between mb-1">
                      <div className="flex-1">
                        <p className="text-xs font-medium text-foreground">Producto</p>
                        <p className="text-xs text-muted-foreground">{pkg.item_description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-primary">${pkg.estimated_price}</p>
                      </div>
                    </div>
                    {pkg.item_link && (
                      <a 
                        href={pkg.item_link} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs text-primary hover:underline"
                      >
                        Ver producto →
                      </a>
                    )}
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
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
};

export default TravelerPackageDetails;