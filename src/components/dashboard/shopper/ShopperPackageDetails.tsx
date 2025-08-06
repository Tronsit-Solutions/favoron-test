import { Package, TripDates } from "@/types";

interface ShopperPackageDetailsProps {
  pkg: Package;
}

const ShopperPackageDetails = ({ pkg }: ShopperPackageDetailsProps) => {
  const renderProducts = () => {
    // Check if there's products_data (new format)
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      const product = pkg.products_data[0] as any; // Type assertion for JSONB data
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
    <div className="space-y-3">
      {renderProducts()}
      
      {pkg.additional_notes && (
        <p className="text-sm">
          <strong>Notas adicionales:</strong> {pkg.additional_notes}
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Creado el {new Date(pkg.created_at).toLocaleDateString('es-GT')}
      </p>
    </div>
  );
};

export default ShopperPackageDetails;