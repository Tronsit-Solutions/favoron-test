import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { getPriceBreakdown } from "@/lib/pricing";
import { useAuth } from "@/hooks/useAuth";
interface PackageQuoteInfoProps {
  quote: {
    totalPrice: string;
    message?: string;
  } | null;
  quoteExpiresAt?: string | Date | null;
  onQuoteExpire?: () => void;
}
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire
}: PackageQuoteInfoProps) => {
  const { profile } = useAuth();
  if (!quote) return null;
  let displayTotal = parseFloat(quote.totalPrice || '0');
  const trustLevel = (profile as any)?.trust_level as string | undefined;
  try {
    const baseFromQuote = parseFloat((quote as any)?.price || '0');
    if (trustLevel === 'prime') {
      const base = Number.isFinite(baseFromQuote) && baseFromQuote > 0
        ? baseFromQuote
        : (displayTotal > 0 ? displayTotal / 1.4 : 0);
      if (base > 0) {
        const breakdown = getPriceBreakdown(base);
        displayTotal = breakdown.totalPrice;
      }
    }
  } catch {}
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