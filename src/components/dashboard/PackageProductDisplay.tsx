import { Card } from "@/components/ui/card";
import StatusAlert from "@/components/ui/status-alert";

interface Product {
  itemDescription: string;
  estimatedPrice: string;
  itemLink?: string;
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
          <p className="font-medium">
            Total estimado: ${products.reduce((sum: number, p: Product) => sum + parseFloat(p.estimatedPrice || '0'), 0).toFixed(2)}
          </p>
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