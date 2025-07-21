import { Package as PackageType } from "@/types";

interface ShippingInstructionsProps {
  pkg: PackageType;
}

const ShippingInstructions = ({ pkg }: ShippingInstructionsProps) => {
  // Solo mostrar si el pago ha sido aprobado
  if (pkg.status !== 'payment_confirmed' || !pkg.traveler_address) {
    return null;
  }

  const address = pkg.traveler_address as any;
  const tripDates = pkg.matched_trip_dates as any;

  return (
    <div className="bg-green-50/50 border border-green-200 rounded-md p-2 mb-3">
      <div className="flex items-center space-x-2 mb-2">
        <span className="text-xs">✅</span>
        <div>
          <h3 className="text-xs font-bold text-green-800">¡Pago Aprobado!</h3>
          <p className="text-xs text-green-700">Envía el producto a:</p>
        </div>
      </div>
      
      <div className="bg-background/80 rounded p-1.5 border border-border text-xs">
        <p className="font-medium">{address.recipientName || 'No especificado'}</p>
        <p>{address.streetAddress}</p>
        {address.streetAddress2 && <p>{address.streetAddress2}</p>}
        <p>{address.cityArea} {address.postalCode && `• ${address.postalCode}`}</p>
        <p>📞 {address.contactNumber}</p>
      </div>
      
      <p className="text-xs text-muted-foreground mt-1">
        💡 Pedido #{pkg.id} • Sube comprobante y tracking después del envío
      </p>
    </div>
  );
};

export default ShippingInstructions;