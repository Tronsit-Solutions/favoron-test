import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { getDisplayTotal } from "@/lib/quoteHelpers";
interface PackageQuoteInfoProps {
  quote: {
    totalPrice: string;
    price?: string;
    message?: string;
  } | null;
  quoteExpiresAt?: string | Date | null;
  onQuoteExpire?: () => void;
  deliveryMethod?: string;
  shopperTrustLevel?: string;
  adminTipAmount?: number;
  packageStatus?: string;
  packageDestination?: string;
  productsData?: any[];
}
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire,
  deliveryMethod = 'pickup',
  shopperTrustLevel,
  adminTipAmount,
  packageStatus,
  packageDestination,
  productsData
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  // Calculate base from products_data admin tips
  const products = productsData || [];
  const sumOfAdminTips = products.reduce((sum, product) => {
    const tip = parseFloat(product.adminAssignedTip || '0');
    return sum + tip;
  }, 0);
  
  // Use stored fees or recalculate
  const serviceFee = parseFloat((quote as any).serviceFee || '0');
  const deliveryFee = parseFloat((quote as any).deliveryFee || '0');
  
  const favoronTotal = sumOfAdminTips + serviceFee;
  const displayTotal = sumOfAdminTips + serviceFee + deliveryFee;
  
  // Only show countdown for states where quote is still pending acceptance/payment
  const shouldShowCountdown = packageStatus && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(packageStatus);
  
  return (
    <StatusAlert variant="info" title="Cotización recibida">
      <div className="space-y-3">
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span>Favorón:</span>
            <span className="font-medium">{formatCurrency(favoronTotal)}</span>
          </div>
          {deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Envío a domicilio:</span>
              <span className="font-medium">{formatCurrency(deliveryFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(displayTotal)}</span>
          </div>
        </div>
        {quote.message && (
          <p className="text-sm text-muted-foreground">Mensaje del viajero: "{quote.message}"</p>
        )}
        {quoteExpiresAt && shouldShowCountdown && (
          <QuoteCountdown 
            expiresAt={quoteExpiresAt} 
            onExpire={onQuoteExpire}
            compact={true}
          />
        )}
      </div>
    </StatusAlert>
  );
};
export default PackageQuoteInfo;