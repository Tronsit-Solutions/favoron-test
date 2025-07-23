import { useState, useEffect } from "react";
import { Package, FileText, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import PurchaseConfirmationViewer from "@/components/admin/PurchaseConfirmationViewer";

interface TravelerPackageDetailsProps {
  pkg: any;
}

const TravelerPackageDetails = ({ pkg }: TravelerPackageDetailsProps) => {
  const [showPackageDetails, setShowPackageDetails] = useState(false);
  const [showDocuments, setShowDocuments] = useState(false);
  const [hasNewDocuments, setHasNewDocuments] = useState(false);

  const getTotalProducts = () => {
    if (pkg.products) return pkg.products.length;
    return 1;
  };

  const getTotalValue = () => {
    if (pkg.products) {
      return pkg.products.reduce((sum: number, product: any) => 
        sum + parseFloat(product.estimatedPrice || 0), 0
      ).toFixed(2);
    }
    return pkg.estimated_price;
  };

  const hasDocuments = pkg.purchase_confirmation || pkg.tracking_info;

  // Detectar si hay documentos nuevos (actualizados en las últimas 24 horas)
  const checkForNewDocuments = () => {
    if (!hasDocuments) return false;
    
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Verificar si el comprobante de compra es reciente
    if (pkg.purchase_confirmation?.uploadedAt) {
      const uploadDate = new Date(pkg.purchase_confirmation.uploadedAt);
      if (uploadDate > twentyFourHoursAgo) return true;
    }
    
    // Verificar si la información de seguimiento es reciente
    if (pkg.tracking_info?.createdAt) {
      const trackingDate = new Date(pkg.tracking_info.createdAt);
      if (trackingDate > twentyFourHoursAgo) return true;
    }
    
    // También verificar el updated_at del paquete por si hay actualizaciones recientes
    if (pkg.updated_at) {
      const updatedDate = new Date(pkg.updated_at);
      if (updatedDate > twentyFourHoursAgo && hasDocuments) return true;
    }
    
    return false;
  };

  // Efecto para verificar documentos nuevos al cargar el componente
  useEffect(() => {
    setHasNewDocuments(checkForNewDocuments());
  }, [pkg]);

  // Función para manejar cuando se abren los documentos
  const handleShowDocuments = (open: boolean) => {
    setShowDocuments(open);
    if (open) {
      // Marcar como visto cuando se abren los documentos
      setHasNewDocuments(false);
    }
  };

  return (
    <div className="space-y-2">
      {/* Basic Info */}
      <div className="bg-gradient-to-br from-traveler-muted to-traveler-muted/50 border border-traveler-border rounded-lg p-3">
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
        
        <div className="mt-2 bg-card/50 border border-border/50 rounded p-1.5">
          <p className="text-xs text-muted-foreground">Resumen del pedido</p>
          <p className="text-xs font-medium text-foreground">{getTotalProducts()} producto(s) • Total: ${getTotalValue()}</p>
        </div>
      </div>

      {/* Expandable Package Details */}
      <Collapsible open={showPackageDetails} onOpenChange={setShowPackageDetails}>
        <CollapsibleTrigger asChild>
          <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8">
            <div className="flex items-center gap-2">
              <Package className="h-3 w-3" />
              Ver detalles de productos
            </div>
            {showPackageDetails ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </Button>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="mt-2 bg-card border border-border rounded-lg p-3 space-y-2">
            {pkg.products ? pkg.products.map((product: any, index: number) => (
              <div key={index} className="bg-muted/30 border border-border/50 rounded p-2">
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
                {product.itemLink && (
                  <a 
                    href={product.itemLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver producto
                  </a>
                )}
              </div>
            )) : (
              // Fallback for old single-product format
              <div className="bg-muted/30 border border-border/50 rounded p-2">
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
                    className="text-xs text-primary hover:underline flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Ver producto
                  </a>
                )}
              </div>
            )}
            
            {/* Additional notes */}
            {pkg.additional_notes && (
              <div className="bg-muted/30 border border-border/50 rounded p-2">
                <p className="text-xs font-medium text-muted-foreground mb-0.5">Notas adicionales</p>
                <p className="text-xs text-foreground">{pkg.additional_notes}</p>
              </div>
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Expandable Documents Section */}
      {hasDocuments && (
        <Collapsible open={showDocuments} onOpenChange={handleShowDocuments}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-full justify-between text-xs h-8 relative">
              <div className="flex items-center gap-2">
                <FileText className="h-3 w-3" />
                Ver comprobantes y seguimiento
              </div>
              {/* Burbuja roja de notificación */}
              {hasNewDocuments && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 rounded-full bg-destructive hover:bg-destructive text-destructive-foreground text-[10px] border-0 flex items-center justify-center">
                  •
                </Badge>
              )}
              {showDocuments ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <div className="mt-2 space-y-2">
              {/* Purchase confirmation */}
              {pkg.purchase_confirmation && (
                <div className="bg-card border border-border rounded-lg p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Comprobante de Compra</p>
                  <PurchaseConfirmationViewer 
                    purchaseConfirmation={pkg.purchase_confirmation} 
                    packageId={pkg.id}
                    className="scale-90 origin-top-left"
                  />
                </div>
              )}
              
              {/* Tracking info */}
              {pkg.tracking_info && (
                <div className="bg-card border border-border rounded-lg p-2">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Información de Seguimiento</p>
                  <div className="text-xs text-foreground">
                    <p><strong>Número de seguimiento:</strong> {pkg.tracking_info.trackingNumber}</p>
                    {pkg.tracking_info.trackingUrl && (
                      <p>
                        <strong>Enlace:</strong>{" "}
                        <a 
                          href={pkg.tracking_info.trackingUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-primary hover:underline"
                        >
                          Ver seguimiento
                        </a>
                      </p>
                    )}
                    {pkg.tracking_info.notes && (
                      <p><strong>Notas:</strong> {pkg.tracking_info.notes}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
};

export default TravelerPackageDetails;