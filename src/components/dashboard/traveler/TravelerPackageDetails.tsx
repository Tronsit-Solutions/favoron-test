import { Package, ExternalLink } from "lucide-react";

interface TravelerPackageDetailsProps {
  pkg: any;
}

const TravelerPackageDetails = ({ pkg }: TravelerPackageDetailsProps) => {
  const getTotalProducts = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.reduce((sum: number, product: any) => 
        sum + parseInt(product.quantity || '1'), 0
      );
    }
    if (pkg.products) return pkg.products.length;
    return 1;
  };

  const getTotalValue = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data)) {
      return pkg.products_data.reduce((sum: number, product: any) => {
        const quantity = parseInt(product.quantity || '1');
        const unitPrice = parseFloat(product.estimatedPrice || '0');
        return sum + (quantity * unitPrice);
      }, 0).toFixed(2);
    }
    if (pkg.products) {
      return pkg.products.reduce((sum: number, product: any) => {
        const quantity = parseInt(product.quantity || '1');
        const unitPrice = parseFloat(product.estimatedPrice || '0');
        return sum + (quantity * unitPrice);
      }, 0).toFixed(2);
    }
    return pkg.estimated_price;
  };

  const renderProduct = (product: any, index: number) => {
    const quantity = parseInt(product.quantity || '1');
    const unitPrice = parseFloat(product.estimatedPrice || '0');
    const totalPrice = quantity * unitPrice;
    const tipAmount = parseFloat(product.adminAssignedTip || '0');
    const isCancelled = product.cancelled === true;

    return (
      <div key={index} className={`bg-muted/30 border border-border/50 rounded-lg p-3 ${isCancelled ? 'opacity-60 bg-destructive/5' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <p className={`text-sm font-semibold text-foreground ${isCancelled ? 'line-through' : ''}`}>
              Producto {index + 1}
              {isCancelled && (
                <span className="ml-2 text-destructive no-underline font-normal text-sm">(cancelado)</span>
              )}
            </p>
            <p className={`text-sm text-muted-foreground ${isCancelled ? 'line-through' : ''}`}>{product.itemDescription}</p>
          </div>
          <p className={`text-sm font-bold ${isCancelled ? 'text-muted-foreground line-through' : 'text-primary'}`}>
            ${quantity > 1 ? totalPrice.toFixed(2) : unitPrice.toFixed(2)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{quantity} unidad{quantity !== 1 ? 'es' : ''} · ${unitPrice.toFixed(2)} c/u</span>
          {tipAmount > 0 && (
            <span className={`font-medium ${isCancelled ? 'line-through' : 'text-green-600'}`}>
              💵 Tip: Q{tipAmount.toFixed(2)}
              {isCancelled && <span className="ml-1 text-destructive no-underline">(no aplica)</span>}
            </span>
          )}
          {product.itemLink && (
            <a 
              href={product.itemLink} 
              target="_blank" 
              rel="noopener noreferrer" 
              className={`hover:underline flex items-center gap-1 ${isCancelled ? 'text-muted-foreground' : 'text-primary'}`}
            >
              <ExternalLink className="h-3 w-3" />
              Ver producto
            </a>
          )}
        </div>

        <p className={`text-sm px-2 py-1 rounded mt-2 ${
          product.needsOriginalPackaging 
            ? 'text-amber-600 bg-amber-50' 
            : 'text-muted-foreground bg-muted/30'
        }`}>
          📦 {product.needsOriginalPackaging ? 'Conservar empaque original' : 'No requiere empaque original'}
        </p>
      </div>
    );
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
        
      </div>

      {/* Product Details - shown directly */}
      <div className="bg-card border border-border rounded-lg p-3 space-y-2">
        {pkg.products_data && Array.isArray(pkg.products_data) 
          ? pkg.products_data.map((product: any, index: number) => renderProduct(product, index))
          : pkg.products 
            ? pkg.products.map((product: any, index: number) => renderProduct(product, index))
            : (
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
        
        {pkg.additional_notes && (
          <div className="bg-muted/30 border border-border/50 rounded p-2">
            <p className="text-xs font-medium text-muted-foreground mb-0.5">Notas adicionales</p>
            <p className="text-xs text-foreground">{pkg.additional_notes}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TravelerPackageDetails;
