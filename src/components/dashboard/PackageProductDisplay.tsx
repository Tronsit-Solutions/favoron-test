import { Card } from "@/components/ui/card";
import StatusAlert from "@/components/ui/status-alert";

interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
  quantity?: string;
  adminAssignedTip?: number;
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
  // Multiple products display
  if (products && products.length > 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Productos solicitados ({products.length}):</p>
        <div className="space-y-3">
          {products.map((product: Product, index: number) => (
            <Card key={index} className="p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Producto #{index + 1}</span>
                <span className="text-sm text-muted-foreground">${product.estimatedPrice}</span>
              </div>
              <p className="text-sm mb-2">{product.itemDescription}</p>
              {product.quantity && (
                <p className="text-xs text-muted-foreground mb-2">
                  <strong>Cantidad:</strong> {product.quantity} unidad{product.quantity !== '1' ? 'es' : ''}
                </p>
              )}
              {product.adminAssignedTip && (
                <p className="text-xs text-green-600 font-medium mb-2">
                  <strong>Tip asignado:</strong> Q{product.adminAssignedTip.toFixed(2)}
                </p>
              )}
              {product.itemLink && (
                <a 
                  href={product.itemLink} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="text-sm text-primary hover:underline"
                >
                  Ver producto
                </a>
              )}
            </Card>
          ))}
        </div>
        <StatusAlert variant="info">
          <div className="space-y-1">
            <p className="font-medium">
              Total estimado: ${products.reduce((sum: number, p: Product) => {
                const price = parseFloat(p.estimatedPrice || '0');
                const quantity = parseInt(p.quantity || '1');
                return sum + (price * quantity);
              }, 0).toFixed(2)}
            </p>
            {products.some(p => p.adminAssignedTip) && (
              <p className="font-medium text-green-600">
                Tip total asignado: Q{products.reduce((sum: number, p: Product) => sum + (p.adminAssignedTip || 0), 0).toFixed(2)}
              </p>
            )}
          </div>
        </StatusAlert>
      </div>
    );
  }

  // Single product display (backward compatibility)
  if (itemLink) {
    return (
      <div className="text-sm">
        <strong>Link del producto:</strong>{' '}
        <a 
          href={itemLink} 
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