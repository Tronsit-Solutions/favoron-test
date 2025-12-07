import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { calculateServiceFee, getDeliveryFee } from "@/lib/pricing";
import { useAuth } from "@/hooks/useAuth";
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
  /** @deprecated Use cityArea instead */
  packageDestination?: string;
  /** cityArea from confirmed_delivery_address - used for delivery fee calculation */
  cityArea?: string;
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
  cityArea,
  productsData
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  const { profile } = useAuth();
  const effectiveTrust = shopperTrustLevel ?? profile?.trust_level;
  
  // Calculate base from products_data admin tips
  const products = productsData || [];
  const sumOfAdminTips = products.reduce((sum, product) => {
    const raw = product?.adminAssignedTip;
    const tip = typeof raw === 'string' ? parseFloat(raw) : Number(raw || 0);
    return sum + (Number.isFinite(tip) ? tip : 0);
  }, 0);
  
  // Recalculate fees correctly based on trust level and delivery method
  // Use cityArea for delivery fee calculation (fall back to packageDestination for backwards compat)
  const serviceFee = calculateServiceFee(sumOfAdminTips, effectiveTrust);
  const deliveryFee = getDeliveryFee(deliveryMethod, effectiveTrust, cityArea || packageDestination);
  
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