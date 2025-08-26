import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";

interface PackageQuoteInfoProps {
  quote: {
    totalPrice: string;
    message?: string;
  } | null;
  quoteExpiresAt?: string | Date | null;
  onQuoteExpire?: () => void;
}

const PackageQuoteInfo = ({ quote, quoteExpiresAt, onQuoteExpire }: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  const totalPrice = parseFloat(quote.totalPrice || '0');
  
  return (
    <StatusAlert variant="info" title="Cotización recibida">
      <div className="space-y-2">
        <p className="text-lg font-semibold">
          Total: ${totalPrice.toFixed(2)}
        </p>
        <p className="text-xs opacity-90">
          Este precio ya incluye todo: servicio Favorón + seguro + compensación al viajero.
        </p>
        {quote.message && (
          <p className="italic">"{quote.message}"</p>
        )}
      </div>
    </StatusAlert>
  );
};

export default PackageQuoteInfo;