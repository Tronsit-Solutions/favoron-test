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
  packageStatus?: string; // Add package status to determine if we should show countdown
}
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire,
  deliveryMethod = 'pickup',
  shopperTrustLevel,
  adminTipAmount,
  packageStatus
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  // Use completePrice if available, otherwise recalculate
  const displayTotal = (quote as any).completePrice || getDisplayTotal(quote, deliveryMethod, shopperTrustLevel);
  
  // Only show countdown for states where quote is still pending acceptance/payment
  const shouldShowCountdown = packageStatus && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(packageStatus);
  
  return (
    <StatusAlert variant="info" title="Cotización recibida">
      <div className="space-y-2">
        <p className="font-semibold text-lg">{formatCurrency(displayTotal)}</p>
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