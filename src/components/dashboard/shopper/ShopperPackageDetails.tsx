import { Package, TripDates } from "@/types";
import { Calendar, Clock, MapPin } from "lucide-react";

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

  const renderShippingDates = () => {
    if (!pkg.matchedTripDates || pkg.status !== 'payment_confirmed') return null;
    
    const dates = pkg.matchedTripDates;
    
    return (
      <div className="bg-info-muted border border-info-border rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <Calendar className="h-4 w-4 text-info mt-0.5" />
          <p className="text-sm font-medium text-info">Fechas importantes para tu envío:</p>
        </div>
        <div className="text-sm text-info ml-6 space-y-1">
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span><strong>Primer día para enviar:</strong> {new Date(dates.firstDayPackages).toLocaleDateString('es-GT')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-3 w-3" />
            <span><strong>Último día para enviar:</strong> {new Date(dates.lastDayPackages).toLocaleDateString('es-GT')}</span>
          </div>
          <div className="flex items-center space-x-2">
            <MapPin className="h-3 w-3" />
            <span><strong>Entrega en oficina Favorón:</strong> {new Date(dates.deliveryDate).toLocaleDateString('es-GT')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-3">
      {renderProducts()}
      {renderShippingDates()}
      
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