import { Package, TripDates } from "@/types";

interface ShopperPackageDetailsProps {
  pkg: Package;
}

const ShopperPackageDetails = ({ pkg }: ShopperPackageDetailsProps) => {
  const renderProducts = () => {
    if (pkg.products && pkg.products.length > 0) {
      return (
        <div className="space-y-3">
          <p className="text-sm font-medium">Productos solicitados ({pkg.products.length}):</p>
          {pkg.products.map((product, index) => (
            <div key={index} className="border rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Producto #{index + 1}</span>
                <span className="text-sm text-muted-foreground">${product.estimatedPrice}</span>
              </div>
              <p className="text-sm">{product.itemDescription}</p>
              {product.itemLink && (
                <a href={product.itemLink} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline block">
                  Ver producto
                </a>
              )}
            </div>
          ))}
          <div className="bg-info-muted border border-info-border rounded-lg p-2">
            <p className="text-sm font-medium text-info">
              Total estimado: ${pkg.products.reduce((sum, p) => sum + parseFloat(p.estimatedPrice || '0'), 0).toFixed(2)}
            </p>
          </div>
        </div>
      );
    }

    // Single product display (backward compatibility)
    return (
      <p className="text-sm">
        <strong>Link del producto:</strong>{' '}
        <a href={pkg.itemLink} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
          Ver producto
        </a>
      </p>
    );
  };

  return (
    <div className="space-y-3">
      {renderProducts()}
      
      {pkg.additionalNotes && (
        <p className="text-sm">
          <strong>Notas adicionales:</strong> {pkg.additionalNotes}
        </p>
      )}
      
      <p className="text-xs text-muted-foreground">
        Creado el {new Date(pkg.createdAt).toLocaleDateString('es-GT')}
      </p>
    </div>
  );
};

export default ShopperPackageDetails;