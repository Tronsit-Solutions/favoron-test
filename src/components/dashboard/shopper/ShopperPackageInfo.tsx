import { Package as PackageIcon, MapPin } from "lucide-react";
import { Package } from "@/types";
import PaymentReceiptUpload from "./PaymentReceiptUpload";
interface ShopperPackageInfoProps {
  pkg: Package;
  onPackageUpdate?: () => void;
}
const ShopperPackageInfo = ({
  pkg,
  onPackageUpdate
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

  const renderPaymentUpload = () => {
    if (!['quote_accepted', 'awaiting_payment'].includes(pkg.status)) return null;
    return (
      <div className="mt-4">
        <PaymentReceiptUpload 
          pkg={pkg} 
          onUploadComplete={() => onPackageUpdate?.()} 
        />
      </div>
    );
  };

  return <>
      {renderQuoteInfo()}
      {renderPaymentUpload()}
      {pkg.status === 'payment_confirmed' && renderTravelerAddress()}
    </>;
};
export default ShopperPackageInfo;