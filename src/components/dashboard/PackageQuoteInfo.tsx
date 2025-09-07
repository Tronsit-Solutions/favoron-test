import StatusAlert from "@/components/ui/status-alert";
import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
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
  if (!quote) return null;
  const totalPrice = parseFloat(quote.totalPrice || '0');
  return <StatusAlert variant="info" title="Cotización recibida">
      
    </StatusAlert>;
};
export default PackageQuoteInfo;