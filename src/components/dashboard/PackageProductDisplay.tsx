import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import StatusAlert from "@/components/ui/status-alert";
import { ExternalLink } from "lucide-react";
import { normalizeProductUrl } from "@/lib/validators";

interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
  quantity?: string;
  adminAssignedTip?: number;
  needsOriginalPackaging?: boolean;
}

interface PackageProductDisplayProps {
  products?: Product[];
  itemDescription?: string;
  itemLink?: string;
  estimatedPrice?: string;
}

const PackageProductDisplay = ({ 
  products, 
  itemDescription, 
  itemLink, 
  estimatedPrice 
}: PackageProductDisplayProps) => {
  // Debug: Log received data
  console.log('🎯 PackageProductDisplay received:', {
    products,
    itemDescription,
    itemLink,
    estimatedPrice
  });

  // Multiple products display
  if (products && products.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Productos solicitados ({products.length}):</p>
        <div className="space-y-3">
          {products.map((product: Product, index: number) => (
            <Card key={index} className="p-4 border-l-4 border-l-primary/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-primary">Producto #{index + 1}</span>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">${product.estimatedPrice || '0'}</span>
                  {product.quantity && product.quantity !== '1' && (
                    <p className="text-xs text-muted-foreground">x {product.quantity} unidades</p>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">{product.itemDescription}</p>
                
                {product.quantity && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Cantidad: {product.quantity} unidad{product.quantity !== '1' ? 'es' : ''}
                    </Badge>
                  </div>
                )}
                
                
                {(() => {
                  const normalizedLink = normalizeProductUrl(product.itemLink);
                  return normalizedLink && (
                    <div className="pt-2">
                      <a 
                        href={normalizedLink} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="inline-flex items-center gap-1 text-sm text-primary hover:underline font-medium"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Ver producto en tienda
                      </a>
                    </div>
                  );
                })()}
                
                {/* Indicador de empaque original */}
                <div className={`mt-2 px-2 py-1 rounded text-xs flex items-center gap-1 ${
                  product.needsOriginalPackaging 
                    ? 'text-amber-600 bg-amber-50' 
                    : 'text-muted-foreground bg-muted/30'
                }`}>
                  📦 {product.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
                </div>
              </div>
            </Card>
          ))}
        </div>
        <StatusAlert variant="info">
          <div className="space-y-1">
            <p className="font-medium text-foreground">
              Total estimado: ${products.reduce((sum: number, p: Product) => {
                const price = parseFloat(p.estimatedPrice || '0');
                const quantity = parseInt(p.quantity || '1');
                return sum + (price * quantity);
              }, 0).toFixed(2)}
            </p>
          </div>
        </StatusAlert>
      </div>
    );
  }

  // Single product display (backward compatibility)
  const normalizedSingleLink = normalizeProductUrl(itemLink);
  if (normalizedSingleLink) {
    return (
      <div className="text-sm">
        <strong>Link del producto:</strong>{' '}
        <a 
          href={normalizedSingleLink} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-primary hover:underline"
        >
          Ver producto
        </a>
      </div>
    );
  }

  return null;
};

export default PackageProductDisplay;