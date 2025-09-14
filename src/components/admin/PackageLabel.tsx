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
      return '🚚 A DOMICILIO';
    } else {
      return '🏢 PICK-UP';
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
           width: '1in', 
           height: '1.5in', 
           fontFamily: 'monospace',
           fontSize: '3px',
           lineHeight: '1.1'
         }}>
      {/* Header with Logo */}
      <div className="text-center py-1 border-b border-black">
        <img 
          src="/favoron-logo.jpg" 
          alt="Favorón"
          className="h-3 mx-auto mb-1"
          style={{ filter: 'grayscale(100%)' }}
        />
        <div className="text-xs font-bold">ETIQUETA</div>
      </div>

      {/* Content */}
      <div className="p-1 space-y-1">
        {/* Package Info - Compact */}
        <div>
          <div className="font-bold">ID: {getPackageId()}</div>
          <div className="break-words">{pkg.item_description}</div>
          <div>${getPackagePrice()}</div>
        </div>

        {/* Shopper */}
        <div>
          <span className="font-bold">SHOPPER:</span> {getShopperName()}
        </div>

        {/* Delivery */}
        <div>
          <span className="font-bold">ENTREGA:</span> {getDeliveryMethodText()}
        </div>

        {/* Date */}
        <div className="pt-1 border-t border-gray-400">
          <div>{getCreationDate()}</div>
        </div>
      </div>
    </div>
  );
};