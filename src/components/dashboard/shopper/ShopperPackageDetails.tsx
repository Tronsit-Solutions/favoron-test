import { useState } from "react";
import { Package } from "@/types";
import { Button } from "@/components/ui/button";
import { Eye, Package2 } from "lucide-react";
import ProductDetailsModal from "../ProductDetailsModal";

interface ShopperPackageDetailsProps {
  pkg: Package;
}

const ShopperPackageDetails = ({ pkg }: ShopperPackageDetailsProps) => {
  const [showModal, setShowModal] = useState(false);

  // Check if it's a multiple product order
  const isMultipleProducts = pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 1;
  
  const getProductCount = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.length;
    }
    return 1;
  };

  const renderProducts = () => {
    // If multiple products, show summary and button
    if (isMultipleProducts) {
      const productCount = getProductCount();
      const totalEstimated = Array.isArray(pkg.products_data) 
        ? (pkg.products_data as any[]).reduce((sum: number, product: any) => {
            const price = parseFloat(product.estimatedPrice || '0');
            const quantity = parseInt(product.quantity || '1');
            return sum + (price * quantity);
          }, 0)
        : 0;

      return (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm">
              <strong>Pedido múltiple:</strong> {productCount} productos
            </p>
            <span className="text-sm font-semibold text-primary">
              Total: ${totalEstimated.toFixed(2)}
            </span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setShowModal(true)}
            className="w-full"
          >
            <Eye className="h-4 w-4 mr-2" />
            Ver todos los productos ({productCount})
          </Button>
        </div>
      );
    }

    // Single product display (keep existing logic)
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      const product = pkg.products_data[0] as any;
      return (
        <div className="space-y-3">
          <p className="text-sm">
            <strong>Descripción:</strong> {product.itemDescription}
          </p>
          {product.itemLink && (
            <p className="text-sm">
              <strong>Link del producto:</strong>{' '}
              <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Ver producto
              </a>
            </p>
          )}
          <p className="text-sm">
            <strong>Precio estimado:</strong> ${product.estimatedPrice}
          </p>
          {product.quantity && (
            <p className="text-sm">
              <strong>Cantidad:</strong> {product.quantity} unidad{product.quantity !== '1' ? 'es' : ''}
            </p>
          )}
        </div>
      );
    }
    
    // Fallback to old format
    return (
      <div className="space-y-3">
        <p className="text-sm">
          <strong>Descripción:</strong> {pkg.item_description}
        </p>
        {pkg.item_link && (
          <p className="text-sm">
            <strong>Link del producto:</strong>{' '}
            <a href={pkg.item_link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Ver producto
            </a>
          </p>
        )}
        <p className="text-sm">
          <strong>Precio estimado:</strong> ${pkg.estimated_price}
        </p>
      </div>
    );
  };

  return (
    <>
      <div className="space-y-3">
        {renderProducts()}
        
        <p className="text-sm">
          <strong>Método de entrega:</strong> {pkg.delivery_method === 'delivery' ? 'Envío a domicilio' : 'Pick-up en oficina'}
        </p>

        {(pkg as any).is_personal_order && (pkg as any).personal_order_instructions && (
          <div className="bg-muted/50 border border-muted rounded-lg p-3">
            <p className="text-sm">
              <strong>Instrucciones del pedido personal:</strong>
            </p>
            <p className="text-sm mt-2 whitespace-pre-wrap">{(pkg as any).personal_order_instructions}</p>
          </div>
        )}
        
        {pkg.additional_notes && (
          <p className="text-sm">
            <strong>Notas adicionales:</strong> {pkg.additional_notes}
          </p>
        )}
        
        <p className="text-xs text-muted-foreground">
          Creado el {new Date(pkg.created_at).toLocaleDateString('es-GT')}
        </p>
      </div>

      <ProductDetailsModal 
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        pkg={pkg}
      />
    </>
  );
};

export default ShopperPackageDetails;