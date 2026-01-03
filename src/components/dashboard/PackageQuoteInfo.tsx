import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { getQuoteValues, getFavoronTotal } from "@/lib/quoteHelpers";

interface PackageQuoteInfoProps {
  quote: {
    totalPrice: string;
    price?: string;
    message?: string;
  } | null;
  quoteExpiresAt?: string | Date | null;
  onQuoteExpire?: () => void;
  packageStatus?: string;
}

/**
 * Displays quote information to the shopper.
 * Uses saved quote values from the database - NO recalculation.
 * When admin edits a quote, this component will show the updated values.
 */
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire,
  packageStatus
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  // Use centralized function to read saved quote values
  const quoteValues = getQuoteValues(quote);
  
  // Favorón total = price (traveler tip) + serviceFee
  const favoronTotal = getFavoronTotal(quote);
  
  // Display total is what the shopper pays (after any discount)
  const displayTotal = quoteValues.finalTotalPrice;
  
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
          {quoteValues.deliveryFee > 0 && (
            <div className="flex justify-between text-sm">
              <span>Envío a domicilio:</span>
              <span className="font-medium">{formatCurrency(quoteValues.deliveryFee)}</span>
            </div>
          )}
          {quoteValues.discountAmount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Descuento{quoteValues.discountCode ? ` (${quoteValues.discountCode})` : ''}:</span>
              <span className="font-medium">-{formatCurrency(quoteValues.discountAmount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold pt-1 border-t border-gray-200">
            <span>Total:</span>
            <span>{formatCurrency(displayTotal)}</span>
          </div>
        </div>
        {quoteValues.message && (
          <p className="text-sm text-muted-foreground">Mensaje del viajero: "{quoteValues.message}"</p>
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