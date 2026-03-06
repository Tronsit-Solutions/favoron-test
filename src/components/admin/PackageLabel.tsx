import React from 'react';

interface PackageLabelProps {
  pkg: any;
  trip?: any;
  className?: string;
  customDescriptions?: { [productIndex: number]: string };
  labelNumber?: number;
}

export const PackageLabel = ({ pkg, trip, className = '', customDescriptions, labelNumber }: PackageLabelProps) => {
  const getShopperName = () => {
    // First try shopper_name (from useOperationsData)
    if (pkg.shopper_name && pkg.shopper_name !== 'Shopper desconocido') {
      return pkg.shopper_name;
    }
    // Fallback to profiles (from other sources like admin panel)
    if (pkg.profiles?.first_name || pkg.profiles?.last_name) {
      return `${pkg.profiles.first_name || ''} ${pkg.profiles.last_name || ''}`.trim();
    }
    return 'N/A';
  };

  const getDeliveryMethodText = () => {
    if (pkg.delivery_method === 'delivery') {
      return 'A domicilio';
    } else {
      return 'Pick-up';
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
      const total = pkg.products_data.filter((p: any) => !p.cancelled).reduce((sum, product) => {
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
      const total = pkg.products_data.filter((p: any) => !p.cancelled).reduce((sum, product) => {
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

  const getFormattedDescription = () => {
    if (pkg.products_data && Array.isArray(pkg.products_data) && pkg.products_data.length > 0) {
      const activeProducts = pkg.products_data
        .map((product: any, originalIndex: number) => ({ ...product, originalIndex }))
        .filter((p: any) => !p.cancelled);
      return activeProducts.map((product: any, index: number) => {
        const quantity = parseInt(product.quantity || '1');
        const description = customDescriptions?.[product.originalIndex] || product.itemDescription || '';
        const quantityText = quantity > 1 ? ` (${quantity}x)` : '';
        return (
          <div key={index} className="break-words">
            {index + 1}. {description}{quantityText}
          </div>
        );
      });
    }
    return customDescriptions?.[0] || pkg.item_description;
  };

  const isCompact = pkg.__compact === true;

  return (
    <div className={`bg-white border-2 border-black ${className}`} 
         style={{ 
           width: isCompact ? '252px' : '288px', 
           height: isCompact ? '360px' : '432px', 
           fontFamily: 'monospace',
           fontSize: isCompact ? '10px' : '12px',
           lineHeight: '1.2',
           position: 'relative'
         }}>
      {/* Header with Logo */}
      <div className={`text-center ${isCompact ? 'py-1' : 'py-2'} border-b border-black`}>
        <img 
          src="/favoron-logo.jpg" 
          alt="Favorón"
          className={`${isCompact ? 'h-6' : 'h-8'} mx-auto`}
          style={{ filter: 'grayscale(100%)' }}
        />
      </div>

      {/* Content */}
      <div className={`${isCompact ? 'p-2 space-y-1' : 'p-2 space-y-1'} text-xs`}>
        {/* Package Info - Unified Section */}
        <div>
          <div className="font-bold mb-1">INFORMACIÓN DEL PEDIDO:</div>
          <div className="break-words space-y-1">
            <div className="mt-1">
              {getFormattedDescription()}
            </div>
            <div><strong>NO. DE SEGUIMIENTO:</strong> {getPackageId()}</div>
            
            <div><strong>Cantidad:</strong> {getTotalQuantity()}</div>
          </div>
        </div>

        {/* Shopper Info */}
        <div>
          <div>
            <span className="font-bold">DESTINATARIO:</span> {getShopperName()}
          </div>
        </div>


        {/* Delivery Method */}
        <div>
          <div>
            <span className="font-bold">ENTREGA:</span> {getDeliveryMethodText()}
          </div>
        </div>

        {/* Label Number under Delivery */}
        <div>
          <div>
            <span className="font-bold">No. de etiqueta:</span>{' '}
            {labelNumber !== undefined && labelNumber !== null
              ? String(labelNumber).padStart(4, '0')
              : '####'}
          </div>
        </div>
        {/* Delivery Address (only for delivery) */}
        {pkg.delivery_method === 'delivery' && getDeliveryAddress() && (
          <div>
            <div className="font-bold mb-1">DIRECCIÓN:</div>
            <div className="break-words">{getDeliveryAddress()}</div>
          </div>
        )}

      </div>

      {/* Label Number - Bottom Right Corner */}
      <div
        style={{
          position: 'absolute',
          bottom: '6px',
          right: '6px',
          fontSize: '8px',
          fontFamily: 'monospace',
          color: '#999',
          fontWeight: 'normal',
          opacity: 0.7
        }}
      >
        {labelNumber !== undefined && labelNumber !== null 
          ? `No. ${String(labelNumber).padStart(4, '0')}`
          : 'No. ####'}
      </div>
    </div>
  );
};