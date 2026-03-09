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
      <div key={index} className={`bg-muted/30 border border-border/50 rounded p-2 ${isCancelled ? 'opacity-60 bg-destructive/5' : ''}`}>
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1">
            <p className={`text-xs font-medium text-foreground ${isCancelled ? 'line-through' : ''}`}>
              Producto {index + 1}
              {isCancelled && (
                <span className="ml-2 text-destructive no-underline font-normal">(cancelado)</span>
              )}
            </p>
            <p className={`text-xs text-muted-foreground ${isCancelled ? 'line-through' : ''}`}>{product.itemDescription}</p>
            <div className="mt-1 space-y-1">
              <p className="text-xs text-muted-foreground">
                <strong>Cantidad:</strong> {quantity} unidad{quantity !== 1 ? 'es' : ''}
              </p>
              <p className="text-xs text-muted-foreground">
                <strong>Precio unitario:</strong> ${unitPrice.toFixed(2)}
              </p>
              {quantity > 1 && (
                <p className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">
                  💰 <strong>Total:</strong> ${unitPrice.toFixed(2)} × {quantity} = <strong>${totalPrice.toFixed(2)}</strong>
                </p>
              )}
              {tipAmount > 0 && (
                <p className={`text-xs font-medium ${isCancelled ? 'text-muted-foreground line-through' : 'text-green-600'}`}>
                  💵 <strong>Tu tip:</strong> Q{tipAmount.toFixed(2)}
                  {isCancelled && <span className="ml-1 text-destructive no-underline">(no aplica)</span>}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className={`text-xs font-bold ${isCancelled ? 'text-muted-foreground line-through' : 'text-primary'}`}>
              ${quantity > 1 ? totalPrice.toFixed(2) : unitPrice.toFixed(2)}
            </p>
            {quantity > 1 && (
              <p className="text-xs text-muted-foreground">Total</p>
            )}
          </div>
        </div>
        {product.itemLink && (
          <a 
            href={product.itemLink} 
            target="_blank" 
            rel="noopener noreferrer" 
            className={`text-xs hover:underline flex items-center gap-1 ${isCancelled ? 'text-muted-foreground' : 'text-primary'}`}
          >
            <ExternalLink className="h-3 w-3" />
            Ver producto
          </a>
        )}
        <p className={`text-xs px-2 py-1 rounded mt-1 flex items-center gap-1 ${
          product.needsOriginalPackaging 
            ? 'text-amber-600 bg-amber-50' 
            : 'text-muted-foreground bg-muted/30'
        }`}>
          📦 {product.needsOriginalPackaging ? 'Conservar empaque original del producto' : 'No requiere empaque original'}
          <span className="block text-[10px] text-muted-foreground font-normal ml-5">
            {product.needsOriginalPackaging 
              ? 'Se refiere al empaque de la marca, no a la caja de cartón del envío/delivery.' 
              : 'Puedes descartar el empaque de la marca y enviar solo el producto.'}
          </span>
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
        
        <div className="mt-2 bg-card/50 border border-border/50 rounded p-1.5">
          <p className="text-xs text-muted-foreground">Resumen del pedido</p>
          <p className="text-xs font-medium text-foreground">{getTotalProducts()} producto(s) • Total: ${getTotalValue()}</p>
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
