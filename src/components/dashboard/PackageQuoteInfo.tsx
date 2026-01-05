import QuoteCountdown from "./QuoteCountdown";
import { formatCurrency } from "@/lib/formatters";
import { getQuoteValues } from "@/lib/quoteHelpers";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plane, Calendar } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface TravelerInfo {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

interface TripInfo {
  fromCity?: string;
  toCity?: string;
  deliveryDate?: string;
}

interface PackageQuoteInfoProps {
  quote: {
    totalPrice: string;
    price?: string;
    message?: string;
  } | null;
  quoteExpiresAt?: string | Date | null;
  onQuoteExpire?: () => void;
  packageStatus?: string;
  travelerInfo?: TravelerInfo;
  tripInfo?: TripInfo;
}

const getInitials = (firstName?: string, lastName?: string) => {
  const first = firstName?.charAt(0)?.toUpperCase() || '';
  const last = lastName?.charAt(0)?.toUpperCase() || '';
  return first + last || 'V';
};

const formatDate = (dateString?: string) => {
  if (!dateString) return '';
  try {
    return format(new Date(dateString + 'T12:00:00'), 'd MMM', { locale: es });
  } catch {
    return dateString;
  }
};

/**
 * Displays quote information to the shopper with traveler info.
 * Uses quote values directly from DB - single source of truth.
 */
const PackageQuoteInfo = ({
  quote,
  quoteExpiresAt,
  onQuoteExpire,
  packageStatus,
  travelerInfo,
  tripInfo
}: PackageQuoteInfoProps) => {
  if (!quote) return null;
  
  // Use saved quote values directly from DB - single source of truth
  const quoteValues = getQuoteValues(quote);
  
  // Favorón total = price (traveler tip) + serviceFee from DB
  const favoronTotal = quoteValues.price + quoteValues.serviceFee;
  
  // Display total from DB (already includes any discount)
  const displayTotal = quoteValues.finalTotalPrice;
  
  // Only show countdown for states where quote is still pending acceptance/payment
  const shouldShowCountdown = packageStatus && ['quote_sent', 'quote_accepted', 'payment_pending'].includes(packageStatus);
  
  const hasTravelerInfo = travelerInfo?.firstName || travelerInfo?.lastName;
  const hasTripInfo = tripInfo?.fromCity || tripInfo?.toCity;
  
  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
      {/* Header with traveler info */}
      {hasTravelerInfo && (
        <div className="flex items-center gap-3 p-3 bg-white border-b border-slate-100">
          <Avatar className="h-10 w-10 border-2 border-slate-200">
            {travelerInfo?.avatarUrl ? (
              <AvatarImage src={travelerInfo.avatarUrl} alt="Avatar del viajero" />
            ) : null}
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
              {getInitials(travelerInfo?.firstName, travelerInfo?.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-800 truncate text-sm">
              {travelerInfo?.firstName} {travelerInfo?.lastName?.charAt(0)}.
            </p>
            {hasTripInfo && (
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <Plane className="h-3 w-3 flex-shrink-0" />
                <span className="truncate">{tripInfo?.fromCity} → {tripInfo?.toCity}</span>
              </div>
            )}
            {tripInfo?.deliveryDate && (
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="h-3 w-3 flex-shrink-0" />
                Entrega: {formatDate(tripInfo.deliveryDate)}
              </p>
            )}
          </div>
        </div>
      )}
      
      {/* Countdown timer (if applicable) */}
      {quoteExpiresAt && shouldShowCountdown && (
        <div className="px-3 py-2 bg-slate-100/50 border-b border-slate-100">
          <QuoteCountdown 
            expiresAt={quoteExpiresAt} 
            onExpire={onQuoteExpire}
            compact={true}
          />
        </div>
      )}
      
      {/* Price breakdown */}
      <div className="p-3 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Servicio Favorón:</span>
          <span className="font-medium text-slate-800">{formatCurrency(favoronTotal)}</span>
        </div>
        
        {quoteValues.deliveryFee > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Envío a domicilio:</span>
            <span className="font-medium text-slate-800">{formatCurrency(quoteValues.deliveryFee)}</span>
          </div>
        )}
        
        {quoteValues.discountAmount > 0 && (
          <div className="flex justify-between text-sm text-primary">
            <span>Descuento{quoteValues.discountCode ? ` (${quoteValues.discountCode})` : ''}:</span>
            <span className="font-medium">-{formatCurrency(quoteValues.discountAmount)}</span>
          </div>
        )}
        
        {/* Separator and Total */}
        <div className="border-t border-slate-200 pt-2 mt-2">
          <div className="flex justify-between items-center">
            <span className="text-slate-700 font-semibold text-sm">Total:</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(displayTotal)}
            </span>
          </div>
        </div>
        
        {/* Traveler message (if exists) */}
        {quoteValues.message && (
          <p className="text-xs text-slate-500 italic pt-2">
            "{quoteValues.message}"
          </p>
        )}
      </div>
    </div>
  );
};

export default PackageQuoteInfo;
