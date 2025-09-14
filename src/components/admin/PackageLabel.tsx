import React from 'react';

interface PackageLabelProps {
  pkg: any;
  className?: string;
}

export const PackageLabel = ({ pkg, className = '' }: PackageLabelProps) => {
  const getShopperName = () => {
    if (pkg.profiles?.first_name || pkg.profiles?.last_name) {
      return `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim();
    }
    return 'N/A';
  };

  const getDeliveryMethodText = () => {
    if (pkg.delivery_method === 'delivery') {
      return 'A DOMICILIO';
    } else {
      return 'PICK-UP';
    }
  };

  const getDeliveryAddress = () => {
    if (pkg.delivery_method === 'delivery' && pkg.confirmed_delivery_address) {
      const addr = pkg.confirmed_delivery_address;
      return [
        addr.streetAddress,
        addr.cityArea,
        addr.hotelAirbnbName,
        addr.contactNumber ? `Tel: ${addr.contactNumber}` : null
      ].filter(Boolean).join(', ');
    }
    return null;
  };

  const getPackageId = () => {
    return pkg.id ? pkg.id.substring(0, 8).toUpperCase() : 'N/A';
  };

  const getPackagePrice = () => {
    // Try to get price from products_data first
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      const total = pkg.products_data.reduce((sum, product) => {
        const price = parseFloat(product.estimatedPrice || '0');
        const quantity = parseInt(product.quantity || '1');
        return sum + (price * quantity);
      }, 0);
      return `$${total.toFixed(2)}`;
    }
    // Fallback to estimated_price
    if (pkg.estimated_price) {
      return `$${parseFloat(pkg.estimated_price).toFixed(2)}`;
    }
    return 'N/A';
  };

  const getTotalQuantity = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      const total = pkg.products_data.reduce((sum, product) => {
        return sum + parseInt(product.quantity || '1');
      }, 0);
      return total.toString();
    }
    return '1';
  };

  const getCreationDate = () => {
    if (pkg.created_at) {
      return new Date(pkg.created_at).toLocaleDateString('es-GT');
    }
    return 'N/A';
  };

  return (
    <div className={`bg-white border-2 border-black ${className}`} 
         style={{ 
           width: '288px', 
           height: '432px', 
           fontFamily: 'monospace',
           fontSize: '12px',
           lineHeight: '1.2'
         }}>
      {/* Header with Logo */}
      <div className="text-center py-4 border-b border-black">
        <img 
          src="/favoron-logo.jpg" 
          alt="Favorón"
          className="h-12 mx-auto mb-2"
          style={{ filter: 'grayscale(100%)' }}
        />
        <div className="text-lg font-bold">ETIQUETA PEDIDO</div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Package Info - Unified Section */}
        <div>
          <div className="text-sm font-bold mb-1">INFORMACIÓN DEL PEDIDO:</div>
          <div className="text-xs break-words space-y-1">
            <div><strong>Descripción:</strong> {pkg.item_description}</div>
            <div><strong>ID:</strong> {getPackageId()}</div>
            <div><strong>Precio Total:</strong> {getPackagePrice()}</div>
            <div><strong>Cantidad:</strong> {getTotalQuantity()}</div>
          </div>
        </div>

        {/* Shopper Info */}
        <div>
          <div className="text-sm">
            <span className="font-bold">SHOPPER:</span> {getShopperName()}
          </div>
        </div>

        {/* Delivery Method */}
        <div>
          <div className="text-sm">
            <span className="font-bold">ENTREGA:</span> {getDeliveryMethodText()}
          </div>
        </div>

        {/* Delivery Address (only for delivery) */}
        {pkg.delivery_method === 'delivery' && getDeliveryAddress() && (
          <div>
            <div className="text-sm font-bold mb-1">DIRECCIÓN:</div>
            <div className="text-xs break-words">{getDeliveryAddress()}</div>
          </div>
        )}

        {/* Dates */}
        <div className="pt-2 border-t border-gray-400 space-y-2">
          <div>
            <div className="text-sm font-bold mb-1">FECHA PEDIDO:</div>
            <div className="text-xs">{getCreationDate()}</div>
          </div>
          <div>
            <div className="text-sm font-bold mb-1">FECHA ETIQUETA:</div>
            <div className="text-xs">{new Date().toLocaleDateString('es-GT')}</div>
          </div>
        </div>
      </div>
    </div>
  );
};