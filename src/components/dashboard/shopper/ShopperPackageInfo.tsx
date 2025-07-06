import { Package as PackageIcon, MapPin } from "lucide-react";
import { Package } from "@/types";

interface ShopperPackageInfoProps {
  pkg: Package;
}

const ShopperPackageInfo = ({ pkg }: ShopperPackageInfoProps) => {
  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;
    
    // Calculate total with Favorón fee (40%)
    const basePrice = parseFloat(pkg.quote.price || '0');
    const additionalFee = parseFloat(pkg.quote.serviceFee || '0');
    const subtotal = basePrice + additionalFee;
    const totalWithFavoronFee = pkg.quote.totalPrice ? parseFloat(pkg.quote.totalPrice) : subtotal * 1.4;
    
    return (
      <div className="bg-info-muted border border-info-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-info">Cotización recibida:</p>
          <p className="text-lg font-bold text-info">${totalWithFavoronFee.toFixed(2)}</p>
        </div>
        <p className="text-xs text-info">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {pkg.quote.message && (
          <p className="text-sm text-info mt-2 italic">"{pkg.quote.message}"</p>
        )}
      </div>
    );
  };

  const renderTravelerAddress = () => {
    if (!pkg.travelerAddress) return null;
    
    return (
      <div className="bg-success-muted border border-success-border rounded-lg p-3">
        <div className="flex items-start space-x-2 mb-2">
          <PackageIcon className="h-4 w-4 text-success mt-0.5" />
          <p className="text-sm font-medium text-success">Dirección del viajero para envío:</p>
        </div>
        <div className="text-sm text-success ml-6">
          <p>{pkg.travelerAddress.streetAddress}</p>
          <p>{pkg.travelerAddress.cityArea}</p>
          {pkg.travelerAddress.hotelAirbnbName && (
            <p>{pkg.travelerAddress.hotelAirbnbName}</p>
          )}
          <p>📞 {pkg.travelerAddress.contactNumber}</p>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderQuoteInfo()}
      {pkg.status === 'payment_confirmed' && renderTravelerAddress()}
    </>
  );
};

export default ShopperPackageInfo;