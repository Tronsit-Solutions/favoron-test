import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { getPriceBreakdown } from "@/lib/pricing";
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
  
  // Use the same calculation logic as QuoteDialog.tsx
  const base = parseFloat(quote.price || String(adminTipAmount || '0')) || 0;
  const breakdown = getPriceBreakdown(base, deliveryMethod, shopperTrustLevel);
  const displayTotal = breakdown.totalPrice;
  
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