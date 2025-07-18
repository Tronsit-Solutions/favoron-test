import { Package as PackageIcon, MapPin } from "lucide-react";
import { Package } from "@/types";
import FavoronPaymentInfo from "./FavoronPaymentInfo";

interface ShopperPackageInfoProps {
  pkg: Package;
}
const ShopperPackageInfo = ({
  pkg
}: ShopperPackageInfoProps) => {
  const renderQuoteInfo = () => {
    if (!pkg.quote) return null;

    // Calculate total with Favorón fee (40%)
    const quote = pkg.quote as any;
    const basePrice = parseFloat(quote?.price || '0');
    const additionalFee = parseFloat(quote?.serviceFee || '0');
    const subtotal = basePrice + additionalFee;
    const totalWithFavoronFee = quote?.totalPrice ? parseFloat(quote.totalPrice) : subtotal * 1.4;
    return <div className="bg-info-muted border border-info-border rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-medium text-info">Cotización recibida:</p>
          <p className="text-lg font-bold text-info">Q{totalWithFavoronFee.toFixed(2)}</p>
        </div>
        <p className="text-xs text-info">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {quote?.message && <p className="text-sm text-info mt-2 italic">"{quote.message}"</p>}
      </div>;
  };
  const renderTravelerAddress = () => {
    if (!pkg.traveler_address) return null;
    return null; // Component not implemented yet
  };
  return <>
      {renderQuoteInfo()}
      {pkg.status === 'quote_accepted' && <FavoronPaymentInfo pkg={pkg} />}
      {pkg.status === 'approved' && renderTravelerAddress()}
    </>;
};
export default ShopperPackageInfo;