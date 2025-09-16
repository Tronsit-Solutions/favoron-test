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
}
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire,
  deliveryMethod = 'pickup',
  shopperTrustLevel,
  adminTipAmount
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  // Always recalculate total to ensure correctness with current trust level
  const displayTotal = getDisplayTotal(quote, deliveryMethod, shopperTrustLevel);
  
  return (
    <StatusAlert variant="info" title="Cotización recibida">
      <div className="space-y-2">
        <p className="font-semibold text-lg">{formatCurrency(displayTotal)}</p>
        {quote.message && (
          <p className="text-sm text-muted-foreground">Mensaje del viajero: "{quote.message}"</p>
        )}
        {quoteExpiresAt && (
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