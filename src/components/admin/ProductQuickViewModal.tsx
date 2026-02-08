import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Package, DollarSign, Ruler } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { normalizeProductUrl } from "@/lib/validators";

interface ProductQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  package: any;
}

const ProductQuickViewModal = ({ isOpen, onClose, package: pkg }: ProductQuickViewModalProps) => {
  const [imageError, setImageError] = useState(false);

  // Extract product info from package
  const getProductInfo = () => {
    // Try products_data first (new format)
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.map((product: any, index: number) => ({
        id: index,
        name: product.itemDescription || 'Producto sin descripción',
        price: product.estimatedPrice || '0',
        link: product.itemLink || null,
        quantity: product.quantity || 1,
        image: product.itemImage || null,
        needsOriginalPackaging: product.needsOriginalPackaging || false
      }));
    }

    // Fallback to legacy fields
    return [{
      id: 0,
      name: pkg.item_description || 'Producto sin descripción',
      price: pkg.estimated_price || '0',
      link: pkg.item_link || null,
      quantity: 1,
      image: null,
      needsOriginalPackaging: false
    }];
  };

  const products = getProductInfo();
  const totalPrice = products.reduce((sum, product) => sum + (parseFloat(product.price) * product.quantity), 0);

  const extractDimensionsFromDescription = (description: string) => {
    const dimensionPattern = /(\d+\.?\d*)\s*[x×]\s*(\d+\.?\d*)\s*[x×]?\s*(\d+\.?\d*)?\s*(cm|inches?|in|pulgadas?)/i;
    const match = description.match(dimensionPattern);
    
    if (match) {
      const [, width, height, depth, unit] = match;
      return {
        width,
        height,
        depth: depth || null,
        unit: unit.toLowerCase().includes('cm') ? 'cm' : 'in'
      };
    }
    return null;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Vista Rápida del Producto
            {products.length > 1 && (
              <Badge variant="secondary">{products.length} productos</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {products.map((product, index) => {
            const dimensions = extractDimensionsFromDescription(product.name);
            
            return (
              <div key={product.id} className="border rounded-lg p-4 space-y-4">
                {products.length > 1 && (
                  <div className="text-sm font-medium text-muted-foreground">
                    Producto {index + 1}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Product Image */}
                  <div className="space-y-2">
                    {product.image && !imageError ? (
                      <img 
                        src={product.image} 
                        alt={product.name}
                        className="w-full h-48 object-cover rounded-lg border"
                        onError={() => setImageError(true)}
                      />
                    ) : (
                      <div className="w-full h-48 bg-muted rounded-lg border flex items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                      </div>
                    )}
                    
                    {(() => {
                      const normalizedLink = normalizeProductUrl(product.link);
                      return normalizedLink && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full"
                          onClick={() => window.open(normalizedLink, '_blank')}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver producto original
                        </Button>
                      );
                    })()}
                  </div>

                  {/* Product Details */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <div className="flex items-center gap-2 mt-2">
                        <DollarSign className="h-4 w-4" />
                        <span className="text-lg font-medium">
                          Q{parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.quantity > 1 && (
                          <span className="text-sm text-muted-foreground">
                            x{product.quantity} = Q{(parseFloat(product.price) * product.quantity).toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Dimensions */}
                    {dimensions && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4" />
                          <span className="font-medium">Dimensiones</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>Ancho: {dimensions.width} {dimensions.unit}</div>
                          <div>Alto: {dimensions.height} {dimensions.unit}</div>
                          {dimensions.depth && (
                            <div className="col-span-2">Profundo: {dimensions.depth} {dimensions.unit}</div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Indicador de empaque original */}
                    <div className={`flex items-center gap-2 px-2 py-1 rounded text-sm ${
                      product.needsOriginalPackaging 
                        ? 'text-amber-600 bg-amber-50' 
                        : 'text-muted-foreground bg-muted/30'
                    }`}>
                      📦 <span>{product.needsOriginalPackaging ? 'Requiere empaque original' : 'No requiere empaque original'}</span>
                    </div>

                    {/* Package Status */}
                    <div className="space-y-2">
                      <div className="text-sm">
                        <span className="font-medium">Estado: </span>
                        <Badge variant="outline">{pkg.status}</Badge>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Origen: </span>
                        {pkg.purchase_origin}
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Destino: </span>
                        {pkg.package_destination}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Total Summary */}
          {products.length > 1 && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total del pedido:</span>
                <span className="text-lg font-bold">Q{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Additional Notes */}
          {pkg.additional_notes && (
            <div className="border-t pt-4">
              <div className="text-sm">
                <span className="font-medium">Notas adicionales: </span>
                {pkg.additional_notes}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductQuickViewModal;